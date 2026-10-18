---
ticket: T008
title: Cenários nomeados — estado completo, LocalStorage, export/import JSON
sprint: sprint-01
priority: high
status: done
created: 2026-10-18
completed: 2026-10-18
---

# T008 — Cenários nomeados (SPEC §6.4, §7, §9)

## Context

O investigador precisa de alternar rapidamente entre experiências
(disposições A–D da SPEC §6.4) sem perder trabalho: traçados de linhas
do pavimento, colocação ajustada de painéis, elementos de arquitetura,
câmara. Sem persistência, cada troca de disposição destrói o estado —
impossível comparar H0 (ordem do museu, linha plana) contra H1/H2 no
mesmo episódio de trabalho. Este ticket implementa o **cenário**: o
estado completo da investigação, guardado, carregado, exportado e
importado como JSON. Um cenário é sempre um EXPERIMENTO (HIPÓTESE) com
os MEDIDOS do investigador — nunca uma reconstrução carregada (SPEC §8).

## Acceptance Criteria

- [x] Esquema `svicente/scenario` v1: disposição + parâmetros, estado
      de colocação de cada painel (+positionY, rotationY), anotações,
      elementos de arquitetura, visibilidade de camadas, câmara
      (SPEC §7)
- [x] `parseScenario` valida na entrada e recolhe TODOS os erros (não
      falha à primeira)
- [x] Repositório LocalStorage (`svicente.scenarios.v1`) com storage
      injectável — puro e testável em Node; validação antes de
      persistir (última linha de defesa)
- [x] Cenários predefinidos A–D (SPEC §6.4) com distribuição de painéis
      emparelhados/round-robin e largura pintada total com folgas
- [x] UI: guardar com nome/descrição, lista, carregar, apagar,
      exportar JSON (descarrega), importar JSON (valida + upsert),
      semear predefinidos; erros visíveis, nunca silenciados
- [x] Câmaras: `getCameraState`/`setCameraState` no visor; a câmara é
      guardada com o cenário (SPEC §7)
- [x] `make check` verde — 149 testes JS (+32) + 6 Python
- [x] `make visual-check` cobre o roundtrip: guardar cenário →
      recarregar página → cenário presente no LocalStorage →
      carregar repõe contagens de anotações → apagar limpa
      (`tmp/visual-check-cenarios.png`)

## Scope

**In scope:** `src/model/scenarios.js` (puro), `src/model/storage.js`
(puro), `src/ui/scenarioPanel.js`, ligação em `src/main.js`
(`captureSnapshot`/`applyScenario`), estado de câmara no `viewer.js`,
`index.html` (#props-panel + secção Cenários), estilos, documentação
METODOLOGIA §9.
**Out of scope:** comparação lado-a-lado de cenários (B003), exportação
para artigo (T010), histórico de versões de um cenário, sincronização
entre dispositivos.

## Diffstory

- **`src/model/scenarios.js` (novo, puro):** esquema e constantes
  (`SCENARIO_SCHEMA`, `SCENARIO_VERSION`), `serializeScenario` (cópia
  profunda), `parseScenario` (recolha acumulada de erros — cada campo
  inválido contribui para a lista; versão futura rejeitada),
  `createDefaultScenarios` (A plana, B angular, C hexágono, D
  irregular — A/B/D abrem para +Z, C fecha; offsets centrados por
  largura pintada + folga 0,05 m).
- **`src/model/storage.js` (novo, puro):** `createScenarioRepository`
  sobre interface `getItem/setItem/removeItem` (localStorage real só em
  `main.js`); upsert por id (`sc-<ts>-<seq>`), `savedAt` carimbado,
  JSON corrompido → lista vazia + `lastError` legível, guardar por
  cima recupera.
- **`src/ui/scenarioPanel.js` (novo):** UI pura por callbacks — nome,
  descrição, lista (select de tamanho 4), guardar/carregar/apagar,
  exportar/importar JSON (`FileReader`), semear predefinidos; estado
  de proveniência visível (cenário = EXPERIMENTO).
- **`src/scene/viewer.js`:** `getCameraState()`/`setCameraState()`
  (posição + alvo + projecção perspectiva/ortográfica).
- **`src/main.js`:** `captureSnapshot` (painéis com estado + positionY
  + rotationY, anotações, elementos, camadas, câmara),
  `applyScenario` (anotações ANTES da reconstrução para as camadas
  nascerem com segmentos; estados repostos por cima; elementSeq
  continua numeração), `panelMeshes()` helper, `layoutParams` activo,
  composição do repositório + painel.
- **`index.html` + `src/style.css`:** `#props-panel` (contentor próprio
  — o painel de propriedades fazia `replaceChildren` no aside inteiro
  e apagava a secção de cenários; bug descoberto pelo cheque visual),
  estilos do painel de cenários; nota do viewport corrigida
  (datação 1470–1480 → dendrocronologia c. 1445).
- **`analysis/visual_check.py`:** `set_input()` (page.fill é no-op
  neste headless — quirk documentado no helper), passo 9 roundtrip de
  cenário; passos 6–7 reforçados (vista frontal por disposição +
  distinção por hash + escuta `pageerror` — capturas idênticas
  anteriores eram um falso positivo: a partir da vista «centro» as
  três disposições abertas mostravam a mesma face vazia).
- **docs/HYPOTHESES.md (commit anterior deste ticket):** registo de H0
  (hipótese corrente — ordem do museu, cena única) e H3 (Batalha,
  Fernando Branco), correção de H1 (datação 1470–1480 superada pela
  dendrocronologia), observações documentais (meias-portas de 1909,
  ordem de 1940, descoberta de 1882).
- **docs/METODOLOGIA.md §9:** esquema, semântica (cenário = experimento
  guardado), recuperação de corrupção, validação.

### Intencionalmente intocado

- **Texturas (T004v2):** a migração para as digitalizações sem moldura
  (domínio público, Google Arts & Culture/MNAA via Commons) é T011 —
  separada para não misturar mudanças de assets com mecânica de
  persistência.
- **Métricas (T007):** o cenário guarda anotações; as métricas são
  derivadas e recalculam-se ao carregar.
- **Modelo de anotações (T005):** `serialize()`/`load()` já previam
  persistência — usados sem alterações.

## Riscos conhecidos / para rever

- **Guardar não versiona:** «Guardar cenário» com o mesmo nome cria uma
  nova entrada (não substitui) — cada guarda é uma EXPERIMENTALIZAÇÃO
  versionada; se o investigador quiser editar-in-place, o import faz
  upsert por id.
- **Câmara guardada é posicional:** `setCameraState` repõe posição e
  alvo, mas o OrbitControls pode não coincidir exactamente com o estado
  guardado após load (verificar em uso real).
- **Quirk do ambiente Playwright:** `page.fill()` e `keyboard.type()`
  não funcionam neste Chromium headless (SwiftShader) — `set_input()`
  contorna via evaluate; se o ambiente mudar, manter o contorno é
  inofensivo.
- LocalStorage limita-se a ~5 MB — irrelevantes para cenários JSON
  (bytes), mas exportações futuras com anexos binários (T010) devem
  usar ficheiro, não LocalStorage.
