"""Schemas Pydantic (entrada/saída da API)."""
from __future__ import annotations
import uuid
from datetime import datetime
from pydantic import BaseModel, EmailStr, Field


# --- Auth ---
class RegistroIn(BaseModel):
    nome_escritorio: str
    nome_usuario: str
    email: EmailStr
    senha: str = Field(min_length=8)


class LoginIn(BaseModel):
    email: EmailStr
    senha: str


class TokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"


# --- Casos ---
class CasoIn(BaseModel):
    nome: str
    descricao: str | None = None


class CasoOut(BaseModel):
    id: uuid.UUID
    nome: str
    descricao: str | None
    status: str
    criado_em: datetime
    class Config:
        from_attributes = True


# --- Documentos ---
class DocumentoOut(BaseModel):
    id: uuid.UUID
    nome_arquivo: str
    status: str
    total_paginas: int | None
    total_chunks: int | None
    criado_em: datetime
    class Config:
        from_attributes = True


# --- Chat ---
class ChatIn(BaseModel):
    pergunta: str
    caso_id: uuid.UUID


class ChunkUsado(BaseModel):
    documento_id: str
    nome_arquivo: str
    pagina: int
    trecho: str


class ChatOut(BaseModel):
    resposta: str
    fontes: list[ChunkUsado]
    tokens: int


# --- Grafo ---
class NoGrafo(BaseModel):
    id: str
    label: str
    tipo: str
    identificador: str | None = None


class ArestaGrafo(BaseModel):
    source: str
    target: str
    tipo: str
    pagina: int | None = None
    documento: str | None = None


class GrafoOut(BaseModel):
    nos: list[NoGrafo]
    arestas: list[ArestaGrafo]


# --- Correções OCR ---
class CorrecaoOut(BaseModel):
    id: uuid.UUID
    documento_id: uuid.UUID
    pagina: int
    texto_original: str
    texto_corrigido: str
    motivo: str | None
    confianca: float | None
    aceita_pelo_usuario: bool | None
    class Config:
        from_attributes = True
