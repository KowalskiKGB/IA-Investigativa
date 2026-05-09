---
tipo: instrucoes
created: 2026-04-25
updated: 2026-04-25
tags: [instrucoes, investigacao, segundo-cerebro, obsidian]
---

# 🕵️ Instruções de Investigação — Segundo Cérebro dos Diários de Macapá/AP

> Adaptação do `obsidian-instructions.md` para o contexto **investigativo**:
> os arquivos `.md` deste vault NÃO documentam código — eles armazenam
> o **conteúdo OCR** dos Diários Oficiais do Município de Macapá/AP,
> com **anotações e links** entre nomes, empresas, processos, CNPJs,
> valores, contratos, decretos, etc. para **encontrar contextos
> estranhos** que mereçam apuração futura.

---

## 🎯 Por que existe este vault

1. A IA perde contexto a cada conversa nova. Este vault é a **memória
   única** do que já foi lido, ligado e investigado nos diários.
2. Os diários têm milhares de páginas — buscar no Obsidian (com
   `[[backlinks]]` e tags) é muito mais rápido que reler PDF.
3. **Investigar = correlacionar.** Um nome que aparece em 2023
   recebendo licitação e em 2025 sendo punido vira um *backlink*
   imediato no Obsidian.
4. Tudo é **Markdown puro** → funciona no Obsidian, VS Code, GitHub e
   é versionável.

---

## 📁 Estrutura do vault

```
Diarios MD/                         ← raiz do segundo cérebro
├── 00-INDEX.md                     ← mapa central (LER PRIMEIRO)
├── PLANO-CONVERSAO.md              ← como os .md são produzidos
├── INSTRUCOES-INVESTIGACAO.md      ← este arquivo
├── 2023/05/<diario>.md             ← conteúdo OCR (1 .md = 1 PDF)
├── 2024/.../...
├── 2025/.../...
├── 2026/.../...
│
├── Pessoas/                        ← (criar sob demanda) 1 .md por nome relevante
├── Empresas/                       ← (criar sob demanda) 1 .md por CNPJ/razão social
├── Processos/                      ← (criar sob demanda) 1 .md por nº de processo
├── Orgaos/                         ← secretarias, autarquias, prefeitura, câmaras
├── Temas/                          ← contratos, licitações, nomeações, exonerações…
└── Investigacoes/                  ← achados que merecem apuração
    ├── leads-abertos.md
    ├── leads-fechados.md
    └── <caso-x>.md
```

> **Regra**: as pastas `Pessoas/`, `Empresas/`, `Processos/`, `Orgaos/`,
> `Temas/`, `Investigacoes/` **só são criadas quando algo concreto
> aparecer**. Não criar fichas vazias só porque sim.

---

## 📝 Padrão de escrita

### A. Diários (`Diarios MD/{ano}/{mes}/<arquivo>.md`)

- Conteúdo **integralmente gerado pelo OCR** (ver
  [[PLANO-CONVERSAO]]).
- Cada página é uma seção `## Página N` — **não mexer na numeração**.
- A IA pode acrescentar **anotações** no fim do arquivo, em uma seção
  separada chamada `## 🔎 Anotações de investigação` com:
  - links `[[Pessoas/<nome>]]`, `[[Empresas/<cnpj-ou-slug>]]`, etc.
  - menções a páginas: `Página 12 — contrato com [[Empresas/Acme LTDA]]`.
- **Nunca** alterar/limpar o texto OCR — só adicionar anotações.

### B. Fichas (Pessoas/Empresas/Processos/...)

Front-matter mínimo:

```yaml
---
tipo: pessoa | empresa | processo | orgao | tema | investigacao
nome: "Fulano de Tal"           # ou razão social, ou nº processo
slug: fulano-de-tal             # nome do arquivo, kebab-case
cpf_cnpj: "000.000.000-00"      # quando houver
aliases: ["F. de Tal", "Fulano"]  # variações de grafia úteis para busca
created: YYYY-MM-DD
updated: YYYY-MM-DD
tags: [pessoa, servidor-publico, ...]
---
```

Corpo:

```markdown
# Fulano de Tal

## Resumo
2-3 linhas sobre quem é, onde aparece.

## Vínculos
- [[Empresas/acme-ltda]] — sócio (Página 5 de [[2024/03/2024-03-12_...]])
- [[Orgaos/sempla]] — nomeado em [[2023/05/2023-05-02_Diário Oficial 4541 - 28.04.2023_]] p. 12

## Aparições nos diários
| Data | Diário | Página | Contexto |
|---|---|---|---|
| 2023-05-02 | [[2023/05/2023-05-02_Diário Oficial 4541 - 28.04.2023_]] | 12 | Nomeação como gestor |
| 2024-03-12 | [[2024/03/2024-03-12_Diário Oficial XXXX]] | 5 | Contrato R$ 200k |

## Observações
- Linha do tempo curta, fatos relevantes, valores.
- Sem opiniões. Sem acusações. **Apenas o que está nos diários.**

## Pendências
- [ ] Confirmar CPF/CNPJ
- [ ] Cruzar com [[Investigacoes/<caso>]]
```

### C. Investigações (`Investigacoes/<caso>.md`)

```yaml
---
tipo: investigacao
status: aberto | em-apuracao | fechado
prioridade: alta | media | baixa
created: YYYY-MM-DD
updated: YYYY-MM-DD
tags: [investigacao, <tema>]
---
```

Conteúdo:

- **Hipótese** em 1 linha.
- **Indícios**: lista com links para diários e fichas.
- **Cronologia**: tabela com datas.
- **Próximos passos**: checklist.

---

## 🔗 Como linkar (sintaxe Obsidian)

| Quero linkar... | Sintaxe |
|---|---|
| Outro arquivo do vault | `[[2023/05/2023-05-02_Diário Oficial 4541 - 28.04.2023_]]` |
| Pessoa | `[[Pessoas/fulano-de-tal]]` |
| Empresa por slug | `[[Empresas/acme-ltda]]` |
| Página específica de um diário | `[[2023/05/2023-05-02_Diário Oficial 4541 - 28.04.2023_#Página 12]]` |
| Texto de exibição diferente | `[[Pessoas/fulano-de-tal\|Fulano]]` |
| Tag | `#nomeacao`, `#licitacao`, `#contrato`, `#exoneracao` |

> **Sempre** que mencionar um nome relevante mais de uma vez,
> **promova** para uma ficha em `Pessoas/` (ou Empresas/, etc.) e
> substitua a menção por `[[link]]`. É isso que constrói o "segundo
> cérebro".

---

## 🧠 Fluxo de trabalho da IA por chat novo

```
NOVA TAREFA (ex: "investigar diários de junho/2024")
        │
        ▼
[1] Ler Diarios MD/00-INDEX.md
        │
        ▼
[2] Ler Diarios MD/PLANO-CONVERSAO.md  (se for converter)
[2] Ler Diarios MD/INSTRUCOES-INVESTIGACAO.md  (se for investigar)
        │
        ▼
[3] Identificar arquivos relevantes (ano/mês, ou ficha existente)
        │
        ▼
[4] Ler os .md envolvidos — incluindo Pessoas/Empresas já fichadas
        │
        ▼
[5] Executar a tarefa:
     - converter   → rodar converter_diarios_md.py
     - investigar  → ler diários, criar/atualizar fichas, criar links
        │
        ▼
[6] Atualizar:
     - 00-INDEX.md (se criou ficha nova)
     - status do .md de diário (parcial → completo)
     - updated: no front-matter dos arquivos tocados
        │
        ▼
TAREFA CONCLUÍDA
```

---

## ⚖️ Regras de ouro

1. **Nada de inventar.** Toda afirmação numa ficha precisa de link
   `[[diario#Página N]]` que comprove.
2. **Texto OCR é sagrado.** Nunca apagar/parafrasear o texto bruto do
   OCR. Anotações vão em seção separada.
3. **Tudo no Obsidian.** Se a informação não tem ficha + link, ela é
   "esquecida" no próximo chat. Sempre fichar.
4. **Resume seguro.** A conversão pode ser retomada de onde parou
   (`## Página N`). Não duplicar páginas, não pular.
5. **Privacidade/uso responsável.** Os diários são públicos, mas o
   cruzamento de dados é sensível. Este vault é para **investigação
   pessoal/jornalística**; não publicar fichas sem revisão.
6. **Sem opinião nas fichas.** Apenas fatos com fonte. Hipóteses só
   em `Investigacoes/`.

---

## 🔍 Padrões úteis para regex/buscas no vault

| Quero achar... | Regex sugerida |
|---|---|
| CNPJ | `\d{2}\.\d{3}\.\d{3}/\d{4}-\d{2}` |
| CPF | `\d{3}\.\d{3}\.\d{3}-\d{2}` |
| Processo (formato `NNNN/AAAA`) | `\b\d{1,6}\s*[/\-]\s*20\d{2}\b` |
| Valores em R$ | `R\$\s*[\d\.\,]+` |
| Nomeação | `(?i)nomea[rc]` |
| Exoneração | `(?i)exoner` |
| Contrato | `(?i)contrato\s*n[ºo°]?\s*[\d\./-]+` |

A IA pode usar `grep_search` (regex) sobre `Diarios MD/**/*.md` para
varrer todos os diários convertidos rapidamente.
