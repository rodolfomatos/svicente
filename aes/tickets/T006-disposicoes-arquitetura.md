---
ticket: T006
title: Disposições espaciais alternativas + arquitetura como restrições (B004)
sprint: sprint-01
priority: high
status: done
created: 2026-10-18
completed: 2026-10-18
---

# T006 — Disposições alternativas + elementos de arquitetura (B004)

## Context

H2 (docs/HYPOTHESES.md) postula que a arquitetura da localização original
restringe onde os painéis podem estar, e que a linha contínua do museu
pode não ser a disposição original. Testar isso exige (a) dispor os
painéis de formas alternativas à linha/plano único e (b) marcar
restrições (porta, janela, altar, trono) com validação de sobreposição —
o backlog B004, executado dentro deste ticket por dependência directa.

Decisão estrutural: generalizar a colocação de painéis de "vértices de
polígono" para **frames de parede** `{a, b, midpoint, inward}`
(`frameFromSegment`) — abrange hexágono fechado, linha plana, alas
angulares e tribuna em U com a mesma matemática e os mesmos testes.

## Acceptance Criteria

- [x] Catálogo de disposições: hexágono (hipótese C), plana, angular
      (ângulo paramétrico 30–170°), U, hexágono irregular — todas
      classificadas HIPÓTESE na UI e no código (SPEC §8)
- [x] Troca de disposição na toolbar reconstrói a cena mantendo anotações
      (persistência por painel, independente do espaço)
- [x] Elementos porta/janela/altar/trono com dimensões ESTIMADAS,
      adicionáveis a qualquer parede com deslocamento lateral
- [x] Validação painel×elemento: vãos colidem por intervalos laterais +
      verticais; volumes colidem por lateral + profundidade
      (`src/model/architecture.js`)
- [x] UI mostra conflitos e limpa ao remover elemento
- [x] Modelo puro (layouts, arquitetura) testado em Node — 31 testes
      novos, 89 total
- [x] `make visual-check` estendido: 5 disposições renderizam; porta ao
      centro gera conflito; remoção limpa

## Scope

**In scope:** `layouts.js`, `architecture.js`, refactor de
`panelState`/`space` para frames, `architectureView.js`,
`architecturePanel.js`, UI de conflitos, visual-check, METODOLOGIA.md.
**Out of scope:** «personalizada» (edição livre de vértices → B005);
bancos/credências (futuro); análise angular/coplanaridade (T007);
cenários nomeados persistidos (T008).

## Diffstory

- **`src/model/layouts.js` (novo):** catálogo + `buildLayout(id,
  {radius, angleDeg})` → frames com normal interior. Comprimentos das
  alas abertas derivam da largura pintada total (5,04 m) + folgas —
  ESTIMADO, documentado no código.
- **`src/geometry/panelPlacement.js`:** extraído `frameFromSegment`
  (compartilhado); `wallFrame` passa a delegar.
- **`src/model/panelState.js`:** funções passam de `vertices` a `walls`
  (frames) — `framesFromVertices` mantém compatibilidade com o hexágono;
  `panelTransformFromState` rejeita parede inexistente no layout.
- **`src/model/architecture.js` (novo):** 4 tipos com dimensões
  ESTIMADAS; `conflictPanelElement` (vão: lateral+vertical; volume:
  lateral+profundidade) e `findConflicts`. Corrigido durante
  desenvolvimento: conflito só na mesma parede (teste apanhou a omissão
  da comparação de `wallIndex`).
- **`src/scene/space.js`:** `createSpace({walls, closed, boundsRadius})`;
  pavimento poligonal só para disposições fechadas; grupo `elements`.
- **`src/scene/architectureView.js` (novo):** vãos como rectângulos na
  parede, volumes como caixas translúcidas — esquemático, nunca
  reconstrução.
- **`src/ui/architecturePanel.js` (novo) + `index.html`/`style.css`:**
  4ª área na grelha (Análise em cima, Arquitetura em baixo); formulário
  tipo/parede/offset, lista com remoção, lista de conflitos.
- **`analysis/visual_check.py`:** verifica as 5 disposições (screenshot +
  variação de pixels) e o ciclo porta→conflito→remover.

### Intencionalmente intocado

- Modelo de painéis/anotações (T004/T005) — as anotações sobrevivem à
  troca de disposição por serem independentes do espaço (validado).
- Gizmo/propriedades — o `wallIndex` agora é limitado ao nº de paredes
  do layout activo (não só 6).

## Riscos conhecidos / para rever

- «Personalizada» adiada (B005) — investigador não pode ainda desenhar
  livremente um muro real.
- Elementos alinhados à parede: sem beirais/molduras nem profundidade
  real de vão (limitação registada em METODOLOGIA.md §3).
- Resultado informativo para H2-C: janela de peitoril 1,1 m colide
  sempre com painel-de-pé de 2,07 m — a hipótese das estreitas a
  flanquear janela exige painéis suspensos ou mais curtos, fora das
  dimensões publicadas. Registado em HYPOTHESES.md (não é falsificação
  documental, é restrição geométrica).
