"""Construção e leitura do grafo de relações (NetworkX em memória + Postgres como verdade)."""
from __future__ import annotations
import uuid
from slugify import slugify
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Entidade, Relacao


async def upsert_entidade(
    db: AsyncSession,
    cliente_id: uuid.UUID,
    tipo: str,
    nome: str,
    identificador: str | None = None,
) -> Entidade:
    slug = slugify(nome)[:120] or "sem-nome"
    res = await db.execute(
        select(Entidade).where(
            Entidade.cliente_id == cliente_id,
            Entidade.tipo == tipo,
            Entidade.slug == slug,
        )
    )
    ent = res.scalar_one_or_none()
    if ent:
        if identificador and not ent.identificador:
            ent.identificador = identificador
        return ent
    ent = Entidade(
        cliente_id=cliente_id, tipo=tipo, nome=nome, slug=slug, identificador=identificador
    )
    db.add(ent)
    await db.flush()
    return ent


async def adicionar_relacao(
    db: AsyncSession,
    cliente_id: uuid.UUID,
    origem: Entidade,
    destino: Entidade,
    tipo: str,
    documento_id: uuid.UUID | None,
    pagina: int | None,
    trecho: str | None,
) -> Relacao:
    rel = Relacao(
        cliente_id=cliente_id,
        origem_id=origem.id,
        destino_id=destino.id,
        tipo=tipo,
        documento_id=documento_id,
        pagina=pagina,
        trecho=trecho,
    )
    db.add(rel)
    await db.flush()
    return rel


async def construir_grafo_json(db: AsyncSession, cliente_id: uuid.UUID) -> dict:
    ents_res = await db.execute(select(Entidade).where(Entidade.cliente_id == cliente_id))
    rels_res = await db.execute(select(Relacao).where(Relacao.cliente_id == cliente_id))
    nos = [
        {
            "id": str(e.id),
            "label": e.nome,
            "tipo": e.tipo,
            "identificador": e.identificador,
        }
        for e in ents_res.scalars()
    ]
    arestas = [
        {
            "source": str(r.origem_id),
            "target": str(r.destino_id),
            "tipo": r.tipo,
            "pagina": r.pagina,
            "documento": str(r.documento_id) if r.documento_id else None,
        }
        for r in rels_res.scalars()
    ]
    return {"nos": nos, "arestas": arestas}
