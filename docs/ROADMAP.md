# Roadmap

## Roadmap

Prioridades: Impact (H/M/L) · Effort (S/M/L) · Priority (P1/P2/P3) · Status.

### Sprint 01 — Fundação (protótipo mínimo investigável)

| # | Item | Impact | Effort | Priority | Status |
|---|------|--------|--------|----------|--------|
| T001 | Modelo de dados + geometria pura: painéis (dimensões publicadas), hexágono regular (120°, raio 3 m), coordenadas métricas — funções testáveis em Node/pytest | H | M | P1 | done |
| T002 | Cena Three.js: painéis texturados, paredes independentes, pavimento, grelha, eixos; OrbitControls + TransformControls; seleção | H | M | P1 | done |
| T003 | Interface: painel de propriedades com edição numérica (XYZ, rotação, dimensões, parede, visibilidade) e vistas predefinidas | H | M | P1 | pending |
| T004 | Imagens dos painéis + metadados (fonte, licença, resolução) e classificação de proveniência na UI | H | S | P1 | pending |
| T005 | Camada de anotação: linhas do pavimento sobre a imagem em coordenadas normalizadas, solidárias ao painel | H | L | P1 | pending |
| T006 | Configurações alternativas: plana, angular aberta, polígono irregular, personalizada + abertura no hexágono | H | M | P2 | pending |
| T007 | Análise: ajuste de retas, pontos de fuga, ângulos/desvios entre painéis, continuidade proposta | H | L | P2 | pending |
| T008 | Cenários nomeados A/B/C/D, persistência LocalStorage, export/import JSON completo | H | M | P2 | pending |
| T009 | Comparação perspetiva/ortográfica, posições de câmara guardadas | M | S | P3 | pending |
| T010 | Exportação: imagem da vista, tabela de medições, anotações por painel, versão+parâmetros | M | S | P3 | pending |

### Backlog

| # | Item | Impact | Effort | Priority | Status |
|---|------|--------|--------|----------|--------|
| B001 | [DISCOVERED] — | | | | |

### Fora do âmbito (SPEC §11) — não planear sem nova base documental

Reconstrução automática do edifício · reconhecimento de figuras · IA de
significado · iluminação histórica · materiais · afirmações sobre localização.
