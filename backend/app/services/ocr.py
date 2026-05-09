"""OCR / extração de texto.

Estratégia:
1. Tenta `pdfplumber` (PDF digital — texto embutido)
2. Se a página vier vazia, faz fallback OCR via `pytesseract`
3. Cada página retorna texto Markdown (cabeçalho `## Página N`)
"""
from __future__ import annotations
from io import BytesIO
from typing import Iterator

import pdfplumber
from pdf2image import convert_from_bytes
import pytesseract


def _ocr_imagem(img) -> str:
    return pytesseract.image_to_string(img, lang="por")


def extrair_paginas(pdf_bytes: bytes) -> Iterator[tuple[int, str]]:
    """Yield (numero_pagina, texto_md)."""
    paginas_vazias: list[int] = []

    with pdfplumber.open(BytesIO(pdf_bytes)) as pdf:
        for idx, pagina in enumerate(pdf.pages, start=1):
            texto = (pagina.extract_text() or "").strip()
            if not texto:
                paginas_vazias.append(idx)
                yield idx, ""  # placeholder; será substituída no fallback
            else:
                yield idx, _para_md(idx, texto)

    if not paginas_vazias:
        return

    # fallback OCR — só para páginas vazias
    imagens = convert_from_bytes(pdf_bytes, dpi=200)
    for num in paginas_vazias:
        try:
            img = imagens[num - 1]
            texto = _ocr_imagem(img).strip()
        except Exception:
            texto = ""
        yield num, _para_md(num, texto, ocr=True)


def _para_md(numero: int, texto: str, ocr: bool = False) -> str:
    flag = " <!-- ocr -->" if ocr else ""
    return f"## Página {numero}{flag}\n\n{texto}\n"


def extrair_tudo(pdf_bytes: bytes) -> tuple[str, list[tuple[int, str]]]:
    """Retorna (markdown_concatenado, [(num, md_pagina)...])."""
    paginas: dict[int, str] = {}
    for num, md in extrair_paginas(pdf_bytes):
        paginas[num] = md
    ordenado = sorted(paginas.items())
    md_total = "\n".join(md for _, md in ordenado)
    return md_total, ordenado
