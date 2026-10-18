/**
 * Testes do modelo dos painéis (SPEC §3, §8).
 */
import { PANELS, PROVENANCE, PUBLISHED_DIMENSIONS_NOTE, getPanel } from '../../src/model/panels.js';

describe('Painéis de São Vicente (SPEC §3)', () => {
  test('existem exactamente os seis painéis, com identificadores estáveis', () => {
    expect(PANELS.map((p) => p.id)).toEqual([
      'frades',
      'pescadores',
      'infante',
      'arcebispo',
      'cavaleiros',
      'reliquia',
    ]);
  });

  // Tabela de dimensões publicadas, em metros (SPEC §3).
  test.each([
    ['frades', 2.072, 0.642],
    ['pescadores', 2.07, 0.6],
    ['infante', 2.064, 1.28],
    ['arcebispo', 2.06, 1.283],
    ['cavaleiros', 2.066, 0.604],
    ['reliquia', 2.065, 0.631],
  ])('%s: dimensões publicadas %f x %f m', (id, height, width) => {
    const p = getPanel(id);
    expect(p.height).toBeCloseTo(height, 9);
    expect(p.width).toBeCloseTo(width, 9);
  });

  test('cada painel carrega proveniência e fonte (R10, N3)', () => {
    for (const p of PANELS) {
      expect(Object.values(PROVENANCE)).toContain(p.provenance);
      expect(p.source).toBeDefined();
      expect(p.note).toBe(PUBLISHED_DIMENSIONS_NOTE);
    }
  });

  test('painéis são imutáveis (modelo de referência)', () => {
    expect(Object.isFrozen(PANELS)).toBe(true);
    expect(Object.isFrozen(PANELS[0])).toBe(true);
  });

  test('getPanel lança para identificador desconhecido', () => {
    expect(() => getPanel('inexistente')).toThrow(/desconhecido/);
  });
});
