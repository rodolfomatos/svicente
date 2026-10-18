/**
 * Disposições espaciais alternativas (T006 — SPEC §6.2). Geometria pura.
 *
 * Cada disposição produz uma lista de ENQUADRAMENTOS DE PAREDE (frames),
 * já com normal interior calculada — o mesmo contrato do `wallFrame` do
 * hexágono, para que colocação de painéis e elementos de arquitetura não
 * dependam da forma do espaço.
 *
 * PROVENIÊNCIA: todas as disposições não-hexagonais são HIPÓTESE de
 * trabalho para comparação (SPEC §1, §8) — nenhuma é uma reconstrução
 * comprovada da instalação original. O hexágono regular é a hipótese C
 * da SPEC §4.
 */
import { polygonVertices, wallSegments } from '../geometry/regularPolygon.js';
import { frameFromSegment } from '../geometry/panelPlacement.js';

/** Largura pintada total dos seis painéis (m, SPEC §3) + folgas. */
const PAINTED_WIDTH_M = 5.04;
const GAP_M = 0.05;

export const LAYOUTS = Object.freeze([
  Object.freeze({
    id: 'hexagono',
    name: 'Hexágono regular (hipótese C, SPEC §4)',
    closed: true,
    provenance: 'HIPÓTESE',
  }),
  Object.freeze({
    id: 'plana',
    name: 'Linha plana — fundo único (retábulo/trono)',
    closed: false,
    provenance: 'HIPÓTESE',
  }),
  Object.freeze({
    id: 'angular',
    name: 'Angular aberta — 2 alas (H2, sala de corte)',
    closed: false,
    provenance: 'HIPÓTESE',
  }),
  Object.freeze({
    id: 'u',
    name: 'Tribuna em U — 3 alas (H1, estrutura temporária)',
    closed: false,
    provenance: 'HIPÓTESE',
  }),
  Object.freeze({
    id: 'irregular',
    name: 'Hexágono irregular (teste de sensibilidade)',
    closed: true,
    provenance: 'HIPÓTESE',
  }),
]);

export function getLayout(id) {
  const layout = LAYOUTS.find((l) => l.id === id);
  if (!layout) throw new Error(`disposição desconhecida: ${id}`);
  return layout;
}

/**
 * Constrói os frames de parede de uma disposição.
 *
 * @param {string} id identificador da disposição
 * @param {{radius?: number, angleDeg?: number}} [params]
 *   `radius` = apotema no hexágono (convenção SPEC §4);
 *   `angleDeg` = ângulo entre alas na disposição angular.
 * @returns {{id: string, walls: object[], center: {x:number,z:number},
 *            closed: boolean, note: string}}
 */
export function buildLayout(id, { radius = 3, angleDeg = 90 } = {}) {
  const meta = getLayout(id);
  switch (id) {
    case 'hexagono': {
      const vertices = polygonVertices({ sides: 6, radius });
      const walls = wallSegments(vertices).map((s) =>
        frameFromSegment(s.a, s.b, { x: 0, z: 0 })
      );
      return { ...meta, walls, center: { x: 0, z: 0 }, note: '' };
    }
    case 'irregular': {
      // Perturbação determinística do raio de vértice (factores fixos) —
      // teste de sensibilidade à regularidade, NÃO uma medição real.
      const factors = [1.0, 0.85, 1.1, 0.9, 1.05, 0.95];
      const vertexRadius = radius / Math.cos(Math.PI / 6);
      const vertices = factors.map((f, i) => {
        const a = (2 * Math.PI * i) / 6;
        return { x: vertexRadius * f * Math.cos(a), z: vertexRadius * f * Math.sin(a) };
      });
      const walls = wallSegments(vertices).map((s) =>
        frameFromSegment(s.a, s.b, { x: 0, z: 0 })
      );
      return {
        ...meta,
        walls,
        center: { x: 0, z: 0 },
        note: 'Factores de vértice fixos (teste de sensibilidade, não medição).',
      };
    }
    case 'plana': {
      // Parede única; comprimento suficiente para os seis painéis + folgas.
      const half = (PAINTED_WIDTH_M + 5 * GAP_M) / 2 + 0.35;
      const center = { x: 0, z: half + 1 }; // lado da face pintada
      const walls = [frameFromSegment({ x: -half, z: 0 }, { x: half, z: 0 }, center)];
      return {
        ...meta,
        walls,
        center,
        note: 'Comprimento = largura pintada total + folgas + margens (ESTIMADO).',
      };
    }
    case 'angular': {
      const angle = (Math.max(30, Math.min(170, angleDeg)) * Math.PI) / 180;
      const L = PAINTED_WIDTH_M / 2 + 2 * GAP_M + 0.3;
      const a1 = { x: 0, z: 0 };
      const b1 = { x: L, z: 0 };
      const b2 = { x: L * Math.cos(angle), z: L * Math.sin(angle) };
      const center = { x: (L + b2.x) / 3, z: b2.z / 3 };
      const walls = [
        frameFromSegment(a1, b1, center),
        frameFromSegment(a1, b2, center),
      ];
      return {
        ...meta,
        walls,
        center,
        note: `Ângulo entre alas: ${angleDeg}° (parâmetro do investigador).`,
      };
    }
    case 'u': {
      const L = PAINTED_WIDTH_M / 3 + 2 * GAP_M + 0.4;
      const center = { x: L / 2, z: L / 2 };
      const walls = [
        frameFromSegment({ x: 0, z: 0 }, { x: 0, z: L }, center),
        frameFromSegment({ x: 0, z: L }, { x: L, z: L }, center),
        frameFromSegment({ x: L, z: L }, { x: L, z: 0 }, center),
      ];
      return { ...meta, walls, center, note: '' };
    }
    default:
      throw new Error(`disposição não implementada: ${id}`);
  }
}
