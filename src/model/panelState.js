/**
 * Estado de colocação de um painel e sincronização com a parede —
 * geometria pura, sem DOM nem Three.js.
 */
import { wallFrame, placeOnWall } from '../geometry/panelPlacement.js';

/**
 * Distância de um ponto a um segmento (plano XZ).
 */
export function distanceToSegment(p, a, b) {
  const abx = b.x - a.x;
  const abz = b.z - a.z;
  const len2 = abx * abx + abz * abz;
  if (len2 < 1e-18) return Math.hypot(p.x - a.x, p.z - a.z);
  let t = ((p.x - a.x) * abx + (p.z - a.z) * abz) / len2;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(p.x - (a.x + t * abx), p.z - (a.z + t * abz));
}

/**
 * Índice da parede mais próxima de uma posição (plano XZ).
 */
export function nearestWallIndex(vertices, position) {
  const n = vertices.length;
  if (n < 3) throw new Error('precisa de >= 3 vértices');
  let best = 0;
  let bestDist = Infinity;
  for (let i = 0; i < n; i++) {
    const d = distanceToSegment(position, vertices[i], vertices[(i + 1) % n]);
    if (d < bestDist) {
      bestDist = d;
      best = i;
    }
  }
  return best;
}

/**
 * Projecta uma posição sobre o enquadramento de uma parede: deslocamento
 * lateral ao longo da parede e distância à face da parede.
 *
 * @returns {{lateralOffset: number, distanceToWall: number}}
 */
export function offsetsFromWall(vertices, index, position) {
  const frame = wallFrame(vertices, index);
  const tangent = { x: -frame.inward.z, z: frame.inward.x };
  const dx = position.x - frame.midpoint.x;
  const dz = position.z - frame.midpoint.z;
  return {
    lateralOffset: dx * tangent.x + dz * tangent.z,
    distanceToWall: dx * frame.inward.x + dz * frame.inward.z,
  };
}

/**
 * Transformação (posição + rotação Y) de um painel a partir do seu estado
 * de colocação. Base no pavimento (Y = altura/2). Se `faceFlipped`, a face
 * pintada fica virada para fora (rotação +π).
 *
 * NOTA: a rotação Y é reaplicada a partir do estado — rotações manuais em Y
 * feitas com o gizmo são perdidas ao mudar de parede/distância (comportamento
 * deliberado: a reorientação para o centro é a semântica da parede).
 * Rotações X/Z do gizmo são preservadas.
 *
 * @param {{x: number, z: number}[]} vertices
 * @param {{wallIndex: number, lateralOffset: number, distanceToWall: number,
 *          width: number, height: number, faceFlipped?: boolean}} state
 */
export function panelTransformFromState(vertices, state) {
  const frame = wallFrame(vertices, state.wallIndex);
  const { position, rotationY } = placeOnWall({
    frame,
    panelWidth: state.width,
    panelHeight: state.height,
    lateralOffset: state.lateralOffset,
    distanceToWall: state.distanceToWall,
  });
  return {
    position,
    rotationY: rotationY + (state.faceFlipped ? Math.PI : 0),
  };
}
