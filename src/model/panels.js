/**
 * Modelo de dados dos Painéis de São Vicente.
 *
 * Dimensões de referência publicadas (SPEC docs/SPEC.md §3). São
 * REFERÊNCIAS PUBLICADAS — não medições próprias nem prova das dimensões
 * da instalação original. Toda a consumção deste módulo deve preservar
 * a proveniência (`provenance` + `source`) na saída (SPEC §8, R10).
 */

/** Classificações de proveniência (SPEC §8). */
export const PROVENANCE = Object.freeze({
  DOCUMENTADO: 'DOCUMENTADO', // sustentado por uma fonte identificada
  MEDIDO: 'MEDIDO', // obtido através de medição explícita
  ESTIMADO: 'ESTIMADO', // calculado a partir de evidência incompleta
  HIPOTESE: 'HIPÓTESE', // definido para testar uma possibilidade
  INTERPRETACAO: 'INTERPRETAÇÃO', // explicação proposta pelo investigador
});

/** Nota obrigatória ao apresentar as dimensões publicadas (SPEC §3, §8). */
export const PUBLISHED_DIMENSIONS_NOTE =
  'Dimensões de referência publicadas; não são medições próprias nem prova ' +
  'das dimensões da instalação original.';

/** Fonte das dimensões de referência (tabela publicada, via SPEC §3). */
const REFERENCE_SOURCE = Object.freeze({
  label: 'Dimensões de referência publicadas (SPEC v0.1, §3)',
  doc: 'docs/SPEC.md',
});

/**
 * Os seis painéis do políptico (SPEC §3). Identificadores estáveis.
 * Dimensões em metros.
 */
export const PANELS = Object.freeze([
  Object.freeze({
    id: 'frades',
    name: 'Painel dos Frades',
    height: 2.072,
    width: 0.642,
    provenance: PROVENANCE.DOCUMENTADO,
    source: REFERENCE_SOURCE,
    note: PUBLISHED_DIMENSIONS_NOTE,
  }),
  Object.freeze({
    id: 'pescadores',
    name: 'Painel dos Pescadores',
    height: 2.07,
    width: 0.6,
    provenance: PROVENANCE.DOCUMENTADO,
    source: REFERENCE_SOURCE,
    note: PUBLISHED_DIMENSIONS_NOTE,
  }),
  Object.freeze({
    id: 'infante',
    name: 'Painel do Infante',
    height: 2.064,
    width: 1.28,
    provenance: PROVENANCE.DOCUMENTADO,
    source: REFERENCE_SOURCE,
    note: PUBLISHED_DIMENSIONS_NOTE,
  }),
  Object.freeze({
    id: 'arcebispo',
    name: 'Painel do Arcebispo',
    height: 2.06,
    width: 1.283,
    provenance: PROVENANCE.DOCUMENTADO,
    source: REFERENCE_SOURCE,
    note: PUBLISHED_DIMENSIONS_NOTE,
  }),
  Object.freeze({
    id: 'cavaleiros',
    name: 'Painel dos Cavaleiros',
    height: 2.066,
    width: 0.604,
    provenance: PROVENANCE.DOCUMENTADO,
    source: REFERENCE_SOURCE,
    note: PUBLISHED_DIMENSIONS_NOTE,
  }),
  Object.freeze({
    id: 'reliquia',
    name: 'Painel da Relíquia',
    height: 2.065,
    width: 0.631,
    provenance: PROVENANCE.DOCUMENTADO,
    source: REFERENCE_SOURCE,
    note: PUBLISHED_DIMENSIONS_NOTE,
  }),
]);

/** Procura um painel pelo identificador estável. Lança se não existir. */
export function getPanel(id) {
  const panel = PANELS.find((p) => p.id === id);
  if (!panel) throw new Error(`Painel desconhecido: ${id}`);
  return panel;
}
