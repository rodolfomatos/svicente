---
ticket: T004
title: Imagens dos painéis + metadados de proveniência e licença
sprint: sprint-01
priority: high
status: done
created: 2026-10-18
completed: 2026-10-18
---

# T004 — Imagens dos painéis + metadados

## Context

T002/T003 usavam texturas placeholder. A SPEC §3/§8 exige imagem frontal de
alta resolução com origem e licença — sem isto, nenhuma medição sobre
imagem é publicável num artigo científico.

## Acceptance Criteria

- [x] Imagem frontal dos seis painéis com textura real (SPEC §3)
- [x] Metadados: fonte, autor, licença, resolução, transformações (N4, §8)
- [x] Atribuição CC BY-SA visível na UI (exigência da licença)
- [x] Recorte reprodutível por script (analysis/crop_panels.py)
- [x] Limites de recorte classificados ESTIMADO com nota de perspectiva
      (SPEC §8) — não fingir precisão sub-pixel inexistente
- [x] Fallback placeholder apenas em falha de carga (N3)
- [x] `make check` verde (JS + Python)

## Scope

**In scope:** download da fonte, script de recorte + manifesto, texturas,
UI de atribuição, testes Python.
**Out of scope:** correcção visual dos limites (ferramenta futura; o
manifesto é editável e o script re-corre), imagens alternativas por painel.

## Notes

- Licença: fotografia CC BY-SA 3.0 (Daniel Villafruela) + obra PD-Art
  (Nuno Gonçalves) — compatível com artigo científico com atribuição.
- Decisão hostil: análise automática de vãos escuros na imagem foi
  inconsistente com qualquer modelo linear de escala (resíduos >250 px)
  — recorte proporcional ESTIMADO é o honesto; duas fronteiras geradas
  coincidem com vãos escuros reais (evidência indireta favorável).
- Ordem assumida na fotografia (esq.→dir.): Frades, Pescadores, Infante,
  Arcebispo, Cavaleiros, Relíquia. Se o investigador detetar inversão,
  corrigir a ordem em analysis/crop_panels.py e re-correr.

## Diffstory

- **O que mudou:** novo `analysis/` (script + testes), `assets/images/`
  (fonte + recortes + manifesto), `panelView.js` carrega textura real,
  `index.html` com atribuição.
- **Porquê:** AC acima; pipeline reprodutível auditável para o artigo.
- **Intocado:** geometria, estado, viewer, toolbar.
- **Riscos:** limites de recorte ESTIMADOS — medições finas de linhas do
  pavimento (T005) podem exigir correcção visual prévia pelo investigador.

## Validation

`make check` → 50 JS + 5 Python, verdes. Assets servidos 200.
`python3 analysis/crop_panels.py` reprodutível. 2026-10-18.
