"""Chat investigativo — RAG sobre documentos do caso."""
import uuid
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import AuthContext, get_auth
from app.db import get_db
from app.models import Caso, Mensagem
from app.schemas import ChatIn, ChatOut, ChunkUsado
from app.services import embeddings, vector_store, claude_svc

router = APIRouter()


@router.post("", response_model=ChatOut)
async def perguntar(
    dados: ChatIn, ctx: AuthContext = Depends(get_auth), db: AsyncSession = Depends(get_db)
):
    caso = await db.get(Caso, dados.caso_id)
    if not caso or str(caso.cliente_id) != ctx.cliente_id:
        raise HTTPException(404, "Caso não encontrado")

    # 1. Embedding da pergunta
    [vec] = embeddings.gerar([dados.pergunta])

    # 2. Busca top-K chunks do tenant. (Nota: filtro por caso pode ser
    #    adicionado se quiser restringir; aqui aproveitamos cross-casos)
    resultados = vector_store.buscar(ctx.cliente_id, vec, k=8)

    chunks_para_llm = [
        {
            "texto": r["texto"],
            "fonte": r["metadata"].get("nome_arquivo", "documento"),
            "pagina": r["metadata"].get("pagina", 0),
            "documento_id": r["metadata"].get("documento_id"),
        }
        for r in resultados
    ]

    # 3. Chamar Claude
    resp = claude_svc.chat_investigativo(dados.pergunta, chunks_para_llm)

    # 4. Persistir histórico
    db.add(Mensagem(
        caso_id=dados.caso_id, usuario_id=uuid.UUID(ctx.usuario_id),
        role="user", conteudo=dados.pergunta,
    ))
    db.add(Mensagem(
        caso_id=dados.caso_id, usuario_id=uuid.UUID(ctx.usuario_id),
        role="assistant", conteudo=resp["resposta"],
        chunks_usados={"chunks": chunks_para_llm},
        tokens_in=resp.get("tokens_in"), tokens_out=resp.get("tokens_out"),
    ))
    await db.commit()

    return ChatOut(
        resposta=resp["resposta"],
        fontes=[
            ChunkUsado(
                documento_id=str(c["documento_id"]),
                nome_arquivo=c["fonte"],
                pagina=c["pagina"],
                trecho=c["texto"][:240],
            )
            for c in chunks_para_llm
        ],
        tokens=(resp.get("tokens_in", 0) + resp.get("tokens_out", 0)),
    )


@router.get("/{caso_id}/historico")
async def historico(
    caso_id: uuid.UUID, ctx: AuthContext = Depends(get_auth), db: AsyncSession = Depends(get_db)
):
    caso = await db.get(Caso, caso_id)
    if not caso or str(caso.cliente_id) != ctx.cliente_id:
        raise HTTPException(404, "Caso não encontrado")
    res = await db.execute(
        select(Mensagem).where(Mensagem.caso_id == caso_id).order_by(Mensagem.criado_em)
    )
    return [
        {"id": str(m.id), "role": m.role, "conteudo": m.conteudo, "criado_em": m.criado_em}
        for m in res.scalars()
    ]
