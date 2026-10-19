import {
  exportMeasurementsCsv,
  exportAnnotationsJson,
  exportParamsJson,
  exportProjectJson,
  validateImportJson,
  APP_VERSION,
} from '../../src/scene/export.js';
import { parseScenario } from '../../src/model/scenarios.js';

const panels = [
  {
    panelId: 'frades',
    width: 0.642,
    height: 2.072,
    position: { x: 1.0, y: 1.036, z: 0.05 },
    rotationY: 0.5,
    wallIndex: 0,
    lateralOffset: -1.2,
    distanceToWall: 0.05,
  },
  {
    panelId: 'infante',
    width: 1.28,
    height: 2.064,
    position: { x: 2.5, y: 1.032, z: 0.05 },
    rotationY: 0.5,
    wallIndex: 0,
    lateralOffset: 0,
    distanceToWall: 0.05,
  },
];

test('APP_VERSION exportada', () => {
  expect(APP_VERSION).toBe('0.1.0');
});

test('exportMeasurementsCsv: cabeçalho + uma linha por painel', () => {
  const csv = exportMeasurementsCsv(panels, {
    layoutId: 'plana',
    radius: 3,
    angleDeg: null,
  });
  const lines = csv.split('\n');
  expect(lines[0]).toContain('painel_id');
  expect(lines[0]).toContain('largura_publicada_m');
  expect(lines).toHaveLength(panels.length + 2); // header + 2 rows + trailing newline
  expect(lines[1]).toContain('frades');
  expect(lines[1]).toContain('0.6420');
  expect(lines[2]).toContain('infante');
  expect(lines[2]).toContain('plana');
  expect(lines[2]).toContain('3.0000');
});

test('exportAnnotationsJson: schema + segmentos por painel', () => {
  const byPanel = {
    frades: [
      { id: 's1', a: { u: 0.1, v: 0.2 }, b: { u: 0.4, v: 0.2 } },
    ],
    reliquia: [],
  };
  const json = exportAnnotationsJson(byPanel);
  const obj = JSON.parse(json);
  expect(obj.schema).toBe('svicente-annotations-v1');
  expect(obj.app_version).toBe(APP_VERSION);
  expect(obj.panels.frades).toHaveLength(1);
  expect(obj.panels.frades[0].a).toEqual({ u: 0.1, v: 0.2 });
  expect(obj.panels.reliquia).toEqual([]);
  expect(obj.note).toContain('EXPERIMENTOS');
});

test('exportParamsJson: versão + parâmetros da configuração', () => {
  const json = exportParamsJson({
    app_version: APP_VERSION,
    name: 'cenário-teste',
    description: 'hipótese C',
    layoutId: 'hexagono',
    radius: 2.7,
    angleDeg: null,
    camera: { type: 'perspective', position: { x: 0, y: 2, z: 5 } },
  });
  const obj = JSON.parse(json);
  expect(obj.schema).toBe('svicente-params-v1');
  expect(obj.app_version).toBe('0.1.0');
  expect(obj.layout.radius).toBe(2.7);
  expect(obj.camera.type).toBe('perspective');
  expect(obj.note).toContain('HIPÓTESE');
});

test('exportProjectJson: bundle completo com snapshot', () => {
  const snap = {
    name: 'proj',
    description: 'desc',
    layout: { id: 'u', radius: 3, angleDeg: 90 },
    panels: { frades: { wallIndex: 0 } },
    annotations: { frades: [{ id: 's1', a: { u: 0, v: 0 }, b: { u: 1, v: 1 } }] },
    camera: { type: 'orthographic' },
  };
  const json = exportProjectJson(snap, 'proj');
  const obj = JSON.parse(json);
  expect(obj.schema).toBe('svicente/scenario');
  expect(obj.app_version).toBe('0.1.0');
  expect(obj.layout.id).toBe('u');
  expect(obj.annotations.frades).toHaveLength(1);
});

test('validateImportJson: aceita projecto válido', () => {
  const text = JSON.stringify({
    schema: 'svicente/project-v1',
    app_version: '0.1.0',
    panels: {},
    annotations: {},
  });
  const r = validateImportJson(text);
  expect(r.ok).toBe(true);
  expect(r.scenario.panels).toEqual({});
});

test('validateImportJson: rejeita JSON inválido', () => {
  const r = validateImportJson('não é json');
  expect(r.ok).toBe(false);
  expect(r.errors.length).toBeGreaterThan(0);
});

test('validateImportJson: rejeita projecto sem anotações', () => {
  const text = JSON.stringify({ schema: 'svicente/project-v1', panels: {} });
  const r = validateImportJson(text);
  expect(r.ok).toBe(false);
  expect(r.errors.some((e) => e.includes('anotações'))).toBe(true);
});

test('§10.10 roundtrip: exportProjectJson → parseScenario aceita (sem perda de anotações)', () => {
  const snap = {
    name: 'rt',
    description: 'roundtrip',
    layout: { id: 'hexagono', radius: 3, angleDeg: 90 },
    panels: { frades: { wallIndex: 0, lateralOffset: 0, distanceToWall: 0.05, width: 0.642, height: 2.072, faceFlipped: false, positionY: 1.036, rotationY: 0 } },
    annotations: { frades: [{ id: 's1', a: { u: 0.1, v: 0.2 }, b: { u: 0.4, v: 0.2 } }] },
    elements: [],
    analysis: { layerVisibility: {} },
    camera: null,
  };
  const json = exportProjectJson(snap, 'rt');
  const obj = JSON.parse(json);
  expect(obj.schema).toBe('svicente/scenario');
  expect(Number.isInteger(obj.version) && obj.version >= 1).toBe(true);

  const check = validateImportJson(json);
  expect(check.ok).toBe(true);

  const parsed = parseScenario(check.scenario);
  expect(parsed.ok).toBe(true);
  expect(parsed.scenario.annotations.frades).toHaveLength(1);
  expect(parsed.scenario.annotations.frades[0].a).toEqual({ u: 0.1, v: 0.2 });
});
