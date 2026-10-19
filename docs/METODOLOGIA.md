# Metodologia — Painéis de São Vicente: Laboratório Espacial 3D

Registo de decisões metodológicas do protótipo, com classificação de
proveniência obrigatória (SPEC §8). Documento destinado a servir de base
à secção de métodos do artigo científico: cada convenção geométrica, cada
parâmetro e cada critério de validação está aqui justificado e remetido
para o teste que a verifica.

Nada do que se segue é facto histórico: é a descrição do instrumento de
teste construído. Configurações apresentadas na aplicação são sempre
HIPÓTESE de trabalho (SPEC §1).

---

## 1. Convenções geométricas

- **Sistema de coordenadas:** metros; eixo Y vertical; plano XZ
  horizontal (SPEC §4). Ângulos em graus na UI, radianos no código.
- **Convenção de raio (crítica):** o parâmetro `radius` do hexágono é o
  **apotema** — distância do centro à linha média das paredes, não o raio
  circunscrito aos vértices. Vértices ficam a `radius / cos(π/6)`.
  Verificado em `tests/geometry/regularPolygon.test.js`.
- **Painel-de-pé:** todo painel assenta no pavimento (base Y = 0, altura
  = altura publicada/ajustada). Posições livres em Y só por acção
  explícita do investigador (degrau, pedestal hipotético).
- **Painel associado a parede (SPEC §5.B):** cada painel tem uma parede
  associada (`wallIndex`), deslocamento lateral ao longo dela
  (`lateralOffset`) e distância à face (`distanceToWall`). Mover a
  distância move o painel ao longo da normal interior, nunca atravessa a
  parede.
- **Frame de parede:** representação canónica de qualquer parede —
  `{a, b, midpoint, inward}`, com `inward` unitária e apontando para o
  interior do espaço. Produzida por `frameFromSegment` (extremidades +
  ponto interior) ou `wallFrame` (polígono + centro). Toda a colocação
  de painéis e elementos funciona sobre frames — não sobre polígonos —
  o que torna as disposições abertas (linha plana, U) tão válidas como o
  hexágono fechado.

## 2. Disposições espaciais (T006)

Catálogo em `src/model/layouts.js`; geometria pura testada em
`tests/model/layouts.test.js`. **Todas classificadas HIPÓTESE** — são
espaços de comparação, não reconstruções.

| id | Descrição | Paredes | Fecha? | Ligação |
|----|-----------|---------|--------|---------|
| `hexagono` | Hexágono regular, apotema `radius` | 6 | sim | SPEC §4, hipótese C |
| `plana` | Parede única reta, seis painéis em fila | 1 | não | H2-A (retábulo/trono) |
| `angular` | Duas alas com ângulo paramétrico (30–170°, default 90°) | 2 | não | H2-B (sala de corte) |
| `u` | Tribuna em U, três alas, aberta à frente | 3 | não | H1 (estrutura temporária) |
| `irregular` | Hexágono com factores de vértice fixos `[1.0, 0.85, 1.1, 0.9, 1.05, 0.95]` | 6 | sim | teste de sensibilidade à regularidade |

- Comprimentos das alas das disposições abertas derivam da largura
  pintada total (5,04 m, SPEC §3) + folgas/margens — **ESTIMADO**, a
  função é documentada no próprio código.
- O hexágono irregular usa factores **determinísticos fixos**: mesma
  entrada → mesma geometria (teste de reprodutibilidade incluído). Não
  é uma medição de nenhuma irregularidade real.
- O catálogo não inclui «personalizada» (edição livre de vértices) —
  Backlog T006b se necessária.

## 3. Elementos de arquitetura como restrições (B004, H2)

`src/model/architecture.js`; testes em `tests/model/architecture.test.js`.

**Princípio:** portas, janelas, altar e trono **ocupam espaço onde um
painel não pode estar**. A aplicação não reconstrói a arquitetura —
marca restrições e acusa conflitos. As dimensões são ordens de
grandeza típicas, classificadas **ESTIMADO** (não medições de fonte
alguma):

| Tipo | L × A (m) | Peitoril/prot. | Natureza |
|------|-----------|----------------|----------|
| Porta | 1,1 × 2,1 | base no pavimento | vão na parede |
| Janela | 0,9 × 1,3 | peitoril 1,1 m | vão na parede |
| Altar | 1,4 × 0,95 | protusão 0,8 m | volume no pavimento |
| Trono/dossel | 1,2 × 2,2 | protusão 0,7 m | volume no pavimento |

**Critérios de conflito** (geometria 1D em coordenadas de parede +
intervalo vertical):

1. **Vão (porta/janela):** conflito se o intervalo lateral do painel e
   do vão se sobrepõem **e** os intervalos verticais se sobrepõem.
   Consequência testável: uma janela de peitoril 1,1 m (topo 2,4 m)
   colide sempre com painel-de-pé de ~2,07 m — para a hipótese das
   estreitas a flanquear janelas (H2-C), os painéis teriam de ter base
   acima de 2,3 m ou serem mais curtos. O políptico não permite isso
   com as dimensões publicadas → **resultado informativo para H2-C**.
2. **Volume (altar/trono):** conflito se os intervalos laterais se
   sobrepõem e o painel está a menos da profundidade do objeto da
   parede (estaria dentro do volume). Painel afastado ≥ profundidade
   passa à frente — compatível com leitura de retábulo com altar
   adiantado (H2-A).

Limitação deliberada: elementos são planos/volumes simples alinhados à
parede; não modelam beirais, molduras nem profundidade real de vão.

## 4. Anotações de linhas do pavimento (T005, SPEC §6.1)

- Coordenadas **normalizadas [0,1]** na imagem do painel — imunes a
  escala, rotação e reaproveitamento de textura; segmentos com comprimento
  mínimo 0,5% da dimensão correspondente (rejeitam micro-traços).
- As linhas são **filhas da malha do painel** (`THREE.Line` dentro do
  `Mesh`): qualquer transformação do painel (parede, offsets, escala,
  gizmo, `faceFlipped`) arrasta as anotações — critério de aceitação 7.
- Persistência por painel em LocalStorage (SPEC §9).

## 5. Texturas e proveniência de imagens (T004v2 → T011 v3)

### 5.1 Pipeline v3 (digitalizações sem moldura, PD)
- **Fonte documental:** digitalizações retificadas dos seis painéis, sem moldura, publicadas no Wikimedia Commons — Google Arts & Culture / Museu Nacional de Arte Antiga (MNAAT). Todos em domínio público (PD-Art).
- **Geração:** `analysis/build_textures_v3.py` descarrega as PNGs para `assets/images/source-v3/` (gitignorado, 46–77 MB cada), verifica licença e proporções, redimensiona para altura máxima 2048 px (Lanczos), converte a JPEG 90 e guarda em `assets/images/panels/*.jpg`. É reprodutível (`--force` regenera).
- **Cadeia de proveniência:** Google Arts & Culture/MNAAT (via Commons, PD) → redimensionamento determinístico → texturas web.
- **Classificação:** DOCUMENTADO (metadados Commons), MEDIDO (dimensões originais + deltas de proporção). O procedimento é determinístico (o script é a fonte de transformação). O manifesto completo está em `assets/images/panels/manifest.json` (schema `svicente-images-v3`), com `supersedes: svicente-images-v2`; o manifesto v2 foi preservado em `assets/images/panels/manifest-v2.json` (cadeia GIMP).
- **Deltas de proporção:** comparados às dimensões publicadas (SPEC §3) — MEDIDO. Valores: Infante -0,04%, Relíquia -0,26%, Frades -5,27%, Arcebispo -0,10%, Cavaleiros +6,74%, Pescadores -6,27%. Estes deltas resultam do ajuste entre digitalização e rectângulo publicado normativo; a textura estica ligeiramente para caber na geometria do modelo (dimensões publicadas mantêm-se invariantes).
- **Caveat:** a digitalização não declara explicitamente «pré/restauro» recente; as datas do documento continuam: painel de Nuno Gonçalves, séc. XV (dendrocronologia: c. 1445). Os limites de recorte da v2 (moldura corrigida, residual 19 mm) não aplicam à v3 — o artigo científico deve registar ambos os caminhos metodológicos se referido.

### 5.2 Observações sobre a escolha
- Os PNGs sem moldura eliminam a necessidade de correcção de perspectiva manual; com isto, a maioria das proporções casam quase exactamente com as dimensões publicadas. Os restantes 5–7% não justificam deformação da imagem; registam-se como caveat e preserva-se a geometria normativa (SPEC §3).
- Anotações UV são relativas à textura activa — mudar para v3 é apropriado antes de existirem anotações reais do investigador (T010–T011 feito neste momento).

#### 5.3 Histórico: pipeline v2 (preservado)
- Fonte: fotografia de Daniel Villafruela (Wikimedia Commons, 2014-09-17, CC BY-SA 3.0). Recorte, correcção de perspectiva e remoção de molduras (GIMP), por acção do investigador (2026-10-18), sobre a fotografia. Limites de recorte ESTIMADOS (proporção de larguras publicadas). Residual objectivo 19 mm.
- Registo completo no manifesto v2 histórico (não é mais a textura em uso).

## 6. Verificação

- **Testes unitários (CI/Node):** geometria pura — modelo, disposições,
  colocação, arquitetura, anotações — 89 testes (`make check`). A cena
  (Three.js) e a UI (DOM) não são testáveis em Node; a sua verificação
  é visual.
- **Verificação visual local (`make visual-check`):** Playwright +
  Chromium headless com SwiftShader (WebGL por software). Verifica:
  canvas com variação real de pixels; 6 camadas de análise; traço de
  linha cria anotação; texturas com HTTP 200; **as cinco disposições
  renderizam**; porta ao centro gera conflito; remoção de elemento
  limpa. Screenshots em `tmp/` para inspecção humana.
- WebGL não corre em CI — a verificação visual é local por decisão
  registada (não é CI-blocking).

## 7. Limitações conhecidas (rever antes do artigo)

- Rotação Y manual perdida ao mudar parede/distâncias (semântica da
  parede reorienta para o interior).
- Rotações X/Z não persistidas na UI de propriedades.
- Elementos de arquitetura alinhados à parede, sem beirais/molduras.
- Disposição «personalizada» (edição livre) não implementada.
- O protótipo **não decide** qual a disposição correcta: produz
  métricas de compatibilidade (T007) para o investigador confrontar com
  evidência documental.

## 8. Métricas de análise (T007)

`src/model/analysis.js`; testes com dados sintéticos em
`tests/model/analysis.test.js`. Entradas: traçados do investigador em
UV [0,1] (MEDIDO) + transformação de cada painel (posição, quaternion,
dimensões efectivas).

**Por painel:**

- *Direcção dominante* — média circular das direcções dos traçados,
  módulo 180° (linhas não orientadas), ponderada por comprimento UV;
  dispersão = RMS angular. Duas linhas paralelas → dispersão ~0°;
  ortogonais → >40°.
- *Ponto de fuga aparente* — interseções pareadas das rectas ajustadas
  (TLS, mínimos quadrados totais) dentro de [−2,3]² (fora = ruído);
  centróide + RMS. Com <2 traçados: não calculável (null).

**Por par de painéis vizinhos** (rectângulos a <0,75 m no plano XZ,
corte ESTIMADO):

- *Distância* entre rectângulos no pavimento.
- *Ângulo diedro* entre faces (normais = produto vectorial dos eixos
  mundo; 0° = coplanaridade; 60° = alas adjacentes do hexágono).
- *Continuidade transfronteira* — para cada par de traçados que cruzam
  a aresta comum (extremidade a <3% da largura do painel do lado do
  vizinho): desvio angular agudo e afastamento médio entre as rectas
  3D infinitas (projectado em `uvToWorld` com a transformação real do
  painel). Melhor par = menor desvio angular. Cortes de leitura
  «CONTÍNUA»: ≤5° **e** ≤0,10 m (ESTIMADOS — pontos de corte, não
  verdades).

**Leitura para as hipóteses:** (a) diedro ~0° em todos os pares +
traçados contínuos = compatível com linha contínua (H2-A); (b) diedro
consistente em diedro único com continuidade dentro dele = H2-B; (c)
grupos com continuidade interna mas quebra entre grupos = H2-C; (d)
diedro nenhum explica as linhas = enfraquece o hexágono regular (C da
SPEC §4) a favor de reticulares (H1). Nenhum destes passos conclui —
só restringe o espaço de hipóteses (SPEC §1).

Verificação: `make visual-check` calcula direcção dominante sobre
traçados reais da cena (screenshot `tmp/visual-check-metricas.png`).

## 9. Cenários e persistência (T008)

Um **cenário** é o estado completo da investigação numa dada
experiência: disposição + parâmetros (raio, ângulo), colocação
efectiva de cada painel (parede, offsets, dimensões efectivas, posição
Y, rotação, face virada), anotações do investigador (traçados de linhas
— MEDIDOS), elementos de arquitetura (restrições), visibilidade de
camadas e câmara (SPEC §6.4, §7). Guarda-se no LocalStorage
(`svicente.scenarios.v1`) e exporta-se como JSON.

**Semântica (rigor histórico, SPEC §8):** um cenário guardado é um
EXPERIMENTO (HIPÓTESE) com os MEDIDOS do investigador — nunca uma
reconstrução. Alternar entre cenários é alternar entre experiências,
não entre verdades. A UI marca-o explicitamente.

**Validação na entrada (`parseScenario`):** o JSON importado/carregado
é validado campo a campo, recolhendo TODOS os erros de uma vez
(esquema, versão, nome, disposição, painéis conhecidos, campos
numéricos, UV em [0,1], segmentos não degenerados, elementos,
câmara, camadas). Um cenário inválido nunca é aplicado nem persistido
— o repositório revalida antes de escrever (última linha de defesa).

**Recuperação de corrupção:** JSON ilegível no LocalStorage → lista
vazia + `lastError` legível; guardar um cenário novo recupera o
armazenamento. A câmara é guardada posicionalmente (posição + alvo +
tipo de projecção).

**Cenários predefinidos A–D (SPEC §6.4):** A = linha plana, B = linha
angular, C = hexágono regular (hipótese C da SPEC §4), D = hexágono
irregular. A/B/D abrem para +Z; C fecha. Os seis painéis distribuem-se
por parede round-robin; em A ficam numa só parede, centrados pelo
bloco (largura pintada total + folgas de 0,05 m). Todos predefinidos
carregam `positionY = altura/2` (pé no pavimento) e sem anotações.

**Verificação:** `make visual-check` cobre o roundtrip — guardar
cenário com anotações → recarregar a página → cenário presente →
carregar repõe as contagens de anotações → apagar limpa a lista
(screenshot `tmp/visual-check-cenarios.png`).

## 10. Exportação e reprodutibilidade (T010)

SPEC §9 exige: guardar/carregar projetos JSON, exportar vista 3D,
exportar tabela de medições, exportar anotações por painel, registar
versão + parâmetros e guardar descrição da hipótese. Cada resultado
deve poder ser reproduzido a partir dos dados e parâmetros guardados.

**Saídas (`src/scene/export.js`, sem servidor nem build step):**

- **Vista 3D (PNG):** `canvas.toDataURL('image/png')` da cena renderizada.
- **Tabela de medições (CSV):** uma linha por painel — id, nome,
  dimensões publicadas, posição (X/Y/Z), rotação Y, parede associada,
  deslocamento lateral, distância à parede — mais disposição, raio e
  ângulo da disposição activa.
- **Anotações por painel (JSON):** segmentos UV normalizados
  `[0,1]²` (imunes à escala da textura), schema `svicente-annotations-v1`.
- **Versão + parâmetros (JSON):** versão da aplicação (`APP_VERSION`),
  disposição, raio, ângulo, câmara, descrição da hipótese,
  schema `svicente-params-v1`.
- **Projecto completo (JSON):** bundle com schema `svicente/scenario` v1
  + metadados (app_version, created_at, nota de proveniência). Como usa
  o mesmo schema/versão do cenário, é diretamente re-importável por
  `parseScenario` — o roundtrip export→import preserva as anotações sem
  perda (SPEC §10.10), validado em `tests/scene/export.test.js`.

**Semântica:** cada exportação carrega a nota de proveniência
(`PROVENANCE_NOTE`) e a advertência de que configurações são
EXPERIMENTOS (HIPÓTESE), nunca reconstruções históricas (SPEC §1, §8).

