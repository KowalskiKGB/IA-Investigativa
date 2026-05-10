"""Pipeline de processamento de documento (background task).

Fix v2:
- Marca 'concluido' após OCR + embeddings (antes do LLM).
- Extração de entidades / correções OCR roda em asyncio.create_task (bg) sem afetar status.
- Todas as operações síncronas (OCR, embeddings) usam asyncio.to_thread para não bloquear o loop.
"""
from __future__ import annotations
import asyncio
import hashlib
import uuid
import logging
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db import SessionLocal
from app.models import Documento, PaginaMD, CorrecaoOCR
from app.services import ocr, chunker, embeddings, vector_store, llm, graph as graph_svc, storage, settings_svc

log = logging.getLogger(__name__)


async def processar(documento_id: uuid.UUID, cliente_id: uuid.UUID, storage_key: str):
    """OCR + embedding + marca concluido. LLM roda em background separado."""
    async with SessionLocal() as db:
        doc = await db.get(Documento, documento_id)
        if not doc:
            return
        doc.status = "processando"
        doc.progresso = 5
        await db.commit()

    try:
        # 1. Download + OCR (síncronos → thread)
        pdf_bytes = await asyncio.to_thread(storage.download_bytes, storage_key)
        sha = hashlib.sha256(pdf_bytes).hexdigest()
        md_total, paginas = await asyncio.to_thread(ocr.extrair_tudo, pdf_bytes)

        # 2. Salvar páginas Markdown
        async with SessionLocal() as db:
            doc = await db.get(Documento, documento_id)
            doc.sha256 = sha
            doc.total_paginas = len(paginas)
            doc.progresso = 55
            for num, md in paginas:
                db.add(PaginaMD(documento_id=documento_id, numero=num, texto_md=md))
            await db.commit()

        # 3. Chunking
        chunks = chunker.chunk_paginas(
            paginas, str(documento_id), doc.nome_arquivo, tamanho=500, overlap=50
        )

        # 4. Embeddings + indexação (síncronos → thread)
        if chunks:
            vetores = await asyncio.to_thread(embeddings.gerar, [c.texto for c in chunks])
            ids = [f"{documento_id}:{c.indice}" for c in chunks]
            metas = [
                {
                    "documento_id": str(documento_id),
                    "nome_arquivo": c.nome_arquivo,
                    "pagina": c.pagina,
                    "indice": c.indice,
                }
                for c in chunks
            ]
            try:
                await asyncio.to_thread(
                    vector_store.indexar, str(cliente_id), ids, [c.texto for c in chunks], vetores, metas
                )
            except Exception as chroma_err:
                log.warning(
                    "ChromaDB indexing falhou para %s (documento ainda acessível via texto): %s",
                    documento_id, chroma_err,
                )

        # 5. Marcar CONCLUÍDO — documento já é pesquisável e acessível
        async with SessionLocal() as db:
            doc = await db.get(Documento, documento_id)
            doc.total_chunks = len(chunks)
            doc.status = "concluido"
            doc.progresso = 90
            await db.commit()

        # 6. Extração LLM em background (não bloqueia status nem o loop)
        asyncio.create_task(
            _extrair_entidades_bg(documento_id, cliente_id, paginas)
        )

    except Exception as exc:
        log.exception("Falha ao processar documento %s", documento_id)
        async with SessionLocal() as db:
            doc = await db.get(Documento, documento_id)
            if doc:
                doc.status = "erro"
                doc.erro = str(exc)[:1000]
                await db.commit()


async def _extrair_entidades_bg(
    documento_id: uuid.UUID,
    cliente_id: uuid.UUID,
    paginas: list[tuple[int, str]],
) -> None:
    """Extrai entidades + sugere correções OCR via LLM. Falhas não afetam o documento."""
    try:
        async with SessionLocal() as db:
            cfg = await settings_svc.carregar_dict(db)

        for num, md in paginas:
            if not md.strip():
                continue

            ext = await asyncio.to_thread(llm.extrair_entidades, md, num, cfg)

            async with SessionLocal() as db:
                ent_map: dict[str, object] = {}
                for ent in ext.get("entidades", []):
                    if not ent.get("nome"):
                        continue
                    obj = await graph_svc.upsert_entidade(
                        db, cliente_id, ent.get("tipo", "outro"),
                        ent["nome"], ent.get("identificador"),
                    )
                    ent_map[ent["nome"]] = obj
                for rel in ext.get("relacoes", []):
                    o = ent_map.get(rel.get("origem"))
                    d = ent_map.get(rel.get("destino"))
                    if not o or not d:
                        continue
                    await graph_svc.adicionar_relacao(
                        db, cliente_id, o, d,
                        rel.get("tipo", "relacionado"),
                        documento_id, num, rel.get("trecho"),
                    )

                correcoes = await asyncio.to_thread(llm.sugerir_correcoes, md, num, cfg)
                for cor in correcoes:
                    db.add(CorrecaoOCR(
                        documento_id=documento_id,
                        pagina=num,
                        texto_original=cor.get("texto_original", "")[:5000],
                        texto_corrigido=cor.get("texto_corrigido", "")[:5000],
                        motivo=cor.get("motivo"),
                        confianca=cor.get("confianca"),
                    ))
                await db.commit()

        async with SessionLocal() as db:
            doc = await db.get(Documento, documento_id)
            if doc and doc.status == "concluido":
                doc.progresso = 100
                await db.commit()

    except Exception:
        log.exception("Falha na extração LLM (bg) para %s", documento_id)
        # Não altera o status — documento permanece 'concluido' e pesquisável

