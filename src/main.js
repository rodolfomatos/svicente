/**
 * Ponto de entrada: compõe espaço, painéis e visor; liga a interface.
 *
 * Disposição inicial: um painel por parede, virado para o centro — é uma
 * HIPÓTESE de partida para manipulação (SPEC §1, §5), não uma reconstrução.
 */
import { polygonVertices } from './geometry/regularPolygon.js';
import { wallFrame, placeOnWall } from './geometry/panelPlacement.js';
import { createSpace } from './scene/space.js';
import { createAllPanelViews } from './scene/panelView.js';
import { createViewer } from './scene/viewer.js';

const $ = (id) => document.getElementById(id);

const canvas = $('scene');
let space = null;

const viewer = createViewer(canvas, { onSelect: renderProperties });

function buildScene(radiusM) {
  if (space) viewer.scene.remove(space.group);
  space = createSpace({ sides: 6, radius: radiusM, height: 3 });
  viewer.scene.add(space.group);

  const vertices = polygonVertices({ sides: 6, radius: radiusM });
  const views = createAllPanelViews();
  views.forEach((mesh, i) => {
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

// --- Painel de propriedades (leitura; edição numérica em T003) ---
function renderProperties(obj) {
  const fields = $('props-fields');
  const prov = $('props-provenance');
  const hint = document.querySelector('#properties .hint');
  if (!obj || obj.userData.type !== 'panel') {
    fields.hidden = true;
    prov.hidden = true;
    hint.hidden = false;
    return;
  }
  hint.hidden = true;
  fields.hidden = false;
  prov.hidden = false;
  const { panel } = obj.userData;
  const rows = [
    ['Painel', panel.name],
    ['ID', panel.id],
    ['Dimensões', `${panel.width} × ${panel.height} m`],
    ['Posição X', `${obj.position.x.toFixed(3)} m`],
    ['Posição Y', `${obj.position.y.toFixed(3)} m`],
    ['Posição Z', `${obj.position.z.toFixed(3)} m`],
    ['Rotação Y', `${((obj.rotation.y * 180) / Math.PI).toFixed(1)}°`],
    ['Fonte dimensões', panel.source.label],
  ];
  fields.innerHTML = rows.map(([k, v]) => `<dt>${k}</dt><dd>${v}</dd>`).join('');
  prov.textContent = panel.provenance;
}

// --- Arranque ---
buildScene(3);
