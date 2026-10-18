/**
 * Testes do modelo de cenários (T008 — SPEC §6.4, §9).
 * Validação na entrada (recolhe TODOS os erros), roundtrip de
 * serialização e cenários predefinidos A–D.
 */
import {
  SCENARIO_SCHEMA,
  SCENARIO_VERSION,
  createDefaultScenarios,
  parseScenario,
  serializeScenario,
} from '../../src/model/scenarios.js';

/** Cenário válido mínimo, construído sobre um predefinido real. */
function validScenario(overrides = {}) {
  const base = createDefaultScenarios()[0]; // A — plana
  return { ...base, ...overrides };
}

describe('serializeScenario', () => {
  test('captura o estado completo (SPEC §6.4: disposição, painéis, anotações, elementos, câmara)', () => {
    const snap = {
      name: 'Teste',
      description: 'desc',
      layout: { id: 'angular', radius: 4, angleDeg: 120 },
      panels: {
        frades: {
          wallIndex: 1,
          lateralOffset: 0.3,
          distanceToWall: 0.05,
          width: 0.642,
          height: 2.072,
          faceFlipped: true,
          positionY: 1.1,
          rotationY: 0.5,
        },
      },
      annotations: { frades: [{ id: 's1', a: { u: 0.1, v: 0.2 }, b: { u: 0.9, v: 0.8 } }] },
      elements: [{ id: 'e1', type: 'porta', wallIndex: 0, lateralOffset: 0 }],
      analysis: { layerVisibility: { frades: false } },
      camera: { position: { x: 0, y: 1, z: 5 }, target: { x: 0, y: 1, z: 0 }, orthographic: false },
    };
    const scn = serializeScenario(snap);
    expect(scn.schema).toBe(SCENARIO_SCHEMA);
    expect(scn.version).toBe(SCENARIO_VERSION);
    expect(scn.layout).toEqual({ id: 'angular', radius: 4, angleDeg: 120 });
    expect(scn.panels.frades.faceFlipped).toBe(true);
    expect(scn.panels.frades.positionY).toBe(1.1);
    expect(scn.annotations.frades).toHaveLength(1);
    expect(scn.elements).toHaveLength(1);
    expect(scn.analysis.layerVisibility).toEqual({ frades: false });
    expect(scn.camera.orthographic).toBe(false);
  });

  test('faz cópia profunda: mutar o snapshot depois não afecta o cenário', () => {
    const annotations = { frades: [{ id: 's1', a: { u: 0.1, v: 0.2 }, b: { u: 0.9, v: 0.8 } }] };
    const snap = {
      name: 'X',
      layout: { id: 'plana', radius: 3, angleDeg: 90 },
      panels: {},
      annotations,
      elements: [],
      analysis: {},
      camera: { position: { x: 0, y: 0, z: 0 }, target: { x: 1, y: 1, z: 1 } },
    };
    const scn = serializeScenario(snap);
    annotations.frades[0].a.u = 0.999;
    snap.camera.position.x = 99;
    expect(scn.annotations.frades[0].a.u).toBe(0.1);
    expect(scn.camera.position.x).toBe(0);
  });

  test('sem câmara → null (SPEC §7: câmara opcional no cenário)', () => {
    const scn = serializeScenario({
      name: 'X',
      layout: { id: 'plana', radius: 3, angleDeg: 90 },
      panels: {},
    });
    expect(scn.camera).toBeNull();
  });
});

describe('parseScenario — validação', () => {
  test('cenário predefinido válido passa e normaliza (nome aparado)', () => {
    const r = parseScenario(validScenario({ name: '  Margem A  ' }));
    expect(r.errors).toEqual([]);
    expect(r.ok).toBe(true);
    expect(r.scenario.name).toBe('Margem A');
    expect(r.scenario.layout.id).toBe('plana');
    expect(Object.keys(r.scenario.panels)).toHaveLength(6);
  });

  test('texto JSON também é aceite', () => {
    const r = parseScenario(JSON.stringify(validScenario()));
    expect(r.ok).toBe(true);
  });

  test('JSON inválido → erro único, sem colapsar', () => {
    const r = parseScenario('{sem json');
    expect(r.ok).toBe(false);
    expect(r.errors[0]).toMatch(/JSON inválido/);
  });

  test('não-objecto → erro', () => {
    for (const input of [null, 42, 'texto plano', [1, 2]]) {
      const r = parseScenario(input);
      expect(r.ok).toBe(false);
      expect(r.errors).toHaveLength(1);
    }
  });

  test('recolhe TODOS os erros de uma vez', () => {
    const bad = {
      schema: 'outro/schema',
      version: SCENARIO_VERSION,
      name: '',
      layout: { id: 'inexistente', radius: 0.1, angleDeg: 'x' },
      panels: {
        frades: { wallIndex: -1, lateralOffset: 'x', distanceToWall: -2, width: 0, height: 0, faceFlipped: 'sim' },
        desconhecido: {},
      },
    };
    const r = parseScenario(bad);
    expect(r.ok).toBe(false);
    expect(r.errors.length).toBeGreaterThanOrEqual(8);
    // Cada erro nomeado é reconhecível na lista.
    for (const frag of ['schema', 'nome vazio', 'disposição desconhecida', 'raio', 'ângulo', 'wallIndex', 'lateralOffset', 'distanceToWall', 'largura', 'altura', 'faceFlipped', 'painel desconhecido']) {
      expect(r.errors.some((e) => e.includes(frag))).toBe(true);
    }
  });

  test('versão futura rejeitada; versão mínima aceite', () => {
    expect(parseScenario(validScenario({ version: SCENARIO_VERSION + 1 })).ok).toBe(false);
    expect(parseScenario(validScenario({ version: 0 })).ok).toBe(false);
  });

  test('anotações fora de [0,1] ou segmento minúsculo rejeitados', () => {
    const seg = (a, b) => ({ frades: [{ id: 's1', a, b }] });
    const outUv = parseScenario(validScenario({ annotations: seg({ u: 1.5, v: 0 }, { u: 0.9, v: 0.9 }) }));
    expect(outUv.ok).toBe(false);
    expect(outUv.errors[0]).toMatch(/fora de \[0,1\]/);
    const tiny = parseScenario(validScenario({ annotations: seg({ u: 0.5, v: 0.5 }, { u: 0.501, v: 0.5 }) }));
    expect(tiny.ok).toBe(false);
    expect(tiny.errors[0]).toMatch(/demasiado curto/);
  });

  test('anotações para painel desconhecido rejeitadas', () => {
    const r = parseScenario(validScenario({ annotations: { extrano: [] } }));
    expect(r.ok).toBe(false);
    expect(r.errors[0]).toMatch(/painel desconhecido/);
  });

  test('elemento inválido (tipo/wallIndex/offset) rejeitado', () => {
    const r = parseScenario(
      validScenario({ elements: [{ id: 'e1', type: 'obelisco', wallIndex: 0, lateralOffset: 0 }] })
    );
    expect(r.ok).toBe(false);
    expect(r.errors[0]).toMatch(/tipo desconhecido/);
    const r2 = parseScenario(
      validScenario({ elements: [{ id: 'e1', type: 'porta', wallIndex: 1.5, lateralOffset: 0 }] })
    );
    expect(r2.ok).toBe(false);
    expect(r2.errors[0]).toMatch(/wallIndex/);
  });

  test('câmara incompleta rejeitada; ausente aceite (null)', () => {
    const r = parseScenario(validScenario({ camera: { position: { x: 0, y: 0, z: 0 } } }));
    expect(r.ok).toBe(false);
    expect(r.errors[0]).toMatch(/target inválido/);
    expect(parseScenario(validScenario({ camera: null })).ok).toBe(true);
  });

  test('layerVisibility de painel desconhecido rejeitado', () => {
    const r = parseScenario(
      validScenario({ analysis: { layerVisibility: { fantasma: true } } })
    );
    expect(r.ok).toBe(false);
    expect(r.errors[0]).toMatch(/camada de painel desconhec/);
  });
});

describe('createDefaultScenarios (SPEC §6.4: A–D)', () => {
  test('quatro cenários, todos válidos, com as disposições certas', () => {
    const defs = createDefaultScenarios();
    expect(defs).toHaveLength(4);
    expect(defs.map((d) => d.layout.id)).toEqual(['plana', 'angular', 'hexagono', 'irregular']);
    for (const d of defs) {
      const r = parseScenario(d);
      expect(r.errors).toEqual([]);
      expect(r.ok).toBe(true);
    }
  });

  test('cada cenário tem os seis painéis com estado válido', () => {
    for (const d of createDefaultScenarios()) {
      const layout = parseScenario(d).scenario;
      expect(Object.keys(layout.panels).sort()).toEqual(
        ['arcebispo', 'cavaleiros', 'frades', 'infante', 'pescadores', 'reliquia'].sort()
      );
      for (const st of Object.values(layout.panels)) {
        expect(Number.isInteger(st.wallIndex)).toBe(true);
        expect(st.wallIndex).toBeGreaterThanOrEqual(0);
        expect(st.width).toBeGreaterThan(0);
        expect(st.height).toBeGreaterThan(0);
        expect(st.positionY).toBeCloseTo(st.height / 2, 6);
      }
    }
  });

  test('hexágono: um painel por parede (round-robin)', () => {
    const c = createDefaultScenarios().find((d) => d.layout.id === 'hexagono');
    const used = Object.values(c.panels).map((st) => st.wallIndex).sort();
    expect(used).toEqual([0, 1, 2, 3, 4, 5]);
  });

  test('plana: todos os painéis na mesma parede, bloco centrado', () => {
    const a = createDefaultScenarios().find((d) => d.layout.id === 'plana');
    const sts = Object.values(a.panels);
    expect(sts.every((st) => st.wallIndex === 0)).toBe(true);
    const offs = sts.map((st) => st.lateralOffset);
    expect(new Set(offs).size).toBe(6);
    // O bloco de painéis + folgas (0,05 m) fica centrado no ponto
    // médio da parede: aresta esquerda em −T/2, direita em +T/2.
    const gap = 0.05;
    const total = sts.reduce((s, st) => s + st.width, 0) + gap * (sts.length - 1);
    const left = Math.min(...sts.map((st) => st.lateralOffset - st.width / 2));
    const right = Math.max(...sts.map((st) => st.lateralOffset + st.width / 2));
    expect(left).toBeCloseTo(-total / 2, 6);
    expect(right).toBeCloseTo(total / 2, 6);
  });

  test('predefinidos sem anotações, elementos e câmara', () => {
    for (const d of createDefaultScenarios()) {
      expect(d.annotations).toEqual({});
      expect(d.elements).toEqual([]);
      expect(d.camera).toBeNull();
    }
  });

  test('roundtrip: serializar → parse → serializar é estável', () => {
    const d = createDefaultScenarios()[2];
    const once = parseScenario(d).scenario;
    const twice = parseScenario(serializeScenario(once)).scenario;
    expect(twice).toEqual(once);
  });
});
