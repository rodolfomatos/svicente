/**
 * Espaço envolvente: paredes independentes, pavimento, grelha e eixos.
 * Coordenadas métricas, Y vertical (SPEC §4).
 */
import * as THREE from 'three';
import { polygonVertices, wallSegments } from '../geometry/regularPolygon.js';

const WALL_COLOR = 0x737373;
const FLOOR_COLOR = 0x171717;

/**
 * Constrói o espaço a partir da geometria pura (regularPolygon.js).
 *
 * @param {{sides?: number, radius?: number, height?: number}} [opts]
 *   `radius` = apotema (centro à linha média das paredes), SPEC §4.
 */
export function createSpace({ sides = 6, radius = 3, height = 3 } = {}) {
  const group = new THREE.Group();
  group.name = 'space';

  const vertices = polygonVertices({ sides, radius });
  const wallData = wallSegments(vertices);
  const vertexRadius = Math.hypot(vertices[0].x, vertices[0].z);

  // Paredes: planos independentes e editáveis (uma por segmento).
  const wallMeshes = wallData.map((w, i) => {
    const length = w.length;
    const geo = new THREE.PlaneGeometry(length, height);
    const mat = new THREE.MeshBasicMaterial({
      color: WALL_COLOR,
      transparent: true,
      opacity: 0.18,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(w.midpoint.x, height / 2, w.midpoint.z);
    // Alinhar o eixo local X do plano (XY, normal +Z) com o segmento da parede.
    mesh.rotation.y = Math.atan2(-(w.b.z - w.a.z), w.b.x - w.a.x);
    mesh.name = `wall-${i}`;
    mesh.userData = { type: 'wall', wallIndex: i, length, height };
    return mesh;
  });
  wallMeshes.forEach((m) => group.add(m));

  // Pavimento: polígono preenchido no plano XZ.
  const shape = new THREE.Shape(vertices.map((v) => new THREE.Vector2(v.x, -v.z)));
  const floor = new THREE.Mesh(
    new THREE.ShapeGeometry(shape),
    new THREE.MeshBasicMaterial({ color: FLOOR_COLOR, side: THREE.DoubleSide })
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = 0;
  floor.name = 'floor';
  floor.userData = { type: 'floor' };
  group.add(floor);

  // Grelha métrica e eixos.
  const grid = new THREE.GridHelper(vertexRadius * 2.2, 22, 0x404040, 0x262626);
  grid.position.y = 0.002;
  grid.name = 'grid';
  const axes = new THREE.AxesHelper(1.5);
  axes.position.y = 0.004;
  axes.name = 'axes';
  group.add(grid, axes);

  return {
    group,
    wallMeshes,
    floor,
    grid,
    axes,
    metrics: { sides, radius, height, vertexRadius },
  };
}
