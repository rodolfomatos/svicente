/**
 * Repositório de cenários sobre um storage injectável (T008 — SPEC §9).
 *
 * `storage` tem interface de `localStorage` (getItem/setItem/removeItem);
 * em testes passa-se um objecto-fake, o que mantém este módulo puro e
 * testável em Node. O ficheiro exportado/importado pelo investigador é
 * o próprio cenário JSON (SPEC §9: «guardar e carregar projetos JSON»).
 */
import { parseScenario } from './scenarios.js';

export const SCENARIOS_STORAGE_KEY = 'svicente.scenarios.v1';

/**
 * @param {{storage: {getItem:Function,setItem:Function,removeItem:Function},
 *          key?: string, now?: () => string}} opts
 */
export function createScenarioRepository({
  storage,
  key = SCENARIOS_STORAGE_KEY,
  now = () => new Date().toISOString(),
} = {}) {
  if (!storage || typeof storage.getItem !== 'function') {
    throw new Error('storage injectado inválido (getItem/setItem/removeItem)');
  }

  let lastError = null;
  let idSeq = 0;

  /** Lê a lista bruta; JSON corrompido → lista vazia + lastError. */
  function readAll() {
    const raw = storage.getItem(key);
    if (!raw) return [];
    try {
      const data = JSON.parse(raw);
      if (!Array.isArray(data)) throw new Error('estrutura não é uma lista');
      lastError = null;
      return data;
    } catch (e) {
      lastError = `cenários guardados corrompidos em "${key}": ${e.message}`;
      return [];
    }
  }

  function writeAll(list) {
    storage.setItem(key, JSON.stringify(list));
  }

  /** Todos os cenários, por ordem de guarda. */
  function list() {
    return readAll().map((s) => ({ ...s }));
  }

  function get(id) {
    const found = readAll().find((s) => s.id === id);
    return found ? { ...found } : null;
  }

  /**
   * Guarda (insere ou substitui por id) DEPOIS de validar. Nunca
   * persiste um cenário inválido — o repositório é a última linha de
   * defesa antes do LocalStorage.
   *
   * @returns {{ok: boolean, scenario?: object, errors?: string[]}}
   */
  function save(scenario) {
    const check = parseScenario(scenario);
    if (!check.ok) return { ok: false, errors: check.errors };
    const all = readAll();
    const savedAt = now();
    let out;
    const i = all.findIndex((s) => s.id === check.scenario.id);
    if (i >= 0) {
      out = { ...check.scenario, savedAt };
      all[i] = out;
    } else {
      idSeq += 1;
      out = {
        ...check.scenario,
        id: `sc-${Date.now().toString(36)}-${idSeq}`,
        savedAt,
      };
      all.push(out);
    }
    writeAll(all);
    return { ok: true, scenario: { ...out } };
  }

  function remove(id) {
    const all = readAll();
    const next = all.filter((s) => s.id !== id);
    if (next.length === all.length) return false;
    writeAll(next);
    return true;
  }

  function clear() {
    storage.removeItem(key);
  }

  return {
    list,
    get,
    save,
    remove,
    clear,
    get lastError() {
      return lastError;
    },
    key,
  };
}
