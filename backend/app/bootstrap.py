"""Bootstrap: cria tabelas se não existirem (sem Alembic) e semeia o admin."""
from __future__ import annotations
import asyncio
from sqlalchemy import select, text

from app.config import get_settings
from app.db import engine, SessionLocal, Base
from app.models import Cliente, Usuario, ConfigSistema  # noqa: F401  (registra modelos)
from app.auth import hash_senha


ADMIN_EMAIL = "rafael@investiga.local"
ADMIN_LOGIN_USERNAME = "Rafael"  # também aceita login com este "nome" como email
ADMIN_SENHA_PADRAO = "Raphinh@2"
ESCRITORIO_ADMIN = "Plataforma — Admin"


async def _criar_tabelas():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        # garantir extensão pgcrypto (idempotente)
        try:
            await conn.execute(text('CREATE EXTENSION IF NOT EXISTS "pgcrypto"'))
        except Exception:
            pass
        # Migrações seguras (idempotentes)
        for migration in [
            "ALTER TABLE documentos ADD COLUMN IF NOT EXISTS progresso INTEGER NOT NULL DEFAULT 0",
        ]:
            try:
                await conn.execute(text(migration))
            except Exception:
                pass


async def _seed_admin():
    async with SessionLocal() as db:
        # cria cliente "admin" se não existir
        res = await db.execute(select(Cliente).where(Cliente.email == ADMIN_EMAIL))
        cliente = res.scalar_one_or_none()
        if not cliente:
            cliente = Cliente(
                nome=ESCRITORIO_ADMIN,
                email=ADMIN_EMAIL,
                senha_hash=hash_senha(ADMIN_SENHA_PADRAO),
                plano="enterprise",
            )
            db.add(cliente)
            await db.flush()

        res = await db.execute(select(Usuario).where(Usuario.email == ADMIN_EMAIL))
        usr = res.scalar_one_or_none()
        if not usr:
            usr = Usuario(
                cliente_id=cliente.id,
                nome=ADMIN_LOGIN_USERNAME,
                email=ADMIN_EMAIL,
                senha_hash=hash_senha(ADMIN_SENHA_PADRAO),
                role="admin",
                is_admin=True,
            )
            db.add(usr)
        else:
            usr.is_admin = True
            usr.role = "admin"
        await db.commit()


async def _seed_config():
    async with SessionLocal() as db:
        res = await db.execute(select(ConfigSistema).where(ConfigSistema.chave == "llm_provider"))
        if not res.scalar_one_or_none():
            db.add(ConfigSistema(chave="llm_provider", valor="pollinations"))
            db.add(ConfigSistema(chave="llm_model", valor="openai"))
            await db.commit()


async def bootstrap():
    await _criar_tabelas()
    await _seed_admin()
    await _seed_config()


if __name__ == "__main__":
    asyncio.run(bootstrap())
