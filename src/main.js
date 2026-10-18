/**
 * Ponto de entrada: compõe espaço, painéis e visor; ligeia interface e
 * mantém o estado de colocação de cada painel (SPEC §5).
 *
 * Disposição inicial: um painel por parede, virado para o centro — é uma
 * HIPÓTESE de partida para manipulação (SPEC §1, §5), não uma reconstrução.
 */
import { polygonVertices } from './geometry/regularPolygon.js';
import { wallFrame, placeOnWall } from './geometry/panelPlacement.js';
import {
  nearestWallIndex,
  offsetsFromWall,
  panelTransformFromState,
} from './model/panelState.js';
import { createSpace } from './scene/space.js';
import { createAllPanelViews } from './scene/panelView.js';
import { createViewer } from './scene/viewer.js';
import { createPropertiesPanel } from './ui/propertiesPanel.js';

const $ = (id) => document.getElementById(id);

let space = null;
let vertices = [];

const properties = createPropertiesPanel($('properties'), { onEdit });

const viewer = createViewer($('scene'), {
  onSelect: (obj) => {
    properties.show(obj);
    properties.sync(obj);
  },
  onChange: (obj) => {
    // Gizmo movido: ressincroniza estado de colocação e campos numéricos.
    resyncState(obj);
    properties.sync(obj);
  },
});

/**
 * Estado de colocação de um painel: parede associada, offsets e dimensões
 * efectivas (podem divergir das publicadas — ajuste do investigador).
 */
function initState(mesh) {
  const wallIndex = nearestWallIndex(vertices, mesh.position);
  const { lateralOffset, distanceToWall } = offsetsFromWall(
    vertices,
    wallIndex,
    mesh.position
  );
  mesh.userData.state = {
    wallIndex,
    lateralOffset,
    distanceToWall,
    width: mesh.userData.panel.width,
    height: mesh.userData.panel.height,
    faceFlipped: false,
  };
}

/** Reaplica o estado à malha (posição/orientação via geometria pura). */
function applyState(mesh) {
  const st = mesh.userData.state;
  const t = panelTransformFromState(vertices, st);
  mesh.position.set(t.position.x, t.position.y, t.position.z);
  mesh.rotation.y = t.rotationY;
}

/** Depois de um arrasto do gizmo, recalcula parede e offsets a partir da posição. */
function resyncState(mesh) {
  const st = mesh.userData.state;
  st.wallIndex = nearestWallIndex(vertices, mesh.position);
  const { lateralOffset, distanceToWall } = offsetsFromWall(
    vertices,
    st.wallIndex,
    mesh.position
  );
  st.lateralOffset = lateralOffset;
  st.distanceToWall = distanceToWall;
}

/** Edição numérica no painel de propriedades (SPEC §5.B). */
function onEdit(field, value) {
  const mesh = viewer.selected;
  if (!mesh) return;
  const st = mesh.userData.state;
  switch (field) {
    case 'positionX':
      mesh.position.x = value;
      resyncState(mesh);
      break;
    case 'positionZ':
      mesh.position.z = value;
      resyncState(mesh);
      break;
    case 'positionY':
      mesh.position.y = value; // altura livre (ex.: degrau), mantida até applyState
      break;
    case 'rotationDeg':
      mesh.rotation.y = (value * Math.PI) / 180;
      break;
    case 'width':
    case 'height':
      st[field] = value; // ajuste do investigador (HIPÓTESE)
      applyState(mesh);
      break;
    case 'distanceToWall':
      st.distanceToWall = value;
      applyState(mesh);
      break;
    case 'wallIndex':
      st.wallIndex = value;
      applyState(mesh);
      break;
    case 'faceFlipped':
      st.faceFlipped = value === 1;
      applyState(mesh);
      break;
    default:
      return;
  }
  properties.sync(mesh);
}

function buildScene(radiusM) {
  if (space) viewer.scene.remove(space.group);
  space = createSpace({ sides: 6, radius: radiusM, height: 3 });
  viewer.scene.add(space.group);

  vertices = polygonVertices({ sides: 6, radius: radiusM });
  createAllPanelViews().forEach((mesh, i) => {
    const frame = wallFrame(vertices, i);
    const { position, rotationY } = placeOnWall({
      frame,
      panelWidth: mesh.userData.panel.width,
      panelHeight: mesh.userData.panel.height,
      distanceToWall: 0.05, // folga mínima entre painel e parede
    });
    mesh.position.set(position.x, position.y, position.z);
    mesh.rotation.y = rotationY;
    viewer.scene.add(mesh);
    initState(mesh);
  });
  toggleLayers();
}

// --- Barra de ferramentas (SPEC §5.A) ---
$('radius-input').addEventListener('change', (e) => {
  const v = Number(e.target.value);
  if (Number.isFinite(v) && v >= 0.5) buildScene(v);
  else e.target.value = space.metrics.radius;
});

$('view-frontal').addEventListener('click', () => viewer.setView('frontal'));
$('view-superior').addEventListener('click', () => viewer.setView('superior'));
$('view-lateral').addEventListener('click', () => viewer.setView('lateral'));
$('view-centro').addEventListener('click', () => viewer.setView('centro'));

$('toggle-proj').addEventListener('click', (e) => {
  const toOrtho = e.currentTarget.getAttribute('aria-pressed') !== 'true';
  viewer.setOrthographic(toOrtho);
  e.currentTarget.setAttribute('aria-pressed', String(toOrtho));
  e.currentTarget.textContent = toOrtho ? 'Perspectiva' : 'Ortográfica';
});

function toggleLayers() {
  space.wallMeshes.forEach((m) => {
    m.visible = $('show-walls').checked;
  });
  space.floor.visible = $('show-floor').checked;
  space.grid.visible = $('show-grid').checked;
  space.axes.visible = $('show-axes').checked;
}
['show-walls', 'show-floor', 'show-grid', 'show-axes'].forEach((id) =>
  $(id).addEventListener('change', toggleLayers)
);

// --- Arranque ---
buildScene(3);
