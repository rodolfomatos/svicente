/**
 * Testes do repositório de cenários (T008 — SPEC §9).
 * Storage injectado (objecto-fake) — o módulo permanece puro e testável
 * em Node; o LocalStorage real só existe no browser (main.js).
 */
import { createScenarioRepository, SCENARIOS_STORAGE_KEY } from '../../src/model/storage.js';
import { createDefaultScenarios } from '../../src/model/scenarios.js';

/** localStorage fake: interface getItem/setItem/removeItem. */
function fakeStorage(initial = {}) {
  const map = new Map(Object.entries(initial));
  return {
    getItem: (k) => (map.has(k) ? map.get(k) : null),
    setItem: (k, v) => map.set(k, String(v)),
    removeItem: (k) => map.delete(k),
    dump: () => Object.fromEntries(map),
  };
}

const FIXED_NOW = () => '2026-10-18T12:00:00.000Z';

describe('criação', () => {
  test('storage inválido → throw', () => {
    expect(() => createScenarioRepository({})).toThrow(/storage injectado/);
    expect(() => createScenarioRepository({ storage: {} })).toThrow(/storage injectado/);
  });

  test('chave por omissão e customizada', () => {
    const repo = createScenarioRepository({ storage: fakeStorage(), now: FIXED_NOW });
    expect(repo.key).toBe(SCENARIOS_STORAGE_KEY);
    const custom = createScenarioRepository({
      storage: fakeStorage(),
      key: 'teste.chave',
      now: FIXED_NOW,
    });
    expect(custom.key).toBe('teste.chave');
  });
});

describe('list/get', () => {
  test('armazenamento vazio → lista vazia, sem erro', () => {
    const repo = createScenarioRepository({ storage: fakeStorage(), now: FIXED_NOW });
    expect(repo.list()).toEqual([]);
    expect(repo.lastError).toBeNull();
    expect(repo.get('inexistente')).toBeNull();
  });

  test('guardados e relidos (cópias — mutar não afecta o repo)', () => {
    const storage = fakeStorage();
    const repo = createScenarioRepository({ storage, now: FIXED_NOW });
    repo.save(createDefaultScenarios()[0]);
    const got = repo.list();
    got[0].name = 'MUTADO';
    expect(repo.list()[0].name).not.toBe('MUTADO');
  });
});

describe('save', () => {
  test('insere com id e savedAt carimbados', () => {
    const repo = createScenarioRepository({ storage: fakeStorage(), now: FIXED_NOW });
    const res = repo.save(createDefaultScenarios()[0]);
    expect(res.ok).toBe(true);
    expect(res.scenario.id).toMatch(/^sc-/);
    expect(res.scenario.savedAt).toBe('2026-10-18T12:00:00.000Z');
    expect(repo.list()).toHaveLength(1);
  });

  test('cenário inválido NUNCA é persistido (última linha de defesa)', () => {
    const storage = fakeStorage();
    const repo = createScenarioRepository({ storage, now: FIXED_NOW });
    const res = repo.save({ schema: 'errado' });
    expect(res.ok).toBe(false);
    expect(res.errors.length).toBeGreaterThan(0);
    expect(storage.getItem(SCENARIOS_STORAGE_KEY)).toBeNull();
    expect(repo.list()).toEqual([]);
  });

  test('upsert por id: guardar duas vezes com o mesmo id actualiza', () => {
    let clock = 0;
    const repo = createScenarioRepository({
      storage: fakeStorage(),
      now: () => `2026-10-18T12:0${clock++}:00.000Z`,
    });
    const first = repo.save(createDefaultScenarios()[0]).scenario;
    const res = repo.save({ ...first, name: 'Renomeado' });
    expect(res.ok).toBe(true);
    expect(repo.list()).toHaveLength(1);
    expect(repo.list()[0].name).toBe('Renomeado');
    expect(repo.list()[0].savedAt).toBe('2026-10-18T12:01:00.000Z');
  });
});

describe('remove/clear', () => {
  test('remover existente devolve true e apaga; inexistente devolve false', () => {
    const repo = createScenarioRepository({ storage: fakeStorage(), now: FIXED_NOW });
    const { scenario } = repo.save(createDefaultScenarios()[1]);
    expect(repo.remove(scenario.id)).toBe(true);
    expect(repo.list()).toEqual([]);
    expect(repo.remove(scenario.id)).toBe(false);
  });

  test('clear remove a chave inteira', () => {
    const storage = fakeStorage();
    const repo = createScenarioRepository({ storage, now: FIXED_NOW });
    repo.save(createDefaultScenarios()[0]);
    repo.clear();
    expect(storage.getItem(SCENARIOS_STORAGE_KEY)).toBeNull();
  });
});

describe('recuperação de corrupção (SPEC §9)', () => {
  test('JSON corrompido → lista vazia + lastError legível; novo guarda recupera', () => {
    const storage = fakeStorage({ [SCENARIOS_STORAGE_KEY]: 'isto não é json{' });
    const repo = createScenarioRepository({ storage, now: FIXED_NOW });
    expect(repo.list()).toEqual([]);
    expect(repo.lastError).toMatch(/corrompidos/);
    // Guardar por cima recupera o armazenamento.
    const res = repo.save(createDefaultScenarios()[0]);
    expect(res.ok).toBe(true);
    expect(repo.list()).toHaveLength(1);
    expect(repo.lastError).toBeNull();
  });

  test('JSON válido mas não-lista → tratado como corrupção', () => {
    const storage = fakeStorage({ [SCENARIOS_STORAGE_KEY]: '{"não":"lista"}' });
    const repo = createScenarioRepository({ storage, now: FIXED_NOW });
    expect(repo.list()).toEqual([]);
    expect(repo.lastError).toMatch(/corrompidos/);
  });

  test('entrada inválida na lista armazenada não rebenta as operações', () => {
    const good = {
      ...createDefaultScenarios()[0],
      id: 'sc-teste',
      savedAt: '2026-10-18T12:00:00.000Z',
    };
    const storage = fakeStorage({
      [SCENARIOS_STORAGE_KEY]: JSON.stringify([good, { id: 'x', lixo: true }]),
    });
    const repo = createScenarioRepository({ storage, now: FIXED_NOW });
    expect(repo.list()).toHaveLength(2);
    expect(repo.get('sc-teste').name).toBe(good.name);
    // Upsert substitui a entrada boa; a inválida permanece (o repo
    // valida o que escreve, não revalida o histórico armazenado).
    const res = repo.save({ ...good, name: 'Atualizado' });
    expect(res.ok).toBe(true);
    expect(repo.list()).toHaveLength(2);
    expect(repo.get('sc-teste').name).toBe('Atualizado');
  });
});
