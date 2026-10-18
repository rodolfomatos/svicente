# Vision

## Problem

Os seis Painéis de São Vicente (Políptico de Afonso II, MNAAT) estão hoje
dispersos e não se sabe com certeza como estavam dispostos espacialmente na
original sala capitolar do Mosteiro da Batalha. As hipóteses de reconstrução
(disposição plana, angular, hexagonal, irregular) não podem ser avaliadas
sistematicamente: não existe ferramenta que permita ao investigador colocar os
painéis em configurações 3D, medir a coerência das linhas do pavimento entre
painéis e comparar hipóteses com critérios geométricos explícitos.

Sem isto, a avaliação fica dependente de impressões visuais — e uma
visualização convincente não é prova histórica.

## Solution

Protótipo web ("Laboratório Espacial 3D") que trata cada configuração como
**hipótese testável**, não como reconstrução:

- Seis painéis como planos texturados com dimensões publicadas e fonte
  explicitada, manipuláveis individualmente (posição, rotação, escala).
- Espaços configuráveis (plano, angular, hexágono regular, polígono
  irregular, personalizado) em coordenadas métricas.
- Camada de análise geométrica: linhas do pavimento sobrepostas às imagens em
  coordenadas normalizadas, pontos de fuga, ângulos e desvios entre painéis.
- Cenários nomeados, guardados e comparáveis, com exportação JSON completa e
  proveniência de cada dado (DOCUMENTADO / MEDIDO / ESTIMADO / HIPÓTESE /
  INTERPRETAÇÃO).

Tecnologias: HTML5/CSS3, JavaScript nativo com módulos ES, Three.js
(OrbitControls, TransformControls), sem framework de interface. Scripts Python
auxiliares para medições/análise quando a lógica beneficiar de testes numéricos
fora do navegador.

## Value

- Permite investigador formular e **falsificar** hipóteses de disposição
  espacial com medições reproduzíveis em vez de intuição.
- Torna visível o que não encaixa (critério 12 da especificação), não só o
  que parece encaixar.
- Base modular reutilizável para futura ferramenta de investigação mais
  ampla.

## Success criteria

Ver `docs/SPEC.md` §10 — os 12 critérios de aceitação do protótipo.
