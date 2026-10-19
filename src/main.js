/**
 * Ponto de entrada: compõe espaço, painéis, arquitetura e visor; ligeia
 * interface e mantém o estado de colocação de cada painel (SPEC §5).
 *
 * Disposições (T006): hexágono (hipótese C, SPEC §4), linha plana,
 * angular, U e hexágono irregular — todas HIPÓTESE de comparação.
 * Elementos de arquitetura (B004/H2): porta, janela, altar, trono como
 * restrições com dimensões ESTIMADAS.
 * Métricas (T007): direções dominantes, pontos de fuga, diedros,
 * continuidade transfronteira (H1/H2).
 * Cenários (T008): guardar/carregar o estado completo (SPEC §6.4, §7,
 * §9) como EXPERIMENTOS nomeados no LocalStorage + JSON exportável.
 */
import * as THREE from 'three';
import { placeOnWall, distributePanelsAlongWalls } from './geometry/panelPlacement.js';
import { PANELS } from './model/panels.js';
import {
  nearestWallIndex,
  offsetsFromWall,
  panelTransformFromState,
} from './model/panelState.js';
import { buildLayout, LAYOUTS } from './model/layouts.js';
import { createElement, findConflicts } from './model/architecture.js';
import { analyzeLayout } from './model/analysis.js';
import { createAnnotationStore } from './model/annotations.js';
import { createSpace } from './scene/space.js';
import { createAllPanelViews } from './scene/panelView.js';
import { createAnnotationLayer } from './scene/annotationView.js';
import { syncElementViews } from './scene/architectureView.js';
import { createViewer } from './scene/viewer.js';
import { createAnalysisPanel } from './ui/analysisPanel.js';
import { createArchitecturePanel } from './ui/architecturePanel.js';
import { createMetricsPanel } from './ui/metricsPanel.js';
import { createPropertiesPanel } from './ui/propertiesPanel.js';
import { createScenarioPanel } from './ui/scenarioPanel.js';
import { createDefaultScenarios, parseScenario, serializeScenario } from './model/scenarios.js';
import { createScenarioRepository } from './model/storage.js';
import {
  exportImage,
  exportMeasurementsCsv,
  exportAnnotationsJson,
  exportParamsJson,
  exportProjectJson,
  downloadText,
  validateImportJson,
  APP_VERSION,
} from './scene/export.js';

const $ = (id) => document.getElementById(id);

let space = null;
/** Frames de parede da disposição activa (model/layouts.js). */
let walls = [];
/** Disposição activa. */
let layout = buildLayout('hexagono', { radius: 3 });
/** Elementos de arquitetura (B004). */
let elements = [];
let elementSeq = 0;
/** Parâmetros da disposição activa (guardados no cenário, SPEC §6.4). */
const layoutParams = { radius: 3, angleDeg: 90 };

/** Anotações de linhas por painel (coordenadas normalizadas, SPEC §6.1). */
const annotations = createAnnotationStore();
/** @type {Map<string, ReturnType<typeof createAnnotationLayer>>} */
const annotationLayers = new Map();
const layerVisibility = new Map(); // por defeito visível

const properties = createPropertiesPanel($('props-panel'), { onEdit });
const analysis = createAnalysisPanel($('analysis-layers'), {
  onToggle: (panelId, visible) => {
    layerVisibility.set(panelId, visible);
    annotationLayers.get(panelId)?.setVisible(visible);
  },
});
const archPanel = createArchitecturePanel($('architecture'), {
  onAdd: (type, wallIndex, lateralOffset) => {
    elementSeq += 1;
    elements.push({
      ...createElement(type, wallIndex, lateralOffset),
      id: `e${elementSeq}`,
    });
    refreshArchitecture();
  },
  onRemove: (id) => {
    elements = elements.filter((e) => e.id !== id);
    refreshArchitecture();
  },
});

const ALL_PANEL_IDS = [
  'frades',
  'pescadores',
  'infante',
  'arcebispo',
  'cavaleiros',
  'reliquia',
];

/**
 * Dados de mundo + traçados de cada painel para as métricas (T007).
 * Eixos right/up extraídos do quaternion da malha (rotações do gizmo
 * incluídas); largura/altura = dimensões efectivas do estado.
 */
function collectPanelsForAnalysis() {
  const vRight = new THREE.Vector3(1, 0, 0);
  const vUp = new THREE.Vector3(0, 1, 0);
  return viewer.scene.children
    .filter((o) => o.userData?.type === 'panel')
    .map((mesh) => {
      const right = vRight.clone().applyQuaternion(mesh.quaternion);
      const up = vUp.clone().applyQuaternion(mesh.quaternion);
      const st = mesh.userData.state;
      return {
        id: mesh.userData.panel.id,
        origin: { x: mesh.position.x, y: mesh.position.y, z: mesh.position.z },
        right: { x: right.x, y: right.y, z: right.z },
        up: { x: up.x, y: up.y, z: up.z },
        width: st.width,
        height: st.height,
        segments: annotations.list(mesh.userData.panel.id),
      };
    });
}

const metricsPanel = createMetricsPanel($('metrics'), {
  getPanels: collectPanelsForAnalysis,
});

function refreshAnalysis() {
  analysis.renderLines(
    ALL_PANEL_IDS.map((id) => ({ id })),
    (id) => annotations.count(id),
    (id) => layerVisibility.get(id) !== false
  );
}

/** Reconstói vistos de elementos e recalcula conflitos (H2). */
function refreshArchitecture() {
  const container = space.elementGroup;
  syncElementViews(container, elements, walls);
  const panelObjs = viewer.scene.children.filter((o) => o.userData?.type === 'panel');
  archPanel.render(elements);
  archPanel.renderConflicts(
    findConflicts(
      panelObjs.map((m) => ({ id: m.userData.panelId, state: m.userData.state })),
      elements
    )
  );
}

const viewer = createViewer($('scene'), {
  onSelect: (obj) => {
    properties.show(obj);
    properties.sync(obj);
  },
  onChange: (obj) => {
    // Gizmo movido: ressincroniza estado de colocação e campos numéricos.
    resyncState(obj);
    properties.sync(obj);
    if (elements.length) refreshArchitecture(); // conflitos podem mudar
  },
  onDrawPreview: (panelId, a, b) => {
    for (const [id, layer] of annotationLayers) {
      layer.setPreview(
        id === panelId && a && b ? a : null,
        id === panelId && a && b ? b : null
      );
    }
  },
  onDrawSegment: (panelId, a, b) => {
    annotations.addSegment(panelId, a, b);
    annotationLayers.get(panelId)?.setSegments(annotations.list(panelId));
    analysis.updateCounts((id) => annotations.count(id));
    // T007: traçado novo muda direcções dominantes e continuidade.
    metricsPanel.refresh(analyzeLayout(collectPanelsForAnalysis()));
  },
});

/**
 * Estado de colocação de um painel: parede associada, offsets e dimensões
 * efectivas (podem divergir das publicadas — ajuste do investigador).
 */
function initState(mesh) {
  const wallIndex = nearestWallIndex(walls, mesh.position);
  const { lateralOffset, distanceToWall } = offsetsFromWall(
    walls,
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
  if (st.wallIndex >= walls.length) st.wallIndex = walls.length - 1;
  const t = panelTransformFromState(walls, st);
  mesh.position.set(t.position.x, t.position.y, t.position.z);
  mesh.rotation.y = t.rotationY;
  // Dimensões editadas → escala sobre a geometria publicada. Sem isto
  // (bug descoberto no T003), largura/altura alteradas só moviam a malha
  // mas não a redimensionavam. A escala arrasta as anotações-filhas.
  const pub = mesh.userData.panel;
  mesh.scale.set(st.width / pub.width, st.height / pub.height, 1);
}

/** Depois de um arrasto do gizmo, recalcula parede e offsets a partir da posição. */
function resyncState(mesh) {
  const st = mesh.userData.state;
  st.wallIndex = nearestWallIndex(walls, mesh.position);
  const { lateralOffset, distanceToWall } = offsetsFromWall(
    walls,
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
      st.wallIndex = Math.min(value, walls.length - 1);
      applyState(mesh);
      break;
    case 'faceFlipped':
      st.faceFlipped = value === 1;
      applyState(mesh);
      break;
    default:
      return;
  }
  if (elements.length) refreshArchitecture();
  properties.sync(mesh);
}

function buildScene(layoutDef) {
  if (space) viewer.scene.remove(space.group);
  // Remove any existing panel meshes from previous layout build
  for (const mesh of panelMeshes()) {
    // Remove annotation layer group from mesh and dispose via stored layer if present
    viewer.scene.remove(mesh);
  }
  for (const layer of annotationLayers.values()) {
    layer.dispose();
  }
  annotationLayers.clear();
  layout = layoutDef;
  walls = layoutDef.walls;

  const boundsRadius = Math.max(
    ...walls.flatMap((w) => [Math.hypot(w.a.x, w.a.z), Math.hypot(w.b.x, w.b.z)])
  );
  space = createSpace({
    walls,
    height: 3,
    closed: layoutDef.closed,
    boundsRadius,
  });
  viewer.scene.add(space.group);
  // Distribuição dos painéis ao longo das paredes (lado a lado, sem
  // sobreposição). Em disposições fechadas (hexagono/irregular: 6 paredes,
  // 6 painéis) → um por parede centrado; em abertas (plana/angular/u) →
  // lado a lado ao longo das paredes, bloco centrado por parede.
  const placement = distributePanelsAlongWalls(walls, PANELS);
  createAllPanelViews().forEach((mesh, i) => {
    const { wallIndex, lateralOffset } = placement[i];
    const frame = walls[wallIndex];
    const { position, rotationY } = placeOnWall({
      frame,
      panelWidth: mesh.userData.panel.width,
      panelHeight: mesh.userData.panel.height,
      lateralOffset,
      distanceToWall: 0.05, // folga mínima entre painel e parede
    });
    mesh.position.set(position.x, position.y, position.z);
    mesh.rotation.y = rotationY;
    viewer.scene.add(mesh);
    initState(mesh);
    // Camada de linhas filha da malha (acompanha transformações, crit. 7).
    const layer = createAnnotationLayer(mesh);
    layer.setSegments(annotations.list(mesh.userData.panel.id));
    layer.setVisible(layerVisibility.get(mesh.userData.panel.id) !== false);
    annotationLayers.set(mesh.userData.panel.id, layer);
  });
  toggleLayers();
  refreshAnalysis();
  archPanel.setWallCount(walls.length);
  refreshArchitecture();
  // T007: a disposição activa muda diedros e continuidade.
  metricsPanel.refresh(analyzeLayout(collectPanelsForAnalysis()));
}

// --- Barra de ferramentas (SPEC §5.A) ---
const configSelect = $('config-select');
for (const l of LAYOUTS) {
  const opt = document.createElement('option');
  opt.value = l.id;
  opt.textContent = l.name;
  configSelect.append(opt);
}
configSelect.addEventListener('change', () => {
  const radius = Number($('radius-input').value) || 3;
  layoutParams.radius = radius;
  buildScene(buildLayout(configSelect.value, { radius }));
});

$('radius-input').addEventListener('change', (e) => {
  const v = Number(e.target.value);
  if (Number.isFinite(v) && v >= 0.5) {
    layoutParams.radius = v;
    buildScene(buildLayout(layout.id, { radius: v }));
  } else e.target.value = String(layoutParams.radius);
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

// --- Modo de traço de linhas (SPEC §6.1) ---
$('toggle-draw').addEventListener('click', (e) => {
  const toDraw = e.currentTarget.getAttribute('aria-pressed') !== 'true';
  viewer.setDrawMode(toDraw);
  e.currentTarget.setAttribute('aria-pressed', String(toDraw));
  e.currentTarget.textContent = toDraw ? 'Concluir traço' : 'Traçar linhas';
});
// Cancelar traço com Escape (sem guardar o segmento em curso).
window.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && viewer.drawMode) {
    viewer.setDrawMode(false);
    const btn = $('toggle-draw');
    btn.setAttribute('aria-pressed', 'false');
    btn.textContent = 'Traçar linhas';
  }
});

function toggleLayers() {
  space.wallMeshes.forEach((m) => {
    m.visible = $('show-walls').checked;
  });
  if (space.floor) space.floor.visible = $('show-floor').checked;
  space.grid.visible = $('show-grid').checked;
  space.axes.visible = $('show-axes').checked;
}
['show-walls', 'show-floor', 'show-grid', 'show-axes'].forEach((id) =>
  $(id).addEventListener('change', toggleLayers)
);

// --- Cenários (T008 — SPEC §6.4, §7, §9) ---
const scenarioRepository = createScenarioRepository({ storage: window.localStorage });

function panelMeshes() {
  return viewer.scene.children.filter((o) => o.userData?.type === 'panel');
}

/**
 * Captura o estado COMPLETO da investigação: disposição + parâmetros,
 * colocação efectiva de cada painel, anotações (MEDIDOS do
 * investigador), elementos de arquitetura, visibilidade de camadas e
 * câmara (SPEC §7: «a posição da câmara será guardada com o cenário»).
 */
function captureSnapshot(name, description) {
  const panels = {};
  for (const mesh of panelMeshes()) {
    panels[mesh.userData.panel.id] = {
      ...mesh.userData.state,
      positionY: mesh.position.y,
      rotationY: mesh.rotation.y,
    };
  }
  return {
    name,
    description,
    layout: { id: layout.id, ...layoutParams },
    panels,
    annotations: annotations.serialize(),
    elements: elements.map((e) => ({ ...e })),
    analysis: { layerVisibility: Object.fromEntries(layerVisibility) },
    camera: viewer.getCameraState(),
  };
}

/**
 * Aplica um cenário à cena: reconstrói a disposição, repõe estados de
 * colocação, anotações, camadas, elementos e câmara. Alternar de
 * cenário é alternar de EXPERIMENTO — nunca uma «verdade» carregada
 * (SPEC §8).
 */
function applyScenario(scn) {
  configSelect.value = scn.layout.id;
  $('radius-input').value = String(scn.layout.radius);
  layoutParams.radius = scn.layout.radius;
  layoutParams.angleDeg = scn.layout.angleDeg;
  // Anotações ANTES da reconstrução: as camadas criadas por buildScene
  // já nascem com os segmentos carregados.
  annotations.load(scn.annotations ?? {});
  buildScene(
    buildLayout(scn.layout.id, {
      radius: scn.layout.radius,
      angleDeg: scn.layout.angleDeg,
    })
  );
  for (const mesh of panelMeshes()) {
    const st = scn.panels[mesh.userData.panel.id];
    if (!st) continue;
    mesh.userData.state = { ...st };
    applyState(mesh);
    // Altura/rotação livres do investigador (SPEC §5.B) por cima do
    // estado de parede.
    if (st.positionY != null) mesh.position.y = st.positionY;
    if (st.rotationY != null) mesh.rotation.y = st.rotationY;
  }
  layerVisibility.clear();
  for (const [id, v] of Object.entries(scn.analysis?.layerVisibility ?? {})) {
    layerVisibility.set(id, v);
  }
  refreshAnalysis();
  for (const [id, layer] of annotationLayers) {
    layer.setVisible(layerVisibility.get(id) !== false);
  }
  elements = (scn.elements ?? []).map((e) => ({ ...e }));
  // Numeração de elementos continua de onde o cenário ficou (e5 → 6).
  elementSeq = elements.reduce(
    (max, e) => Math.max(max, Number.parseInt(e.id.slice(1), 10) || 0),
    0
  );
  refreshArchitecture();
  if (scn.camera) viewer.setCameraState(scn.camera);
  metricsPanel.refresh(analyzeLayout(collectPanelsForAnalysis()));
  viewer.select(null);
}

createScenarioPanel($('scenarios'), {
  repository: scenarioRepository,
  save: (name, description) =>
    scenarioRepository.save(serializeScenario(captureSnapshot(name, description))),
  load: (id) => {
    const stored = scenarioRepository.get(id);
    if (!stored) return { ok: false, errors: [`cenário «${id}» não encontrado`] };
    const check = parseScenario(stored);
    if (!check.ok) return check;
    applyScenario(check.scenario);
    return { ok: true, scenario: check.scenario };
  },
  remove: (id) => scenarioRepository.remove(id),
  exportJson: (name) =>
    JSON.stringify(serializeScenario(captureSnapshot(name, '')), null, 2),
  importJson: (text) => {
    const check = parseScenario(text);
    if (!check.ok) return check;
    // Importação mantém id/savedAt (upsert) — reimportar actualiza.
    return scenarioRepository.save(check.scenario);
  },
  seedDefaults: () => {
    let count = 0;
    for (const d of createDefaultScenarios()) {
      if (scenarioRepository.save(d).ok) count += 1;
    }
    return { ok: count > 0, count };
  },
});

// --- Exportação (T010) ---
const ts = () =>
  new Date()
    .toISOString()
    .replace(/[:.]/g, '-')
    .slice(0, 13);

function measurementRows() {
  const rows = [];
  for (const mesh of panelMeshes()) {
    const st = mesh.userData.state || {};
    const pub = mesh.userData.panel;
    rows.push({
      panelId: pub.id,
      width: pub.width,
      height: pub.height,
      position: { x: mesh.position.x, y: mesh.position.y, z: mesh.position.z },
      rotationY: mesh.rotation.y,
      wallIndex: st.wallIndex ?? 0,
      lateralOffset: st.lateralOffset ?? 0,
      distanceToWall: st.distanceToWall ?? 0,
      state: st,
    });
  }
  return rows;
}

$('export-vista').addEventListener('click', () => {
  exportImage($('scene'), `svicente-vista-${ts()}`);
});

$('export-medicoes').addEventListener('click', () => {
  const rows = measurementRows();
  const csv = exportMeasurementsCsv(rows, {
    layoutId: layout.id,
    radius: layoutParams.radius,
    angleDeg: layoutParams.angleDeg,
  });
  downloadText(
    `svicente-metricas-${ts()}.csv`,
    csv,
    'text/csv;charset=utf-8'
  );
});

$('export-annotacoes').addEventListener('click', () => {
  const json = exportAnnotationsJson(annotations.serialize());
  downloadText(
    `svicente-annotacoes-${ts()}.json`,
    json,
    'application/json'
  );
});

$('export-projeto').addEventListener('click', () => {
  const snap = captureSnapshot('exportação', 'exportação para o artigo científico');
  const json = exportProjectJson(snap, snap.name);
  downloadText(
    `svicente-projeto-${ts()}.json`,
    json,
    'application/json'
  );
});

$('export-parametros').addEventListener('click', () => {
  const snap = captureSnapshot('parâmetros', 'versão + parâmetros da configuração');
  const json = exportParamsJson({
    app_version: APP_VERSION,
    name: snap.name,
    description: snap.description,
    layoutId: snap.layout.id,
    radius: snap.layout.radius,
    angleDeg: snap.layout.angleDeg,
    camera: snap.camera,
  });
  downloadText(
    `svicente-parametros-${ts()}.json`,
    json,
    'application/json'
  );
});

$('import-projeto-btn').addEventListener('click', () => {
  $('import-projeto').click();
});
$('import-projeto').addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (ev) => {
    const check = validateImportJson(ev.target.result);
    if (!check.ok) {
      alert('Importação rejeitada:\n' + check.errors.join('\n'));
      return;
    }
    const parsed = parseScenario(check.scenario);
    if (!parsed.ok) {
      alert('Esquema inválido:\n' + parsed.errors.join('\n'));
      return;
    }
    applyScenario(parsed.scenario);
    alert('Projeto importado com sucesso.');
  };
  reader.readAsText(file);
});

// --- Arranque ---
configSelect.value = 'hexagono';
buildScene(layout);
