"""Embeddings — OpenAI text-embedding-3-small (com fallback determinístico p/ dev sem API)."""
from __future__ import annotations
import hashlib
import math
from typing import Iterable

from app.config import get_settings

_s = get_settings()


def _fallback_embedding(texto: str, dim: int = 384) -> list[float]:
    """Embedding determinístico baseado em hash — só para dev/teste sem chave."""
    h = hashlib.sha256(texto.encode("utf-8")).digest()
    # repete o hash até preencher dim
    bruto = (h * ((dim // len(h)) + 1))[:dim]
    vec = [(b - 128) / 128 for b in bruto]
    norma = math.sqrt(sum(v * v for v in vec)) or 1.0
    return [v / norma for v in vec]


def gerar(textos: Iterable[str]) -> list[list[float]]:
    textos = list(textos)
    if not _s.openai_api_key:
        return [_fallback_embedding(t) for t in textos]

    from openai import OpenAI

    cli = OpenAI(api_key=_s.openai_api_key)
    out = cli.embeddings.create(model="text-embedding-3-small", input=textos)
    return [d.embedding for d in out.data]
