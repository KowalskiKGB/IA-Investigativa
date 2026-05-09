# 📑 Plano de Negócio — Investigação Documental para Advogados

> Documento estratégico do produto. Atualizar conforme o projeto evolui.
> Data inicial: 2026-05-09.

---

## 1. Resumo Executivo

**Produto**: SaaS B2B onde escritórios de advocacia fazem upload de PDFs e imagens (processos, diários oficiais, contratos, perícias). O sistema:

1. Faz **OCR + conversão para Markdown** (canônico, durável, lido por IA).
2. **Corrige erros de OCR** automaticamente, registrando cada correção com nº da página para o advogado conferir no PDF original.
3. **Indexa** os documentos em embeddings (RAG).
4. **Extrai entidades** (pessoas, empresas, CNPJs, valores, datas, processos) e monta um **grafo de relações** estilo Obsidian.
5. Oferece **chat investigativo** que responde apenas com base nos documentos do cliente, sempre citando arquivo + página.
6. Exporta o vault em formato 100% **compatível com Obsidian** (cliente leva os dados).

**Diferencial central**: o system prompt em [`backend/prompts/INSTRUCOES-INVESTIGACAO.md`](../backend/prompts/INSTRUCOES-INVESTIGACAO.md) — uma metodologia investigativa testada em mais de 1.000 páginas de Diários Oficiais de Macapá/AP.

---

## 2. Cliente-alvo

| Segmento | Dor | Disposição a pagar |
|---|---|---|
| Escritórios de **direito público** | Cruzar nomeações, contratos, licitações em milhares de páginas de DOM/DOE | Alta |
| **Advocacia criminal** | Mapear vínculos societários, fluxos financeiros em inquéritos extensos | Alta |
| **Compliance / due diligence** | Bater nomes de partes contra processos públicos | Média-alta |
| **Jornalismo investigativo** | Mesma necessidade, orçamento menor | Plano "Pro Solo" |

**Beachhead**: escritórios de direito público em capitais com Diários Oficiais grandes (Macapá, Belém, São Luís, Manaus). Produto já tem um *playbook* validado com Diários de Macapá.

---

## 3. Proposta de Valor

> "Em 1 hora seu escritório vê em um grafo o que levaria 3 dias de leitura cruzada — com cada conexão clicável até a página do PDF."

- **OCR auditável**: toda correção é registrada em `Correcoes/` com nº da página → o advogado confere e mantém prova judicial intacta.
- **Markdown soberano**: cliente exporta tudo e abre no Obsidian — sem aprisionamento.
- **Grafo navegável**: visualização estilo Obsidian Graph View nativa no produto.
- **Chat com fonte**: respostas sempre com `arquivo.pdf, p. N` — pronto para citação processual.

---

## 4. Modelo de Receita

### Planos sugeridos (ajustar após pilotos)

| Plano | Mensal | Inclui |
|---|---|---|
| **Solo** | R$ 297 | 1 usuário, 500 páginas/mês, 5 casos ativos |
| **Escritório** | R$ 897 | 5 usuários, 3.000 páginas/mês, casos ilimitados, grafo cross-casos |
| **Enterprise** | sob consulta | SSO, deploy dedicado, SLA, on-prem |

**Add-ons**: páginas extras (R$ 0,30/pág), OCR de áudio/vídeo, exportação assinada.

### Custo unitário (referência interna)
- ~U$ 10/mês de infra+APIs por cliente "Escritório" → margem bruta > 90%.

---

## 5. Roadmap (Fases)

### ✅ Fase 0 — Base conceitual (concluída)
- [x] System prompt `INSTRUCOES-INVESTIGACAO.md`
- [x] Validação manual com Diários de Macapá (vault em `Diarios MD/`)
- [x] Arquitetura de referência

### 🔨 Fase 1 — MVP Local (4–6 sem)
- [ ] Backend FastAPI: upload, OCR, chunker, embeddings, chat RAG
- [ ] Postgres + ChromaDB via docker-compose
- [ ] Auth JWT simples + multi-tenant
- [ ] Frontend Next.js: login, upload, lista de casos, chat
- [ ] Deploy no servidor próprio via **Coolify**
- [ ] Cloudflare Tunnel para HTTPS público

### 🌐 Fase 2 — Grafo + UX Obsidian (3–4 sem)
- [ ] Extração de entidades (Claude Haiku) pós-upload
- [ ] Grafo NetworkX → endpoint JSON
- [ ] Visualizador Cytoscape.js com look-and-feel Obsidian
- [ ] Painel de correções OCR (lista de correções por página)
- [ ] Exportador do vault (.zip pronto pro Obsidian)

### 💼 Fase 3 — Produto Comercial (3–4 sem)
- [ ] Cobrança (Stripe ou Asaas)
- [ ] Painel admin (uso, faturamento)
- [ ] Onboarding guiado
- [ ] Relatório de investigação (PDF assinado)
- [ ] Termos LGPD + DPA template

### ☁️ Fase 4 — Escala (após validação)
- [ ] Migrar ChromaDB → Pinecone
- [ ] Migrar NetworkX → Neo4j
- [ ] AWS (ECS + RDS + S3) com IaC (Terraform)
- [ ] Suporte a DOCX, áudio (Whisper), vídeo

---

## 6. LGPD & Segurança (não-negociável)

- **Isolamento por tenant**: namespace no Vector DB + Postgres RLS.
- **Criptografia em repouso**: discos do servidor + S3 SSE.
- **Criptografia em trânsito**: HTTPS via Cloudflare obrigatório.
- **Logs de acesso**: cada leitura de documento auditada (quem, quando, qual caso).
- **Não-treino**: cláusula explícita no contrato Anthropic/OpenAI já prevê não-uso para treino; reforçar no DPA com cliente.
- **DPO**: indicar responsável formal antes do primeiro cliente pago.
- **Direito de exclusão**: endpoint `DELETE /clientes/{id}/dados` que apaga storage + vetores + grafo + DB.

---

## 7. Stack Final (decidida)

| Camada | Escolha | Motivo |
|---|---|---|
| Backend | FastAPI + Python 3.12 | Async, ecossistema IA |
| LLM | Claude Sonnet 4.5 (chat) + Haiku 4.5 (extração) | Melhor para análise jurídica |
| OCR digital | pdfplumber + pymupdf | Grátis, preciso |
| OCR scaneado | Tesseract local + fallback Azure DI | Zero custo no início |
| Embeddings | OpenAI `text-embedding-3-small` | U$0,02/1M tokens |
| Vector DB | ChromaDB | Self-hosted, grátis |
| DB relacional | PostgreSQL 16 | Padrão sólido |
| Storage | MinIO (compat. S3) no servidor | Migração trivial pra AWS S3 |
| Grafo | NetworkX + JSON | Sem infra extra na Fase 1-2 |
| Frontend | Next.js 14 (App Router) + Tailwind | DX, SSR |
| Visualizador grafo | Cytoscape.js + tema Obsidian | Performance em grafos grandes |
| Auth | NextAuth + JWT no backend | Simples, compatível |
| Deploy | **Coolify no servidor próprio** | PaaS open-source, Docker-native |
| Edge / DNS | **Cloudflare** (Tunnel + DNS + WAF) | HTTPS grátis, esconde IP |

---

## 8. Métricas-chave (Norte do produto)

| Métrica | Alvo Fase 1 | Alvo Fase 3 |
|---|---|---|
| Páginas processadas/cliente/mês | 500 | 5.000 |
| Tempo médio upload → indexado | < 2 min/100 pág | < 30 s/100 pág |
| Taxa de correção OCR aceita pelo advogado | > 80% | > 95% |
| Acurácia de extração de entidade (F1) | > 0.7 | > 0.9 |
| NPS de advogados pilotos | ≥ 40 | ≥ 60 |

---

## 9. Plano de Lançamento (Go-to-market)

1. **2 pilotos gratuitos** com escritórios em Macapá (já temos relacionamento via os Diários).
2. Estudo de caso público com nomes anonimizados (com autorização).
3. Conteúdo técnico no LinkedIn / Jota / Migalhas explicando a metodologia.
4. Página de captação com vídeo de 90s mostrando o grafo crescendo em tempo real.
5. Preço de lançamento -30% para os 10 primeiros clientes anuais.

---

## 10. Riscos & Mitigações

| Risco | Mitigação |
|---|---|
| Vazamento de dado de cliente | Tenant isolation + auditoria + seguro cyber |
| Custo LLM dispara | Cache de respostas + Haiku para extração + limite por plano |
| OCR ruim em scaneados antigos | Fallback Azure Document Intelligence (paga só quando precisa) |
| Concorrente (LegalTech grande) | Foco vertical em **investigação** (não contratos), grafo + Obsidian export = lock-out reverso |
| Chave API exposta | Rotacionar tokens, secrets só em Coolify env, nunca em git |

---

## 11. Próximos passos imediatos (esta semana)

1. ✅ Estrutura do repositório criada (este commit)
2. Backend skeleton + endpoint `/health`
3. Postgres + ChromaDB rodando local via docker-compose
4. Upload PDF → OCR → chunks → ChromaDB funcionando
5. Frontend skeleton com tela de upload e chat
6. Deploy "hello world" no Coolify para validar pipeline
7. Cloudflare Tunnel apontando para o app
