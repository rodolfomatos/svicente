# Painéis de São Vicente — Laboratório Espacial 3D

Protótipo de investigação histórico-artística: uma ferramenta web para
**testar hipóteses sobre a disposição espacial original** dos seis
Painéis de São Vicente (Políptico de Nuno Gonçalves, c. 1470–1480,
MNAAT Lisboa) — hoje dispersos, com a disposição da sala capitular
original desconhecida.

> **Princípio reitor (SPEC §1):** o modelo é uma ferramenta de
> investigação, **não uma reconstrução histórica apresentada como
> facto**. Nenhuma configuração mostrada pela aplicação é prova de
> nada; cada dado carrega a sua classificação de proveniência e cada
> hipótese tem um teste falsificável.

**Estado:** protótipo v0.1 — tickets T001–T007 concluídos (ver
[`docs/ROADMAP.md`](docs/ROADMAP.md)).

---

## Sumário

1. [Arranque rápido](#arranque-rápido)
2. [O que a aplicação faz](#o-que-a-aplicação-faz)
3. [Hipóteses de investigação](#hipóteses-de-investigação)
4. [Como testar hipóteses com a ferramenta](#como-testar-hipóteses-com-a-ferramenta)
5. [Regras de proveniência](#regras-de-proveniência)
6. [Arquitectura do código](#arquitectura-do-código)
7. [Documentação do projecto](#documentação-do-projecto)
8. [Comandos e verificação](#comandos-e-verificação)
9. [Ciclo de trabalho (AES)](#ciclo-de-trabalho-aes)
10. [Imagens, fontes e licenças](#imagens-fontes-e-licenças)
11. [Limitações conhecidas](#limitações-conhecidas)

---

## Arranque rápido

Pré-requisitos: Node.js ≥ 18, Python ≥ 3.10 (para scripts de análise e
cheque visual).

```bash
git clone git@github.com:rodolfomatos/svicente.git
cd svicente
npm install          # dependências (three, jest, eslint, prettier, http-server)
npm start            # servidor estático em http://localhost:8080
```

Abrir <http://localhost:8080> num browser com WebGL.

**Para verificar que tudo funciona:**

```bash
make check           # docs + testes JS (117) + lint + testes Python (6)
make visual-check    # Playwright + Chromium headless: cena renderiza de facto
```

`make visual-check` produz screenshots em `tmp/` para inspecção humana
(o WebGL não corre em CI — a verificação visual é local por decisão
registada).

---

## O que a aplicação faz

### Vista 3D (Three.js, sem framework, sem build step)

- **Seis painéis** texturados com as dimensões publicadas, em
  coordenadas métricas (metros, Y vertical), na convenção
  _painel-de-pé_ (base no pavimento, SPEC §4).
- **Navegação orbital** (OrbitControls) + **gizmo de translação**
  (TransformControls) por painel; selecção por clique.
- **Disposições alternativas** (menu de configuração, todas
  HIPÓTESE, T006):

  | Disposição         | Geometria                       | Ligação                   |
  | ------------------ | ------------------------------- | ------------------------- |
  | Hexágono regular   | 6 paredes, apotema editável     | SPEC §4, hipótese C       |
  | Linha plana        | parede única, 6 painéis em fila | H2-A (retábulo/trono)     |
  | Angular aberta     | 2 alas, ângulo 30–170°          | H2-B (sala de corte)      |
  | Tribuna em U       | 3 alas, aberta à frente         | H1 (estrutura temporária) |
  | Hexágono irregular | factores de vértice fixos       | teste de sensibilidade    |

- **Painel de propriedades:** edição numérica de posição XYZ,
  rotação Y, largura/altura (ajuste do investigador), parede
  associada, deslocamento lateral, distância à parede, face
  invertida; vistas predefinidas (frontal, superior, lateral, centro);
  perspectiva/ortográfica.
- **Vistas analíticas:** paredes, pavimento, grelha métrica e eixos
  com toggles individuais.

### Anotações (SPEC §6.1, T005)

- Modo **«Traçar linhas»**: clicar e arrastar sobre um painel cria
  segmentos das linhas do pavimento em **coordenadas normalizadas
  [0,1]** da imagem — imunes a resolução, escala e re-posicionamento.
- As linhas são **filhas da malha do painel**: qualquer transformação
  (parede, offsets, escala, gizmo, inversão de face) arrasta-as
  automaticamente (critério de aceitação 7).
- Camada por painel com toggle de visibilidade e contagem; segmentos
  < 0,5% da dimensão são rejeitados (ruído de clique); Escape cancela
  o traço em curso.

### Arquitetura como restrições (H2, B004, T006)

Portas, janelas, altar e trono podem ser colocados em qualquer parede
(deslocamento lateral editável) como **obstáculos hipotéticos** onde
um painel não pode estar:

- Dimensões típicas quinhentistas, classificadas **ESTIMADO** — não
  são medições de fonte alguma.
- **Validação automática de conflitos:**
  - _Vãos_ (porta/janela): colidem se os intervalos laterais **e**
    verticais se sobrepõem;
  - _Volumes_ (altar/trono): colidem se sobrepõem lateralmente e o
    painel está a menos da profundidade do objeto da parede.
- Conflitos listados no painel «Arquitetura», com razão legível.

### Métricas de análise (T007)

Botão **«Calcular métricas»** no painel de análise:

- **Por painel:** nº de traçados, **direcção dominante** (média
  circular módulo 180°, ponderada por comprimento), dispersão angular
  e **ponto de fuga aparente** (interseções pareadas das rectas
  ajustadas por TLS, com dispersão RMS).
- **Por par de painéis vizinhos** (< 0,75 m no pavimento):
  - distância entre rectângulos no plano XZ;
  - **ângulo diedro** entre faces (0° = coplanar);
  - **continuidade transfronteira:** melhor par de traçados que cruzam
    a aresta comum → desvio angular agudo + afastamento entre as rectas
    3D, usando a transformação real de cada malha.
- Cortes de leitura (≤5° e ≤0,10 m → «CONTÍNUA») marcados
  **ESTIMADO**; recálculo automático ao traçar e ao mudar disposição.

---

## Hipóteses de investigação

Registry completo em [`docs/HYPOTHESES.md`](docs/HYPOTHESES.md). Todas
classificadas HIPÓTESE — nenhuma é facto.

### H1 — Painéis para uma Cortes nunca realizada

Os painéis teriam sido pintados para decorar uma estrutura temporária
de corte (tenda/tribuna/dossel) associada a uma Cortes de Santarém que
não se realizou. **Teste geométrico:** as linhas do pavimento devem
ser compatíveis com disposição plana (A) ou angular (B); desvios
incompatíveis com hexágono (C) restringiriam o espaço de hipóteses a
tipos reticulares. **Pendente:** verificação documental primária
(B002 — Documentos de D. Afonso V).

### H2 — A arquitetura restringe a disposição

Portas, janelas, altar ou trono do espaço original determinam onde
cada painel pode estar; a linha contínua do museu pode ser
reconstrução moderna. **Testes:**

1. Elementos de arquitetura vs. sobreposições — _concluído (T006);
   resultado já legível: uma janela de peitoril 1,1 m colide sempre
   com painel-de-pé de ~2,07 m, o que enfraquece a variante C tal como
   formulada._
2. Coplanaridade (diedro) e continuidade por grupo — _instrumento
   pronto (T007); aguarda traçados do investigador._

---

## Como testar hipóteses com a ferramenta

Fluxo de trabalho típico (o resultado é do investigador, não da app):

1. **Traçar** as linhas do pavimento reais sobre cada painel (modo
   «Traçar linhas») — isto é a MEDICÃO principal (MEDIDO).
2. **Trocar disposição** (hexágono → plana → angular → U) — as
   anotações sobrevivem à troca.
3. **Calcular métricas** — ler diedros e continuidade por par.
4. **Colocar restrições arquitetónicas** (porta/janela/altar/trono) e
   verificar conflitos.
5. **Comparar** os padrões contra os planos de teste de H1/H2
   (leitura em [`docs/METODOLOGIA.md`](docs/METODOLOGIA.md) §8):
   - coplanaridade total + continuidade → compatível com linha
     contínua (H2-A);
   - diedro único consistente → H2-B;
   - grupos com continuidade interna e quebra entre grupos → H2-C;
   - nenhum diedro explica as linhas → enfraquece o hexágono, favorece
     reticulares (H1).

**Nenhum destes passos conclui uma hipótese** — só restringe o espaço
de hipóteses. A distinção final H1 vs. hipótese da Sé de Lisboa exige
evidência extra-geométrica (documental, arqueologia da moldura).

---

## Regras de proveniência

Todo o dado exibido ou exportado carrega classificação (SPEC §8):

| Classe          | Significado                                |
| --------------- | ------------------------------------------ |
| `DOCUMENTADO`   | sustentado por uma fonte identificada      |
| `MEDIDO`        | obtido por medição explícita               |
| `ESTIMADO`      | calculado a partir de evidência incompleta |
| `HIPÓTESE`      | definido para testar uma possibilidade     |
| `INTERPRETAÇÃO` | explicação proposta pelo investigador      |

Onde vivem no código:

- `src/model/panels.js` — dimensões publicadas + nota obrigatória
  (`PUBLISHED_DIMENSIONS_NOTE`); painéis imutáveis.
- `src/model/layouts.js` — todas as disposições: `HIPÓTESE`.
- `src/model/architecture.js` — dimensões dos elementos: `ESTIMADO`.
- `src/model/analysis.js` — `TOLERANCES`: `ESTIMADO`; traçados:
  `MEDIDO`.
- `assets/images/panels/manifest.json` — cadeia de proveniência
  completa das imagens (ver secção de licenças).

As texturas **nunca são deformadas** pela aplicação; alterações de
largura/altura são ajustes explícitos e rotulados do investigador.

---

## Arquitectura do código

```
index.html            import map (three), layout de 3 áreas + métricas
src/
  main.js             composição: espaço + painéis + arquitetura + UI
  style.css
  geometry/
    regularPolygon.js    polígonos regulares (convenção: radius = apotema)
    panelPlacement.js    frames de parede {a,b,midpoint,inward} + placeOnWall
  model/             # geometria pura — testada em Node, sem DOM/Three
    panels.js            modelo imutável dos 6 painéis + proveniência
    panelState.js        estado por parede (wallIndex, offsets) + transformações
    layouts.js           catálogo de 5 disposições → frames
    architecture.js      elementos + validação de sobreposição
    annotations.js       segmentos UV [0,1] com mínimo 0,5%
    analysis.js          métricas: TLS, VP, diedros, continuidade
  scene/             # Three.js — verificado visualmente, não em CI
    viewer.js            câmara, OrbitControls, gizmo, raycast, modo traço
    space.js             paredes/pavimento/grelha a partir de frames
    panelView.js         malhas texturadas dos painéis
    annotationView.js    linhas como FILHAS da malha (critério 7)
    architectureView.js  vãos e volumes esquemáticos
  ui/                # DOM puro, sem framework
    propertiesPanel.js   edição numérica (SPEC §5.B)
    analysisPanel.js     camadas + toggles + contagens
    architecturePanel.js elementos + conflitos
    metricsPanel.js      métricas T007
analysis/
  crop_panels.py      geração de texturas + manifesto de proveniência
  visual_check.py     Playwright/SwiftShader: verificação visual local
  tests/              pytest (6 testes)
tests/                Jest (117 testes) — só a camada pura
docs/                 SPEC, VISION, HYPOTHESES, METODOLOGIA, ROADMAP...
aes/                  tickets, kanban, sprints (protocolo AES)
```

**Decisões estruturais que não mudam sem discussão:**

- _Frames de parede_ são a representação canónica — disposições
  abertas e fechadas partilham a mesma matemática.
- O raio do hexágono é **apotema** (linha média das paredes), não
  raio circunscrito.
- Camada pura (`model/`, `geometry/`) não importa `three` nem `DOM` —
  é o que torna 117 testes possíveis em Node.
- Camada de cena/UI não é testável em Node; a sua garantia é o
  `make visual-check` local + screenshots.

---

## Documentação do projecto

| Documento                                        | Conteúdo                                                                                                                |
| ------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------- |
| [`docs/SPEC.md`](docs/SPEC.md)                   | **Normativo** — requisitos, 12 critérios de aceitação (§10), âmbito (§11). Prevalece sobre REQUIREMENTS.md em conflito. |
| [`docs/VISION.md`](docs/VISION.md)               | Problema, solução, valor, critérios de sucesso                                                                          |
| [`docs/HYPOTHESES.md`](docs/HYPOTHESES.md)       | Registry H1/H2: enunciado, evidência a favor/contra, teste, estado                                                      |
| [`docs/METODOLOGIA.md`](docs/METODOLOGIA.md)     | **Base do artigo** — convenções, parâmetros, critérios, métricas (§8), limitações                                       |
| [`docs/ROADMAP.md`](docs/ROADMAP.md)             | Tickets T001–T010 + backlog                                                                                             |
| [`docs/REQUIREMENTS.md`](docs/REQUIREMENTS.md)   | Requisitos detalhados                                                                                                   |
| [`docs/PERSONAS.md`](docs/PERSONAS.md)           | Persona do investigador                                                                                                 |
| [`docs/DESIGN.md`](docs/DESIGN.md)               | Decisões de design                                                                                                      |
| [`docs/QUALITY_GATES.md`](docs/QUALITY_GATES.md) | Gates de qualidade                                                                                                      |
| [`docs/CHECKLIST.md`](docs/CHECKLIST.md)         | Checklist de entrega                                                                                                    |
| [`docs/COMMON_ERRORS.md`](docs/COMMON_ERRORS.md) | Erros conhecidos e correcções                                                                                           |
| [`aes/tickets/`](aes/tickets/)                   | Histórico por ticket (diffstory + critérios)                                                                            |

---

## Comandos e verificação

| Comando                            | O que faz                                                                  |
| ---------------------------------- | -------------------------------------------------------------------------- |
| `npm start`                        | servidor estático em `localhost:8080` (sem build)                          |
| `make check`                       | docs-check + testes JS (com cobertura) + lint (0 warnings) + testes Python |
| `make test`                        | Jest com cobertura (camada pura: `model/`, `geometry/`)                    |
| `make python-test`                 | pytest de `analysis/`                                                      |
| `make lint`                        | ESLint + `--max-warnings=0`                                                |
| `make format`                      | Prettier em todo o repositório                                             |
| `make visual-check`                | Playwright headless + SwiftShader; screenshots em `tmp/`                   |
| `make visual-check` com `--headed` | idem com janela visível (`python3 analysis/visual_check.py --headed`)      |
| `make doctor`                      | diagnóstico do ambiente                                                    |

O cheque visual verifica: canvas com variação real de pixels; 6
camadas de análise; traço cria anotação; texturas HTTP 200; **as 5
disposições renderizam**; porta ao centro gera conflito; remoção limpa;
**métricas calculam**. Falha (exit 1) em qualquer condição violada.

**Porquê não CI para o WebGL:** o Chromium headless sem GPU não
disponibiliza WebGL fiável em runners CI; em vez de ignorar a camada
visual, o projecto faz a verificação local com SwiftShader (software)
e regista a decisão. A camada pura corre em CI normalmente (não há CI
configurado neste repositório — apenas hooks locais `pre-commit`).

---

## Ciclo de trabalho (AES)

O projecto segue o protocolo AES: cada unidade de trabalho é um
**ticket** em `aes/tickets/` com contexto, critérios de aceitação e
_diffstory_ (o que mudou, porquê, o que ficou intocado de propósito,
riscos). Progresso em [`aes/kanban.md`](aes/kanban.md) e
[`aes/sprints/sprint-01.md`](aes/sprints/sprint-01.md).

Estado actual (2026-10-18):

| Ticket                                 | Estado  |
| -------------------------------------- | ------- |
| T001 Modelo + geometria pura           | done    |
| T002 Cena Three.js                     | done    |
| T003 Painel de propriedades            | done    |
| T004 Imagens + metadados (v2)          | done    |
| T005 Anotações de linhas               | done    |
| T006 Disposições + arquitetura (B004)  | done    |
| T007 Métricas de análise               | done    |
| T008 Cenários nomeados + export/import | done    |
| T009 Câmaras guardadas                 | pending |
| T010 Exportações para o artigo         | pending |
| T011 Texturas v3 (digitalizações PD)   | in-progress |

---

## Imagens, fontes e licenças

- **Obra:** Políptico de São Vicente, Nuno Gonçalves, séc. XV
  (estimativa clássica c. 1470–1480; dendrocronologia de Peter Klein
  apoia c. 1445 — ver `docs/HYPOTHESES.md`) — domínio público (MNAAT,
  Lisboa).
- **Fotografia base:** «Lisboa-Museu Nacional de Arte Antiga-Políptico
  de São Vicente-20140917.jpg», Villafruela (2014), **CC BY-SA 3.0**,
  via Wikimedia Commons. Atribuição visível na UI (rodapé).
- **Texturas dos painéis:** recortes do investigador (GIMP — remoção
  de molduras + correcção de perspectiva, 2026-10-18) sobre a
  fotografia acima. Cadeia completa em
  `assets/images/panels/manifest.json` (classificação MEDIDO; nota de
  perspectiva residual objective 19 mm, deltas de proporção 0,7–5,0%
  vs. tabelas publicadas).
- **Código:** [CC BY-SA 3.0](LICENSE) — escolha deliberada para ser
  consistente com a licença da fotografia base das texturas
  (Villafruela, CC BY-SA 3.0); reutilizações derivadas partilham a
  mesma licença, com atribuição.

Referências documentais adicionais em `docs/SPEC.md` (Google Arts &
Culture; Modernismo.pt).

---

## Limitações conhecidas

Registadas em [`docs/METODOLOGIA.md`](docs/METODOLOGIA.md) §7 e nos
tickets; rever antes de citar no artigo:

- **Rotação Y manual** feita com o gizmo perde-se ao mudar
  parede/distância (a parede reorienta o painel para o interior —
  semântica deliberada).
- Rotações X/Z não persistidas na UI de propriedades.
- Elementos de arquitetura alinhados à parede — sem beirais,
  molduras nem profundidade real de vão.
- Disposição «personalizada» (edição livre de vértices) não
  implementada (backlog B005).
- Ponto de fuga calculado é **aparente em UV**, não métrico da câmara
  original.
- Os traçados são do investigador (MEDIDO) mas não há ainda rejeição
  de outliers (RANSAC) — com ruído de mão, o «melhor par» de
  continuidade pode apanhar coincidências.
- Sem CI; a verificação visual é local e manual (screenshots em
  `tmp/`).
- **O protótipo não decide qual a disposição correcta** — produz
  métricas de compatibilidade para o investigador confrontar com
  evidência documental (SPEC §1).
