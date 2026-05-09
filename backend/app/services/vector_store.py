"""Wrapper do ChromaDB com isolamento por cliente (collection por tenant)."""
from __future__ import annotations
from typing import Any

import chromadb
from chromadb.config import Settings as ChromaSettings

from app.config import get_settings

_s = get_settings()
_client = None


def _cli():
    global _client
    if _client is None:
        try:
            _client = chromadb.HttpClient(
                host=_s.chroma_host,
                port=_s.chroma_port,
                settings=ChromaSettings(anonymized_telemetry=False),
            )
        except Exception:
            # fallback embutido p/ dev
            _client = chromadb.PersistentClient(
                path="./chroma_data",
                settings=ChromaSettings(anonymized_telemetry=False),
            )
    return _client


def _collection(cliente_id: str):
    nome = f"tenant_{cliente_id.replace('-', '')}"
    return _cli().get_or_create_collection(nome, metadata={"hnsw:space": "cosine"})


def indexar(cliente_id: str, ids: list[str], textos: list[str], embeddings: list[list[float]], metadados: list[dict]):
    if not ids:
        return
    _collection(cliente_id).upsert(
        ids=ids, documents=textos, embeddings=embeddings, metadatas=metadados
    )


def buscar(cliente_id: str, embedding: list[float], k: int = 8, filtro: dict[str, Any] | None = None) -> list[dict]:
    res = _collection(cliente_id).query(
        query_embeddings=[embedding], n_results=k, where=filtro or None
    )
    saida: list[dict] = []
    if not res["ids"] or not res["ids"][0]:
        return saida
    for i in range(len(res["ids"][0])):
        saida.append(
            {
                "id": res["ids"][0][i],
                "texto": res["documents"][0][i],
                "metadata": res["metadatas"][0][i],
                "distancia": (res["distances"][0][i] if res.get("distances") else None),
            }
        )
    return saida


def deletar_documento(cliente_id: str, documento_id: str):
    _collection(cliente_id).delete(where={"documento_id": documento_id})


def deletar_tenant(cliente_id: str):
    nome = f"tenant_{cliente_id.replace('-', '')}"
    try:
        _cli().delete_collection(nome)
    except Exception:
        pass
