/**
 * Espaço envolvente: paredes independentes, pavimento, grelha e eixos.
 * Coordenadas métricas, Y vertical (SPEC §4).
 *
 * Aceita QUALQUER disposição via `walls` (frames {a, b, midpoint, inward},
 * T006) — hexágono, linha plana, angular, U. Disposições fechadas têm
 * pavimento poligonal; as abertas mantêm grelha métrica sem contorno.
 */
import * as THREE from 'three';

const WALL_COLOR = 0x737373;
const FLOOR_COLOR = 0x171717;

/**
 * @param {{walls: object[], height?: number, closed?: boolean,
 *          boundsRadius?: number}} params
 *   `walls` = frames de parede (model/layouts.js ou wallFrame);
 *   `boundsRadius` dimensiona a grelha (raio máx. dos vértices ou
 *   extensão do layout aberto).
 */
export function createSpace({
  walls,
  height = 3,
  closed = false,
  boundsRadius = 4,
} = {}) {
  if (!walls?.length) throw new Error('createSpace precisa de walls');
  const group = new THREE.Group();
  group.name = 'space';

  // Paredes: planos independentes e editáveis (uma por segmento).
  const wallMeshes = walls.map((w, i) => {
    const length = Math.hypot(w.b.x - w.a.x, w.b.z - w.a.z);
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

  // Pavimento: polígono preenchido no plano XZ (só disposições fechadas).
  let floor = null;
  if (closed) {
    const shape = new THREE.Shape(walls.map((w) => new THREE.Vector2(w.a.x, -w.a.z)));
    floor = new THREE.Mesh(
      new THREE.ShapeGeometry(shape),
      new THREE.MeshBasicMaterial({ color: FLOOR_COLOR, side: THREE.DoubleSide })
    );
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = 0;
    floor.name = 'floor';
    floor.userData = { type: 'floor' };
    group.add(floor);
  }

  // Grelha métrica e eixos.
  const grid = new THREE.GridHelper(boundsRadius * 2.2, 22, 0x404040, 0x262626);
  grid.position.y = 0.002;
  grid.name = 'grid';
  const axes = new THREE.AxesHelper(1.5);
  axes.position.y = 0.004;
  axes.name = 'axes';
  group.add(grid, axes);

  // Grupo de elementos de arquitetura (B004) — vazio, preenchido pela UI.
  const elementGroup = new THREE.Group();
  elementGroup.name = 'elements';
  group.add(elementGroup);

  return {
    group,
    wallMeshes,
    floor,
    grid,
    axes,
    elementGroup,
    metrics: { height, closed, boundsRadius, wallCount: walls.length },
  };
}
