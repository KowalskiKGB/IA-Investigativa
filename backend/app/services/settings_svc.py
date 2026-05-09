"""Configurações dinâmicas (settings) — armazenadas no Postgres, editáveis pelo admin."""
from __future__ import annotations
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import ConfigSistema


DEFAULTS = {
    "llm_provider": "pollinations",
    "llm_model": "openai",
    "anthropic_api_key": "",
    "openai_api_key": "",
    "groq_api_key": "",
    "openrouter_api_key": "",
    "system_prompt_override": "",
}


async def carregar_dict(db: AsyncSession) -> dict:
    res = await db.execute(select(ConfigSistema))
    out = dict(DEFAULTS)
    for c in res.scalars():
        out[c.chave] = c.valor or ""
    return out


def carregar_dict_sync(db) -> dict:
    """Versão síncrona (usada no pipeline async via SessionLocal)."""
    from sqlalchemy import select as _select
    res = db.execute(_select(ConfigSistema))
    out = dict(DEFAULTS)
    for c in res.scalars():
        out[c.chave] = c.valor or ""
    return out


async def salvar(db: AsyncSession, chave: str, valor: str) -> None:
    res = await db.execute(select(ConfigSistema).where(ConfigSistema.chave == chave))
    obj = res.scalar_one_or_none()
    if obj:
        obj.valor = valor
    else:
        db.add(ConfigSistema(chave=chave, valor=valor))
    await db.commit()
