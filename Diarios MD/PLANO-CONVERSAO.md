---
tipo: plano
created: 2026-04-25
updated: 2026-04-25
tags: [plano, conversao, ocr, gpu]
---

# 📋 Plano de Conversão — Diários Oficiais → Markdown

> Objetivo: transformar **todos** os PDFs (imagens escaneadas) em
> `diarios/{ano}/{mes}/*.pdf` em arquivos `.md` em
> `Diarios MD/{ano}/{mes}/<mesmo-nome>.md`, página por página, usando a
> GPU (RTX 5050 / CUDA 12.8) com EasyOCR. O Markdown é a base do
> "segundo cérebro" usado para investigação posterior — links de nomes,
> empresas, processos, CNPJs, etc.

---

## 🎯 Princípios

1. **1 PDF = 1 arquivo `.md`** com o mesmo nome (sem `.pdf`).
2. **Estrutura espelhada**: `Diarios MD/2023/05/...` ↔ `diarios/2023/05/...`.
3. **Página por página**, em ordem: cada página vira uma seção
   `## Página N` e o texto OCR vai logo abaixo, sem sumarização.
4. **Escrita incremental**: o `.md` é gravado em modo *append* a cada
   página → se a IA/processo cair, **nada se perde**.
5. **Resume automático**: ao reiniciar, o conversor lê o maior
   `## Página N` já escrito e **continua da próxima**. Isso resolve o
   problema de excesso de tokens — cada chamada lida com uma página
   por vez.
6. **GPU obrigatória** (`torch.cuda.is_available()`); só cai para CPU
   com aviso.
7. **OCR fiel** (`paragraph=True`, `lang=pt`) — sem reescrita, sem
   resumo, preservando o que está escrito (mesmo "estranho"). A
   investigação depende disso.

---

## ⚙️ Stack Técnica

| Componente | Versão / Origem | Função |
|---|---|---|
| Python | 3.12.7 | Runtime |
| PyMuPDF (`fitz`) | já instalado | Renderiza páginas PDF → imagem |
| PyTorch + CUDA | 2.11 + cu128 | Backend GPU |
| EasyOCR | já instalado | OCR multi-idioma (`pt`) na GPU |
| GPU | RTX 5050 (8 GB, sm_120 Blackwell) | Aceleração |
| Driver | NVIDIA 596.21 / CUDA 13.2 | — |
| DPI render | 250 (padrão) | Qualidade vs. velocidade |

Script principal: [converter_diarios_md.py](../converter_diarios_md.py)
Teste mínimo: [_test_converter.py](../_test_converter.py)

---

## 📊 Inventário (PDFs encontrados em `diarios/`)

**Total: 792 PDFs / ~14,84 GB**

| Ano | PDFs | Meses |
|---|---|---|
| 2023 | 157 | 05–12 |
| 2024 | 293 | 01–12 |
| 2025 | 263 | 01–12 |
| 2026 | 81 | 01–04 |

Detalhe por mês:

| 2023 | 2024 | 2025 | 2026 |
|---|---|---|---|
| 05: 23 | 01: 21 | 01: 25 | 01: 26 |
| 06: 17 | 02: 25 | 02: 18 | 02: 33 |
| 07: 18 | 03: 23 | 03: 17 | 03: 13 |
| 08: 21 | 04: 19 | 04: 21 | 04: 9 |
| 09: 21 | 05: 22 | 05: 24 | |
| 10: 19 | 06: 13 | 06: 19 | |
| 11: 19 | 07: 32 | 07: 23 | |
| 12: 19 | 08: 29 | 08: 20 | |
|       | 09: 26 | 09: 27 | |
|       | 10: 32 | 10: 23 | |
|       | 11: 29 | 11: 21 | |
|       | 12: 22 | 12: 23 | |

---

## 🔁 Fluxo do Conversor

```
  diarios/{ano}/{mes}/<arquivo>.pdf
                │
                ▼
  fitz.open()  → conta páginas
                │
                ▼
  md_path_for() → Diarios MD/{ano}/{mes}/<arquivo>.md
                │
                ▼
  ┌─ existe? ──── não ──► escreve front-matter + cabeçalho
  │      │
  │      sim
  │      │
  ▼      ▼
  pages_done(md) = N (maior `## Página N` no .md)
                │
                ▼
  para pg em [N+1 .. total]:
      render página (PyMuPDF, DPI 250)
      OCR EasyOCR/GPU (paragraph=True, pt)
      append `## Página pg\n\n<texto>` no .md
                │
                ▼
  ao terminar todas: status: parcial → completo
```

### Garantias do resume

- A regex `^## Página (\d+)$` localiza o último número gravado.
- A IA/processo pode parar a qualquer momento; basta rodar de novo.
- Em chats novos, basta abrir o `.md` em construção e ver até qual
  `## Página N` foi.

---

## 🗂️ Estrutura de saída (espelhada)

```
Diarios MD/
├── 00-INDEX.md                  ← mapa do vault
├── INSTRUCOES-INVESTIGACAO.md   ← regras de uso para investigação
├── PLANO-CONVERSAO.md           ← este arquivo
├── 2023/
│   ├── 05/
│   │   ├── 2023-05-02_Diário Oficial 4541 - 28.04.2023_.md
│   │   ├── 2023-05-03_Diário Oficial 4536 - 20.04.2023.md
│   │   └── ...
│   ├── 06/ ...
│   └── 12/
├── 2024/ (01..12)
├── 2025/ (01..12)
└── 2026/ (01..04)
```

### Front-matter padrão de cada `.md` de diário

```yaml
---
tipo: diario-oficial
arquivo: <nome>.pdf
ano: 2023
mes: 05
paginas: 63
status: parcial | completo
tags: [diario, ocr, 2023]
---
```

---

## 🚀 Execução

### 1. Pré-requisitos (uma vez)

```powershell
cd "C:\Users\rafae\OneDrive\Desktop\Extrator de diários"
pip install --upgrade torch torchvision --index-url https://download.pytorch.org/whl/cu128
# easyocr, pymupdf, pytesseract, pillow, numpy já estão instalados
```

Validar GPU:

```powershell
python -c "import torch; print(torch.cuda.is_available(), torch.cuda.get_device_name(0))"
# esperado: True NVIDIA GeForce RTX 5050 ...
```

### 2. Rodar tudo (modo padrão)

```powershell
cd "C:\Users\rafae\OneDrive\Desktop\Extrator de diários"
python converter_diarios_md.py
```

- Itera 2023 → 2024 → 2025 → 2026, mês a mês, PDF a PDF.
- Pode ser interrompido (Ctrl+C) e retomado sem perda.

### 3. Filtrar lote (editar topo do `converter_diarios_md.py`)

```python
ANOS = ["2023"]            # só um ano
MESES = ["05", "06"]       # só dois meses
DPI = 250                  # 200 mais rápido / 300 mais preciso
```

### 4. Dry-run (lista o que faria sem rodar OCR)

```powershell
python converter_diarios_md.py --dry
```

### 5. Continuação por nova IA / novo chat

A IA seguinte deve:

1. Ler `Diarios MD/00-INDEX.md` e este plano.
2. Rodar `python converter_diarios_md.py`.
3. O script detecta o que já foi feito (via `## Página N`) e continua.
4. Se a IA estiver convertendo manualmente um arquivo, abrir o `.md` e
   continuar a partir da última página + 1.

---

## 🛡️ Regras de qualidade do OCR

- **Não corrigir, não resumir, não reescrever.** O texto OCR vai
  *como saiu* — apenas com `.strip()` e quebras de parágrafo.
- Erros de OCR ficam visíveis (`Felıx` vs `Felix`, etc.) — buscas
  posteriores devem usar regex tolerante.
- Em página em branco/ilegível, gravar bloco vazio sob `## Página N`
  (não pular numeração).
- Em erro de renderização: gravar `[ERRO OCR página N: <msg>]` na
  página correspondente — assim a numeração fica intacta.

---

## 📈 Estimativa de tempo

Considerando ~5–10 s por página em GPU RTX 5050 a 250 DPI e ~25–40
páginas por diário:

| Cenário | Por PDF | Total (792 PDFs) |
|---|---|---|
| Otimista (5 s/pg, 25 pg) | ~2 min | ~26 h |
| Realista (8 s/pg, 30 pg) | ~4 min | ~53 h |
| Pessimista (10 s/pg, 40 pg) | ~7 min | ~92 h |

Recomenda-se rodar em lotes (1 ano por vez) e deixar a máquina ligada
durante a noite. Como o resume é seguro, dá para parar e voltar.

---

## ✅ Critério de "completo"

Um `.md` está completo quando:

1. Possui `## Página N` para todo `N ∈ [1, paginas]`.
2. `status: completo` no front-matter.
3. Está linkado em `Diarios MD/00-INDEX.md` (na seção do mês).

Quando todos os meses de um ano estão completos, marcar o ano como
`✅` no `00-INDEX.md`.
