/**
 * Anotações lineares sobre as imagens dos painéis (SPEC §6.1).
 *
 * Coordenadas NORMALIZADAS da imagem (UV, [0,1] em ambos os eixos), de
 * modo a não dependerem da resolução do ficheiro — deslocar ou escalar
 * um painel não invalida as anotações.
 *
 * Modelo puro: sem DOM, sem Three.js. O desenho 3D é feito por
 * src/scene/annotationView.js; a persistência (JSON/localStorage) é T008.
 */

const UV_EPS = 1e-6;

function assertUV(point, label) {
  const { u, v } = point;
  if (
    typeof u !== 'number' ||
    typeof v !== 'number' ||
    !Number.isFinite(u) ||
    !Number.isFinite(v) ||
    u < -UV_EPS ||
    u > 1 + UV_EPS ||
    v < -UV_EPS ||
    v > 1 + UV_EPS
  ) {
    throw new Error(`${label} fora de [0,1]: (${u}, ${v})`);
  }
}

/**
 * Cria um armazenamento de anotações.
 *
 * @param {Record<string, Array<{id: string, a: {u:number,v:number},
 *   b: {u:number,v:number}>>} [initial] estado inicial (ex.: JSON carregado)
 */
export function createAnnotationStore(initial = {}) {
  let seq = 0;
  /** @type {Map<string, Array>} */
  const byPanel = new Map();
  for (const [panelId, segments] of Object.entries(initial)) {
    byPanel.set(
      panelId,
      segments.map((s) => ({ ...s }))
    );
  }

  function list(panelId) {
    return byPanel.get(panelId) ?? [];
  }

  /**
   * Adiciona um segmento de linha a um painel.
   * Comprimento mínimo: 0.5% da dimensão normalizada (evita ruído de clique).
   */
  function addSegment(panelId, a, b) {
    assertUV(a, 'ponto a');
    assertUV(b, 'ponto b');
    if (Math.hypot(b.u - a.u, b.v - a.v) < 0.005) {
      throw new Error('segmento demasiado curto (< 0.5% da imagem)');
    }
    seq += 1;
    const segment = { id: `s${seq}`, a: { ...a }, b: { ...b } };
    if (!byPanel.has(panelId)) byPanel.set(panelId, []);
    byPanel.get(panelId).push(segment);
    return segment;
  }

  function removeSegment(panelId, segmentId) {
    const segments = byPanel.get(panelId);
    if (!segments) return false;
    const i = segments.findIndex((s) => s.id === segmentId);
    if (i < 0) return false;
    segments.splice(i, 1);
    return true;
  }

  function count(panelId) {
    return list(panelId).length;
  }

  /** Painéis com pelo menos uma anotação. */
  function panelIds() {
    return [...byPanel.entries()].filter(([, s]) => s.length > 0).map(([id]) => id);
  }

  /** Estado serializável (JSON-ready), incluindo painéis vazios removidos. */
  function serialize() {
    const out = {};
    for (const [panelId, segments] of byPanel) {
      if (segments.length > 0) out[panelId] = segments.map((s) => ({ ...s }));
    }
    return out;
  }

  /** Substitui todo o estado (ex.: carregar projeto exportado). */
  function load(data) {
    byPanel.clear();
    for (const [panelId, segments] of Object.entries(data ?? {})) {
      byPanel.set(
        panelId,
        segments.map((s) => ({ ...s }))
      );
    }
  }

  return { list, addSegment, removeSegment, count, panelIds, serialize, load };
}
