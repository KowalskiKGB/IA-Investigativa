"""Auth — registro e login."""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db import get_db
from app.models import Cliente, Usuario
from app.schemas import RegistroIn, LoginIn, TokenOut
from app.auth import hash_senha, verifica_senha, gerar_token

router = APIRouter()


@router.post("/registro", response_model=TokenOut, status_code=201)
async def registrar(dados: RegistroIn, db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(Cliente).where(Cliente.email == dados.email))
    if res.scalar_one_or_none():
        raise HTTPException(status.HTTP_409_CONFLICT, "Email já cadastrado")
    cliente = Cliente(
        nome=dados.nome_escritorio, email=dados.email, senha_hash=hash_senha(dados.senha),
    )
    db.add(cliente)
    await db.flush()
    usr = Usuario(
        cliente_id=cliente.id,
        nome=dados.nome_usuario,
        email=dados.email,
        senha_hash=cliente.senha_hash,
        role="admin",
    )
    db.add(usr)
    await db.commit()
    return TokenOut(access_token=gerar_token(str(usr.id), str(cliente.id)))


@router.post("/login", response_model=TokenOut)
async def login(dados: LoginIn, db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(Usuario).where(Usuario.email == dados.email))
    usr = res.scalar_one_or_none()
    if not usr or not verifica_senha(dados.senha, usr.senha_hash):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Credenciais inválidas")
    return TokenOut(access_token=gerar_token(str(usr.id), str(usr.cliente_id)))
