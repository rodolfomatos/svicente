/**
 * Testes da geometria pura (SPEC §4): hexágono regular em coordenadas
 * métricas, com radius = apotema (centro à linha média das paredes).
 */
import {
  polygonVertices,
  interiorAngleDeg,
  wallSegments,
  distanceToCenter,
  apothemDeviation,
} from '../../src/geometry/regularPolygon.js';

const RADIUS_M = 3; // parâmetro experimental SPEC §4 — não dimensão histórica
const HEX_CIRCUMRADIUS_M = RADIUS_M / Math.cos(Math.PI / 6); // ≈ 3.4641 m

describe('Hexágono regular (SPEC §4)', () => {
  test('ângulo interior de referência = 120°', () => {
    expect(interiorAngleDeg(6)).toBeCloseTo(120, 9);
  });

  test('seis vértices e seis paredes', () => {
    const v = polygonVertices({ sides: 6, radius: RADIUS_M });
    expect(v).toHaveLength(6);
    expect(wallSegments(v)).toHaveLength(6);
  });

  test('radius = apotema: cada parede está a exactamente 3 m do centro', () => {
    const v = polygonVertices({ sides: 6, radius: RADIUS_M });
    expect(apothemDeviation(v, RADIUS_M)).toBeLessThan(1e-9);
  });

  test('vértices a radius/cos(π/n) do centro (não a radius)', () => {
    const v = polygonVertices({ sides: 6, radius: RADIUS_M });
    for (const p of v) {
      expect(distanceToCenter(p)).toBeCloseTo(HEX_CIRCUMRADIUS_M, 9);
    }
  });

  test('centro geométrico na origem do sistema de coordenadas', () => {
    const v = polygonVertices({ sides: 6, radius: RADIUS_M });
    const cx = v.reduce((s, p) => s + p.x, 0) / 6;
    const cz = v.reduce((s, p) => s + p.z, 0) / 6;
    expect(cx).toBeCloseTo(0, 9);
    expect(cz).toBeCloseTo(0, 9);
  });

  test('rotation desloca o primeiro vértice sobre o plano XZ', () => {
    const v0 = polygonVertices({ sides: 6, radius: RADIUS_M, rotation: 0 })[0];
    const v30 = polygonVertices({
      sides: 6,
      radius: RADIUS_M,
      rotation: Math.PI / 6,
    })[0];
    expect(v0.x).toBeCloseTo(HEX_CIRCUMRADIUS_M, 9);
    expect(v0.z).toBeCloseTo(0, 9);
    expect(v30.x).toBeCloseTo(HEX_CIRCUMRADIUS_M * Math.cos(Math.PI / 6), 9);
    expect(v30.z).toBeCloseTo(HEX_CIRCUMRADIUS_M * Math.sin(Math.PI / 6), 9);
  });

  test('paredes regulares: mesmo comprimento (apothem coerente)', () => {
    const walls = wallSegments(polygonVertices({ sides: 6, radius: RADIUS_M }));
    for (const w of walls) {
      expect(w.length).toBeCloseTo(HEX_CIRCUMRADIUS_M, 9);
    }
  });

  test('centro personalizável (translação métrica)', () => {
    const center = { x: 10, z: -5 };
    const v = polygonVertices({ sides: 6, radius: RADIUS_M, center });
    expect(apothemDeviation(v, RADIUS_M, center)).toBeLessThan(1e-9);
  });
});

describe('Validação de entradas', () => {
  test.each([[2], [1.5], [0]])('sides=%s rejeitado', (sides) => {
    expect(() => polygonVertices({ sides })).toThrow(/sides/);
    expect(() => interiorAngleDeg(sides)).toThrow(/sides/);
  });

  test.each([[0], [-3]])('radius=%s rejeitado', (radius) => {
    expect(() => polygonVertices({ radius })).toThrow(/radius/);
  });

  test('wallSegments exige >= 3 vértices', () => {
    expect(() => wallSegments([{ x: 0, z: 0 }, { x: 1, z: 0 }])).toThrow();
  });
});

describe('Polígonos regulares (generalização)', () => {
  test('quadrado: interior 90°, apotema coerente', () => {
    expect(interiorAngleDeg(4)).toBeCloseTo(90, 9);
    const v = polygonVertices({ sides: 4, radius: 2 });
    expect(apothemDeviation(v, 2)).toBeLessThan(1e-9);
  });

  test('triângulo equilátero: interior 60°', () => {
    expect(interiorAngleDeg(3)).toBeCloseTo(60, 9);
    const v = polygonVertices({ sides: 3, radius: 1 });
    expect(apothemDeviation(v, 1)).toBeLessThan(1e-9);
  });
});
