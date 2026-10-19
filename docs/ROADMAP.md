# Roadmap

## Roadmap

Prioridades: Impact (H/M/L) · Effort (S/M/L) · Priority (P1/P2/P3) · Status.

### Sprint 01 — Fundação (protótipo mínimo investigável)

| # | Item | Impact | Effort | Priority | Status |
|---|------|--------|--------|----------|--------|
| T001 | Modelo de dados + geometria pura: painéis (dimensões publicadas), hexágono regular (120°, raio 3 m), coordenadas métricas — funções testáveis em Node/pytest | H | M | P1 | done |
| T002 | Cena Three.js: painéis texturados, paredes independentes, pavimento, grelha, eixos; OrbitControls + TransformControls; seleção | H | M | P1 | done |
| T003 | Interface: painel de propriedades com edição numérica (XYZ, rotação, dimensões, parede, visibilidade) e vistas predefinidas | H | M | P1 | done |
| T004 | Imagens dos painéis + metadados (fonte, licença, resolução) e classificação de proveniência na UI | H | S | P1 | done |
| T005 | Camada de anotação: linhas do pavimento sobre a imagem em coordenadas normalizadas, solidárias ao painel | H | L | P1 | done |
| T006 | Configurações alternativas: plana, angular aberta, U, polígono irregular (frames de parede; personalizada: T006b) + elementos de arquitetura (B004) | H | M | P2 | done |
| T007 | Análise: ajuste de retas, pontos de fuga, ângulos/desvios entre painéis, continuidade proposta | H | L | P2 | done |
| T008 | Cenários nomeados A/B/C/D, persistência LocalStorage, export/import JSON completo | H | M | P2 | done |
| T009 | Comparação perspetiva/ortográfica, posições de câmara guardadas | M | S | P3 | pending |
| T010 | Exportação: imagem da vista, tabela de medições, anotações por painel, versão+parâmetros | M | S | P3 | done |
| T011 | Texturas v3: substituir bases GIMP pelas digitalizações sem moldura do Commons (Google Arts & Culture/MNAA, domínio público, até 4727×7713 px, proporções ~dimensões publicadas) — nova cadeia de proveniência no manifest | H | M | P2 | in-progress |

### Backlog

| # | Item | Impact | Effort | Priority | Status |
|---|------|--------|--------|----------|--------|
| B001 | Ferramenta de correcção visual dos limites de recorte (T004 gerou recortes ESTIMADOS; manifesto editável + re-correr script) | H | M | P2 | pending |
| B002 | H1 (docs/HYPOTHESES.md): reformular a hipótese das Cortes para a janela dendrocronológica (c. 1445, Klein) ou arquivar face a H3 — ver observações documentais (HYPOTHESES.md, T008); pesquisa documental: Cortes/regnência de D. Pedro nos anos 1440 | H | M | P2 | pending |
| B003 | Cenário quick-comparação A/B/C na toolbar (quando T006/T008 existirem) para teste rápido de hipóteses reticulares vs. hexágono | M | S | P3 | pending |
| B004 | Elementos de arquitetura plausível (porta, janela, altar, trono) como restrições de parede no T006 — geometria simples + validação de sobreposição painel×elemento (H2, docs/HYPOTHESES.md) | H | M | P1 | done (em T006) |
| B005 | Disposição «personalizada»: edição livre de vértices/frames pelo investigador (T006b) | M | M | P3 | pending |

### Fora do âmbito (SPEC §11) — não planear sem nova base documental

Reconstrução automática do edifício · reconhecimento de figuras · IA de
significado · iluminação histórica · materiais · afirmações sobre localização.
