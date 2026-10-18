# Requirements

Fonte normativa: `docs/SPEC.md` (especificação completa). Este ficheiro
resume os requisitos verificáveis; em caso de conflito, SPEC.md prevalece.

## Functional

- R1 — Seis painéis representados individualmente com proporções das dimensões
  publicadas (SPEC §3), editáveis e com fonte associada.
- R2 — Texturas aplicadas a superfícies planas, sem deformação da imagem.
- R3 — Sistema de coordenadas métricas (Y vertical, plano XZ), hexágono regular
  inicial: 6 paredes independentes, 120°, raio 3 m editável, altura
  configurável (SPEC §4).
- R4 — Configurações suportadas: plana, angular aberta, hexágono regular,
  polígono irregular, personalizada; abertura/entrada no hexágono.
- R5 — Interface em três áreas: vista 3D orbital (perspetiva/ortográfica,
  vistas predefinidas, camadas), painel de propriedades com edição numérica,
  painel de análise com toggles independentes (SPEC §5).
- R6 — Anotação de linhas do pavimento sobre as imagens em coordenadas
  normalizadas; anotações acompanham as transformações dos painéis (SPEC §6.1).
- R7 — Ajuste de retas, cálculo de pontos de fuga, comparação de direções e
  desvios angulares entre painéis (SPEC §6.2, §6.3).
- R8 — Cenários nomeados, guardados e comparáveis; alternância sem perda de
  dados (SPEC §6.4).
- R9 — Câmara posicionável e guardada com o cenário; distinção explícita
  entre geometria, orientação pintada, projeção e linhas analíticas (SPEC §7).
- R10 — Classificação de proveniência de cada dado:
  DOCUMENTADO/MEDIDO/ESTIMADO/HIPÓTESE/INTERPRETAÇÃO (SPEC §8).
- R11 — Exportação/importação JSON sem perda; imagem da vista 3D; tabela de
  medições; anotações por painel; versão da aplicação e parâmetros registados
  (SPEC §9).

## Non-Functional

- N1 — Sem framework de interface; módulos ES nativos; lógica geométrica
  pura e testável fora do navegador (Node/Jest e Python/pytest).
- N2 — Persistência inicial em LocalStorage + ficheiros JSON exportáveis.
- N3 — Nenhuma conclusão histórica apresentada como facto; UI distingue
  sempre a proveniência dos dados (SPEC §1, §8, §10.11–10.12).
- N4 — Imagens com metadados: fonte, licença, resolução, transformações.
- N5 — Medições sobre fotografias carregam aviso sobre limitações de
  perspetiva/distorção ótica (SPEC §8).

## Out of Scope (initial phase)

Ver SPEC §11: reconstrução automática do edifício, reconhecimento automático
de figuras, IA para significado dos painéis, iluminação histórica, materiais,
afirmações automáticas sobre localização original.
