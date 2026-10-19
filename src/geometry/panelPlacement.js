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

/**
 * Distribui painéis lado a lado ao longo de paredes, sem sobreposição.
 *
 * Regras:
 * - Disposições fechadas (n paredes === n painéis): um painel por parede,
 *   centrado no ponto médio da parede (lateralOffset = 0).
 * - Disposições abertas (n paredes < n painéis): os painéis são
 *   distribuídos pelas paredes (proporcionalmente, resto nas primeiras),
 *   lado a lado dentro de cada parede, com o bloco centrado no ponto
 *   médio de cada parede.
 *
 * Devolve um array de {wallIndex, lateralOffset} na mesma ordem de
 * `panels`. `lateralOffset` está em metros ao longo da tangente da
 * parede a partir do seu ponto médio (positivo na direção da tangente).
 *
 * Geometria pura, sem Three.js. Testável.
 *
 * @param {ReturnType<typeof frameFromSegment>[]} walls
 * @param {{width: number}[]} panels painéis na ordem de colocação pretendida
 * @returns {{wallIndex: number, lateralOffset: number}[]}
 */
export function distributePanelsAlongWalls(walls, panels) {
  const nPanels = panels.length;
  const nWalls = walls.length;
  const result = new Array(nPanels);

  if (nWalls === nPanels) {
    for (let i = 0; i < nPanels; i++) result[i] = { wallIndex: i, lateralOffset: 0 };
    return result;
  }

  // Quantos painéis por parede (distribuição proporcional, resto nas primeiras paredes).
  const base = Math.floor(nPanels / nWalls);
  const remainder = nPanels % nWalls;

  let panelCursor = 0;
  for (let wi = 0; wi < nWalls; wi++) {
    let count = base + (wi < remainder ? 1 : 0);
    if (count === 0) continue;

    let totalW = 0;
    for (let j = 0; j < count; j++) totalW += panels[panelCursor + j].width;

    // Bloco centrado no ponto médio da parede.
    let cursor = -totalW / 2; // ao longo da tangente a partir do ponto médio
    for (let j = 0; j < count; j++) {
      const p = panels[panelCursor + j];
      result[panelCursor + j] = {
        wallIndex: wi,
        lateralOffset: cursor + p.width / 2,
      };
      cursor += p.width;
    }
    panelCursor += count;
  }
  return result;
}
