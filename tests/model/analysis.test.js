/**
 * Testes das métricas de análise (T007 — SPEC §7).
 * Dados sintéticos: as métricas devem recuperar geometrias conhecidas.
 */
import {
  analyzeLayout,
  apparentVanishingPoint,
  continuityBetween,
  dihedralDeg,
  dominantDirection,
  fitLineTLS,
  intersectLines,
  pointScatter,
  rectCornersXZ,
  rectDistanceXZ,
  segmentWorld,
  uvToWorld,
} from '../../src/model/analysis.js';

const seg = (u1, v1, u2, v2) => ({ a: { u: u1, v: v1 }, b: { u: u2, v: v2 } });

/** Painel deitado de lado em XZ: origem (0,0,0), largura 1 m em +X, altura 2 m em +Y. */
function flatPanel(id, origin, segments = []) {
  return {
    id,
    origin,
    right: { x: 1, y: 0, z: 0 },
    up: { x: 0, y: 1, z: 0 },
    width: 1,
    height: 2,
    segments,
  };
}

describe('fitLineTLS', () => {
  test('recta exacta: resíduo ~0 e ângulo correcto', () => {
    // Recta v = 2u + 0.3 → ângulo atan(2) ≈ 63.43°
    const f = fitLineTLS([seg(0.1, 0.5, 0.9, 2.1)]);
    expect(f.rms).toBeLessThan(1e-12);
    expect(f.angleDeg).toBeCloseTo((Math.atan(2) * 180) / Math.PI, 6);
    // Todos os pontos satisfazem a equação implícita.
    for (const p of f.points) {
      expect(Math.abs(f.a * p.u + f.b * p.v + f.c)).toBeLessThan(1e-12);
    }
  });

  test('segmento vertical: ângulo 90°', () => {
    const f = fitLineTLS([seg(0.5, 0.1, 0.5, 0.9)]);
    expect(f.angleDeg).toBeCloseTo(90, 6);
  });

  test('menos de 2 pontos → null', () => {
    expect(fitLineTLS([])).toBeNull();
  });
});

describe('intersectLines', () => {
  test('rectas perpendiculares cruzam na origem implícita', () => {
    const p = intersectLines({ a: 1, b: 0, c: 0 }, { a: 0, b: 1, c: 0 });
    expect(p.u).toBeCloseTo(0, 9);
    expect(p.v).toBeCloseTo(0, 9);
  });
  test('rectas paralelas → null', () => {
    expect(intersectLines({ a: 1, b: 0, c: 0 }, { a: 1, b: 0, c: 3 })).toBeNull();
  });
  test('interseccção verificada contra equações originais', () => {
    // u + v − 1 = 0 e u − v = 0 → (0.5, 0.5)
    const p = intersectLines({ a: 1, b: 1, c: -1 }, { a: 1, b: -1, c: 0 });
    expect(p.u).toBeCloseTo(0.5, 9);
    expect(p.v).toBeCloseTo(0.5, 9);
    expect(p.u + p.v - 1).toBeCloseTo(0, 9);
  });
});

describe('pointScatter', () => {
  test('pontos idênticos → RMS 0', () => {
    const s = pointScatter([
      { u: 1, v: 1 },
      { u: 1, v: 1 },
    ]);
    expect(s.rms).toBeCloseTo(0, 12);
    expect(s.u).toBe(1);
  });
  test('vazio → null', () => {
    expect(pointScatter([])).toBeNull();
  });
});

describe('dominantDirection', () => {
  test('duas rectas paralelas → dispersão ~0', () => {
    const d = dominantDirection([seg(0.1, 0.1, 0.9, 0.5), seg(0.1, 0.3, 0.9, 0.7)]);
    expect(d.angleDeg).toBeCloseTo((Math.atan2(0.4, 0.8) * 180) / Math.PI, 6);
    expect(d.spreadDeg).toBeLessThan(1e-6);
  });
  test('ortogonais ponderadas igual → dispersão grande', () => {
    const d = dominantDirection([seg(0, 0.5, 1, 0.5), seg(0.5, 0, 0.5, 1)]);
    expect(d.spreadDeg).toBeGreaterThan(40);
  });
});

describe('apparentVanishingPoint', () => {
  test('duas rectas concorrentes conhecidas', () => {
    // v = u e v = −u + 1 → ponto de fuga em (0.5, 0.5)
    const vp = apparentVanishingPoint([seg(0, 0, 1, 1), seg(0, 1, 1, 0)]);
    expect(vp.u).toBeCloseTo(0.5, 9);
    expect(vp.v).toBeCloseTo(0.5, 9);
  });
  test('menos de 2 traçados → null', () => {
    expect(apparentVanishingPoint([seg(0, 0, 1, 1)])).toBeNull();
    expect(apparentVanishingPoint([])).toBeNull();
  });
});

describe('uvToWorld', () => {
  const p = flatPanel('a', { x: 0, y: 0, z: 0 });
  test('centro UV → origem do painel', () => {
    const w = uvToWorld(p, 0.5, 0.5);
    expect(w).toEqual({ x: 0, y: 0, z: 0 });
  });
  test('canto sup. direito → (+½largura, +½altura)', () => {
    const w = uvToWorld(p, 1, 1);
    expect(w.x).toBeCloseTo(0.5, 9);
    expect(w.y).toBeCloseTo(1, 9);
    expect(w.z).toBeCloseTo(0, 9);
  });
  test('segmentWorld devolve as duas extremidades', () => {
    const w = segmentWorld(seg(0, 0, 1, 1), p);
    expect(w.a).toEqual({ x: -0.5, y: -1, z: 0 });
    expect(w.b).toEqual({ x: 0.5, y: 1, z: 0 });
  });
});

describe('dihedralDeg', () => {
  test('normais iguais → 0° (coplanar)', () => {
    expect(dihedralDeg({ x: 0, y: 0, z: 1 }, { x: 0, y: 0, z: 1 })).toBeCloseTo(0, 9);
  });
  test('normais perpendiculares → 90°', () => {
    expect(dihedralDeg({ x: 0, y: 0, z: 1 }, { x: 1, y: 0, z: 0 })).toBeCloseTo(90, 9);
  });
  test('hexágono: normais de paredes adjacentes → 60°', () => {
    const n1 = { x: 0, y: 0, z: 1 };
    const th = Math.PI / 3;
    const n2 = { x: Math.sin(th), y: 0, z: Math.cos(th) };
    expect(dihedralDeg(n1, n2)).toBeCloseTo(60, 9);
  });
});

describe('rectângulos e distâncias XZ', () => {
  test('retângulo alinhado a X tem cantos correctos', () => {
    const c = rectCornersXZ(flatPanel('a', { x: 2, y: 0, z: 0 }));
    const xs = c.map((p) => p.x).sort((p, q) => p - q);
    const zs = c.map((p) => p.z).sort((p, q) => p - q);
    expect(xs[0]).toBeCloseTo(1.5, 9);
    expect(xs[3]).toBeCloseTo(2.5, 9);
    expect(zs[0]).toBeCloseTo(0, 9);
    expect(zs[3]).toBeCloseTo(0, 9); // altura em Y, não em Z
  });
  test('painéis separados 0.5 m → distância 0.5 m', () => {
    const a = flatPanel('a', { x: 0, y: 0, z: 0 });
    const b = flatPanel('b', { x: 1.5, y: 0, z: 0 }); // bordas a 0.5 e 1.0... 0.5m gap
    expect(rectDistanceXZ(a, b)).toBeCloseTo(0.5, 9);
  });
  test('painéis sobrepostos em X mas separados em Z', () => {
    const a = flatPanel('a', { x: 0, y: 0, z: 0 });
    const b = flatPanel('b', { x: 0.1, y: 0, z: 3 });
    expect(rectDistanceXZ(a, b)).toBeCloseTo(3, 9);
  });
});

describe('continuityBetween', () => {
  const onFloor = (x1, z1, x2, z2) => ({
    a: { x: x1, y: 0, z: z1 },
    b: { x: x2, y: 0, z: z2 },
  });
  test('rectas colineares → ~0° e gap ~0', () => {
    const m = continuityBetween(onFloor(0, 0, 1, 0), onFloor(1.001, 0, 2, 0));
    expect(m.angleDeg).toBeLessThan(1e-6);
    expect(m.gapM).toBeLessThan(1e-9);
  });
  test('rectas paralelas mas desfasadas → ~0° mas gap > 0', () => {
    const m = continuityBetween(onFloor(0, 0, 1, 0), onFloor(1.001, 0.3, 2, 0.3));
    expect(m.angleDeg).toBeLessThan(1e-6);
    expect(m.gapM).toBeCloseTo(0.3, 6);
  });
  test('rectas a 45° → ângulo ~45°', () => {
    const m = continuityBetween(onFloor(0, 0, 1, 0), onFloor(1, 0, 2, 1));
    expect(m.angleDeg).toBeCloseTo(45, 6);
  });
});

describe('analyzeLayout — integração sintética', () => {
  test('linha contínua A (dois painéis coplanares) → diedro 0 e continuidade ~0', () => {
    // Dois painéis lado a lado, coplanares (faces em +Z), com uma linha
    // horizontal (v=0.5) a atravessar os dois.
    const A = flatPanel('a', { x: 0, y: 0, z: 0 }, [seg(0, 0.5, 1, 0.5)]);
    const B = flatPanel('b', { x: 1.51, y: 0, z: 0 }, [seg(0, 0.5, 1, 0.5)]);
    const r = analyzeLayout([A, B]);
    expect(r.pairs).toHaveLength(1);
    expect(r.pairs[0].distanceM).toBeCloseTo(0.51, 6);
    expect(r.pairs[0].dihedralDeg).toBeCloseTo(0, 6);
    expect(r.pairs[0].continuity.nCandidates).toBe(1);
    expect(r.pairs[0].continuity.best.angleDeg).toBeLessThan(1e-6);
    expect(r.pairs[0].continuity.best.gapM).toBeLessThan(1e-6);
    expect(r.panels).toHaveLength(2);
    expect(r.panels[0].dominantDeg).toBeCloseTo(0, 6);
  });

  test('linha contínua B (dois painéis a 60°) → diedro 60, linha quebra em 3D', () => {
    // Painel B rodado 60° sobre Y (como alas adjacentes do hexágono).
    const A = flatPanel('a', { x: 0, y: 0, z: 0 }, [seg(0.9, 0.3, 1, 0.7)]);
    const th = Math.PI / 3;
    const B = {
      ...flatPanel('b', { x: 1, y: 0, z: 0 }, [seg(0, 0.7, 0.1, 0.3)]),
      right: { x: Math.cos(th), y: 0, z: -Math.sin(th) },
      up: { x: 0, y: 1, z: 0 },
    };
    const r = analyzeLayout([A, B]);
    expect(r.pairs).toHaveLength(1);
    expect(r.pairs[0].dihedralDeg).toBeCloseTo(60, 6);
    // Com diedro 60° a linha pintada não é contínua em 3D: desvio angular > 0.
    expect(r.pairs[0].continuity.best.angleDeg).toBeGreaterThan(1);
  });

  test('painéis distantes não formam par', () => {
    const A = flatPanel('a', { x: 0, y: 0, z: 0 });
    const B = flatPanel('b', { x: 10, y: 0, z: 0 });
    const r = analyzeLayout([A, B]);
    expect(r.pairs).toHaveLength(0);
  });

  test('sem traçados → métricas nulas, sem excepção', () => {
    const r = analyzeLayout([
      flatPanel('a', { x: 0, y: 0, z: 0 }),
      flatPanel('b', { x: 1.51, y: 0, z: 0 }),
    ]);
    expect(r.panels[0].dominantDeg).toBeNull();
    expect(r.panels[0].vp).toBeNull();
    expect(r.pairs[0].continuity.nCandidates).toBe(0);
    expect(r.pairs[0].continuity.best).toBeNull();
  });
});
