# 🏛️ Serviço de Investigação Documental para Advogados
## Arquitetura Completa — Blueprint de Desenvolvimento

---

## 1. Visão Geral do Produto

Um SaaS onde escritórios de advocacia fazem upload de documentos (PDFs, processos, contratos, diários oficiais) e interagem via chat com uma IA que:

- **Lê e indexa** todos os documentos do cliente
- **Conecta automaticamente** entidades entre documentos (pessoas, empresas, CNPJs, valores, datas)
- **Responde perguntas** com base apenas nos documentos enviados, sempre citando a fonte
- **Constrói um grafo visual** de relações entre as entidades encontradas
- **Mantém histórico** de investigações por caso, separado por cliente

O **diferencial** é o system prompt baseado na metodologia `INSTRUCOES-INVESTIGACAO.md` — a IA não apenas responde, ela raciocina como investigadora.

---

## 2. Conceitos Fundamentais

### 2.1 Multi-tenancy (isolamento por cliente)

```
Plataforma
├── Cliente A (Escritório Silva & Associados)
│   ├── Caso 1: "Contrato Prefeitura X"
│   │   ├── contrato_001.pdf
│   │   └── processo_456.pdf
│   ├── Caso 2: "Licitação Suspeita Y"
│   │   └── edital.pdf
│   └── Grafo de entidades do Cliente A
│
└── Cliente B (Escritório Mendes)
    ├── Caso 1: ...
    └── Grafo de entidades do Cliente B
```

- Cada cliente vê **apenas seus próprios dados**
- O grafo de relações conecta entidades **entre todos os casos do mesmo cliente**
- Um chat em "Caso 1" pode encontrar informações relevantes em "Caso 2" automaticamente

### 2.2 O que é RAG (Retrieval-Augmented Generation)

Em vez de mandar o documento inteiro para o Claude (caro e ineficiente), o sistema:

1. Divide o documento em pedaços pequenos (**chunks**) de ~500 palavras
2. Converte cada chunk num vetor numérico (**embedding**) que representa o "significado"
3. Quando o advogado pergunta algo, converte a pergunta em vetor também
4. Busca os chunks mais **semanticamente próximos** da pergunta
5. Manda apenas esses chunks para o Claude responder

Resultado: respostas precisas, custo baixo, fonte sempre rastreável.

### 2.3 O Grafo de Relações

O Claude extrai entidades de cada documento e as conecta:

```
[Fulano de Tal] ──── sócio ────► [Empresa X LTDA]
       │                                │
    servidor                         contrato
       │                                │
       ▼                                ▼
[Secretaria Y] ◄──── assinou ──── [Contrato Nº 123]
                                        │
                                     valor
                                        │
                                        ▼
                                  [R$ 2.400.000]
```

Esse grafo é visualizável no frontend como uma rede interativa — cada nó clicável mostra as páginas dos documentos que embasam a relação.

---

## 3. Arquitetura Técnica

### 3.1 Diagrama de Fluxo

```
UPLOAD DE DOCUMENTO
        │
        ▼
[FastAPI Backend]
        │
        ├─► OCR/Extração de texto (pdfplumber / pymupdf)
        │
        ├─► Divisão em chunks (500 palavras, overlap 50)
        │
        ├─► Geração de embeddings (OpenAI text-embedding-3-small)
        │
        ├─► Salvar chunks no Vector DB (ChromaDB/Pinecone)
        │   namespace: cliente_{id}_caso_{id}
        │
        └─► Extração de entidades via Claude
            └─► Salvar no grafo (Neo4j ou NetworkX)

────────────────────────────────────

CHAT DO ADVOGADO
        │
        ▼
[FastAPI Backend]
        │
        ├─► Busca vetorial: top 8 chunks mais relevantes
        │   (filtra por cliente_id)
        │
        ├─► Monta prompt:
        │   system = INSTRUCOES-INVESTIGACAO.md
        │   context = chunks encontrados
        │   user = pergunta do advogado
        │
        ├─► Chama Claude API (claude-sonnet-4-5)
        │
        ├─► Retorna resposta com fontes citadas
        │
        └─► Extrai novas relações → atualiza grafo

────────────────────────────────────

VISUALIZAÇÃO DO GRAFO
        │
        ▼
[Frontend Next.js]
        │
        └─► Requisita grafo JSON do backend
            └─► Renderiza com D3.js / Cytoscape.js
                (nós interativos, clique mostra fonte)
```

### 3.2 Stack Tecnológica

| Camada | Tecnologia | Por quê |
|---|---|---|
| **Backend** | Python + FastAPI | Rápido de desenvolver, async nativo |
| **LLM** | Claude API (Anthropic) | Melhor para análise jurídica/investigativa |
| **OCR/PDF** | pdfplumber + pymupdf | Gratuito, preciso para PDFs digitais |
| **OCR scaneado** | Tesseract ou Azure Doc Intelligence | Para documentos físicos fotografados |
| **Embeddings** | OpenAI text-embedding-3-small | Barato (~U$0,02/1M tokens) |
| **Vector DB** | ChromaDB (local) → Pinecone (escala) | ChromaDB grátis para começar |
| **Grafo** | NetworkX (dev) → Neo4j (prod) | NetworkX sem infraestrutura extra |
| **Banco relacional** | PostgreSQL | Usuários, casos, histórico de chats |
| **Frontend** | Next.js 14 (React) | SSR, otimizado, boa DX |
| **Grafo visual** | Cytoscape.js | Melhor que D3 para grafos complexos |
| **Autenticação** | Clerk ou Supabase Auth | Multi-tenant pronto, grátis até escala |
| **Storage de PDFs** | Supabase Storage ou S3 | Arquivos por tenant isolados |
| **Deploy backend** | Railway ou Render | Simples, suporta Python |
| **Deploy frontend** | Vercel | Grátis para Next.js |

### 3.3 Estrutura de Pastas do Projeto

```
investigacao-saas/
├── backend/
│   ├── main.py                    ← FastAPI app
│   ├── routers/
│   │   ├── auth.py                ← login, registro
│   │   ├── documentos.py          ← upload, processamento
│   │   ├── chat.py                ← chat com RAG
│   │   └── grafo.py               ← endpoints do grafo
│   ├── services/
│   │   ├── ocr.py                 ← extração de texto
│   │   ├── chunker.py             ← divisão em chunks
│   │   ├── embeddings.py          ← geração de vetores
│   │   ├── vector_store.py        ← ChromaDB/Pinecone
│   │   ├── claude.py              ← wrapper da API Claude
│   │   ├── entity_extractor.py   ← extração de entidades
│   │   └── graph.py               ← construção do grafo
│   ├── models/
│   │   ├── usuario.py
│   │   ├── caso.py
│   │   └── documento.py
│   ├── prompts/
│   │   └── INSTRUCOES-INVESTIGACAO.md  ← seu diferencial
│   └── requirements.txt
│
├── frontend/
│   ├── app/
│   │   ├── (auth)/
│   │   │   ├── login/page.tsx
│   │   │   └── registro/page.tsx
│   │   ├── dashboard/
│   │   │   ├── page.tsx           ← lista de casos
│   │   │   ├── [caso_id]/
│   │   │   │   ├── page.tsx       ← chat do caso
│   │   │   │   ├── documentos/    ← upload e lista
│   │   │   │   └── grafo/         ← visualização do grafo
│   │   └── layout.tsx
│   ├── components/
│   │   ├── Chat.tsx
│   │   ├── GrafoVisual.tsx        ← Cytoscape.js
│   │   ├── UploadDocumento.tsx
│   │   └── ListaEntidades.tsx
│   └── package.json
│
└── docker-compose.yml             ← PostgreSQL + ChromaDB local
```

---

## 4. Banco de Dados (Esquema PostgreSQL)

```sql
-- Clientes (escritórios)
CREATE TABLE clientes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    plano TEXT DEFAULT 'basico',  -- basico | profissional | enterprise
    criado_em TIMESTAMP DEFAULT NOW()
);

-- Casos de investigação
CREATE TABLE casos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cliente_id UUID REFERENCES clientes(id),
    nome TEXT NOT NULL,
    descricao TEXT,
    status TEXT DEFAULT 'ativo',  -- ativo | arquivado
    criado_em TIMESTAMP DEFAULT NOW()
);

-- Documentos enviados
CREATE TABLE documentos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    caso_id UUID REFERENCES casos(id),
    nome_arquivo TEXT NOT NULL,
    url_storage TEXT NOT NULL,      -- link S3/Supabase
    status_processamento TEXT DEFAULT 'pendente',  -- pendente | processando | concluido | erro
    total_paginas INTEGER,
    total_chunks INTEGER,
    criado_em TIMESTAMP DEFAULT NOW()
);

-- Histórico de chats
CREATE TABLE mensagens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    caso_id UUID REFERENCES casos(id),
    role TEXT NOT NULL,             -- user | assistant
    conteudo TEXT NOT NULL,
    chunks_usados JSONB,            -- quais chunks embasaram a resposta
    criado_em TIMESTAMP DEFAULT NOW()
);

-- Entidades extraídas (nós do grafo)
CREATE TABLE entidades (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cliente_id UUID REFERENCES clientes(id),
    tipo TEXT NOT NULL,             -- pessoa | empresa | orgao | processo | valor
    nome TEXT NOT NULL,
    identificador TEXT,             -- CPF, CNPJ, nº processo
    metadata JSONB,
    UNIQUE(cliente_id, tipo, nome)
);

-- Relações entre entidades (arestas do grafo)
CREATE TABLE relacoes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entidade_origem UUID REFERENCES entidades(id),
    entidade_destino UUID REFERENCES entidades(id),
    tipo_relacao TEXT NOT NULL,     -- socio | assinou | nomeou | contratou...
    fonte_documento_id UUID REFERENCES documentos(id),
    fonte_pagina INTEGER,
    fonte_trecho TEXT,              -- trecho exato que gerou a relação
    criado_em TIMESTAMP DEFAULT NOW()
);
```

---

## 5. A Chamada ao Claude (Código Central)

```python
# backend/services/claude.py
import anthropic
from pathlib import Path

client = anthropic.Anthropic(api_key="ANTHROPIC_API_KEY")

SYSTEM_PROMPT = Path("prompts/INSTRUCOES-INVESTIGACAO.md").read_text(encoding="utf-8")

def chat_investigativo(pergunta: str, chunks: list[dict]) -> dict:
    """
    chunks: lista de {"texto": "...", "fonte": "contrato.pdf", "pagina": 3}
    """
    contexto = "\n\n---\n\n".join([
        f"[Fonte: {c['fonte']}, Página {c['pagina']}]\n{c['texto']}"
        for c in chunks
    ])

    response = client.messages.create(
        model="claude-sonnet-4-5",
        max_tokens=4096,
        system=SYSTEM_PROMPT,
        messages=[
            {
                "role": "user",
                "content": f"""Contexto extraído dos documentos do cliente:

{contexto}

---

Pergunta do advogado:
{pergunta}

Responda com base apenas nos documentos acima. Cite sempre a fonte (arquivo e página).
Se identificar relações novas entre entidades, liste-as ao final no formato JSON:
```json
{{"relacoes": [{{"origem": "...", "destino": "...", "tipo": "...", "fonte": "...", "pagina": N}}]}}
```"""
            }
        ]
    )

    return {
        "resposta": response.content[0].text,
        "tokens_usados": response.usage.input_tokens + response.usage.output_tokens
    }
```

---

## 6. Extração de Entidades (Pós-Upload)

```python
# backend/services/entity_extractor.py

PROMPT_EXTRACAO = """
Analise o texto abaixo extraído de um documento jurídico/oficial.
Extraia todas as entidades relevantes e suas relações.

Retorne APENAS JSON válido no formato:
{
  "entidades": [
    {"tipo": "pessoa|empresa|orgao|processo|valor", "nome": "...", "identificador": "CPF/CNPJ/nº se houver"}
  ],
  "relacoes": [
    {"origem": "nome da entidade", "destino": "nome da entidade", "tipo": "socio|assinou|nomeou|contratou|recebeu|...", "pagina": N}
  ]
}

Texto:
{texto}
"""

def extrair_entidades(texto: str, pagina: int) -> dict:
    response = client.messages.create(
        model="claude-haiku-4-5",  # modelo mais barato para extração em volume
        max_tokens=2048,
        messages=[{"role": "user", "content": PROMPT_EXTRACAO.format(texto=texto)}]
    )
    # parse do JSON retornado
    import json
    return json.loads(response.content[0].text)
```

---

## 7. Endpoint de Upload (FastAPI)

```python
# backend/routers/documentos.py
from fastapi import APIRouter, UploadFile, Depends

router = APIRouter()

@router.post("/casos/{caso_id}/documentos")
async def upload_documento(
    caso_id: str,
    arquivo: UploadFile,
    cliente_id: str = Depends(get_cliente_atual)  # via JWT
):
    # 1. Salvar arquivo no storage
    url = await storage.salvar(arquivo, cliente_id, caso_id)
    
    # 2. Registrar no banco
    doc_id = await db.criar_documento(caso_id, arquivo.filename, url)
    
    # 3. Processar em background (não bloqueia a resposta)
    background_tasks.add_task(processar_documento, doc_id, cliente_id)
    
    return {"documento_id": doc_id, "status": "processando"}

async def processar_documento(doc_id: str, cliente_id: str):
    # 1. OCR → texto
    texto_completo = ocr.extrair(doc_id)
    
    # 2. Chunking
    chunks = chunker.dividir(texto_completo, chunk_size=500, overlap=50)
    
    # 3. Embeddings → Vector DB
    embeddings_service.indexar(chunks, namespace=f"cliente_{cliente_id}")
    
    # 4. Extração de entidades → Grafo
    for chunk in chunks:
        entidades = entity_extractor.extrair_entidades(chunk.texto, chunk.pagina)
        grafo_service.adicionar(entidades, cliente_id, doc_id)
    
    # 5. Atualizar status
    await db.atualizar_status(doc_id, "concluido")
```

---

## 8. Estimativa de Custos por Cliente

### Cenário: escritório pequeno (5 casos, ~500 páginas/mês)

| Item | Custo estimado/mês |
|---|---|
| Claude API (chat) — ~100 perguntas/mês | ~U$ 2,00 |
| Claude API (extração de entidades) — 500 páginas | ~U$ 1,50 |
| OpenAI Embeddings | ~U$ 0,10 |
| ChromaDB (self-hosted) | U$ 0 |
| PostgreSQL (Railway) | ~U$ 5,00 |
| Storage S3/Supabase | ~U$ 1,00 |
| **Total de infraestrutura** | **~U$ 10/mês** |

**Sugestão de precificação**: R$ 300–800/mês por cliente → margem alta.

---

## 9. Roadmap de Desenvolvimento

### Fase 1 — MVP (4–6 semanas)
- [ ] Backend FastAPI com upload de PDF
- [ ] OCR com pdfplumber
- [ ] ChromaDB local para embeddings
- [ ] Chat básico com Claude + RAG
- [ ] Autenticação simples (JWT)
- [ ] Frontend minimalista (Next.js): upload + chat

### Fase 2 — Grafo e Multi-tenant (3–4 semanas)
- [ ] Extração de entidades pós-upload
- [ ] Grafo com NetworkX + endpoint JSON
- [ ] Visualização Cytoscape.js no frontend
- [ ] Isolamento real por cliente (namespace + row-level security no Postgres)
- [ ] Múltiplos casos por cliente

### Fase 3 — Produto (2–3 semanas)
- [ ] Painel de administração (clientes, uso, planos)
- [ ] Histórico de chats persistente
- [ ] Exportar relatório de investigação (PDF)
- [ ] Onboarding guiado para advogados
- [ ] Planos e cobrança (Stripe)

### Fase 4 — Escala
- [ ] Migrar ChromaDB → Pinecone
- [ ] Migrar NetworkX → Neo4j
- [ ] OCR para documentos escaneados (Azure/Google)
- [ ] Suporte a DOCX, imagens, áudios de depoimentos

---

## 10. Segurança e LGPD

- **Dados isolados por tenant** no Vector DB (namespace) e Postgres (RLS)
- **Criptografia em repouso** nos arquivos (S3/Supabase criptografado)
- **HTTPS obrigatório** em todas as rotas
- **JWT com expiração curta** + refresh token
- **Contrato de processamento de dados** com cada cliente (obrigatório pela LGPD)
- **Logs de acesso** a documentos (auditoria)
- **Nunca usar dados de um cliente** para treinar modelos ou responder outro cliente

---

## 11. Ordem de Implementação Recomendada

```
Semana 1-2:
  1. Criar repositório GitHub
  2. docker-compose com PostgreSQL + ChromaDB
  3. FastAPI com rotas básicas (health check, auth)
  4. Upload de PDF → OCR → chunks → salvar no ChromaDB
  5. Testar via curl/Insomnia

Semana 3-4:
  6. Integração Claude API com RAG
  7. Endpoint de chat funcional
  8. Testar com documentos reais (seus diários como prova)
  9. Frontend Next.js: tela de login + upload + chat

Semana 5-6:
  10. Multi-tenant completo (isolamento por cliente)
  11. Múltiplos casos por cliente
  12. Grafo básico (extração + visualização)
  13. Deploy no Railway (backend) + Vercel (frontend)

A partir daí: iterar com feedback de advogados reais.
```

---

## 12. Arquivo de Referência

O arquivo `INSTRUCOES-INVESTIGACAO.md` (copiado neste workspace) é o **system prompt principal** do serviço. Ele define:

- Como a IA deve raciocinar sobre os documentos
- Quais padrões buscar (nomeações, contratos, CNPJs, valores)
- Como estruturar fichas de entidades
- Como linkar e correlacionar informações
- As regras de ouro (nada de inventar, sempre citar fonte)

Esse arquivo **não deve ser compartilhado publicamente** — é o núcleo do produto.

---

*Documento gerado em 2026-05-09. Atualizar conforme o desenvolvimento avança.*
