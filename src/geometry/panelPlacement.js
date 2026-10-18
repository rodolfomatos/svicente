/**
 * Colocação de painéis sobre paredes — geometria pura, sem Three.js.
 *
 * Um painel é um plano vertical de pé no pavimento (base em Y=0),
 * posicionado ao longo de uma parede e orientado para o interior do
 * espaço. NÃO presume que um painel ocupa uma parede inteira (SPEC §4):
 * `lateralOffset` permite deslocá-lo ao longo da parede.
 */

/**
 * Enquadramento de um segmento de parede: extremidades, ponto médio e
 * normal interior unitária (do segmento para um ponto interior dado).
 *
 * @param {{x:number,z:number}} a
 * @param {{x:number,z:number}} b
 * @param {{x: number, z: number}} interior ponto para o qual a face aponta
 */
export function frameFromSegment(a, b, interior) {
  const midpoint = { x: (a.x + b.x) / 2, z: (a.z + b.z) / 2 };
  const dx = interior.x - midpoint.x;
  const dz = interior.z - midpoint.z;
  const len = Math.hypot(dx, dz);
  if (len < 1e-12) throw new Error('parede degenerada: ponto médio no interior');
  return { a, b, midpoint, inward: { x: dx / len, z: dz / len } };
}

/**
 * Enquadramento de uma parede: extremidades, ponto médio e normal
 * interior unitária (do centro da parede para o centro do espaço).
 *
 * @param {{x: number, z: number}[]} vertices vértices do polígono
 * @param {number} index índice da parede (vértice `index` → `index+1`)
 * @param {{x: number, z: number}} [center] centro do espaço
 */
export function wallFrame(vertices, index, center = { x: 0, z: 0 }) {
  const n = vertices.length;
  if (!Number.isInteger(index) || index < 0 || index >= n) {
    throw new Error(`índice de parede inválido: ${index} (0..${n - 1})`);
  }
  return frameFromSegment(vertices[index], vertices[(index + 1) % n], center);
}

/**
 * Posição e orientação de um painel de pé sobre a base de uma parede.
 *
 * Convenção: o plano do painelo tem a face pintada virada para o interior
 * (normal aponta para `center`).
 *
 * @param {{
 *   frame: ReturnType<typeof wallFrame>,
 *   panelWidth: number, panelHeight: number,
 *   lateralOffset?: number, distanceToWall?: number,
 * }} params deslocamento lateral ao longo da parede e folga para dentro
 * @returns {{position: {x: number, y: number, z: number}, rotationY: number}}
 *   rotação em torno de Y (radianos) que aponta a face para o centro
 */
export function placeOnWall({
  frame,
  panelWidth,
  panelHeight,
  lateralOffset = 0,
  distanceToWall = 0,
}) {
  if (!(panelWidth > 0) || !(panelHeight > 0)) {
    throw new Error('dimensões do painel inválidas (> 0)');
  }
  // Tangente à parede: perpendicular da normal interior, no plano XZ.
  const tangent = { x: -frame.inward.z, z: frame.inward.x };
  const position = {
    x: frame.midpoint.x + tangent.x * lateralOffset + frame.inward.x * distanceToWall,
    y: panelHeight / 2, // base no pavimento (Y=0), SPEC §4
    z: frame.midpoint.z + tangent.z * lateralOffset + frame.inward.z * distanceToWall,
  };
  // Rotação em Y que leva a normal +Z do plano à normal interior.
  const rotationY = Math.atan2(frame.inward.x, frame.inward.z);
  return { position, rotationY };
}
