/**
 * Cenários nomeados (T008 — SPEC §6.4, §9). Geometria pura.
 *
 * Um cenário captura o estado COMPLETO da investigação numa dada
 * hipótese: disposição + parâmetros, estado de colocação de cada
 * painel, anotações (traçados do investigador), elementos de
 * arquitetura, visibilidade de camadas e câmara (SPEC §7: «a posição
 * da câmara deverá ser guardada com o cenário»).
 *
 * Serialização (`serializeScenario`), validação na entrada
 * (`parseScenario`) e cenários predefinidos A–D (SPEC §6.4). O
 * armazenamento LocalStorage vive em `src/model/storage.js`.
 *
 * PROVENIÊNCIA: o cenário NUNCA é uma reconstrução — é um EXPERIMENTO
 * guardado (HIPÓTESE) com os MEDIDOS que o investigador traçou (SPEC
 * §8). Alternar entre cenários é alternar entre experiências, não
 * entre verdades.
 */
import { placeOnWall } from '../geometry/panelPlacement.js';
import { ELEMENT_TYPES } from './architecture.js';
import { LAYOUTS, buildLayout } from './layouts.js';
import { PANELS } from './panels.js';

export const SCENARIO_SCHEMA = 'svicente/scenario';
export const SCENARIO_VERSION = 1;

/** Folga entre painéis na disposição dos cenários predefinidos (ESTIMADO). */
const PANEL_GAP_M = 0.05;
/** Comprimento mínimo de traçado, igual ao do armazenamento de anotações. */
const MIN_SEGMENT_UV = 0.005;

const PANEL_IDS = new Set(PANELS.map((p) => p.id));
const LAYOUT_IDS = new Set(LAYOUTS.map((l) => l.id));

const isNum = (v) => typeof v === 'number' && Number.isFinite(v);

/**
 * Serializa o estado capturado da cena num cenário JSON-ready.
 *
 * @param {{name: string, description?: string,
 *          layout: {id: string, radius: number, angleDeg: number},
 *          panels: Record<string, object>, annotations: object,
 *          elements: object[], analysis?: {layerVisibility?: object},
 *          camera: object|null}} snapshot
 */
export function serializeScenario(snapshot) {
  const panels = {};
  for (const [id, st] of Object.entries(snapshot.panels ?? {})) {
    panels[id] = {
      wallIndex: st.wallIndex,
      lateralOffset: st.lateralOffset,
      distanceToWall: st.distanceToWall,
      width: st.width,
      height: st.height,
      faceFlipped: st.faceFlipped,
      positionY: st.positionY,
      rotationY: st.rotationY,
    };
  }
  return {
    schema: SCENARIO_SCHEMA,
    version: SCENARIO_VERSION,
    name: snapshot.name,
    description: snapshot.description ?? '',
    layout: {
      id: snapshot.layout.id,
      radius: snapshot.layout.radius,
      angleDeg: snapshot.layout.angleDeg,
    },
    panels,
    annotations: JSON.parse(JSON.stringify(snapshot.annotations ?? {})),
    elements: (snapshot.elements ?? []).map((e) => ({ ...e })),
    analysis: {
      layerVisibility: { ...(snapshot.analysis?.layerVisibility ?? {}) },
    },
    camera: snapshot.camera ? JSON.parse(JSON.stringify(snapshot.camera)) : null,
  };
}

function validateSegment(s) {
  if (!s || typeof s !== 'object') return 'segmento inválido';
  if (typeof s.id !== 'string' || !s.id) return 'segmento sem id';
  for (const k of ['a', 'b']) {
    const p = s[k];
    if (
      !p ||
      !isNum(p.u) ||
      !isNum(p.v) ||
      p.u < 0 ||
      p.u > 1 ||
      p.v < 0 ||
      p.v > 1
    ) {
      return `ponto ${k} fora de [0,1]: (${p?.u}, ${p?.v})`;
    }
  }
  if (Math.hypot(s.b.u - s.a.u, s.b.v - s.a.v) < MIN_SEGMENT_UV) {
    return `segmento ${s.id} demasiado curto (< 0.5%)`;
  }
  return null;
}

function validatePanelState(st) {
  const errors = [];
  if (!st || typeof st !== 'object') return ['estado de painel inválido'];
  if (!Number.isInteger(st.wallIndex) || st.wallIndex < 0)
    errors.push(`wallIndex inválido: ${st.wallIndex}`);
  if (!isNum(st.lateralOffset)) errors.push(`lateralOffset inválido: ${st.lateralOffset}`);
  if (!isNum(st.distanceToWall) || st.distanceToWall < 0)
    errors.push(`distanceToWall inválido: ${st.distanceToWall}`);
  if (!isNum(st.width) || st.width <= 0) errors.push(`largura inválida: ${st.width}`);
  if (!isNum(st.height) || st.height <= 0) errors.push(`altura inválida: ${st.height}`);
  if (typeof st.faceFlipped !== 'boolean')
    errors.push(`faceFlipped inválido: ${st.faceFlipped}`);
  if (st.positionY != null && !isNum(st.positionY))
    errors.push(`positionY inválido: ${st.positionY}`);
  if (st.rotationY != null && !isNum(st.rotationY))
    errors.push(`rotationY inválido: ${st.rotationY}`);
  return errors;
}

function validateElement(el) {
  if (!el || typeof el !== 'object') return 'elemento inválido';
  if (typeof el.id !== 'string' || !el.id) return 'elemento sem id';
  if (!ELEMENT_TYPES[el.type]) return `tipo desconhecido: ${el.type}`;
  if (!Number.isInteger(el.wallIndex) || el.wallIndex < 0)
    return `wallIndex inválido: ${el.wallIndex}`;
  if (!isNum(el.lateralOffset)) return `lateralOffset inválido: ${el.lateralOffset}`;
  return null;
}

function validateCamera(c) {
  if (!c || typeof c !== 'object') return 'câmara inválida';
  for (const k of ['position', 'target']) {
    const v = c[k];
    if (!v || !isNum(v.x) || !isNum(v.y) || !isNum(v.z))
      return `${k} inválido: (${v?.x}, ${v?.y}, ${v?.z})`;
  }
  if (c.orthographic != null && typeof c.orthographic !== 'boolean')
    return `orthographic inválido: ${c.orthographic}`;
  return null;
}

/**
 * Valida um cenário (objecto ou texto JSON). Recolhe TODOS os erros —
 * o investigador deve ver o que está mal de uma vez.
 *
 * @returns {{ok: boolean, scenario: object|null, errors: string[]}}
 */
export function parseScenario(input) {
  let data = input;
  if (typeof input === 'string') {
    try {
      data = JSON.parse(input);
    } catch (e) {
      return { ok: false, scenario: null, errors: [`JSON inválido: ${e.message}`] };
    }
  }
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    return { ok: false, scenario: null, errors: ['o cenário não é um objecto'] };
  }

  const errors = [];
  if (data.schema !== SCENARIO_SCHEMA) {
    errors.push(`schema esperado "${SCENARIO_SCHEMA}", obtido "${data.schema}"`);
  }
  if (!Number.isInteger(data.version) || data.version < 1) {
    errors.push(`versão inválida: ${data.version}`);
  } else if (data.version > SCENARIO_VERSION) {
    errors.push(`versão ${data.version} não suportada (máxima ${SCENARIO_VERSION})`);
  }
  if (typeof data.name !== 'string' || !data.name.trim()) errors.push('nome vazio');

  const layout = data.layout ?? {};
  if (!LAYOUT_IDS.has(layout.id)) errors.push(`disposição desconhecida: ${layout.id}`);
  if (!isNum(layout.radius) || layout.radius < 0.5)
    errors.push(`raio inválido: ${layout.radius}`);
  if (!isNum(layout.angleDeg)) errors.push(`ângulo inválido: ${layout.angleDeg}`);

  const panels = {};
  if (!data.panels || typeof data.panels !== 'object') {
    errors.push('painéis em falta');
  } else {
    for (const [id, st] of Object.entries(data.panels)) {
      if (!PANEL_IDS.has(id)) {
        errors.push(`painel desconhecido: ${id}`);
        continue;
      }
      errors.push(...validatePanelState(st).map((e) => `${id}: ${e}`));
      panels[id] = st;
    }
  }

  const annotations = {};
  if (data.annotations != null) {
    if (typeof data.annotations !== 'object') {
      errors.push('anotações inválidas');
    } else {
      for (const [id, segs] of Object.entries(data.annotations)) {
        if (!PANEL_IDS.has(id)) {
          errors.push(`anotações para painel desconhecido: ${id}`);
          continue;
        }
        if (!Array.isArray(segs)) {
          errors.push(`anotações de ${id} não são uma lista`);
          continue;
        }
        const out = [];
        for (const s of segs) {
          const err = validateSegment(s);
          if (err) errors.push(`${id}: ${err}`);
          else out.push({ id: s.id, a: { ...s.a }, b: { ...s.b } });
        }
        annotations[id] = out;
      }
    }
  }

  const elements = [];
  if (data.elements != null) {
    if (!Array.isArray(data.elements)) {
      errors.push('elementos não são uma lista');
    } else {
      data.elements.forEach((el, i) => {
        const err = validateElement(el);
        if (err) errors.push(`elemento ${i}: ${err}`);
        else
          elements.push({
            id: el.id,
            type: el.type,
            wallIndex: el.wallIndex,
            lateralOffset: el.lateralOffset,
          });
      });
    }
  }

  let camera = null;
  if (data.camera != null) {
    const err = validateCamera(data.camera);
    if (err) errors.push(`câmara: ${err}`);
    else camera = JSON.parse(JSON.stringify(data.camera));
  }

  const layerVisibility = {};
  const analysis = data.analysis;
  if (analysis != null && analysis.layerVisibility != null) {
    if (typeof analysis.layerVisibility !== 'object') {
      errors.push('layerVisibility inválido');
    } else {
      for (const [id, v] of Object.entries(analysis.layerVisibility)) {
        if (!PANEL_IDS.has(id)) {
          errors.push(`camada de painel desconhecida: ${id}`);
          continue;
        }
        layerVisibility[id] = Boolean(v);
      }
    }
  }

  if (errors.length) return { ok: false, scenario: null, errors };
  return {
    ok: true,
    errors: [],
    scenario: {
      // id/savedAt são do repositório — mantidos no import para upsert.
      id: typeof data.id === 'string' ? data.id : undefined,
      savedAt: typeof data.savedAt === 'string' ? data.savedAt : undefined,
      schema: SCENARIO_SCHEMA,
      version: SCENARIO_VERSION,
      name: data.name.trim(),
      description: typeof data.description === 'string' ? data.description : '',
      layout: {
        id: layout.id,
        radius: layout.radius,
        angleDeg: layout.angleDeg,
      },
      panels,
      annotations,
      elements,
      analysis: { layerVisibility },
      camera,
    },
  };
}

/**
 * Cenários predefinidos A–D (SPEC §6.4). Um painel por parede
 * (round-robin); offsets laterais centrados e espaçados pela largura
 * pintada + folga (ESTIMADO). Base de comparação — nenhuma é
 * reconstrução (todas HIPÓTESE).
 */
export function createDefaultScenarios({ radius = 3, angleDeg = 90 } = {}) {
  const defs = [
    {
      layoutId: 'plana',
      name: 'A — Disposição plana',
      description:
        'Fundo único: retábulo, trono ou linha de museu (H2-A). HIPÓTESE.',
    },
    {
      layoutId: 'angular',
      name: 'B — Disposição angular',
      description: 'Duas alas em ângulo (sala de corte, H2-B). HIPÓTESE.',
    },
    {
      layoutId: 'hexagono',
      name: 'C — Hexágono regular',
      description: 'Hipótese C da SPEC §4 (convenção: raio = apotema). HIPÓTESE.',
    },
    {
      layoutId: 'irregular',
      name: 'D — Hexágono irregular',
      description: 'Teste de sensibilidade à regularidade. HIPÓTESE.',
    },
  ];
  return defs.map((d) => defaultScenario(d, { radius, angleDeg }));
}

function defaultScenario({ layoutId, name, description }, { radius, angleDeg }) {
  const layoutDef = buildLayout(layoutId, { radius, angleDeg });

  // Distribuição round-robin por parede; dentro da parede, pela ordem
  // canónica dos painéis, centrada no ponto médio.
  const perWall = new Map();
  PANELS.forEach((p, i) => {
    const wallIndex = i % layoutDef.walls.length;
    if (!perWall.has(wallIndex)) perWall.set(wallIndex, []);
    perWall.get(wallIndex).push(p);
  });

  const panels = {};
  for (const [wallIndex, group] of perWall) {
    const total =
      group.reduce((s, p) => s + p.width, 0) + PANEL_GAP_M * (group.length - 1);
    let cursor = -total / 2;
    for (const p of group) {
      const lateralOffset = cursor + p.width / 2;
      cursor += p.width + PANEL_GAP_M;
      const { rotationY } = placeOnWall({
        frame: layoutDef.walls[wallIndex],
        panelWidth: p.width,
        panelHeight: p.height,
        lateralOffset,
        distanceToWall: 0.05,
      });
      panels[p.id] = {
        wallIndex,
        lateralOffset,
        distanceToWall: 0.05,
        width: p.width,
        height: p.height,
        faceFlipped: false,
        positionY: p.height / 2,
        rotationY,
      };
    }
  }

  return serializeScenario({
    name,
    description,
    layout: { id: layoutId, radius, angleDeg },
    panels,
    annotations: {},
    elements: [],
    analysis: { layerVisibility: {} },
    camera: null,
  });
}
