---
ticket: T002
title: Cena Three.js — painéis texturados, espaço hexagonal, navegação orbital
sprint: sprint-01
priority: high
status: done
created: 2026-10-18
completed: 2026-10-18
---

# T002 — Cena Three.js

## Context

T001 deu geometria pura verificada; este ticket torna-a visível e
manipulável: cena Three.js com os seis painéis de pé no pavimento dentro
do hexágono regular, prontos para seleção e transformação (SPEC §2, §4, §5.A).

## Acceptance Criteria

- [x] Cena Three.js com seis painéis verticais, base no pavimento, proporções do modelo (SPEC §3)
- [x] Espaço hexagonal: paredes independentes, pavimento, grelha, eixos (SPEC §4)
- [x] OrbitControls + TransformControls; seleção por clique (SPEC §5.A)
- [x] Perspectiva/ortográfica e vistas frontal/superior/lateral/centro (SPEC §5.A)
- [x] Alternar visibilidade de paredes/pavimento/grelha/eixos (SPEC §5.A)
- [x] Servida sem build step (import map, SPEC §2)
- [x] `make check` verde

## Scope

**In scope:** `index.html`, `src/style.css`, `src/main.js`, `src/scene/*`,
`src/geometry/panelPlacement.js`, testes de colocação.
**Out of scope:** edição numérica (T003), imagens oficiais (T004), anotações
(T005), layouts alternativos (T006).

## Notes

- Texturas placeholder procedurais, marcadas como placeholder (N3) — nunca
  se apresentam como imagem do painel até T004.
- Disposição inicial (um painel por parede) é HIPÓTESE de partida.
- Bugs apanhados na implementação: rotação de parede com +π/2 errado;
  declaração de `scene` antes de criação em viewer.js.

## Diffstory

- **O que mudou:** nova camada de cena (space/panelView/viewer), novo
  `panelPlacement.js` testável, HTML/CSS de três áreas, main.js.
- **Porquê:** AC acima; separação geometria pura (Node-testável) vs
  composição Three.js (fina, sem testes unitários — aceito).
- **Intocado:** T001, hooks, CI, kanban (marcado).
- **Riscos:** cena não validada visualmente num browser real (só
  disponibilidade HTTP 200 dos módulos); WebGL inexistente em CI.

## Validation

`make check` → 37/37 testes, lint/docs ok. Módulos servidos com 200 via
`http-server` (index, three, main, OrbitControls). 2026-10-18.
