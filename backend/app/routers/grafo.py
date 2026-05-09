"""Endpoints do grafo (formato Cytoscape-friendly)."""
import uuid
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import AuthContext, get_auth
from app.db import get_db
from app.schemas import GrafoOut
from app.services import graph as graph_svc

router = APIRouter()


@router.get("", response_model=GrafoOut)
async def obter_grafo(ctx: AuthContext = Depends(get_auth), db: AsyncSession = Depends(get_db)):
    return await graph_svc.construir_grafo_json(db, uuid.UUID(ctx.cliente_id))


@router.get("/caso/{caso_id}", response_model=GrafoOut)
async def obter_grafo_caso(
    caso_id: uuid.UUID,
    ctx: AuthContext = Depends(get_auth),
    db: AsyncSession = Depends(get_db),
):
    """Grafo filtrado pelos documentos de um caso específico."""
    return await graph_svc.construir_grafo_json_por_caso(db, caso_id)
