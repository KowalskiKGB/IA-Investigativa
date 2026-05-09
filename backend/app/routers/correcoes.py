"""Painel de correções de OCR (advogado revisa e aceita/rejeita)."""
import uuid
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import AuthContext, get_auth
from app.db import get_db
from app.models import CorrecaoOCR, Documento, Caso
from app.schemas import CorrecaoOut

router = APIRouter()


@router.get("/{documento_id}", response_model=list[CorrecaoOut])
async def listar(
    documento_id: uuid.UUID, ctx: AuthContext = Depends(get_auth), db: AsyncSession = Depends(get_db)
):
    doc = await db.get(Documento, documento_id)
    if not doc:
        raise HTTPException(404, "Documento não encontrado")
    caso = await db.get(Caso, doc.caso_id)
    if not caso or str(caso.cliente_id) != ctx.cliente_id:
        raise HTTPException(404, "Documento não encontrado")
    res = await db.execute(
        select(CorrecaoOCR).where(CorrecaoOCR.documento_id == documento_id).order_by(CorrecaoOCR.pagina)
    )
    return list(res.scalars())


@router.post("/{correcao_id}/aceitar")
async def aceitar(
    correcao_id: uuid.UUID, aceitar: bool = True,
    ctx: AuthContext = Depends(get_auth), db: AsyncSession = Depends(get_db),
):
    cor = await db.get(CorrecaoOCR, correcao_id)
    if not cor:
        raise HTTPException(404, "Correção não encontrada")
    cor.aceita_pelo_usuario = aceitar
    await db.commit()
    return {"ok": True, "aceita": aceitar}
