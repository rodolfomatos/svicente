---
ticket: T011
title: Texturas v3 — digitalizações sem moldura (domínio público, Commons)
sprint: sprint-01
priority: high
status: in-progress
created: 2026-10-18
---

# T011 — Texturas v3: digitalizações PD sem moldura

## Context

O utilizador apontou (2026-10-18) que o Commons tem digitalizações dos
seis painéis **sem moldura**, de altíssima resolução, em domínio
público — o que torna desnecessária a correcção manual de perspectiva
do T004v2 (GIMP). Verificação feita: os seis PNG existem (crédito
Google Arts &amp; Culture/MNAA), todos PD, resoluções de 2583×8928 a
4727×7710 px, proporções muito próximas das dimensões publicadas
(diferença ≤7%, compatível com margens de digitalização). O trabalho
GIMP não é desperdiçado: documentou a metodologia e o residual ~19 mm;
as bases são substituídas por digitalizações profissionais, com nova
cadeia de proveniência (SPEC §8).

## Acceptance Criteria

- [x] Download das 6 digitalizações PD (Commons, Google Arts &amp;
      Culture/MNAA) para `assets/images/source-v3/` (gitignorado —
      46–77 MB cada, não pertencem ao repo)
- [x] Verificação programática: licença PD, proporção vs dimensões
      publicadas (relatório por painel, deltas registados)
- [x] Derivação de texturas web (máx. 2048 px de altura, JPEG q90) em
      `assets/images/panels/*.jpg` — script reprodutível
      `analysis/build_textures_v3.py`
- [x] Manifest v3 (`svicente-images-v3`): cadeia de proveniência
      nova, medido vs estimado, caveats; v2 preservado como histórico
- [x] UI/README/METODOLOGIA actualizados (fonte, licença, datação c.
      1445)
- [x] `make check` + `make visual-check` verdes (texturas 200 + cena
      renderiza)

## Scope

**In scope:** `analysis/build_textures_v3.py`, `assets/images/panels/`
(texturas + manifest), `src/scene/panelView.js` (comentário de
proveniência), `index.html` (nota do viewport), docs.
**Out of scope:** re-anotação de linhas do pavimento (investigador);
qualquer alteração geométrica do modelo (dimensões publicadas
mantêm-se).

## Diffstory

- **`analysis/build_textures_v3.py` (novo):** descarrega (se ausente)
  os PNG do Commons via API, valida licença PD e proporção, deriva
  texturas JPEG 2048 px, escreve `manifest.json` v3 com a cadeia
  completa. Re-executável (download com cache local).
- **`assets/images/panels/*.jpg`:** substituídos pelas digitalizações
  v3 (sem moldura, sem correcção manual — só redimensionamento).
- **`manifest.json`:** schema v3; entrada `supersedes: v2` (bases
  GIMP continuam documentadas como cadeia anterior).
- **Docs:** METODOLOGIA §5 (pipeline v3), README (imagens/fontes),
  index.html (nota do viewport).

### Intencionalmente intocado

- `PANELS` em `src/model/panels.js` — dimensões publicadas são
  normativas (SPEC §3); as novas imagens mudam textura, não geometria.
- Anotações existentes — coordenadas UV normalizadas sobrevivem à
  troca de textura (ambas as cadeias aproximam o mesmo rectângulo
  pintado).

## Riscos conhecidos / para rever

- **Proporção ≠ dimensão publicada (até ~7% em Pescadores/Frades):**
  pode ser margem da digitalização ou erro das medidas publicadas —
  a textura estica ligeiramente para caber no rectângulo publicado;
  deltas registados no manifest para revisão.
- As digitalizações são de **antes da recente restauro (2019–2025)**
  ou após? Google Arts &amp; Culture digitizou em data não declarada —
  caveat registado; não afecta geometria.
- Download depende da rede (Commons); script cacheia localmente.
