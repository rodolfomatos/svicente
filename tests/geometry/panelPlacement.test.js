/**
 * Testes da colocação de painéis sobre paredes (SPEC §4, §5).
 */
import { polygonVertices } from '../../src/geometry/regularPolygon.js';
import { wallFrame, placeOnWall } from '../../src/geometry/panelPlacement.js';

const V = polygonVertices({ sides: 6, radius: 3 });

describe('wallFrame', () => {
  test('ponto médio da parede a exactamente 3 m do centro (apotema)', () => {
    const f = wallFrame(V, 0);
    expect(Math.hypot(f.midpoint.x, f.midpoint.z)).toBeCloseTo(3, 9);
  });

  test('normal interior é unitária e aponta para o centro', () => {
    for (let i = 0; i < 6; i++) {
      const f = wallFrame(V, i);
      expect(Math.hypot(f.inward.x, f.inward.z)).toBeCloseTo(1, 9);
      // produto escalar positivo com a direção midpoint→centro
      expect(f.inward.x * -f.midpoint.x + f.inward.z * -f.midpoint.z).toBeGreaterThan(0);
    }
  });

  test('índice inválido rejeitado', () => {
    expect(() => wallFrame(V, 6)).toThrow(/inválido/);
    expect(() => wallFrame(V, -1)).toThrow(/inválido/);
    expect(() => wallFrame(V, 1.5)).toThrow(/inválido/);
  });
});

describe('placeOnWall', () => {
  const frame = wallFrame(V, 2);
  const W = 0.642;
  const H = 2.072;

  test('base do painel no pavimento: y = altura/2', () => {
    const { position } = placeOnWall({ frame, panelWidth: W, panelHeight: H });
    expect(position.y).toBeCloseTo(H / 2, 9);
  });

  test('sem deslocamentos, fica sobre o ponto médio da parede', () => {
    const { position } = placeOnWall({ frame, panelWidth: W, panelHeight: H });
    expect(position.x).toBeCloseTo(frame.midpoint.x, 9);
    expect(position.z).toBeCloseTo(frame.midpoint.z, 9);
  });

  test('distanceToWall desloca para dentro, ao longo da normal', () => {
    const d = 0.25;
    const { position } = placeOnWall({
      frame, panelWidth: W, panelHeight: H, distanceToWall: d,
    });
    const dist = Math.hypot(position.x, position.z);
    expect(dist).toBeCloseTo(3 - d, 9); // mais perto do centro
  });

  test('lateralOffset desloca ao longo da parede (painel não ocupa parede inteira)', () => {
    const off = 0.3;
    const { position } = placeOnWall({
      frame, panelWidth: W, panelHeight: H, lateralOffset: off,
    });
    // perpendicular à normal: deslocação puramente tangencial, logo
    // distância ao centro = hipotenusa sqrt(3² + off²)
    expect(Math.hypot(position.x, position.z)).toBeCloseTo(Math.hypot(3, off), 9);
  });

  test('rotação aponta a face para o centro: +Z local ≈ normal interior', () => {
    const { rotationY } = placeOnWall({ frame, panelWidth: W, panelHeight: H });
    expect(Math.sin(rotationY)).toBeCloseTo(frame.inward.x, 9);
    expect(Math.cos(rotationY)).toBeCloseTo(frame.inward.z, 9);
  });

  test('dimensões inválidas rejeitadas', () => {
    expect(() => placeOnWall({ frame, panelWidth: 0, panelHeight: H })).toThrow();
    expect(() => placeOnWall({ frame, panelWidth: W, panelHeight: -1 })).toThrow();
  });
});
