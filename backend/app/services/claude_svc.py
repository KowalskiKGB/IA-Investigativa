"""Wrapper do Claude (Anthropic) — chat investigativo + extração de entidades.

Cai em modo demo (resposta canned) se não houver chave configurada.
"""
from __future__ import annotations
import json
from pathlib import Path
from typing import Any

from app.config import get_settings

_s = get_settings()

PROMPTS_DIR = Path(__file__).resolve().parents[2] / "prompts"

# Carrega o system prompt principal (núcleo do produto).
def _system_prompt() -> str:
    arq = PROMPTS_DIR / "INSTRUCOES-INVESTIGACAO.md"
    if arq.exists():
        return arq.read_text(encoding="utf-8")
    return "Você é uma IA investigativa que analisa documentos e responde citando fontes."


def _client():
    if not _s.anthropic_api_key:
        return None
    import anthropic
    return anthropic.Anthropic(api_key=_s.anthropic_api_key)


def chat_investigativo(pergunta: str, chunks: list[dict]) -> dict[str, Any]:
    """chunks: [{"texto", "fonte", "pagina", "documento_id"}]"""
    contexto = "\n\n---\n\n".join(
        f"[Fonte: {c['fonte']}, Página {c['pagina']}]\n{c['texto']}" for c in chunks
    )
    user_msg = (
        f"Contexto extraído dos documentos do cliente:\n\n{contexto}\n\n---\n\n"
        f"Pergunta do advogado:\n{pergunta}\n\n"
        "Responda com base apenas nos documentos acima. Cite sempre arquivo e página.\n"
        "Se identificar relações entre entidades, liste-as ao final em JSON dentro de "
        "um bloco ```json com a chave 'relacoes' contendo objetos {origem, destino, tipo, fonte, pagina}."
    )

    cli = _client()
    if cli is None:
        # Modo demo
        resposta = (
            "**[modo demo — sem chave Anthropic configurada]**\n\n"
            f"Sua pergunta: _{pergunta}_\n\n"
            "Trechos relevantes encontrados nos documentos:\n\n"
            + "\n\n".join(
                f"- {c['fonte']} (p. {c['pagina']}): {c['texto'][:160]}..." for c in chunks[:3]
            )
        )
        return {"resposta": resposta, "tokens_in": 0, "tokens_out": 0}

    msg = cli.messages.create(
        model="claude-sonnet-4-5",
        max_tokens=4096,
        system=_system_prompt(),
        messages=[{"role": "user", "content": user_msg}],
    )
    return {
        "resposta": msg.content[0].text,
        "tokens_in": msg.usage.input_tokens,
        "tokens_out": msg.usage.output_tokens,
    }


PROMPT_EXTRACAO = """Analise o texto extraído de um documento jurídico/oficial.
Extraia entidades relevantes e relações.

Retorne APENAS JSON válido:
{
  "entidades": [
    {"tipo": "pessoa|empresa|orgao|processo|valor", "nome": "...", "identificador": "CPF/CNPJ/nº ou null"}
  ],
  "relacoes": [
    {"origem": "nome", "destino": "nome", "tipo": "socio|assinou|nomeou|contratou|recebeu|exonerou|...", "trecho": "trecho exato"}
  ]
}

Texto (página %d):
%s
"""


def extrair_entidades(texto: str, pagina: int) -> dict[str, Any]:
    cli = _client()
    if cli is None:
        return {"entidades": [], "relacoes": []}
    msg = cli.messages.create(
        model="claude-haiku-4-5",
        max_tokens=2048,
        messages=[{"role": "user", "content": PROMPT_EXTRACAO % (pagina, texto)}],
    )
    raw = msg.content[0].text.strip()
    # tenta extrair bloco JSON
    if "```" in raw:
        partes = raw.split("```")
        for p in partes:
            p = p.strip()
            if p.startswith("json"):
                p = p[4:].strip()
            if p.startswith("{"):
                raw = p
                break
    try:
        return json.loads(raw)
    except Exception:
        return {"entidades": [], "relacoes": []}


PROMPT_CORRECAO = """Você é revisor de OCR de documentos jurídicos em português.
O texto abaixo foi extraído via OCR e pode conter erros (caracteres trocados, palavras grudadas, quebras erradas).

Liste APENAS as correções que tem alta confiança (>0.85). Para cada uma, retorne:
- texto_original (string exata como está no OCR)
- texto_corrigido (sua sugestão)
- motivo (1 frase curta)
- confianca (0.0 a 1.0)

Retorne JSON válido: {"correcoes": [...]}.
Se não houver correções óbvias, retorne {"correcoes": []}.

Texto (página %d):
%s
"""


def sugerir_correcoes(texto: str, pagina: int) -> list[dict]:
    cli = _client()
    if cli is None:
        return []
    msg = cli.messages.create(
        model="claude-haiku-4-5",
        max_tokens=2048,
        messages=[{"role": "user", "content": PROMPT_CORRECAO % (pagina, texto)}],
    )
    raw = msg.content[0].text.strip()
    if "```" in raw:
        for p in raw.split("```"):
            p = p.strip()
            if p.startswith("json"):
                p = p[4:].strip()
            if p.startswith("{"):
                raw = p
                break
    try:
        return json.loads(raw).get("correcoes", [])
    except Exception:
        return []
