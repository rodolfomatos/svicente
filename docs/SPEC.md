# Painéis de São Vicente — Laboratório Espacial 3D

## Especificação do protótipo de investigação histórico-artística

**Versão:** 0.1 — âmbito do protótipo
**Objetivo:** investigar a coerência geométrica e visual dos Painéis de São Vicente em diferentes configurações espaciais tridimensionais.

**Fonte:** especificação original fornecida pelo utilizador (exportada de conversa ChatGPT, 2026-10-18).

**Referências documentais:**

- Google Arts & Culture — Painéis de São Vicente: <https://artsandculture.google.com/asset/pain%C3%A9is-de-s%C3%A3o-vicente/WAG9YcHHiWiS-g>
- Modernismo.pt — Almada no Mosteiro da Batalha: <https://modernismo.pt/index.php/almada-no-mosteiro-da-batalha>
- Wikimedia Commons — Políptico de São Vicente (imagem frontal): <https://commons.wikimedia.org/wiki/File:Lisboa-Museu_Nacional_de_Arte_Antiga-Pol%C3%ADptico_de_S%C3%A3o_Vicente-20140917.jpg>

---

## 1. Princípio fundamental

A aplicação deverá permitir testar hipóteses sobre a disposição espacial original dos seis Painéis de São Vicente, sem assumir antecipadamente qual seria a configuração correta.

O modelo tridimensional deverá ser uma ferramenta de investigação, não uma reconstrução histórica apresentada como facto.

Todos os elementos deverão distinguir explicitamente:

- Dados documentados.
- Medições efetuadas sobre imagens.
- Parâmetros definidos pelo investigador.
- Hipóteses geométricas.
- Resultados calculados.
- Interpretações ainda não demonstradas.

## 2. Tecnologias

- HTML5 e CSS3.
- JavaScript nativo, com módulos ES.
- Three.js para visualização 3D.
- OrbitControls para navegação orbital.
- TransformControls para manipulação dos painéis.
- SVG ou Canvas 2D para anotações e linhas analíticas, conforme o caso.
- JSON para guardar configurações, medições, anotações e resultados.
- LocalStorage para persistência inicial dos projetos no navegador.

Não utilizar uma framework de interface nesta primeira versão. Manter a aplicação modular, para que a lógica geométrica possa ser posteriormente reutilizada numa ferramenta de investigação mais abrangente.

## 3. Modelo dos painéis

Representar individualmente os seis painéis:

1. Painel dos Frades.
2. Painel dos Pescadores.
3. Painel do Infante.
4. Painel do Arcebispo.
5. Painel dos Cavaleiros.
6. Painel da Relíquia.

Dimensões de referência publicadas:

| Painel | Altura | Largura |
|---|---:|---:|
| Frades | 2,072 m | 0,642 m |
| Pescadores | 2,070 m | 0,600 m |
| Infante | 2,064 m | 1,280 m |
| Arcebispo | 2,060 m | 1,283 m |
| Cavaleiros | 2,066 m | 0,604 m |
| Relíquia | 2,065 m | 0,631 m |

As dimensões deverão ser editáveis e acompanhadas da respetiva fonte. Os valores acima são referências iniciais publicadas, não medições próprias nem prova das dimensões da instalação original.

Cada painel deverá ter:

- Identificador estável.
- Nome histórico.
- Imagem frontal de alta resolução.
- Dimensões físicas.
- Origem e licença da imagem.
- Posição tridimensional.
- Rotação tridimensional.
- Escala controlada, mantendo as proporções por defeito.
- Camada de linhas e pontos analíticos.
- Anotações e observações do investigador.

As imagens devem ser aplicadas como texturas sobre superfícies planas. Não deformar a imagem para a adaptar à geometria do espaço.

## 4. Modelo espacial

Criar um sistema de coordenadas métricas, com o eixo Y vertical e o plano XZ horizontal.

A primeira configuração deverá ser um espaço hexagonal regular:

- Seis paredes.
- Ângulo interior de referência: 120°.
- Raio inicial: 3 metros, medido do centro à linha média das paredes.
- Pavimento horizontal.
- Altura das paredes configurável.
- Centro geométrico na origem do sistema de coordenadas.

O raio de 3 metros é um parâmetro experimental, não uma dimensão histórica conhecida.

As seis paredes deverão ser independentes e editáveis. O utilizador deverá poder alterar o raio, a altura, a orientação e a posição de cada parede, sem obrigar o conjunto a permanecer regular.

Implementar também:

- Disposição plana.
- Disposição angular aberta.
- Espaço hexagonal regular.
- Espaço poligonal irregular.
- Configuração personalizada.

O modelo não deverá presumir que cada painel ocupa uma parede inteira. Uma parede poderá conter um painel, vários painéis ou nenhum.

A configuração hexagonal deverá admitir uma abertura, uma entrada ou uma zona de observação, quando necessário.

## 5. Interface de investigação

A interface deverá ser organizada em três áreas:

### A. Vista 3D principal

- Câmara orbital livre.
- Rotação, translação e zoom.
- Seleção de painéis.
- Manipulação dos painéis e paredes.
- Alternância entre perspetiva e projeção ortográfica.
- Vistas predefinidas: frontal, superior, lateral e centro do espaço.
- Mostrar ou ocultar paredes, pavimento, grelha e eixos.
- Mostrar ou ocultar cada camada analítica.

### B. Painel de propriedades

Ao selecionar um painel, permitir editar:

- Posição X, Y e Z.
- Rotação em torno dos três eixos.
- Largura e altura.
- Distância à parede.
- Parede associada.
- Orientação da face pintada.
- Visibilidade.
- Estado e proveniência dos dados.

As transformações deverão poder ser introduzidas numericamente, para permitir experiências reproduzíveis.

### C. Painel de análise

Permitir selecionar as linhas, os pontos, as medições e as hipóteses que se pretende visualizar.

Cada elemento deverá poder ser ativado ou desativado independentemente.

## 6. Sistema de análise geométrica

### 6.1. Linhas do pavimento

Esta é a prioridade analítica inicial.

O investigador deverá poder marcar sobre cada imagem:

- Segmentos de linhas visíveis nos ladrilhos.
- Interseções.
- Direções dominantes.
- Pontos de fuga estimados.
- Limites dos planos do pavimento.
- Pontos de referência partilhados entre painéis.

As linhas deverão ser armazenadas em coordenadas normalizadas da imagem, de modo a não depender da resolução do ficheiro.

Quando os painéis forem movimentados no espaço 3D, as anotações deverão acompanhar as respetivas superfícies.

### 6.2. Linhas de perspetiva

O sistema deverá permitir:

- Ajustar retas a conjuntos de pontos selecionados.
- Calcular interseções e pontos de fuga.
- Representar linhas projetadas na imagem.
- Projetar essas linhas na geometria tridimensional.
- Comparar direções entre painéis.
- Medir desvios angulares.
- Assinalar linhas incompatíveis com uma hipótese geométrica.

Não assumir que todas as linhas convergem para um único ponto. As linhas podem representar direções diferentes, pertencer a planos distintos ou não corresponder a uma construção perspetiva rigorosa.

### 6.3. Continuidade entre painéis

O investigador deverá poder escolher uma linha num painel e compará-la com uma linha de outro painel.

O sistema deverá apresentar:

- Ângulo entre as direções.
- Distância entre os pontos de ligação propostos.
- Diferença de orientação.
- Continuidade visual na vista selecionada.
- Erro geométrico estimado.

Uma linha que pareça contínua numa projeção não deverá ser automaticamente considerada contínua no espaço tridimensional.

### 6.4. Comparação de configurações

Criar uma função para guardar e comparar cenários com nomes próprios.

Exemplos:

- A — Disposição plana.
- B — Disposição angular.
- C — Hexágono regular.
- D — Hexágono irregular.

Cada cenário deverá guardar a posição dos painéis, a geometria do espaço, as anotações relevantes e os parâmetros de análise.

A comparação deverá permitir alternar rapidamente entre cenários sem perder os dados ou as medições.

## 7. Câmara e condições de observação

A aplicação deverá permitir colocar a câmara:

- No centro geométrico.
- Junto a uma entrada hipotética.
- Diante de um painel.
- Em qualquer posição definida pelo investigador.

A posição da câmara deverá ser guardada com o cenário.

Implementar uma opção de comparação entre perspetiva e projeção ortográfica. A projeção ortográfica ajuda a comparar alinhamentos sem os efeitos de escala da perspetiva, mas não deverá ser confundida com a experiência visual real de um observador.

A ferramenta deverá distinguir:

1. Geometria física do espaço.
2. Orientação das superfícies pintadas.
3. Projeção produzida pela câmara.
4. Linhas analíticas sobrepostas à imagem.

## 8. Proveniência e rigor histórico

Cada dado deverá possuir uma classificação:

- DOCUMENTADO — sustentado por uma fonte identificada.
- MEDIDO — obtido através de medição explícita.
- ESTIMADO — calculado a partir de evidência incompleta.
- HIPÓTESE — definido para testar uma possibilidade.
- INTERPRETAÇÃO — explicação proposta pelo investigador.

As configurações experimentais nunca deverão ser apresentadas como reconstruções históricas comprovadas.

As imagens deverão ter metadados sobre a fonte, licença, resolução e eventuais transformações aplicadas.

As medições feitas sobre fotografias deverão incluir uma nota sobre as limitações da perspetiva fotográfica, da distorção ótica e da resolução disponível.

## 9. Exportação e reprodutibilidade

Permitir:

- Guardar e carregar projetos JSON.
- Exportar uma imagem da vista 3D.
- Exportar uma tabela de medições.
- Exportar as anotações de cada painel.
- Registar a versão da aplicação e os parâmetros utilizados.
- Guardar uma descrição textual da hipótese testada.

Cada resultado deverá poder ser reproduzido a partir dos dados e dos parâmetros guardados.

## 10. Critérios de aceitação

O protótipo será considerado funcional quando:

1. Os seis painéis estiverem representados com proporções corretas.
2. A configuração hexagonal inicial tiver ângulos interiores de 120°.
3. O raio puder ser ajustado e medido em unidades métricas.
4. A câmara puder ser movimentada livremente.
5. Cada painel puder ser reposicionado e rodado individualmente.
6. For possível desenhar linhas sobre as imagens.
7. As linhas e os pontos acompanharem corretamente as transformações dos painéis.
8. For possível comparar pelo menos três configurações espaciais.
9. As medições forem calculadas e apresentadas com unidades.
10. Os dados puderem ser exportados e reimportados sem perda das anotações.
11. A interface distinguir dados documentados de hipóteses.
12. Nenhuma conclusão histórica for inferida apenas a partir de uma visualização aparentemente convincente.

## 11. Fora do âmbito inicial

Não implementar nesta fase:

- Reconstrução automática do edifício original.
- Reconhecimento automático de todas as figuras.
- Inteligência artificial para interpretar o significado dos painéis.
- Simulação histórica da iluminação.
- Reconstrução física dos materiais.
- Afirmações automáticas sobre a localização original.

Estas funcionalidades poderão ser acrescentadas quando existir uma base geométrica e documental suficientemente sólida.

## 12. Resultado esperado

Uma aplicação web que permita ao investigador colocar os Painéis de São Vicente em diferentes configurações espaciais, manipular a sua posição, observar a continuidade das linhas do pavimento e comparar sistematicamente a coerência geométrica de cada hipótese.

O resultado da investigação não será necessariamente a confirmação do hexágono. Poderá ser a identificação de uma configuração mais coerente, a descoberta de novas questões ou a conclusão de que os dados disponíveis não permitem distinguir as hipóteses.

A ferramenta deverá tornar visível não apenas aquilo que parece encaixar, mas também aquilo que não encaixa.
