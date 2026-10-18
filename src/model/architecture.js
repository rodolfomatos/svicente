/**
 * Elementos de arquitetura plausível como restrições de parede (B004, H2).
 *
 * Portas, janelas, altar e trono ocupam espaço onde um painel não pode
 * estar. TUDO AQUI É HIPÓTESE/ESTIMADO: dimensões típicas de arquitetura
 * quinhentista portuguesa para teste de compatibilidade — NÃO medições
 * da localização original (SPEC §8).
 *
 * Modelo: cada elemento fica associado a uma parede (índice) e a um
 * deslocamento lateral ao longo dela (mesma convenção dos painéis).
 * Sobreposições são calculadas em coordenadas de parede (intervalo
 * lateral) + intervalo vertical — geometria pura, testável.
 */
import { PROVENANCE } from './panels.js';

/**
 * Dimensões por tipo (metros). ESTIMADO — ordens de grandeza típicas.
 */
export const ELEMENT_TYPES = Object.freeze({
  porta: Object.freeze({
    id: 'porta',
    name: 'Porta',
    width: 1.1,
    height: 2.1,
    sill: 0, // base no pavimento
    occupiesFloor: false, // vão na parede
    provenance: PROVENANCE.ESTIMADO,
    note: 'Vão de porta típico (ESTIMADO, ordem de grandeza quinhentista).',
  }),
  janela: Object.freeze({
    id: 'janela',
    name: 'Janela',
    width: 0.9,
    height: 1.3,
    sill: 1.1, // peitoril
    occupiesFloor: false,
    provenance: PROVENANCE.ESTIMADO,
    note: 'Vão com peitoril (ESTIMADO) — testa a hipótese dos estreitos a flanquear janelas.',
  }),
  altar: Object.freeze({
    id: 'altar',
    name: 'Altar',
    width: 1.4,
    height: 0.95,
    depth: 0.8, // protrusão para dentro do espaço
    sill: 0,
    occupiesFloor: true,
    provenance: PROVENANCE.ESTIMADO,
    note: 'Bloco de altar (ESTIMADO) — exige painéis livres na sua face.',
  }),
  trono: Object.freeze({
    id: 'trono',
    name: 'Trono/dossel',
    width: 1.2,
    height: 2.2,
    depth: 0.7,
    sill: 0,
    occupiesFloor: true,
    provenance: PROVENANCE.ESTIMADO,
    note: 'Assento com dossel (ESTIMADO) — os dois painéis grandes funcionariam como fundo.',
  }),
});

let seq = 0;

/**
 * Cria um elemento colocado numa parede.
 *
 * @param {string} typeKey porta|janela|altar|trono
 * @param {number} wallIndex índice da parede do layout activo
 * @param {number} lateralOffset deslocamento ao longo da parede (m, centro do elemento)
 */
export function createElement(typeKey, wallIndex, lateralOffset = 0) {
  const type = ELEMENT_TYPES[typeKey];
  if (!type) throw new Error(`tipo de elemento desconhecido: ${typeKey}`);
  seq += 1;
  return {
    id: `e${seq}`,
    type: typeKey,
    wallIndex,
    lateralOffset,
  };
}

/** Dimensões efectivas de um elemento (com defaults do tipo). */
export function elementMetrics(el) {
  const type = ELEMENT_TYPES[el.type];
  return {
    width: el.width ?? type.width,
    height: el.height ?? type.height,
    sill: el.sill ?? type.sill,
    depth: el.depth ?? type.depth,
  };
}

/**
 * Extensão de um elemento em coordenadas de parede:
 * intervalo lateral [u0,u1] (a partir do ponto médio da parede) e
 * intervalo vertical [y0,y1] a partir do pavimento.
 */
export function elementExtent(el) {
  const { width, height, sill } = elementMetrics(el);
  return {
    u0: el.lateralOffset - width / 2,
    u1: el.lateralOffset + width / 2,
    y0: sill,
    y1: sill + height,
  };
}

/**
 * Extensão de um painel em coordenadas da sua parede associada.
 * Convenção painel-de-pé (SPEC §4): base em Y=0, altura = `height`.
 */
export function panelExtent(state) {
  return {
    u0: state.lateralOffset - state.width / 2,
    u1: state.lateralOffset + state.width / 2,
    y0: state.positionY ?? 0,
    y1: (state.positionY ?? 0) + state.height,
  };
}

/**
 * Sobreposição de dois intervalos 1D (abertos, tolerância 1e-9).
 */
function intervalsOverlap(a0, a1, b0, b1) {
  return a0 < b1 - 1e-9 && b0 < a1 - 1e-9;
}

/**
 * Conflito painel × elemento na mesma parede.
 *
 * Regras:
 * - Vão (porta/janela): colisão se os intervalos laterais E verticais
 *   sobrepõem — a janela alta (peitoril 1.1 + altura 1.3 → topo 2.4)
 *   colide com painéis de ~2.07 m; uma faixa de painel por baixo do
 *   peitoril seria necessária (não existe no políptico).
 * - Elemento de pavimento (altar/trono): o painel não pode ocupar o
 *   espaço do volume — colisão se os intervalos laterais sobrepõem e o
 *   painel está a menos de `depth` da parede (estaria dentro do objeto).
 *
 * @returns {{conflict: boolean, reason?: string}}
 */
export function conflictPanelElement(state, el) {
  if (el.wallIndex !== state.wallIndex) return { conflict: false };
  const type = ELEMENT_TYPES[el.type];
  const e = elementExtent(el);
  const p = panelExtent(state);
  const lateral = intervalsOverlap(p.u0, p.u1, e.u0, e.u1);
  if (!type.occupiesFloor) {
    const vertical = intervalsOverlap(p.y0, p.y1, e.y0, e.y1);
    return lateral && vertical
      ? {
          conflict: true,
          reason: `vão de ${type.name.toLowerCase()} sobrepõe o painel`,
        }
      : { conflict: false };
  }
  const depth = elementMetrics(el).depth;
  const inFront = state.distanceToWall < depth + state.height * 0.02;
  return lateral && inFront
    ? {
        conflict: true,
        reason: `${type.name.toLowerCase()} ocupa o pavimento à frente do painel`,
      }
    : { conflict: false };
}

/**
 * Varre todos os painéis × elementos e devolve os conflitos.
 *
 * @param {Array<{id: string, state: object}>} panels
 * @param {Array} elements
 * @returns {Array<{panelId: string, elementId: string, reason: string}>}
 */
export function findConflicts(panels, elements) {
  const out = [];
  for (const { id, state } of panels) {
    for (const el of elements) {
      if (el.wallIndex !== state.wallIndex) continue;
      const { conflict, reason } = conflictPanelElement(state, el);
      if (conflict) out.push({ panelId: id, elementId: el.id, reason });
    }
  }
  return out;
}
