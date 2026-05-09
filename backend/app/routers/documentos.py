"""Upload e listagem de documentos."""
import uuid
from fastapi import APIRouter, Depends, HTTPException, UploadFile, BackgroundTasks
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import AuthContext, get_auth
from app.db import get_db
from app.models import Caso, Documento, PaginaMD
from app.schemas import DocumentoOut
from app.services import storage, pipeline

router = APIRouter()


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
