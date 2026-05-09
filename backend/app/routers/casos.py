"""CRUD de casos."""
import uuid
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import AuthContext, get_auth
from app.db import get_db
from app.models import Caso
from app.schemas import CasoIn, CasoOut

router = APIRouter()


@router.post("", response_model=CasoOut, status_code=201)
async def criar(dados: CasoIn, ctx: AuthContext = Depends(get_auth), db: AsyncSession = Depends(get_db)):
    caso = Caso(cliente_id=ctx.cliente_id, nome=dados.nome, descricao=dados.descricao)
    db.add(caso)
    await db.commit()
    await db.refresh(caso)
    return caso


@router.get("", response_model=list[CasoOut])
async def listar(ctx: AuthContext = Depends(get_auth), db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(Caso).where(Caso.cliente_id == ctx.cliente_id).order_by(Caso.criado_em.desc()))
    return list(res.scalars())


@router.get("/{caso_id}", response_model=CasoOut)
async def obter(caso_id: uuid.UUID, ctx: AuthContext = Depends(get_auth), db: AsyncSession = Depends(get_db)):
    caso = await db.get(Caso, caso_id)
    if not caso or str(caso.cliente_id) != ctx.cliente_id:
        raise HTTPException(404, "Caso não encontrado")
    return caso
