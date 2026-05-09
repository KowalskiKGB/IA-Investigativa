"""Multi-provider LLM com configuração dinâmica.

Providers suportados:
- pollinations  → público, sem chave (default p/ testes)
- anthropic     → Claude Sonnet/Haiku
- openai        → GPT-4o
- groq          → Llama 3.3 (free tier com chave grátis)
- openrouter    → modelos free como llama-3.3-70b
"""
from __future__ import annotations
import json
from pathlib import Path
from typing import Any
import httpx

from app.config import get_settings

PROMPTS_DIR = Path(__file__).resolve().parents[2] / "prompts"


def _system_prompt() -> str:
    arq = PROMPTS_DIR / "INSTRUCOES-INVESTIGACAO.md"
    if arq.exists():
        return arq.read_text(encoding="utf-8")
    return "Você é uma IA investigativa que analisa documentos jurídicos e responde citando fontes (arquivo + página). Nunca invente."


def _provider_config(db_settings: dict | None = None) -> dict:
    """Retorna {provider, model, api_key, base_url}."""
    s = get_settings()
    db_settings = db_settings or {}

    provider = db_settings.get("llm_provider") or "pollinations"
    model = db_settings.get("llm_model")

    cfg = {
        "pollinations": {
            "base_url": "https://text.pollinations.ai/openai",
            "model": model or "openai",
            "api_key": "",
        },
        "anthropic": {
            "base_url": "https://api.anthropic.com",
            "model": model or "claude-sonnet-4-5",
            "api_key": db_settings.get("anthropic_api_key") or s.anthropic_api_key,
        },
        "openai": {
            "base_url": "https://api.openai.com/v1",
            "model": model or "gpt-4o-mini",
            "api_key": db_settings.get("openai_api_key") or s.openai_api_key,
        },
        "groq": {
            "base_url": "https://api.groq.com/openai/v1",
            "model": model or "llama-3.3-70b-versatile",
            "api_key": db_settings.get("groq_api_key", ""),
        },
        "openrouter": {
            "base_url": "https://openrouter.ai/api/v1",
            "model": model or "meta-llama/llama-3.3-70b-instruct:free",
            "api_key": db_settings.get("openrouter_api_key", ""),
        },
    }
    out = cfg.get(provider, cfg["pollinations"])
    out["provider"] = provider
    return out


def _openai_compat_chat(cfg: dict, system: str, user: str, max_tokens: int = 2048) -> tuple[str, int, int]:
    """Chamada OpenAI-compatível (Pollinations/OpenAI/Groq/OpenRouter)."""
    headers = {"Content-Type": "application/json"}
    if cfg.get("api_key"):
        headers["Authorization"] = f"Bearer {cfg['api_key']}"
    payload = {
        "model": cfg["model"],
        "messages": [
            {"role": "system", "content": system},
            {"role": "user", "content": user},
        ],
        "max_tokens": max_tokens,
        "temperature": 0.2,
    }
    url = f"{cfg['base_url'].rstrip('/')}/chat/completions"
    with httpx.Client(timeout=120) as cli:
        r = cli.post(url, json=payload, headers=headers)
        r.raise_for_status()
        data = r.json()
    txt = data["choices"][0]["message"]["content"]
    usage = data.get("usage") or {}
    return txt, usage.get("prompt_tokens", 0), usage.get("completion_tokens", 0)


def _anthropic_chat(cfg: dict, system: str, user: str, max_tokens: int = 4096) -> tuple[str, int, int]:
    if not cfg["api_key"]:
        raise RuntimeError("ANTHROPIC_API_KEY ausente")
    import anthropic
    cli = anthropic.Anthropic(api_key=cfg["api_key"])
    msg = cli.messages.create(
        model=cfg["model"], max_tokens=max_tokens, system=system,
        messages=[{"role": "user", "content": user}],
    )
    return msg.content[0].text, msg.usage.input_tokens, msg.usage.output_tokens


def chat_investigativo(pergunta: str, chunks: list[dict], db_settings: dict | None = None) -> dict[str, Any]:
    contexto = "\n\n---\n\n".join(
        f"[Fonte: {c['fonte']}, Página {c['pagina']}]\n{c['texto']}" for c in chunks
    )
    if not contexto.strip():
        contexto = "(sem chunks indexados ainda — peça ao usuário para fazer upload de documentos)"

    user_msg = (
        f"Contexto extraído dos documentos do cliente:\n\n{contexto}\n\n---\n\n"
        f"Pergunta do advogado:\n{pergunta}\n\n"
        "Responda em português, com base apenas nos documentos acima. "
        "Cite sempre arquivo e página. Se identificar relações entre entidades "
        "(pessoas, empresas, órgãos), liste-as ao final num bloco ```json com "
        "o formato {\"relacoes\": [{\"origem\":\"...\",\"destino\":\"...\",\"tipo\":\"...\",\"pagina\":N}]}."
    )

    cfg = _provider_config(db_settings)
    try:
        if cfg["provider"] == "anthropic":
            texto, tin, tout = _anthropic_chat(cfg, _system_prompt(), user_msg)
        else:
            texto, tin, tout = _openai_compat_chat(cfg, _system_prompt(), user_msg, max_tokens=2048)
    except Exception as exc:  # fallback elegante
        texto = (
            f"⚠️ **Provider `{cfg['provider']}` falhou** ({exc}). "
            "Trechos relevantes encontrados nos documentos:\n\n"
            + ("\n\n".join(f"- {c['fonte']} (p. {c['pagina']}): {c['texto'][:200]}..." for c in chunks[:5]) or "_nenhum_")
        )
        tin = tout = 0

    return {"resposta": texto, "tokens_in": tin, "tokens_out": tout, "provider": cfg["provider"]}


def _parse_json_loose(raw: str) -> dict:
    raw = raw.strip()
    if "```" in raw:
        for p in raw.split("```"):
            p = p.strip()
            if p.startswith("json"):
                p = p[4:].strip()
            if p.startswith("{"):
                raw = p
                break
    try:
        return json.loads(raw)
    except Exception:
        return {}


PROMPT_EXTRACAO = """Analise o texto extraído de um documento jurídico/oficial em português.
Extraia entidades relevantes e suas relações.

Retorne APENAS JSON válido (sem texto antes/depois):
{
  "entidades": [
    {"tipo": "pessoa|empresa|orgao|processo|valor", "nome": "...", "identificador": "CPF/CNPJ/nº ou null"}
  ],
  "relacoes": [
    {"origem": "nome", "destino": "nome", "tipo": "socio|assinou|nomeou|contratou|recebeu|exonerou|outro", "trecho": "trecho exato curto"}
  ]
}

Texto (página %d):
%s
"""


def extrair_entidades(texto: str, pagina: int, db_settings: dict | None = None) -> dict[str, Any]:
    if not texto.strip():
        return {"entidades": [], "relacoes": []}
    cfg = _provider_config(db_settings)
    user_msg = PROMPT_EXTRACAO % (pagina, texto[:8000])
    try:
        if cfg["provider"] == "anthropic":
            raw, _, _ = _anthropic_chat(cfg, "Você extrai entidades em JSON.", user_msg, max_tokens=2048)
        else:
            raw, _, _ = _openai_compat_chat(cfg, "Você extrai entidades em JSON.", user_msg, max_tokens=2048)
    except Exception:
        return {"entidades": [], "relacoes": []}
    out = _parse_json_loose(raw)
    return {
        "entidades": out.get("entidades", []) if isinstance(out, dict) else [],
        "relacoes": out.get("relacoes", []) if isinstance(out, dict) else [],
    }


PROMPT_CORRECAO = """Você é revisor de OCR de documentos jurídicos em português.
Liste APENAS correções com confiança >0.85. Para cada uma:
- texto_original (string exata como está no OCR)
- texto_corrigido (sua sugestão)
- motivo (1 frase curta)
- confianca (0.0 a 1.0)

Retorne JSON: {"correcoes": [...]}.
Se nada óbvio, retorne {"correcoes": []}.

Texto (página %d):
%s
"""


def sugerir_correcoes(texto: str, pagina: int, db_settings: dict | None = None) -> list[dict]:
    if not texto.strip():
        return []
    cfg = _provider_config(db_settings)
    user_msg = PROMPT_CORRECAO % (pagina, texto[:6000])
    try:
        if cfg["provider"] == "anthropic":
            raw, _, _ = _anthropic_chat(cfg, "Você revisa OCR.", user_msg, max_tokens=1500)
        else:
            raw, _, _ = _openai_compat_chat(cfg, "Você revisa OCR.", user_msg, max_tokens=1500)
    except Exception:
        return []
    out = _parse_json_loose(raw)
    return out.get("correcoes", []) if isinstance(out, dict) else []
