"""Pipeline de processamento de documento (background task)."""
from __future__ import annotations
import hashlib
import uuid
import logging
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db import SessionLocal
from app.models import Documento, PaginaMD, CorrecaoOCR, Caso
from app.services import ocr, chunker, embeddings, vector_store, llm, graph as graph_svc, storage, settings_svc

log = logging.getLogger(__name__)


async def processar(documento_id: uuid.UUID, cliente_id: uuid.UUID, storage_key: str):
    """Executa o pipeline completo. Idempotente em caso de retry parcial."""
    async with SessionLocal() as db:
        doc = await db.get(Documento, documento_id)
        if not doc:
            return
        doc.status = "processando"
        await db.commit()

    try:
        pdf_bytes = storage.download_bytes(storage_key)
        sha = hashlib.sha256(pdf_bytes).hexdigest()
        md_total, paginas = ocr.extrair_tudo(pdf_bytes)

        # 1. Salvar páginas Markdown + metadados
        async with SessionLocal() as db:
            doc = await db.get(Documento, documento_id)
            doc.sha256 = sha
            doc.total_paginas = len(paginas)
            for num, md in paginas:
                db.add(PaginaMD(documento_id=documento_id, numero=num, texto_md=md))
            await db.commit()

        # 2. Chunking
        chunks = chunker.chunk_paginas(
            paginas, str(documento_id), doc.nome_arquivo, tamanho=500, overlap=50
        )

        # 3. Embeddings + indexação no Vector DB (namespace por cliente)
        if chunks:
            vetores = embeddings.gerar([c.texto for c in chunks])
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
            vector_store.indexar(
                str(cliente_id), ids, [c.texto for c in chunks], vetores, metas
            )

        # 4. Extração de entidades (1 vez por página) e correções OCR
        async with SessionLocal() as db:
            cfg = await settings_svc.carregar_dict(db)
            for num, md in paginas:
                # 4a. Entidades / relações
                ext = llm.extrair_entidades(md, num, db_settings=cfg)
                ent_map: dict[str, "uuid.UUID"] = {}
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

                # 4b. Correções de OCR
                for cor in llm.sugerir_correcoes(md, num, db_settings=cfg):
                    db.add(CorrecaoOCR(
                        documento_id=documento_id,
                        pagina=num,
                        texto_original=cor.get("texto_original", "")[:5000],
                        texto_corrigido=cor.get("texto_corrigido", "")[:5000],
                        motivo=cor.get("motivo"),
                        confianca=cor.get("confianca"),
                    ))
            await db.commit()

        # 5. Marcar concluído
        async with SessionLocal() as db:
            doc = await db.get(Documento, documento_id)
            doc.total_chunks = len(chunks)
            doc.status = "concluido"
            await db.commit()

    except Exception as exc:  # noqa: BLE001
        log.exception("Falha ao processar documento %s", documento_id)
        async with SessionLocal() as db:
            doc = await db.get(Documento, documento_id)
            if doc:
                doc.status = "erro"
                doc.erro = str(exc)[:1000]
                await db.commit()
