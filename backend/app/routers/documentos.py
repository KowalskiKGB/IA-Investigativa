"""Upload, listagem e processamento de documentos."""
from __future__ import annotations
import asyncio
import json
import uuid
import logging
from fastapi import APIRouter, Depends, HTTPException, UploadFile, BackgroundTasks
from fastapi.responses import StreamingResponse, Response
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import AuthContext, get_auth
from app.db import get_db, SessionLocal
from app.models import Caso, Documento, PaginaMD
from app.schemas import DocumentoOut
from app.services import storage, pipeline, vector_store

log = logging.getLogger(__name__)
router = APIRouter()


# ── Upload ───────────────────────────────────────────────────────────────────

@router.post("/{caso_id}", response_model=DocumentoOut, status_code=201)
async def enviar(
    caso_id: uuid.UUID,
    arquivo: UploadFile,
    bg: BackgroundTasks,
    ctx: AuthContext = Depends(get_auth),
    db: AsyncSession = Depends(get_db),
):
    caso = await db.get(Caso, caso_id)
    if not caso or str(caso.cliente_id) != ctx.cliente_id:
        raise HTTPException(404, "Caso não encontrado")

    conteudo = await arquivo.read()
    if not conteudo:
        raise HTTPException(400, "Arquivo vazio")

    key = f"{ctx.cliente_id}/{caso_id}/{uuid.uuid4()}-{arquivo.filename}"
    storage.upload_bytes(key, conteudo, arquivo.content_type or "application/octet-stream")

    doc = Documento(
        caso_id=caso_id,
        nome_arquivo=arquivo.filename or "documento",
        mime_type=arquivo.content_type,
        url_storage=key,
        status="pendente",
        progresso=0,
    )
    db.add(doc)
    await db.commit()
    await db.refresh(doc)

    bg.add_task(pipeline.processar, doc.id, uuid.UUID(ctx.cliente_id), key)
    return doc


# ── Listagem ─────────────────────────────────────────────────────────────────

@router.get("/{caso_id}", response_model=list[DocumentoOut])
async def listar(caso_id: uuid.UUID, ctx: AuthContext = Depends(get_auth), db: AsyncSession = Depends(get_db)):
    caso = await db.get(Caso, caso_id)
    if not caso or str(caso.cliente_id) != ctx.cliente_id:
        raise HTTPException(404, "Caso não encontrado")
    res = await db.execute(select(Documento).where(Documento.caso_id == caso_id).order_by(Documento.criado_em.desc()))
    return list(res.scalars())


# ── Excluir documento ─────────────────────────────────────────────────────────

@router.delete("/{caso_id}/{documento_id}", status_code=204)
async def excluir(
    caso_id: uuid.UUID,
    documento_id: uuid.UUID,
    ctx: AuthContext = Depends(get_auth),
    db: AsyncSession = Depends(get_db),
):
    doc = await db.get(Documento, documento_id)
    if not doc or doc.caso_id != caso_id:
        raise HTTPException(404, "Documento não encontrado")
    caso = await db.get(Caso, caso_id)
    if not caso or str(caso.cliente_id) != ctx.cliente_id:
        raise HTTPException(403, "Acesso negado")

    try:
        storage.deletar_arquivo(doc.url_storage)
    except Exception:
        pass
    try:
        vector_store.deletar_documento(ctx.cliente_id, str(documento_id))
    except Exception:
        pass

    await db.delete(doc)
    await db.commit()


# ── Texto extraído por página ─────────────────────────────────────────────────

@router.get("/{caso_id}/{documento_id}/texto")
async def obter_texto(
    caso_id: uuid.UUID,
    documento_id: uuid.UUID,
    ctx: AuthContext = Depends(get_auth),
    db: AsyncSession = Depends(get_db),
):
    doc = await db.get(Documento, documento_id)
    if not doc or doc.caso_id != caso_id:
        raise HTTPException(404, "Documento não encontrado")
    caso = await db.get(Caso, caso_id)
    if not caso or str(caso.cliente_id) != ctx.cliente_id:
        raise HTTPException(403, "Acesso negado")

    res = await db.execute(
        select(PaginaMD).where(PaginaMD.documento_id == documento_id).order_by(PaginaMD.numero)
    )
    paginas = []
    for p in res.scalars():
        md = p.texto_md
        metodo = "ocr" if "<!-- ocr -->" in md else "extraido"
        linhas = md.split("\n")
        texto = "\n".join(l for l in linhas if not l.startswith("## Página")).strip()
        paginas.append({"numero": p.numero, "texto": texto, "metodo": metodo})

    return {
        "documento_id": str(documento_id),
        "nome_arquivo": doc.nome_arquivo,
        "total_paginas": doc.total_paginas,
        "status": doc.status,
        "paginas": paginas,
    }


# ── PDF proxy ─────────────────────────────────────────────────────────────────

@router.get("/{caso_id}/{documento_id}/pdf")
async def baixar_pdf(
    caso_id: uuid.UUID,
    documento_id: uuid.UUID,
    ctx: AuthContext = Depends(get_auth),
    db: AsyncSession = Depends(get_db),
):
    """Proxy do arquivo original do MinIO para o browser (contorna CORS interno)."""
    doc = await db.get(Documento, documento_id)
    if not doc or doc.caso_id != caso_id:
        raise HTTPException(404, "Documento não encontrado")
    caso = await db.get(Caso, caso_id)
    if not caso or str(caso.cliente_id) != ctx.cliente_id:
        raise HTTPException(403, "Acesso negado")

    try:
        pdf_bytes = await asyncio.to_thread(storage.download_bytes, doc.url_storage)
    except Exception as e:
        raise HTTPException(500, f"Erro ao baixar arquivo: {e}")

    mime = doc.mime_type or "application/octet-stream"
    return Response(
        content=pdf_bytes,
        media_type=mime,
        headers={
            "Content-Disposition": f'inline; filename="{doc.nome_arquivo}"',
            "Cache-Control": "private, max-age=3600",
        },
    )


# ── Markdown (compatibilidade) ────────────────────────────────────────────────

@router.get("/{caso_id}/{documento_id}/markdown")
async def baixar_md(
    caso_id: uuid.UUID,
    documento_id: uuid.UUID,
    ctx: AuthContext = Depends(get_auth),
    db: AsyncSession = Depends(get_db),
):
    doc = await db.get(Documento, documento_id)
    if not doc or doc.caso_id != caso_id:
        raise HTTPException(404, "Documento não encontrado")
    res = await db.execute(
        select(PaginaMD).where(PaginaMD.documento_id == documento_id).order_by(PaginaMD.numero)
    )
    md = "\n".join(p.texto_md for p in res.scalars())
    return {"markdown": md, "nome_arquivo": doc.nome_arquivo}


# ── Stream OCR sem IA ─────────────────────────────────────────────────────────

@router.get("/{caso_id}/{documento_id}/stream-ocr")
async def stream_ocr_direto(
    caso_id: uuid.UUID,
    documento_id: uuid.UUID,
    ctx: AuthContext = Depends(get_auth),
    db: AsyncSession = Depends(get_db),
):
    """SSE: converte PDF sem IA, página a página, transmitindo texto em tempo real.

    Adaptado de converter_diarios_md.py. Se já concluído, lê do banco.
    """
    doc = await db.get(Documento, documento_id)
    if not doc or doc.caso_id != caso_id:
        raise HTTPException(404, "Documento não encontrado")
    caso = await db.get(Caso, caso_id)
    if not caso or str(caso.cliente_id) != ctx.cliente_id:
        raise HTTPException(403, "Acesso negado")

    # Já processado: lê do banco com pequeno delay para efeito de stream
    if doc.status == "concluido":
        async def _stream_db():
            async with SessionLocal() as s:
                res = await s.execute(
                    select(PaginaMD).where(PaginaMD.documento_id == documento_id).order_by(PaginaMD.numero)
                )
                paginas = list(res.scalars())
            total = len(paginas)
            yield f"data: {json.dumps({'type': 'start', 'total': total, 'cached': True})}\n\n"
            for p in paginas:
                md = p.texto_md
                metodo = "ocr" if "<!-- ocr -->" in md else "extraido"
                linhas = md.split("\n")
                texto = "\n".join(l for l in linhas if not l.startswith("## Página")).strip()
                yield f"data: {json.dumps({'type': 'page', 'pagina': p.numero, 'total': total, 'metodo': metodo, 'texto': texto})}\n\n"
                await asyncio.sleep(0.03)
            yield f"data: {json.dumps({'type': 'done', 'total_paginas': total})}\n\n"
        return StreamingResponse(_stream_db(), media_type="text/event-stream",
                                  headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"})

    # Outro processo em andamento — informa cliente
    if doc.status == "processando":
        async def _info():
            yield f"data: {json.dumps({'type': 'info', 'msg': 'Processando com IA. Aguarde ou recarregue.'})}\n\n"
        return StreamingResponse(_info(), media_type="text/event-stream",
                                  headers={"Cache-Control": "no-cache"})

    # Conversão direta (sem IA) — processa e transmite ao vivo
    storage_key = doc.url_storage

    async def _stream_fresco():
        import fitz  # PyMuPDF
        import pytesseract
        from PIL import Image

        try:
            pdf_bytes = await asyncio.to_thread(storage.download_bytes, storage_key)

            def _contar_paginas():
                d = fitz.open(stream=pdf_bytes, filetype="pdf")
                n = d.page_count
                d.close()
                return n

            total = await asyncio.to_thread(_contar_paginas)

            async with SessionLocal() as s:
                d = await s.get(Documento, documento_id)
                if d:
                    d.status = "processando"
                    d.progresso = 5
                    d.total_paginas = total
                    await s.commit()

            yield f"data: {json.dumps({'type': 'start', 'total': total})}\n\n"

            def _processar_pagina(pg_idx: int):
                doc_fitz = fitz.open(stream=pdf_bytes, filetype="pdf")
                page = doc_fitz[pg_idx]
                texto_digital = page.get_text("text").strip()
                if texto_digital:
                    doc_fitz.close()
                    return texto_digital, "extraido", f"## Página {pg_idx + 1}\n\n{texto_digital}\n"
                mat = fitz.Matrix(200 / 72, 200 / 72)
                pix = page.get_pixmap(matrix=mat)
                img = Image.frombytes("RGB", [pix.width, pix.height], pix.samples)
                doc_fitz.close()
                texto = pytesseract.image_to_string(img, lang="por").strip()
                return texto, "ocr", f"## Página {pg_idx + 1} <!-- ocr -->\n\n{texto}\n"

            for i in range(total):
                texto, metodo, md = await asyncio.to_thread(_processar_pagina, i)

                async with SessionLocal() as s:
                    existe = (await s.execute(
                        select(PaginaMD).where(
                            PaginaMD.documento_id == documento_id, PaginaMD.numero == i + 1
                        )
                    )).scalar_one_or_none()
                    if not existe:
                        s.add(PaginaMD(documento_id=documento_id, numero=i + 1, texto_md=md))
                    d = await s.get(Documento, documento_id)
                    if d:
                        d.progresso = int((i + 1) / total * 85)
                    await s.commit()

                yield f"data: {json.dumps({'type': 'page', 'pagina': i + 1, 'total': total, 'metodo': metodo, 'texto': texto})}\n\n"

            async with SessionLocal() as s:
                d = await s.get(Documento, documento_id)
                if d:
                    d.status = "concluido"
                    d.total_paginas = total
                    d.progresso = 90
                    await s.commit()

            yield f"data: {json.dumps({'type': 'done', 'total_paginas': total})}\n\n"

        except Exception as exc:
            log.exception("Erro no stream-ocr para %s", documento_id)
            async with SessionLocal() as s:
                d = await s.get(Documento, documento_id)
                if d:
                    d.status = "erro"
                    d.erro = str(exc)[:500]
                    await s.commit()
            yield f"data: {json.dumps({'type': 'error', 'msg': str(exc)[:200]})}\n\n"

    return StreamingResponse(
        _stream_fresco(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


@router.post("/{caso_id}", response_model=DocumentoOut, status_code=201)
async def enviar(
    caso_id: uuid.UUID,
    arquivo: UploadFile,
    bg: BackgroundTasks,
    ctx: AuthContext = Depends(get_auth),
    db: AsyncSession = Depends(get_db),
):
    caso = await db.get(Caso, caso_id)
    if not caso or str(caso.cliente_id) != ctx.cliente_id:
        raise HTTPException(404, "Caso não encontrado")

    conteudo = await arquivo.read()
    if not conteudo:
        raise HTTPException(400, "Arquivo vazio")

    key = f"{ctx.cliente_id}/{caso_id}/{uuid.uuid4()}-{arquivo.filename}"
    storage.upload_bytes(key, conteudo, arquivo.content_type or "application/pdf")

    doc = Documento(
        caso_id=caso_id,
        nome_arquivo=arquivo.filename or "documento.pdf",
        mime_type=arquivo.content_type,
        url_storage=key,
        status="pendente",
    )
    db.add(doc)
    await db.commit()
    await db.refresh(doc)

    bg.add_task(pipeline.processar, doc.id, uuid.UUID(ctx.cliente_id), key)
    return doc


@router.get("/{caso_id}", response_model=list[DocumentoOut])
async def listar(caso_id: uuid.UUID, ctx: AuthContext = Depends(get_auth), db: AsyncSession = Depends(get_db)):
    caso = await db.get(Caso, caso_id)
    if not caso or str(caso.cliente_id) != ctx.cliente_id:
        raise HTTPException(404, "Caso não encontrado")
    res = await db.execute(select(Documento).where(Documento.caso_id == caso_id).order_by(Documento.criado_em.desc()))
    return list(res.scalars())


@router.get("/{caso_id}/{documento_id}/markdown")
async def baixar_md(
    caso_id: uuid.UUID,
    documento_id: uuid.UUID,
    ctx: AuthContext = Depends(get_auth),
    db: AsyncSession = Depends(get_db),
):
    """Retorna o documento convertido em Markdown (compatível com Obsidian)."""
    doc = await db.get(Documento, documento_id)
    if not doc or doc.caso_id != caso_id:
        raise HTTPException(404, "Documento não encontrado")
    res = await db.execute(
        select(PaginaMD).where(PaginaMD.documento_id == documento_id).order_by(PaginaMD.numero)
    )
    md = "\n".join(p.texto_md for p in res.scalars())
    return {"markdown": md, "nome_arquivo": doc.nome_arquivo}
