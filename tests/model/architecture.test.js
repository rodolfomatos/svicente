/**
 * Testes dos elementos de arquitetura e validação de sobreposição (B004, H2).
 * Dimensões ESTIMADAS — os testes validam a LÓGICA, não a verdade histórica.
 */
import {
  createElement,
  elementExtent,
  ELEMENT_TYPES,
  findConflicts,
  conflictPanelElement,
  panelExtent,
} from '../../src/model/architecture.js';
import { PROVENANCE } from '../../src/model/panels.js';

/** Estado de painel padrão: parede 0, centrado, 0.05 m da parede. */
function panelState(over = {}) {
  return {
    wallIndex: 0,
    lateralOffset: 0,
    distanceToWall: 0.05,
    width: 0.6,
    height: 2.07,
    ...over,
  };
}

describe('elementos: modelo', () => {
  test('quatro tipos, todos com dimensões ESTIMADAS (SPEC §8)', () => {
    expect(Object.keys(ELEMENT_TYPES)).toEqual(['porta', 'janela', 'altar', 'trono']);
    for (const t of Object.values(ELEMENT_TYPES)) {
      expect(t.provenance).toBe(PROVENANCE.ESTIMADO);
      expect(t.note).toMatch(/ESTIMADO/);
    }
  });

  test('createElement rejeita tipo desconhecido', () => {
    expect(() => createElement('pinaculo', 0, 0)).toThrow(/desconhecido/);
  });

  test('janela tem peitoril: base acima do pavimento', () => {
    const e = elementExtent(createElement('janela', 0, 0));
    expect(e.y0).toBeGreaterThan(0.5);
    expect(e.y1).toBeGreaterThan(e.y0);
  });
});

describe('conflitos painel × vão (porta/janela)', () => {
  test('porta ao centro da parede → conflito (painel atravessa o vão)', () => {
    const r = conflictPanelElement(panelState(), createElement('porta', 0, 0));
    expect(r.conflict).toBe(true);
    expect(r.reason).toMatch(/porta/);
  });

  test('porta deslocada 2 m → sem conflito (fora do painel)', () => {
    const r = conflictPanelElement(panelState(), createElement('porta', 0, 2));
    expect(r.conflict).toBe(false);
  });

  test('janela ao centro → conflito: topo (2.4 m) acima da base do painel (0 m)', () => {
    // H2: painéis de pé no pavimento colidem mesmo com janela de peitoril.
    const r = conflictPanelElement(panelState(), createElement('janela', 0, 0));
    expect(r.conflict).toBe(true);
    expect(r.reason).toMatch(/janela/);
  });

  test('janela alta (peitoril 2.3 m, topo 2.5) → painel de 2.07 passa por baixo', () => {
    const el = { ...createElement('janela', 0, 0), sill: 2.3, height: 0.2 };
    const r = conflictPanelElement(panelState(), el);
    expect(r.conflict).toBe(false); // painel termina em 2.07 < 2.3
  });

  test('parede diferente → nunca conflita', () => {
    const r = conflictPanelElement(panelState(), createElement('porta', 1, 0));
    expect(r.conflict).toBe(false);
  });
});

describe('conflitos painel × volume (altar/trono)', () => {
  test('altar ao centro, painel encostado → conflito (dentro do volume)', () => {
    const r = conflictPanelElement(panelState(), createElement('altar', 0, 0));
    expect(r.conflict).toBe(true);
    expect(r.reason).toMatch(/altar/);
  });

  test('painel afastado 1.5 m da parede → sem conflito (passa à frente do altar)', () => {
    const r = conflictPanelElement(
      panelState({ distanceToWall: 1.5 }),
      createElement('altar', 0, 0)
    );
    expect(r.conflict).toBe(false);
  });

  test('trono lateral, painel centrado → sem conflito (sem sobreposição lateral)', () => {
    const r = conflictPanelElement(panelState(), createElement('trono', 0, 1.5));
    expect(r.conflict).toBe(false);
  });

  test('painel alargado (largura investigador) agarra o altar que antes passava', () => {
    const el = createElement('altar', 0, 1.2);
    const narrow = conflictPanelElement(panelState(), el);
    const wide = conflictPanelElement(panelState({ width: 1.3 }), el);
    expect(narrow.conflict).toBe(false); // 1.2 - 0.7 = 0.5 > 0.3
    expect(wide.conflict).toBe(true); // 1.2 - 0.65 = 0.55... < 0.65? sim
  });
});

describe('findConflicts: varredura', () => {
  test('devolve apenas pares conflitantes com razão legível', () => {
    const panels = [
      { id: 'frades', state: panelState({ wallIndex: 0 }) },
      { id: 'pescadores', state: panelState({ wallIndex: 1, lateralOffset: 2 }) },
    ];
    const elements = [createElement('porta', 0, 0), createElement('janela', 2, 0)];
    const conflicts = findConflicts(panels, elements);
    expect(conflicts).toHaveLength(1);
    expect(conflicts[0].panelId).toBe('frades');
    expect(conflicts[0].elementId).toBeTruthy();
    expect(conflicts[0].reason).toBeTruthy();
  });

  test('painel livre → lista vazia', () => {
    const panels = [{ id: 'infante', state: panelState({ lateralOffset: 3 }) }];
    expect(findConflicts(panels, [createElement('porta', 0, 0)])).toEqual([]);
  });
});

describe('panelExtent', () => {
  test('painel-de-pé: base em 0, topo na altura (SPEC §4)', () => {
    const e = panelExtent(panelState({ height: 2.06 }));
    expect(e.y0).toBe(0);
    expect(e.y1).toBe(2.06);
    expect(e.u0).toBe(-0.3);
    expect(e.u1).toBe(0.3);
  });
});
