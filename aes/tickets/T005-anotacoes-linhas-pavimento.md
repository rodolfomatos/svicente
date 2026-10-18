---
ticket: T005
title: Camada de anotação — linhas do pavimento (coordenadas normalizadas)
sprint: sprint-01
priority: high
status: done
created: 2026-10-18
completed: 2026-10-18
---

# T005 — Camada de anotação: linhas do pavimento

## Context

A SPEC §6.1 define esta camada como "prioridade analítica inicial": linhas
sobre a imagem, em coordenadas normalizadas, que acompanham as
transformações dos painéis (critério 7 de aceitação). É a ferramenta de que
H1 (docs/HYPOTHESES.md) precisa para ser testada.

## Acceptance Criteria

- [x] Segmentos desenháveis por rato sobre o painel (modo «Traçar linhas»,
      arrasto, pré-visualização, Escape cancela)
- [x] Coordenadas NORMALIZADAS [0,1] da imagem, independentes da resolução
      (SPEC §6.1)
- [x] Linhas são filhas da malha do painel → acompanham posição, rotação e
      escala automaticamente (critério 7)
- [x] Camada por painel com toggle de visibilidade + contagem (SPEC §5.C)
- [x] Modelo puro (sem DOM/Three) testado em Node
- [x] Segmentos demasiado curtos rejeitados (<0.5% — ruído de clique)
- [x] `make check` verde

## Scope

**In scope:** modelo de anotações, camada 3D, modo de traço no viewer,
painel de análise, fix de escala (ver abaixo).
**Out of scope:** interseções, direções dominantes, pontos de fuga (T007);
persistência JSON/localStorage (T008); desenho livre (não-segmentos).

## Notes

- **[DISCOVERED mid-T005] Bug do T003 corrigido:** edição de
  largura/altura aplicava a posição mas nunca definia `mesh.scale` — a
  malha não redimensionava. Corrigido em `applyState` (escala relativa às
  dimensões publicadas); anotações-filhas herdam a escala, mantendo as
  coordenadas normalizadas válidas.
- Decisão: segmentos em vez de traço livre — o SPEC §6.1 pede segmentos
  (interseções/direções depois derivam-se no T007).
- Decisão: raycast UV do PlaneGeometry como leitura do clique (sem
  conversão a pixels); suficiente para normalização.

## Diffstory

- **O que mudou:** `src/model/annotations.js` (novo, puro),
  `src/scene/annotationView.js` (novo), `src/ui/analysisPanel.js` (novo),
  `viewer.js` (modo traço: hitPanel, preview, suspensão da orbita),
  `main.js` (composição, fix de escala, toolbar), `index.html` (botão +
  texto de análise), `tests/model/annotations.test.js` (8 testes).
- **Porquê:** AC acima; orbita suspensa durante o traço porque senão o
  arrasto desliza a câmara (bug óbvio de UX antecipado).
- **Intocado:** geometria pura, modelo de painéis, propriedades, T004.
- **Riscos:** traço em vista ortográfica inclinada pode ser impreciso —
  usar vista frontal; aceite.

## Validation

`make check` → 58 JS + 5 Python, verdes. Assets/módulos servidos 200.
Validação visual pendente pelo utilizador no browser (WebGL não corre em
CI). 2026-10-18.
