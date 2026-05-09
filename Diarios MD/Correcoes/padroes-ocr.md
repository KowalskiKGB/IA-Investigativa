---
tipo: referencia
created: 2026-04-28
updated: 2026-04-28
tags: [referencia, ocr, padroes]
---

# 🔎 Padrões recorrentes de erro de OCR

> Catálogo dos enganos típicos do EasyOCR sobre os Diários de Macapá/AP.
> Serve para (a) gerar `aliases:` nas fichas e (b) montar regex
> tolerantes na busca. Será expandido durante a varredura de 2023.

---

## Confusões de caractere

| Errado | Certo | Onde aparece tipicamente |
|---|---|---|
| `ı` (i sem ponto) | `i` | nomes: `Felıx` → `Felix`, `Antônlo` → `Antônio` |
| `l` minúsculo | `i` | `Antônlo`, `Sllva`, `Olllvelra` |
| `l` minúsculo | `í` | `Munlclpal` → `Municipal` |
| `rn` | `m` | leitura de `m` partido |
| `cl` | `d` | em palavras como `cle` → `de` |
| `0` (zero) | `O` (letra) | siglas/nomes |
| `O` (letra) | `0` (zero) | em CNPJ/CPF/processo |
| `S` | `5` | em números |
| `5` | `S` | em palavras |
| `B` | `8` / `R` | em números/siglas |
| `&` | `e` | conjunções |
| espaço extra | — | quebras dentro de palavras: `Mun icipal` |
| espaço faltando | — | `Sllvade` → `Silva de` |

## Acentuação

| Errado | Certo |
|---|---|
| `Mônıca` | `Mônica` |
| `Antônlo` | `Antônio` |
| `Olllvelra` / `Ollvelra` | `Oliveira` |
| `Sllva` | `Silva` |
| `Macapa` (sem til) | `Macapá` |
| `EducaçGo` / `Éducação` | `Educação` |

## Siglas comuns (e suas variantes OCR observadas)

| Forma OCR | Sigla correta | Significado |
|---|---|---|
| `SEGOV` | SEGOV | Sec. Mun. de Governo |
| `SEMSA` | SEMSA | Sec. Mun. de Saúde |
| `SEMED` | SEMED | Sec. Mun. de Educação |
| `SEMAS` | SEMAS | Sec. Mun. de Assistência Social |
| `SEMOB` | SEMOB | Sec. Mun. de Obras |
| `SEMZUR` | SEMZUR | Sec. Mun. de Zeladoria Urbana |
| `SEMAG` | SEMAG | Sec. Mun. de Agricultura |
| `SEMCOM` | SEMCOM | Sec. Mun. de Comunicação |
| `SEMAI` | SEMAI | Sec. Mun. de Articulação Institucional |
| `SMMPP` | SMMPP | Sec. Mun. de Mobilização e Participação Popular |
| `MACAPATUR` | MACAPATUR | Inst. Mun. de Turismo |
| `IMPROIR` | IMPROIR | Inst. Mun. de Política e Promoção de Igualdade Racial |
| `MACAPAPREV` | MACAPAPREV | Regime Próprio de Previdência |
| `CTMAC` | CTMAC | Cia. de Trânsito de Macapá |
| `EMDESUR` | EMDESUR | Emp. de Desenvolvimento Urbano |
| `GCMM` | GCMM | Guarda Civil Municipal |

## Regex tolerantes para busca

| Quero achar | Regex |
|---|---|
| Nome com `i`/`ı`/`l` ambíguo | `Fel[ıil]x`, `Ant[ôo]n[lio]+`, `S[il1l]+va`, `O[il1]+vel?ra` |
| Macapá com/sem til | `Macap[áa]` |
| CNPJ com OCR tolerante | `\d{2}[\.\s]\d{3}[\.\s]\d{3}[/\-]\d{4}[\-\s]\d{2}` |
| Valor R$ com espaço estranho | `R\$\s*[\d\.\,\s]+` |

---

## Como contribuir com este catálogo

1. Ao identificar um par antes/depois NOVO em ≥3 diários, adicionar aqui.
2. Sempre indicar a fonte (pelo menos 1 diário com link `[[YYYY/MM/...]]#Página N`).
3. Se houver dúvida (`confiança baixa`), manter em [[_MOC-correcoes]] e NÃO promover.
