/**
 * Testes do modelo de anotações lineares (SPEC §6.1) — geometria pura.
 */
import { createAnnotationStore } from '../../src/model/annotations.js';

const A = { u: 0.1, v: 0.2 };
const B = { u: 0.8, v: 0.9 };

describe('annotations: adicionar segmentos', () => {
  test('adiciona e lista por painel', () => {
    const store = createAnnotationStore();
    const s = store.addSegment('infante', A, B);
    expect(s.id).toBeTruthy();
    expect(store.list('infante')).toHaveLength(1);
    expect(store.count('infante')).toBe(1);
    expect(store.list('frades')).toHaveLength(0);
  });

  test('rejeita coordenadas fora de [0,1]', () => {
    const store = createAnnotationStore();
    expect(() => store.addSegment('infante', { u: -0.1, v: 0.5 }, B)).toThrow(
      /\[0,1\]/
    );
    expect(() => store.addSegment('infante', A, { u: 1.2, v: 0.5 })).toThrow(/\[0,1\]/);
    expect(() => store.addSegment('infante', A, { u: NaN, v: 0.5 })).toThrow(/\[0,1\]/);
    expect(() => store.addSegment('infante', A, { u: 0.5 })).toThrow(/\[0,1\]/);
  });

  test('rejeita segmentos demasiado curtos (ruído de clique)', () => {
    const store = createAnnotationStore();
    expect(() =>
      store.addSegment('infante', { u: 0.5, v: 0.5 }, { u: 0.501, v: 0.5 })
    ).toThrow(/curto/);
    expect(store.count('infante')).toBe(0);
  });

  test('cópias defensivas: mutar argumentos não altera o armazenamento', () => {
    const store = createAnnotationStore();
    const a = { u: 0.2, v: 0.2 };
    const b = { u: 0.7, v: 0.7 };
    store.addSegment('frades', a, b);
    a.u = 0.99;
    expect(store.list('frades')[0].a.u).toBe(0.2);
  });
});

describe('annotations: remoção e estados', () => {
  test('removeSegment devolve false para id inexistente', () => {
    const store = createAnnotationStore();
    store.addSegment('frades', A, B);
    expect(store.removeSegment('frades', 'nao-existe')).toBe(false);
    expect(store.removeSegment('pescadores', 's1')).toBe(false);
    const [{ id }] = store.list('frades');
    expect(store.removeSegment('frades', id)).toBe(true);
    expect(store.count('frades')).toBe(0);
  });

  test('serialize/load roundtrip preserva tudo', () => {
    const store = createAnnotationStore();
    store.addSegment('infante', A, B);
    store.addSegment('arcebispo', { u: 0, v: 0 }, { u: 1, v: 1 });
    const data = JSON.parse(JSON.stringify(store.serialize()));

    const restored = createAnnotationStore(data);
    expect(restored.serialize()).toEqual(store.serialize());
    expect(restored.count('infante')).toBe(1);
    expect(restored.count('arcebispo')).toBe(1);
    expect(restored.panelIds().sort()).toEqual(['arcebispo', 'infante']);
  });

  test('load substitui o estado anterior (abrir projeto exportado)', () => {
    const store = createAnnotationStore();
    store.addSegment('frades', A, B);
    store.load({ cavaleiros: [{ id: 'sX', a: A, b: B }] });
    expect(store.count('frades')).toBe(0);
    expect(store.count('cavaleiros')).toBe(1);
  });

  test('painéis sem segmentos não aparecem no serialize', () => {
    const store = createAnnotationStore();
    store.addSegment('reliquia', A, B);
    store.removeSegment('reliquia', store.list('reliquia')[0].id);
    expect(store.serialize()).toEqual({});
    expect(store.panelIds()).toEqual([]);
  });
});
