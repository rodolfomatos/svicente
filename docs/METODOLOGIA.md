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

## 5. Texturas e proveniência de imagens (T004v2)

- Texturas geradas por `analysis/crop_panels.py` a partir de recortes do
  investigador (GIMP, correção de perspectiva, remoção de molduras,
  2026-10-18), sobre fotografia de Villafruela (2014, CC BY-SA 3.0).
- `assets/images/panels/manifest.json` (v2) regista a cadeia completa:
  fonte → edição do investigador → textura; classificação MEDIDO com
  nota de perspectiva residual (objective 19 mm; deltas de proporção
  0,7–5,0% vs. tabelas publicadas).
- As texturas nunca são deformadas pela aplicação; alterações de
  largura/altura são ajustes explícitos do investigador (HIPÓTESE).

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
