---
ticket: T007
title: Métricas de análise — retas, pontos de fuga, diedros, continuidade
sprint: sprint-01
priority: high
status: done
created: 2026-10-18
completed: 2026-10-18
---

# T007 — Métricas de análise (H1/H2)

## Context

H1 e H2 têm planos de teste que exigem quantificar coisas que a vista
3D só mostra qualitativamente: as linhas do pavimento são contínuas
entre painéis? Os painéis são coplanares (linha contínua, H2-A) ou
dobrados em diedro consistente (H2-B)? Um grupo explica-se sem o
outro (H2-C)? Este ticket constrói o instrumento que responde a estas
perguntas com números, dentro da regra central do projecto: **nenhuma
métrica conclui hipótese** — quantifica compatibilidade.

## Acceptance Criteria

- [x] Ajuste de recta TLS por traçados (resíduos, ângulo) — teste
      sintético recupera recta exacta
- [x] Interseções pareadas → ponto de fuga aparente com dispersão RMS
      (rectas concorrentes conhecidas → posição exacta)
- [x] Direcção dominante por painel: média circular módulo 180°,
      ponderada por comprimento; dispersão angular
- [x] Diedro entre faces de pares vizinhos (0° = coplanar; 60° =
      adjacentes do hexágono — teste)
- [x] Continuidade transfronteira: melhor par de traçados que cruzam a
      aresta comum → desvio angular + afastamento entre rectas 3D,
      usando a transformação REAL do painel (quaternion + dimensões
      efectivas)
- [x] Pares vizinhos = rectângulos a <0,75 m no pavimento (corte
      ESTIMADO registado em TOLERANCES)
- [x] UI «Métricas (T007)» no painel de análise: por painel + por par,
      com cortes ±5°/0,10 m marcados ESTIMADO; recálculo automático
      após traçar e após trocar disposição
- [x] 28 testes sintéticos novos (117 total); `make check` verde
- [x] `make visual-check` cobre: traçar → direcção dominante calculada
      (screenshot `tmp/visual-check-metricas.png`)

## Scope

**In scope:** `src/model/analysis.js` (puro), `src/ui/metricsPanel.js`,
ligação em `main.js` (extracção de eixos mundo via quaternion),
documentação METODOLOGIA §8.
**Out of scope:** ajuste iterativo de rectas com rejeição de outliers
(RANSAC — se os traçados reais mostrarem ruído intolerável);
persistência de relatórios (T008/T010); automação de traçado.

## Diffstory

- **`src/model/analysis.js` (novo, puro):** `fitLineTLS` (autovector
  2×2 fechado), `intersectLines` (Cramer — corrigido sinal durante
  desenvolvimento, teste de verificação contra equações originais
  incluído), `dominantDirection` (duplo ângulo para módulo 180°),
  `apparentVanishingPoint`, `uvToWorld`/`segmentWorld`,
  `dihedralDeg`, `rectDistanceXZ` (distância segmentos 2D clamped),
  `continuityBetween` (desvio angular agudo + afastamento médio
  recta-ponto 3D), `analyzeLayout` (orquestração por par).
- **`src/ui/metricsPanel.js` (novo):** botão «Calcular métricas»,
  listas por painel e por par; nota de proveniência obrigatória.
- **`src/main.js`:** `collectPanelsForAnalysis()` lê posição,
  quaternion (eixos right/up via THREE) e estado de cada malha;
  recálculo em `onDrawSegment` e no fim de `buildScene`.
- **`analysis/visual_check.py`:** passo 8 — traçar duas linhas,
  clicar calcular, verificar conteúdo (usando `text_content()`;
  `inner_text()` sai vazio neste headless SwiftShader — quirk
  registado no comentário do script).
- **docs/METODOLOGIA.md §8:** fórmulas, cortes, leitura para H1/H2
  (quatro padrões: coplanaridade total, diedro único, grupos com
  quebra, nada explica).

### Intencionalmente intocado

- Modelo de anotações e camadas 3D (T005) — as métricas são uma
  camada de leitura, não alteram dados.
- Disposições (T006) — os diedros vêm da disposição activa sem
  duplicar geometria.

## Riscos conhecidos / para rever

- **Traçados reais ≠ sintéticos:** com ruído de mão, o «melhor par»
  por desvio angular pode apanhar coincidências — se acontecer,
  acrescentar contagem mínima de traçados por aresta ou RANSAC.
- Cortes (0,75 m vizinhança; 5°/0,10 m continuidade) são ESTIMADOS —
  sensíveis a decisões do investigador; registados em TOLERANCES para
  serem revistos num só sítio.
- Ponto de fuga aparente ignora a projecção real da câmara (é um VP
  em UV, não métrico) — suficiente para detectar concorrência
  aparente, não para calibrar a câmara original.
