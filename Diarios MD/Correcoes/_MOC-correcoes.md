---
tipo: moc
created: 2026-04-28
updated: 2026-04-28
tags: [moc, correcoes, ocr]
---

# ✏️ MOC — Correções de texto (OCR)

> **Regra de ouro**: o texto OCR dos diários NUNCA é editado. As correções
> ficam em duas formas:
>
> 1. Seção `## ✏️ Correções de texto` no fim de cada `.md` de diário
>    (modelo: [[Templates/_template-correcao-bloco]]).
> 2. Este índice central, agregando antes/depois para busca rápida e
>    para alimentar `aliases:` das fichas.
>
> Ver também [[padroes-ocr]] (catálogo de erros recorrentes).

---

## Tabela mestra

| Antes (OCR) | Depois (provável) | Tipo | Ocorrências | Diários | Notas |
|---|---|---|---|---|---|

> Atualizar à medida que a varredura avança. Quando um `Antes` aparece
> em ≥3 diários, promover para [[padroes-ocr]] como regra geral.

---

## Por tipo

### Nomes de pessoas
> _vazio_

### Cargos
> _vazio_

### Órgãos / siglas
> _vazio_

### Empresas / razões sociais
> _vazio_

### Números (CNPJ/CPF/Processo/Valor)
> _vazio_

---

## Como usar na investigação

- Ao criar uma ficha em `Pessoas/` ou `Empresas/`, adicionar TODAS as
  variantes do `Antes` no campo `aliases:` da ficha. Assim, uma busca
  por `Felıx` cai na ficha de `Felix`.
- Quando rodar `grep_search` por um nome, sempre testar também os
  padrões em [[padroes-ocr]] (regex tolerante).
