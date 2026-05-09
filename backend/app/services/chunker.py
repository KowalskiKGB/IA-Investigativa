"""Divisão de texto em chunks com overlap, preservando referência de página."""
from __future__ import annotations
from dataclasses import dataclass


@dataclass
class Chunk:
    texto: str
    pagina: int
    indice: int
    documento_id: str
    nome_arquivo: str


def _palavras(texto: str) -> list[str]:
    return texto.split()


def chunk_paginas(
    paginas: list[tuple[int, str]],
    documento_id: str,
    nome_arquivo: str,
    tamanho: int = 500,
    overlap: int = 50,
) -> list[Chunk]:
    """Quebra cada página em chunks de ~tamanho palavras com overlap."""
    chunks: list[Chunk] = []
    contador = 0
    for numero, md in paginas:
        palavras = _palavras(md)
        if not palavras:
            continue
        passo = max(tamanho - overlap, 1)
        for i in range(0, len(palavras), passo):
            pedaco = " ".join(palavras[i : i + tamanho])
            if not pedaco.strip():
                continue
            chunks.append(
                Chunk(
                    texto=pedaco,
                    pagina=numero,
                    indice=contador,
                    documento_id=documento_id,
                    nome_arquivo=nome_arquivo,
                )
            )
            contador += 1
            if i + tamanho >= len(palavras):
                break
    return chunks
