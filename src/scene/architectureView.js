/**
 * Vista 3D dos elementos de arquitetura (B004).
 *
 * Representação ESQUEMÁTICA, não reconstrução: portas/janelas como vãos
 * marcados na parede, altar/trono como volumes simples. A geometria real
 * do elemento original é desconhecida (HIPÓTESE, SPEC §8).
 */
import * as THREE from 'three';
import { ELEMENT_TYPES, elementMetrics } from '../model/architecture.js';

const COLORS = {
  porta: 0x8a5a2b,
  janela: 0x6aaed6,
  altar: 0xbfbfbf,
  trono: 0x9c7a3c,
};

/**
 * @param {object} el elemento (model/architecture.js)
 * @param {object} frame enquadramento da parede {a, b, midpoint, inward}
 */
export function createElementView(el, frame) {
  const type = ELEMENT_TYPES[el.type];
  const m = elementMetrics(el);
  const group = new THREE.Group();
  group.name = `element-${el.id}`;
  group.userData = { type: 'element', elementId: el.id, element: el };

  // Tangente à parede (mesma convenção de panelState).
  const tangent = { x: -frame.inward.z, z: frame.inward.x };

  if (type.occupiesFloor) {
    // Volume (altar/trono) encostado à parede, a meio da largura.
    const geo = new THREE.BoxGeometry(m.width, m.height, m.depth);
    const mat = new THREE.MeshBasicMaterial({
      color: COLORS[el.type],
      transparent: true,
      opacity: 0.55,
    });
    const box = new THREE.Mesh(geo, mat);
    const cx =
      frame.midpoint.x + tangent.x * el.lateralOffset + frame.inward.x * (m.depth / 2);
    const cz =
      frame.midpoint.z + tangent.z * el.lateralOffset + frame.inward.z * (m.depth / 2);
    box.position.set(cx, m.sill + m.height / 2, cz);
    // Alinhar a caixa com a orientação da parede.
    box.rotation.y = Math.atan2(frame.inward.x, frame.inward.z);
    group.add(box);
  } else {
    // Vão (porta/janela): retânculo ligeiramente à frente da parede.
    const geo = new THREE.PlaneGeometry(m.width, m.height);
    const mat = new THREE.MeshBasicMaterial({
      color: COLORS[el.type],
      transparent: true,
      opacity: 0.7,
      side: THREE.DoubleSide,
    });
    const rect = new THREE.Mesh(geo, mat);
    const cx = frame.midpoint.x + tangent.x * el.lateralOffset + frame.inward.x * 0.02;
    const cz = frame.midpoint.z + tangent.z * el.lateralOffset + frame.inward.z * 0.02;
    rect.position.set(cx, m.sill + m.height / 2, cz);
    rect.rotation.y = Math.atan2(frame.inward.x, frame.inward.z);
    group.add(rect);
  }
  return group;
}

/**
 * Sincroniza o grupo de elementos com a lista actual.
 *
 * @param {THREE.Group} container grupo que contém os elementos
 * @param {object[]} elements lista actual
 * @param {object[]} walls frames das paredes do layout activo
 */
export function syncElementViews(container, elements, walls) {
  for (const child of [...container.children]) {
    child.traverse((o) => {
      o.geometry?.dispose();
      if (o.material) o.material.dispose();
    });
    container.remove(child);
  }
  for (const el of elements) {
    const frame = walls[el.wallIndex];
    if (frame) container.add(createElementView(el, frame));
  }
}
