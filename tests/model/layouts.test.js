/**
 * Testes das disposições espaciais alternativas (T006 — SPEC §6.2).
 * Todas as disposições são HIPÓTESE de comparação, nunca facto.
 */
import { buildLayout, getLayout, LAYOUTS } from '../../src/model/layouts.js';
import {
  nearestWallIndex,
  offsetsFromWall,
  panelTransformFromState,
} from '../../src/model/panelState.js';

describe('catálogo de disposições', () => {
  test('contém hexágono + as quatro alternativas (SPEC §6.2)', () => {
    const ids = LAYOUTS.map((l) => l.id);
    expect(ids).toEqual(['hexagono', 'plana', 'angular', 'u', 'irregular']);
  });

  test('todas classificadas como HIPÓTESE (SPEC §8)', () => {
    for (const l of LAYOUTS) expect(l.provenance).toBe('HIPÓTESE');
  });

  test('getLayout rejeita id desconhecido', () => {
    expect(() => getLayout('gotica')).toThrow(/desconhecida/);
  });
});

describe('buildLayout', () => {
  test.each(['hexagono', 'plana', 'angular', 'u', 'irregular'])(
    '%s: frames válidos com normal interior unitária',
    (id) => {
      const { walls } = buildLayout(id);
      expect(walls.length).toBeGreaterThanOrEqual(1);
      for (const w of walls) {
        const len = Math.hypot(w.inward.x, w.inward.z);
        expect(len).toBeCloseTo(1, 9);
        expect(Math.hypot(w.b.x - w.a.x, w.b.z - w.a.z)).toBeGreaterThan(0.5);
      }
    }
  );

  test('hexágono: apotema = radius para todas as paredes (convenção SPEC §4)', () => {
    const { walls } = buildLayout('hexagono', { radius: 3 });
    expect(walls).toHaveLength(6);
    for (const w of walls) {
      const d = Math.hypot(w.midpoint.x, w.midpoint.z);
      expect(d).toBeCloseTo(3, 9);
    }
  });

  test('plana: parede única com face virada para o interior', () => {
    const { walls, closed } = buildLayout('plana');
    expect(walls).toHaveLength(1);
    expect(closed).toBe(false);
    expect(walls[0].inward.z).toBeGreaterThan(0); // face para +Z (investigador)
  });

  test('angular: duas alas com interior coerente e ângulo paramétrico', () => {
    const a = buildLayout('angular', { angleDeg: 90 });
    const b = buildLayout('angular', { angleDeg: 120 });
    expect(a.walls).toHaveLength(2);
    expect(b.walls).toHaveLength(2);
    // Interior: ponto comum a ambos os semiplanos das normais.
    for (const w of a.walls) {
      const toCenter = { x: a.center.x - w.midpoint.x, z: a.center.z - w.midpoint.z };
      const dot = toCenter.x * w.inward.x + toCenter.z * w.inward.z;
      expect(dot).toBeGreaterThan(0);
    }
    // Ângulo maior → alas mais abertas → extremidade da 2.ª ala deslocada (cos θ decresce).
    expect(b.walls[1].b.x).toBeLessThan(a.walls[1].b.x - 1e-9);
  });

  test('angular: ângulo é limitado a [30°, 170°] (sem colapso)', () => {
    const clamped = buildLayout('angular', { angleDeg: 500 });
    expect(Number.isFinite(clamped.walls[1].b.x)).toBe(true);
    expect(Number.isFinite(clamped.walls[1].b.z)).toBe(true);
  });

  test('u: três alas, aberto à frente (centro interior)', () => {
    const { walls, center, closed } = buildLayout('u');
    expect(walls).toHaveLength(3);
    expect(closed).toBe(false);
    for (const w of walls) {
      const toCenter = { x: center.x - w.midpoint.x, z: center.z - w.midpoint.z };
      const dot = toCenter.x * w.inward.x + toCenter.z * w.inward.z;
      expect(dot).toBeGreaterThan(0);
    }
  });

  test('irregular: seis paredes com vértices não todos iguais (determinístico)', () => {
    const { walls } = buildLayout('irregular');
    const lengths = walls.map((w) => Math.hypot(w.b.x - w.a.x, w.b.z - w.a.z));
    expect(new Set(lengths.map((l) => l.toFixed(6))).size).toBeGreaterThan(1);
    // Reprodutível: mesma entrada → mesma geometria.
    const again = buildLayout('irregular');
    expect(again.walls.map((w) => w.midpoint)).toEqual(walls.map((w) => w.midpoint));
  });

  test('colocação de painel funciona em qualquer disposição (round-trip)', () => {
    for (const id of LAYOUTS.map((l) => l.id)) {
      const { walls } = buildLayout(id);
      const state = {
        wallIndex: 0,
        lateralOffset: 0.2,
        distanceToWall: 0.05,
        width: 0.6,
        height: 2.07,
      };
      const t = panelTransformFromState(walls, state);
      const back = offsetsFromWall(walls, 0, t.position);
      expect(back.lateralOffset).toBeCloseTo(0.2, 9);
      expect(back.distanceToWall).toBeCloseTo(0.05, 9);
      expect(nearestWallIndex(walls, t.position)).toBe(0);
    }
  });
});
