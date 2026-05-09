-- Esquema inicial. Executado pelo entrypoint do Postgres em ambiente local.
-- Em produção, usar Alembic.

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Clientes (escritórios de advocacia / tenants)
CREATE TABLE IF NOT EXISTS clientes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    senha_hash TEXT NOT NULL,
    plano TEXT NOT NULL DEFAULT 'solo',
    criado_em TIMESTAMPTZ DEFAULT NOW()
);

-- Usuários do escritório (1 cliente -> N usuários)
CREATE TABLE IF NOT EXISTS usuarios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cliente_id UUID NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
    nome TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    senha_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'membro',
    is_admin BOOLEAN NOT NULL DEFAULT FALSE,
    criado_em TIMESTAMPTZ DEFAULT NOW()
);

-- Configurações dinâmicas do sistema (editáveis pelo admin)
CREATE TABLE IF NOT EXISTS config_sistema (
    chave TEXT PRIMARY KEY,
    valor TEXT,
    atualizado_em TIMESTAMPTZ DEFAULT NOW()
);

-- Casos
CREATE TABLE IF NOT EXISTS casos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cliente_id UUID NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
    nome TEXT NOT NULL,
    descricao TEXT,
    status TEXT NOT NULL DEFAULT 'ativo',
    criado_em TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_casos_cliente ON casos(cliente_id);

-- Documentos
CREATE TABLE IF NOT EXISTS documentos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    caso_id UUID NOT NULL REFERENCES casos(id) ON DELETE CASCADE,
    nome_arquivo TEXT NOT NULL,
    mime_type TEXT,
    url_storage TEXT NOT NULL,
    sha256 TEXT,
    status TEXT NOT NULL DEFAULT 'pendente',
    total_paginas INTEGER,
    total_chunks INTEGER,
    erro TEXT,
    criado_em TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_documentos_caso ON documentos(caso_id);

-- Páginas convertidas para Markdown
CREATE TABLE IF NOT EXISTS paginas_md (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    documento_id UUID NOT NULL REFERENCES documentos(id) ON DELETE CASCADE,
    numero INTEGER NOT NULL,
    texto_md TEXT NOT NULL,
    UNIQUE(documento_id, numero)
);

-- Histórico de chats
CREATE TABLE IF NOT EXISTS mensagens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    caso_id UUID NOT NULL REFERENCES casos(id) ON DELETE CASCADE,
    usuario_id UUID REFERENCES usuarios(id) ON DELETE SET NULL,
    role TEXT NOT NULL,
    conteudo TEXT NOT NULL,
    chunks_usados JSONB,
    tokens_in INTEGER,
    tokens_out INTEGER,
    criado_em TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_mensagens_caso ON mensagens(caso_id);

-- Grafo: entidades
CREATE TABLE IF NOT EXISTS entidades (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cliente_id UUID NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
    tipo TEXT NOT NULL,
    nome TEXT NOT NULL,
    slug TEXT NOT NULL,
    identificador TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    criado_em TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(cliente_id, tipo, slug)
);

CREATE INDEX IF NOT EXISTS idx_entidades_cliente ON entidades(cliente_id);

-- Grafo: relações
CREATE TABLE IF NOT EXISTS relacoes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cliente_id UUID NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
    origem_id UUID NOT NULL REFERENCES entidades(id) ON DELETE CASCADE,
    destino_id UUID NOT NULL REFERENCES entidades(id) ON DELETE CASCADE,
    tipo TEXT NOT NULL,
    documento_id UUID REFERENCES documentos(id) ON DELETE SET NULL,
    pagina INTEGER,
    trecho TEXT,
    criado_em TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_relacoes_cliente ON relacoes(cliente_id);
CREATE INDEX IF NOT EXISTS idx_relacoes_origem ON relacoes(origem_id);

-- Correções de OCR (auditáveis pelo advogado)
CREATE TABLE IF NOT EXISTS correcoes_ocr (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    documento_id UUID NOT NULL REFERENCES documentos(id) ON DELETE CASCADE,
    pagina INTEGER NOT NULL,
    texto_original TEXT NOT NULL,
    texto_corrigido TEXT NOT NULL,
    motivo TEXT,
    confianca NUMERIC(3,2),
    aceita_pelo_usuario BOOLEAN,
    criado_em TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_correcoes_doc ON correcoes_ocr(documento_id);

-- Auditoria de acesso (LGPD)
CREATE TABLE IF NOT EXISTS auditoria (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cliente_id UUID NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
    usuario_id UUID REFERENCES usuarios(id) ON DELETE SET NULL,
    acao TEXT NOT NULL,
    recurso TEXT NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    ip TEXT,
    criado_em TIMESTAMPTZ DEFAULT NOW()
);
