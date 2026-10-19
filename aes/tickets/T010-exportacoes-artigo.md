---
ticket: T010
title: Exportações para o artigo científico
sprint: sprint-01
priority: high
status: done
created: 2026-10-19
---

# T010 — Exportações para o artigo científico

## Contexto

O investigador precisa de exportar resultados do protótipo para incluir
no artigo científico: vista de imagem (screenshot da cena), tabela de
medições, anotações por painel, versão+parâmetros da configuração.
SPEC §10 define os critérios de aceitação; §10.10 exige export/reimport
sem perda de anotações.

## Critérios de aceitação (SPEC §10)

- [ ] Exportar vista de imagem (cena renderizada, disposição activa)
- [ ] Exportar tabela de medições (posições, dimensões, paredes, offsets)
- [ ] Exportar anotações por painel (segmentos UV, linhas do pavimento)
- [ ] Exportar versão + parâmetros (versão do projeto, dimensões, radius,
      ângulo, layout activo)
- [ ] Export/import roundtrip sem perda de anotações (§10.10)
- [ ] JSON de exportação válido segundo o esquema do repositório
- [ ] Import rejeia ficheiros inválidos com erro legível

## Escopo

**In scope:** `src/scene/export.js` (novo), botões na UI, download de
ficheiros, `captureSnapshot` (já existe via T008) a ser reutilizado.
**Out of scope:** T009 (perspetiva/ortográfica + posições de câmara),
T011 (texturas v3 — já feito).

## Diffstory (preenchido no fim)

- **`src/scene/export.js` (novo):** funções de exportação.
- UI: botões de export/import nas painéis existentes.
- README, METODOLOGIA, kanban, ROADMAP, ticket.

## Intencionalmente intocado

- Nenhuma alteração à geometria do modelo ou às dimensões publicadas.
- Nenhuma alteração às texturas (v3 já em vigor).

## Riscos conhecidos

- Export de imagem depende de renderização WebGL (disponível localmente;
  SwiftShader se necessário).
- Roundtrip: import valida contra o esquema antes de aplicar (§6.4/T008).
