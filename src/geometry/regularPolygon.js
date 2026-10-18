/**
 * Geometria pura de polígonos regulares em coordenadas métricas.
 *
 * Sistema de coordenadas: eixo Y vertical, plano XZ horizontal
 * (SPEC docs/SPEC.md §4). Sem dependência de Three.js — testável em Node.
 *
 * CONVENÇÃO CRÍTICA (SPEC §4): o parâmetro `radius` é o raio medido do
 * centro à LINHA MÉDIA DAS PAREDES (apotema), não o raio circunscrito
 * aos vértices. Os vértices ficam portanto a `radius / cos(π/n)` do centro.
 */

const TOLERANCE_M = 1e-9;

/**
 * Vértices de um polígono regular. O primeiro vértice parte de `rotation`
 * (radianos, 0 = eixo +X); sentido matemático positivo sobre o plano XZ.
 *
 * @param {{sides?: number, radius?: number, rotation?: number,
 *          center?: {x: number, z: number}}} [opts]
 * @returns {{x: number, z: number}[]} n vértices, em metros.
 */
export function polygonVertices({
  sides = 6,
  radius = 3,
  rotation = 0,
  center = { x: 0, z: 0 },
} = {}) {
  if (!Number.isInteger(sides) || sides < 3) {
    throw new Error(`sides inválido: ${sides} (inteiro >= 3)`);
  }
  if (!(radius > 0)) throw new Error(`radius inválido: ${radius} (> 0)`);
  const vertexRadius = radius / Math.cos(Math.PI / sides);
  const vertices = [];
  for (let i = 0; i < sides; i++) {
    const a = rotation + (2 * Math.PI * i) / sides;
    vertices.push({
      x: center.x + vertexRadius * Math.cos(a),
      z: center.z + vertexRadius * Math.sin(a),
    });
  }
  return vertices;
}

/**
 * Ângulo interior de um polígono regular, em graus.
 * Hexágono regular = 120° (SPEC §4).
 */
export function interiorAngleDeg(sides) {
  if (!Number.isInteger(sides) || sides < 3) {
    throw new Error(`sides inválido: ${sides} (inteiro >= 3)`);
  }
  return ((sides - 2) * 180) / sides;
}

/**
 * Paredes como segmentos entre vértices consecutivos.
 *
 * @param {{x: number, z: number}[]} vertices
 * @returns {{a: object, b: object, midpoint: object, length: number}[]}
 */
export function wallSegments(vertices) {
  const n = vertices.length;
  if (n < 3) throw new Error('precisa de >= 3 vértices');
  const walls = [];
  for (let i = 0; i < n; i++) {
    const a = vertices[i];
    const b = vertices[(i + 1) % n];
    walls.push({
      a,
      b,
      midpoint: { x: (a.x + b.x) / 2, z: (a.z + b.z) / 2 },
      length: Math.hypot(b.x - a.x, b.z - a.z),
    });
  }
  return walls;
}

/**
 * Distância de um ponto ao centro (0,0 por defeito), em metros.
 */
export function distanceToCenter(point, center = { x: 0, z: 0 }) {
  return Math.hypot(point.x - center.x, point.z - center.z);
}

/**
 * Verifica que o centro está a `radius` (apotema) de cada parede —
 * i.e. que o parâmetro radius significa realmente "centro à linha média
 * das paredes". Desvio máximo em metros.
 */
export function apothemDeviation(vertices, radius, center = { x: 0, z: 0 }) {
  const mids = wallSegments(vertices).map((w) => w.midpoint);
  return Math.max(...mids.map((m) => Math.abs(distanceToCenter(m, center) - radius)));
}

export const METRIC_TOLERANCE_M = TOLERANCE_M;
