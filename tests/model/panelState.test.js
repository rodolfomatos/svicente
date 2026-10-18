/**
 * Testes do estado de colocação dos painéis (SPEC §5.B — posição por
 * parede associada e distância à parede).
 */
import { polygonVertices } from '../../src/geometry/regularPolygon.js';
import { placeOnWall, wallFrame } from '../../src/geometry/panelPlacement.js';
import {
  distanceToSegment,
  nearestWallIndex,
  offsetsFromWall,
  panelTransformFromState,
} from '../../src/model/panelState.js';

const V = polygonVertices({ sides: 6, radius: 3 });

describe('distanceToSegment', () => {
  const a = { x: 0, z: 0 };
  const b = { x: 4, z: 0 };
  test('ponto sobre o segmento → 0', () => {
    expect(distanceToSegment({ x: 2, z: 0 }, a, b)).toBeCloseTo(0, 9);
  });
  test('ponto perpendicular ao meio → altura perpendicular', () => {
    expect(distanceToSegment({ x: 2, z: 1.5 }, a, b)).toBeCloseTo(1.5, 9);
  });
  test('para lá das extremidades → distância ao vértice', () => {
    expect(distanceToSegment({ x: 5, z: 0 }, a, b)).toBeCloseTo(1, 9);
    expect(distanceToSegment({ x: -3, z: 4 }, a, b)).toBeCloseTo(5, 9);
  });
  test('segmento degenerado → distância ao ponto', () => {
    expect(distanceToSegment({ x: 3, z: 4 }, a, a)).toBeCloseTo(5, 9);
  });
});

describe('nearestWallIndex', () => {
  test('ponto junto ao ponto médio de cada parede identifica essa parede', () => {
    for (let i = 0; i < 6; i++) {
      const mid = {
        x: (V[i].x + V[(i + 1) % 6].x) / 2,
        z: (V[i].z + V[(i + 1) % 6].z) / 2,
      };
      // deslocado 0.2 m para dentro, ao longo da normal da parede
      const inward = { x: -mid.x / 3, z: -mid.z / 3 };
      const p = { x: mid.x + inward.x * 0.2, z: mid.z + inward.z * 0.2 };
      expect(nearestWallIndex(V, p)).toBe(i);
    }
  });

  test('centro do espaço: equidistante de todas as paredes (resultado determinístico)', () => {
    // No centro o empate é real; o ponto é que a função é determinística —
    // sempre o mesmo índice para a mesma entrada, nunca aleatória.
    const a = nearestWallIndex(V, { x: 0, z: 0 });
    const b = nearestWallIndex(V, { x: 0, z: 0 });
    expect(a).toBe(b);
    expect(a).toBeGreaterThanOrEqual(0);
    expect(a).toBeLessThan(6);
  });

  test('menos de 3 vértices rejeitado', () => {
    expect(() =>
      nearestWallIndex(
        [
          { x: 0, z: 0 },
          { x: 1, z: 0 },
        ],
        { x: 0, z: 0 }
      )
    ).toThrow();
  });
});

describe('offsetsFromWall / round-trip com placeOnWall', () => {
  test.each([
    [0, 0, 0],
    [2, 0.4, 0.15],
    [5, -0.75, 0.05],
  ])(
    'parede %i, offset %f, folga %f → reproduz a posição exacta',
    (index, off, dist) => {
      const expected = placeOnWall({
        frame: { ...frameFor(V, index) },
        panelWidth: 0.6,
        panelHeight: 2,
        lateralOffset: off,
        distanceToWall: dist,
      }).position;
      const round = offsetsFromWall(V, index, expected);
      expect(round.lateralOffset).toBeCloseTo(off, 9);
      expect(round.distanceToWall).toBeCloseTo(dist, 9);
    }
  );
});

// Helper: enquadramento da parede via panelPlacement (mesma convenção).
function frameFor(vertices, index) {
  return wallFrame(vertices, index);
}

describe('panelTransformFromState', () => {
  const state = {
    wallIndex: 1,
    lateralOffset: 0.3,
    distanceToWall: 0.1,
    width: 0.6,
    height: 2.07,
  };

  test('posição base na convenção painel-de-pé (y = altura/2)', () => {
    const t = panelTransformFromState(V, state);
    expect(t.position.y).toBeCloseTo(2.07 / 2, 9);
  });

  test('faceFlipped rota exactamente π', () => {
    const base = panelTransformFromState(V, state);
    const flipped = panelTransformFromState(V, { ...state, faceFlipped: true });
    expect(flipped.rotationY - base.rotationY).toBeCloseTo(Math.PI, 9);
    expect(flipped.position).toEqual(base.position);
  });

  test('rotação aponta a face para o centro (sem flip)', () => {
    const t = panelTransformFromState(V, state);
    const frame = wallFrame(V, state.wallIndex);
    expect(Math.sin(t.rotationY)).toBeCloseTo(frame.inward.x, 9);
    expect(Math.cos(t.rotationY)).toBeCloseTo(frame.inward.z, 9);
  });
});
