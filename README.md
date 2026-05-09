# 🏛️ Investigação Documental para Advogados

> SaaS de investigação documental: PDF → OCR → Markdown (Obsidian-compat) → RAG (Claude) + Grafo de relações.

## Visão rápida

- **Backend**: FastAPI + Postgres + ChromaDB + MinIO
- **Frontend**: Next.js 14 + Tailwind + Cytoscape.js (visualizador estilo Obsidian)
- **Diferencial**: system prompt investigativo testado com 1.000+ páginas de Diários Oficiais
- **Documentação**: ver [`docs/PLANO-DE-NEGOCIO.md`](docs/PLANO-DE-NEGOCIO.md) e [`docs/RUNBOOK-DEPLOY.md`](docs/RUNBOOK-DEPLOY.md)

## Quickstart (local)

```powershell
# 1. Inicializar .env
.\scripts\init-env.ps1
# (edite .env e preencha ANTHROPIC_API_KEY/OPENAI_API_KEY se quiser usar IA real)

# 2. Subir tudo (Postgres + ChromaDB + MinIO + backend + frontend)
docker compose up --build

# 3. Acessar
# Frontend:  http://localhost:3000
# Backend:   http://localhost:8000/docs (Swagger)
# MinIO:     http://localhost:9001  (user/pass do .env)
```

> **Modo demo**: sem chaves de IA, embeddings usam fallback determinístico
> e o chat retorna um placeholder com os trechos encontrados no RAG —
> útil para validar o fluxo end-to-end sem custo.

## Estrutura

```
.
├── backend/          FastAPI + pipeline OCR/RAG/Grafo
│   ├── app/
│   │   ├── routers/  auth, casos, documentos, chat, grafo, correcoes
│   │   ├── services/ ocr, chunker, embeddings, vector_store, claude_svc, graph, storage, pipeline
│   │   ├── models.py · schemas.py · auth.py · db.py · config.py · main.py
│   ├── prompts/      INSTRUCOES-INVESTIGACAO.md (núcleo do produto, NÃO público)
│   └── db/init.sql
├── frontend/         Next.js 14 (App Router)
│   ├── app/          login, registro, casos, casos/[id], grafo, correções
│   └── components/   GrafoViewer.tsx (Cytoscape estilo Obsidian)
├── docs/             plano de negócio + runbook deploy
├── docker-compose.yml
├── .env.example
└── Diarios MD/       vault Obsidian (exemplo real, fora do app)
```

## Roadmap

Ver [`docs/PLANO-DE-NEGOCIO.md`](docs/PLANO-DE-NEGOCIO.md) — fases 1 a 4 (MVP → escala AWS).

## Deploy (Coolify + Cloudflare)

Projeto Coolify: **Investigacao SaaS** (`ma1duzhcrd068cgmo3q5ic79`).
Ver passos completos em [`docs/RUNBOOK-DEPLOY.md`](docs/RUNBOOK-DEPLOY.md).

## Segurança

- Multi-tenant (collection ChromaDB por cliente, escopo Postgres por `cliente_id`)
- JWT + bcrypt
- Storage S3-compatível com keys por tenant/caso
- LGPD: auditoria de acesso, direito de exclusão (a implementar)
- **Nunca** commitar `.env` (já em `.gitignore`)
