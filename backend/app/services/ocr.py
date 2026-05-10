"""OCR / extração de texto.

Estratégia:
1. Detecta se o arquivo é imagem (PNG/JPG/WEBP/TIFF/BMP) pelos magic bytes.
   Nesse caso, usa PIL + pytesseract diretamente (sem pdfplumber).
2. Para PDFs: tenta `pdfplumber` (texto embutido).
   Se a página vier vazia, faz fallback OCR via `pytesseract` + pdf2image.
3. Cada página retorna texto Markdown (cabeçalho `## Página N`)
"""
from __future__ import annotations
from io import BytesIO
from typing import Iterator

import pdfplumber
from pdf2image import convert_from_bytes
import pytesseract
from PIL import Image


_IMAGE_MAGIC = [
    (b'\x89PNG', "image/png"),
    (b'\xff\xd8', "image/jpeg"),
    (b'GIF8', "image/gif"),
    (b'RIFF', "image/webp"),   # RIFF....WEBP
    (b'II*\x00', "image/tiff"),
    (b'MM\x00*', "image/tiff"),
    (b'BM', "image/bmp"),
]

_IMAGE_MIME: set[str] = {
    "image/png", "image/jpeg", "image/jpg", "image/gif",
    "image/webp", "image/tiff", "image/bmp", "image/heic",
    "image/heif", "image/avif", "image/svg+xml",
}


def mime_is_image(mime: str | None) -> bool:
    """Return True if the MIME type indicates an image (not a PDF)."""
    return (mime or "").split(";")[0].strip().lower() in _IMAGE_MIME


def _is_image(data: bytes) -> bool:
    for magic, _ in _IMAGE_MAGIC:
        if data[: len(magic)] == magic:
            return True
    return False


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


def extrair_imagem(image_bytes: bytes) -> tuple[str, list[tuple[int, str]]]:
    """Extrai texto de um arquivo de imagem (PNG/JPG/WEBP/TIFF/BMP) via OCR direto."""
    img = Image.open(BytesIO(image_bytes)).convert("RGB")
    texto = pytesseract.image_to_string(img, lang="por").strip()
    md = _para_md(1, texto, ocr=True)
    return md, [(1, md)]


def contar_paginas_pdf(pdf_bytes: bytes) -> int:
    """Return total page count of a PDF (fast, no text extraction)."""
    with pdfplumber.open(BytesIO(pdf_bytes)) as pdf:
        return len(pdf.pages)


def extrair_texto_nativo_pdf(
    pdf_bytes: bytes,
) -> tuple[dict[int, str], list[int]]:
    """First pass over a PDF: extract embedded text in one pdfplumber session.

    Returns:
        com_texto  – {page_num: markdown_text} for pages that had embedded text.
        vazias     – list of 1-indexed page numbers that had no embedded text.
    """
    com_texto: dict[int, str] = {}
    vazias: list[int] = []
    with pdfplumber.open(BytesIO(pdf_bytes)) as pdf:
        for idx, pagina in enumerate(pdf.pages, start=1):
            texto = (pagina.extract_text() or "").strip()
            if texto:
                com_texto[idx] = _para_md(idx, texto)
            else:
                vazias.append(idx)
    return com_texto, vazias


def ocr_pagina_unica(pdf_bytes: bytes, page_num: int) -> tuple[int, str]:
    """OCR a single 1-indexed PDF page via poppler + tesseract (efficient)."""
    try:
        imgs = convert_from_bytes(
            pdf_bytes, dpi=200, first_page=page_num, last_page=page_num
        )
        texto = _ocr_imagem(imgs[0]).strip() if imgs else ""
    except Exception:
        texto = ""
    return page_num, _para_md(page_num, texto, ocr=True)


def extrair_tudo(
    pdf_bytes: bytes,
    mime_type: str | None = None,
) -> tuple[str, list[tuple[int, str]]]:
    """Retorna (markdown_concatenado, [(num, md_pagina)...]).

    Detecta automaticamente imagens (PNG/JPG/etc.) e as processa via OCR direto,
    sem tentar abrir como PDF.

    O parâmetro *mime_type* é usado como detecção primária; magic bytes como fallback.
    """
    if mime_is_image(mime_type) or _is_image(pdf_bytes):
        return extrair_imagem(pdf_bytes)

    paginas: dict[int, str] = {}
    for num, md in extrair_paginas(pdf_bytes):
        paginas[num] = md
    ordenado = sorted(paginas.items())
    md_total = "\n".join(md for _, md in ordenado)
    return md_total, ordenado
