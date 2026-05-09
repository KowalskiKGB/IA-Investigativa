"""Painel admin — listar clientes, usuários, uso, configurar IA."""
from __future__ import annotations
import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import AuthContext, get_auth, hash_senha
from app.db import get_db
from app.models import Cliente, Usuario, Caso, Documento, Mensagem, PaginaMD, ConfigSistema
from app.services import settings_svc

router = APIRouter()


async def _exigir_admin(ctx: AuthContext, db: AsyncSession) -> Usuario:
    usr = await db.get(Usuario, uuid.UUID(ctx.usuario_id))
    if not usr or not usr.is_admin:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Acesso restrito ao administrador")
    return usr


@router.get("/clientes")
async def listar_clientes(ctx: AuthContext = Depends(get_auth), db: AsyncSession = Depends(get_db)):
    await _exigir_admin(ctx, db)
    clientes = (await db.execute(select(Cliente).order_by(Cliente.criado_em.desc()))).scalars().all()
    out = []
    for c in clientes:
        usr_count = (await db.execute(
            select(func.count()).select_from(Usuario).where(Usuario.cliente_id == c.id)
        )).scalar()
        casos_count = (await db.execute(
            select(func.count()).select_from(Caso).where(Caso.cliente_id == c.id)
        )).scalar()
        docs_count = (await db.execute(
            select(func.count()).select_from(Documento).join(Caso).where(Caso.cliente_id == c.id)
        )).scalar()
        msgs_count = (await db.execute(
            select(func.count()).select_from(Mensagem).join(Caso).where(Caso.cliente_id == c.id)
        )).scalar()
        out.append({
            "id": str(c.id), "nome": c.nome, "email": c.email,
            "plano": c.plano, "criado_em": c.criado_em,
            "usuarios": usr_count, "casos": casos_count,
            "documentos": docs_count, "mensagens": msgs_count,
        })
    return out


@router.get("/clientes/{cliente_id}")
async def detalhe_cliente(cliente_id: uuid.UUID, ctx: AuthContext = Depends(get_auth), db: AsyncSession = Depends(get_db)):
    await _exigir_admin(ctx, db)
    c = await db.get(Cliente, cliente_id)
    if not c:
        raise HTTPException(404, "Cliente não encontrado")
    usuarios = (await db.execute(select(Usuario).where(Usuario.cliente_id == cliente_id))).scalars().all()
    casos = (await db.execute(select(Caso).where(Caso.cliente_id == cliente_id))).scalars().all()
    return {
        "cliente": {"id": str(c.id), "nome": c.nome, "email": c.email, "plano": c.plano, "criado_em": c.criado_em},
        "usuarios": [{"id": str(u.id), "nome": u.nome, "email": u.email, "role": u.role, "is_admin": u.is_admin} for u in usuarios],
        "casos": [{"id": str(k.id), "nome": k.nome, "status": k.status, "criado_em": k.criado_em} for k in casos],
    }


@router.get("/clientes/{cliente_id}/casos/{caso_id}/documentos")
async def docs_admin(cliente_id: uuid.UUID, caso_id: uuid.UUID, ctx: AuthContext = Depends(get_auth), db: AsyncSession = Depends(get_db)):
    await _exigir_admin(ctx, db)
    docs = (await db.execute(
        select(Documento).join(Caso).where(Caso.id == caso_id, Caso.cliente_id == cliente_id)
    )).scalars().all()
    return [{"id": str(d.id), "nome_arquivo": d.nome_arquivo, "status": d.status, "total_paginas": d.total_paginas} for d in docs]


@router.get("/documentos/{documento_id}/markdown")
async def md_admin(documento_id: uuid.UUID, ctx: AuthContext = Depends(get_auth), db: AsyncSession = Depends(get_db)):
    await _exigir_admin(ctx, db)
    doc = await db.get(Documento, documento_id)
    if not doc:
        raise HTTPException(404)
    paginas = (await db.execute(
        select(PaginaMD).where(PaginaMD.documento_id == documento_id).order_by(PaginaMD.numero)
    )).scalars().all()
    return {"nome_arquivo": doc.nome_arquivo, "markdown": "\n".join(p.texto_md for p in paginas)}


# --- Criar usuário (em qualquer cliente, ou admin) ---
@router.post("/usuarios")
async def criar_usuario(
    payload: dict, ctx: AuthContext = Depends(get_auth), db: AsyncSession = Depends(get_db)
):
    await _exigir_admin(ctx, db)
    cliente_id = payload.get("cliente_id")
    nome_escritorio_novo = payload.get("nome_escritorio")
    if not cliente_id:
        if not nome_escritorio_novo:
            raise HTTPException(400, "Informe cliente_id ou nome_escritorio")
        cli = Cliente(
            nome=nome_escritorio_novo,
            email=payload["email"],
            senha_hash=hash_senha(payload["senha"]),
            plano=payload.get("plano", "solo"),
        )
        db.add(cli)
        await db.flush()
        cliente_id = cli.id
    usr = Usuario(
        cliente_id=cliente_id,
        nome=payload.get("nome", "Usuário"),
        email=payload["email"],
        senha_hash=hash_senha(payload["senha"]),
        role=payload.get("role", "membro"),
        is_admin=bool(payload.get("is_admin", False)),
    )
    db.add(usr)
    await db.commit()
    return {"id": str(usr.id), "ok": True}


# --- Configurações (LLM provider, chaves, prompt) ---
@router.get("/config")
async def get_config(ctx: AuthContext = Depends(get_auth), db: AsyncSession = Depends(get_db)):
    await _exigir_admin(ctx, db)
    cfg = await settings_svc.carregar_dict(db)
    # mascara chaves sensíveis na resposta
    for k in ("anthropic_api_key", "openai_api_key", "groq_api_key", "openrouter_api_key"):
        if cfg.get(k):
            cfg[k] = cfg[k][:4] + "•••" + cfg[k][-2:]
    return cfg


@router.post("/config")
async def set_config(payload: dict, ctx: AuthContext = Depends(get_auth), db: AsyncSession = Depends(get_db)):
    await _exigir_admin(ctx, db)
    permitidas = {
        "llm_provider", "llm_model",
        "anthropic_api_key", "openai_api_key", "groq_api_key", "openrouter_api_key",
        "system_prompt_override",
    }
    for k, v in payload.items():
        if k in permitidas:
            await settings_svc.salvar(db, k, str(v))
    return {"ok": True}


@router.get("/stats")
async def stats(ctx: AuthContext = Depends(get_auth), db: AsyncSession = Depends(get_db)):
    await _exigir_admin(ctx, db)
    return {
        "clientes": (await db.execute(select(func.count()).select_from(Cliente))).scalar(),
        "usuarios": (await db.execute(select(func.count()).select_from(Usuario))).scalar(),
        "casos": (await db.execute(select(func.count()).select_from(Caso))).scalar(),
        "documentos": (await db.execute(select(func.count()).select_from(Documento))).scalar(),
        "mensagens": (await db.execute(select(func.count()).select_from(Mensagem))).scalar(),
    }
