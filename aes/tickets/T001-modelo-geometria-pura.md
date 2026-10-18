---
ticket: T001
title: Modelo de dados + geometria pura (painéis, hexágono 120°, raio 3 m)
sprint: sprint-01
priority: high
status: done
created: 2026-10-18
completed: 2026-10-18
---

# T001 — Modelo de dados + geometria pura

## Context

Base de todo o Laboratório Espacial 3D (SPEC §3, §4). Sem modelo de painéis
com proveniência e sem geometria métrica testável fora do navegador, T002
(cena Three.js) construiria sobre areia.

## Acceptance Criteria

- [x] Seis painéis com dimensões publicadas, identificadores estáveis, fonte
      e classe de proveniência (R1, R10)
- [x] Hexágono regular: interior 120°, seis paredes, `radius` = apotema
      (centro à linha média das paredes = 3 m), centro na origem (SPEC §4)
- [x] Geometria pura sem Three.js, testável em Node (N1)
- [x] Entradas inválidas rejeitadas
- [x] `make check` verde

## Scope

**In scope:** `src/model/panels.js`, `src/geometry/regularPolygon.js`,
testes Jest.
**Out of scope:** layouts alternativos (T006), análise de linhas/fugas
(T007), cena 3D (T002).

## Notes

Decisão de design: `radius` no API é o APOTEMA (SPEC §4 "medido do centro à
linha média das paredes"); vértices a `radius/cos(π/n)`. Teste
`apothemDeviation` trava a regressão desta convenção.

## Diffstory

- **O que mudou:** novo `src/model/panels.js` (PANELS, PROVENANCE, getPanel),
  novo `src/geometry/regularPolygon.js` (polygonVertices, interiorAngleDeg,
  wallSegments, distanceToCenter, apothemDeviation), testes em
  `tests/model/` e `tests/geometry/`.
- **Porquê:** critérios AC acima; convenção de apotema obrigatória pela spec.
- **Intocado:** scaffold gerado, hooks, CI, docs (ROADMAP marcado).
- **Riscos:** imagens/texturas ainda inexistentes (T004); geometria não
  validada visualmente até T002.

## Validation

`make check` → 28 testes pass, 100% linhas, lint/docs ok (2026-10-18).
