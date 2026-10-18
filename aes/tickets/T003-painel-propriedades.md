---
ticket: T003
title: Painel de propriedades com edição numérica
sprint: sprint-01
priority: high
status: done
created: 2026-10-18
completed: 2026-10-18
---

# T003 — Painel de propriedades com edição numérica

## Context

T002 deixou a cena visual e o painel de propriedades em modo leitura. A
SPEC §5.B exige edição numérica para "experiências reproduzíveis" — este
ticket transforma selecção em manipulação precisa.

## Acceptance Criteria

- [x] Posição X/Z, rotação Y, largura/altura, distância à parede, parede
      associada e orientação da face editáveis por teclado (SPEC §5.B)
- [x] Estado de colocação sincronizado após arrasto do gizmo (parede mais
      próxima + offsets recalculados)
- [x] Dimensões editadas apresentadas como ajuste do investigador
      (HIPÓTESE), sem sobrescrever as publicadas (SPEC §3, §8, N3)
- [x] Proveniência e fonte visíveis no painel
- [x] Lógica estado↔parede pura e testada em Node (N1)
- [x] `make check` verde

## Scope

**In scope:** `src/model/panelState.js`, `src/ui/propertiesPanel.js`,
`src/main.js`, `src/scene/viewer.js` (onChange).
**Out of scope:** posição Y persistente fora do padrão (altura livre é
aplicada mas reaparece ao reprocessar estado — documentado), rotação X/Z
(gizmo não expõe neste protótipo), camadas analíticas (T005).

## Notes

- Rotação manual em Y é perdida ao mudar de parede/distância: a
  reorientação para o centro é a semântica da parede (documentado em
  `panelState.js`). Risco aceite para T003; revisitar em T006 se o
  investigador o exigir.
- Bug de teste apanhado: empate de distâncias no centro em vírgula
  flutuante — corrigido para testar determinismo (propriedade real).

## Diffstory

- **O que mudou:** novo módulo puro de estado + novo módulo UI; main.js
  passa a manter `userData.state` por painel; viewer notifica transformações.
- **Porquê:** AC acima; separação UI (fina) vs geometria (testada).
- **Intocado:** espaço, painéis do modelo, toolbar, hooks.
- **Riscos:** UI DOM sem testes unitários (só lógica pura coberta).

## Validation

`make check` → 50/50 testes, lint/docs ok. Recursos servidos 200
(index, main, propertiesPanel, panelState). 2026-10-18.
