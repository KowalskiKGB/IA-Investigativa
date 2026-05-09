"""Modelos SQLAlchemy."""
from __future__ import annotations
import uuid
from datetime import datetime
from sqlalchemy import (
    String, Integer, ForeignKey, Text, DateTime, Numeric, Boolean, JSON,
    func,
)
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db import Base


def _uuid_pk():
    return mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)


class Cliente(Base):
    __tablename__ = "clientes"
    id: Mapped[uuid.UUID] = _uuid_pk()
    nome: Mapped[str] = mapped_column(String, nullable=False)
    email: Mapped[str] = mapped_column(String, unique=True, nullable=False)
    senha_hash: Mapped[str] = mapped_column(String, nullable=False)
    plano: Mapped[str] = mapped_column(String, default="solo")
    criado_em: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class Usuario(Base):
    __tablename__ = "usuarios"
    id: Mapped[uuid.UUID] = _uuid_pk()
    cliente_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("clientes.id", ondelete="CASCADE"))
    nome: Mapped[str] = mapped_column(String, nullable=False)
    email: Mapped[str] = mapped_column(String, unique=True, nullable=False)
    senha_hash: Mapped[str] = mapped_column(String, nullable=False)
    role: Mapped[str] = mapped_column(String, default="membro")
    is_admin: Mapped[bool] = mapped_column(Boolean, default=False)
    criado_em: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class ConfigSistema(Base):
    __tablename__ = "config_sistema"
    chave: Mapped[str] = mapped_column(String, primary_key=True)
    valor: Mapped[str | None] = mapped_column(Text)
    atualizado_em: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())


class Caso(Base):
    __tablename__ = "casos"
    id: Mapped[uuid.UUID] = _uuid_pk()
    cliente_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("clientes.id", ondelete="CASCADE"))
    nome: Mapped[str] = mapped_column(String, nullable=False)
    descricao: Mapped[str | None] = mapped_column(Text)
    status: Mapped[str] = mapped_column(String, default="ativo")
    criado_em: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class Documento(Base):
    __tablename__ = "documentos"
    id: Mapped[uuid.UUID] = _uuid_pk()
    caso_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("casos.id", ondelete="CASCADE"))
    nome_arquivo: Mapped[str] = mapped_column(String, nullable=False)
    mime_type: Mapped[str | None] = mapped_column(String)
    url_storage: Mapped[str] = mapped_column(String, nullable=False)
    sha256: Mapped[str | None] = mapped_column(String)
    status: Mapped[str] = mapped_column(String, default="pendente")
    total_paginas: Mapped[int | None] = mapped_column(Integer)
    total_chunks: Mapped[int | None] = mapped_column(Integer)
    erro: Mapped[str | None] = mapped_column(Text)
    criado_em: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class PaginaMD(Base):
    __tablename__ = "paginas_md"
    id: Mapped[uuid.UUID] = _uuid_pk()
    documento_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("documentos.id", ondelete="CASCADE"))
    numero: Mapped[int] = mapped_column(Integer, nullable=False)
    texto_md: Mapped[str] = mapped_column(Text, nullable=False)


class Mensagem(Base):
    __tablename__ = "mensagens"
    id: Mapped[uuid.UUID] = _uuid_pk()
    caso_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("casos.id", ondelete="CASCADE"))
    usuario_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("usuarios.id", ondelete="SET NULL"))
    role: Mapped[str] = mapped_column(String, nullable=False)
    conteudo: Mapped[str] = mapped_column(Text, nullable=False)
    chunks_usados: Mapped[dict | None] = mapped_column(JSONB)
    tokens_in: Mapped[int | None] = mapped_column(Integer)
    tokens_out: Mapped[int | None] = mapped_column(Integer)
    criado_em: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class Entidade(Base):
    __tablename__ = "entidades"
    id: Mapped[uuid.UUID] = _uuid_pk()
    cliente_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("clientes.id", ondelete="CASCADE"))
    tipo: Mapped[str] = mapped_column(String, nullable=False)
    nome: Mapped[str] = mapped_column(String, nullable=False)
    slug: Mapped[str] = mapped_column(String, nullable=False)
    identificador: Mapped[str | None] = mapped_column(String)
    metadata_: Mapped[dict] = mapped_column("metadata", JSONB, default=dict)
    criado_em: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class Relacao(Base):
    __tablename__ = "relacoes"
    id: Mapped[uuid.UUID] = _uuid_pk()
    cliente_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("clientes.id", ondelete="CASCADE"))
    origem_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("entidades.id", ondelete="CASCADE"))
    destino_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("entidades.id", ondelete="CASCADE"))
    tipo: Mapped[str] = mapped_column(String, nullable=False)
    documento_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("documentos.id", ondelete="SET NULL"))
    pagina: Mapped[int | None] = mapped_column(Integer)
    trecho: Mapped[str | None] = mapped_column(Text)
    criado_em: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class CorrecaoOCR(Base):
    __tablename__ = "correcoes_ocr"
    id: Mapped[uuid.UUID] = _uuid_pk()
    documento_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("documentos.id", ondelete="CASCADE"))
    pagina: Mapped[int] = mapped_column(Integer, nullable=False)
    texto_original: Mapped[str] = mapped_column(Text, nullable=False)
    texto_corrigido: Mapped[str] = mapped_column(Text, nullable=False)
    motivo: Mapped[str | None] = mapped_column(Text)
    confianca: Mapped[float | None] = mapped_column(Numeric(3, 2))
    aceita_pelo_usuario: Mapped[bool | None] = mapped_column(Boolean)
    criado_em: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
