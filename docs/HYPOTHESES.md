# Hipóteses de investigação

Registry de hipóteses do projeto. Classificação obrigatória segundo
SPEC §8. Nenhuma hipótese aqui é facto — são enunciados testáveis com
plano de verificação e estado.

---

## H1 — Painéis destinados a decoração de uma Cortes (estrutura temporária)

- **Classificação:** HIPÓTESE
- **Autor:** investigador (sugestão de conversa, 2026-10-18)
- **Enunciado:** Os seis painéis teriam sido pintados para decorar uma
  estrutura temporária de corte (tenda/tribuna/dossel) associada a uma
  Cortes de Santarém que não chegou a realizar-se, e não (ou não apenas)
  para arquitetura permanente.
- **Evidência a favor:** datação c. 1470–1480 coincide com o reinado de
  D. Afonso V; iconografia processional/coletiva com leitura cenográfica.
- **Evidência contra (conhecida):** hipótese dominante = retábulo da
  capela-mor da Sé de Lisboa (MNAAT); Cortes de Santarém 1451
  **realizou-se** (verificável em fontes sobre Cortes de Afonso V);
  estruturas temporárias exigiriam faces não visíveis pintadas de forma
  diferente; painéis com molduras de uso duradouro.
- **Ponto em aberto documental:** confirmar se existiu convocatória de
  Cortes nos anos 1470 que não se concretizou (não localizado em busca
  inicial 2026-10-18; fonte primária necessária: Documentos de D.
  Afonso V / cancilleria).
- **Teste geométrico no protótipo:**
  1. Se H1 (ou hipótese da Sé) for de estrutura reticular → as linhas do
     pavimento devem ser compatíveis com disposição **plana (A)** ou
     **angular aberta (B)**; desvios angulares entre painéis adjacentes
     perto de 0° (plano) ou consistentes com um único diedro (ângulo B).
  2. Resultado **incompatível com hexágono (C)** enfraqueceria C e
     restringiria o espaço de hipóteses a tipos reticulares — não
     distingue H1 da hipótese da Sé, mas elimina alternativas.
  3. Distinguir H1 vs. Sé requer evidência extra-geométrica (documental,
     arqueologia da moldura, vestígios de montagem).
- **Estado:** aberta — T006 (disposições A/B/U) e T007 (métricas:
  diedros, continuidade transfronteira) concluídos a 2026-10-18; o
  teste geométrico é agora **executável** pelo investigador (traçar
  linhas → «Calcular métricas» em cada disposição). Pendente: executar
  o teste com traçados cuidadosos e verificação documental das Cortes
  (B002).
- **Data:** 2026-10-18

---

## H2 — A arquitetura da localização original restringe a disposição

- **Classificação:** HIPÓTESE
- **Autor:** investigador (pergunta de conversa, 2026-10-18)
- **Enunciado:** portas, janelas, altar, trono ou bancos do espaço original
  determinam onde cada painel pode estar; a linha contínua apresentada no
  museu pode não corresponder à disposição original (os estreitos poderiam
  flanquear um vão de janela, por exemplo).
- **Evidência a favor:** largura pintada total (5,04 m) cabe em qualquer
  parede real — o que a arquitetura decide é onde NÃO pode haver painel;
  os dois painéis grandes juntos (2,56 m) formam exatamente um dossel de
  trono/altar; a distribuição estreito-estreito-grande-grande-estreito-estreito
  é compatível com simetria axial.
- **Evidência contra (conhecida):** hipótese da Sé de Lisboa implicaria muro
  sólido da capela-mor sem obstruções no eixo (a verificar documentalmente);
  a linha contínua é a apresentação do museu, com história própria a
  verificar.
- **Teste geométrico no protótipo:**
  1. Modelar elementos de parede (porta, janela, altar, trono) como
     restrições de ocupação (B004) e verificar sobreposições painel×elemento.
  2. T007: coplanaridade das linhas do pavimento distingue linha contínua
     (A) de grupos separados por vão (C).
  3. C exige que as linhas de um grupo se expliquem sem as do outro.
- **Estado:** B004 concluído no T006 (2026-10-18): elementos porta,
  janela, altar e trono modelados como restrições com dimensões
  ESTIMADAS e validação de sobreposição painel×elemento
  (`src/model/architecture.js`, teste em `tests/model/architecture.test.js`).
  Resultado já legível do teste 1: **janela de peitoril 1,1 m colide
  sempre com painel-de-pé de ~2,07 m** (topo do vão 2,4 m > base do
  painel) — para H2-C (estreitos a flanquear janela), os painéis
  teriam de ser mais curtos ou assentar acima do peitoril; as
  dimensões publicadas não o permitem. Isto enfraquece a variante C
  *tal como formulada*, mantendo-a viva apenas com painéis suspensos
  (fora da convenção painel-de-pé, SPEC §4). T007 concluído a
  2026-10-18: coplanaridade (diedro) e continuidade transfronteira
  entre grupos mensuráveis — o teste 2/3 é executável. Aguarda
  traçados cuidadosos pelo investigador e confronto com fontes
  documentais.
- **Data:** 2026-10-18

---

## Regras do registry

- Novas hipóteses: classificação HIPÓTESE, enunciado testável, evidência
  a favor/contra, teste no protótipo, estado.
- Fechar uma hipótese exige resultado de teste **ou** verificação
  documental; mover para CONFIRMADA/FALSIFICADA/INDETERMINADA com data e
  referência.
- Nada aqui pode ser citado como facto num artigo sem a verificação
  própria (SPEC §1, §10.12).
