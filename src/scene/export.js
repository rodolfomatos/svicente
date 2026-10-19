/**
 * Exportação de resultados para o artigo científico (SPEC §9, §10).
 *
 * Produz ficheiros descarregáveis diretamente no navegador (sem servidor,
 * sem build step):
 *
 * - Vista da cena 3D (PNG do canvas WebGL).
 * - Tabela de medições (CSV): painel, dimensões publicadas, posição,
 *   rotação, parede associada, deslocamento lateral, folga da parede.
 * - Anotações por painel (JSON): segmentos UV normalizados das linhas do
 *   pavimento, imunes à escala da textura.
 * - Versão + parâmetros (JSON): versão da aplicação, disposição, raio,
 *   ângulo, câmara, descrição da hipótese.
 * - Projecto completo (JSON): tudo acima num único ficheiro — usado para
 *   export/import roundtrip (SPEC §10.10) sem perda de anotações.
 *
 * Geometria pura + DOM mínimo. Não depende de Three.js (recebe os dados
 * já extraídos da cena).
 */

import { SCENARIO_SCHEMA, SCENARIO_VERSION } from '../model/scenarios.js';

/** Versão da aplicação (package.json). */
export const APP_VERSION = '0.1.0';

/** Etiqueta de proveniência obrigatória anexada a cada exportação. */
export const PROVENANCE_NOTE =
  'Painéis de São Vicente — Laboratório Espacial 3D. ' +
  'Configurações são EXPERIMENTOS (HIPÓTESE), nunca reconstruções históricas ' +
  '(SPEC §1, §8). Dimensões publicadas: MNAAT (referência, não medição).';

/**
 * Descarrega um ficheiro de texto no navegador.
 * @param {string} filename
 * @param {string} content
 * @param {string} type mime-type
 */
export function downloadText(filename, content, type = 'text/plain;charset=utf-8') {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Descarrega a vista 3D como imagem PNG.
 * @param {HTMLCanvasElement} canvas
 * @param {string} name base do nome do ficheiro
 */
export function exportImage(canvas, name) {
  const dataUrl = canvas.toDataURL('image/png');
  const a = document.createElement('a');
  a.href = dataUrl;
  a.download = `${name}-vista.png`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

/**
 * Tabela de medições por painel (CSV).
 *
 * @param {Array<{panelId: string, width: number, height: number,
 *   position: {x,y,z}, rotationY: number, wallIndex: number,
 *   lateralOffset: number, distanceToWall: number, state: object}>} rows
 * @param {{layoutId: string, radius: number, angleDeg?: number}} layout
 * @returns {string} CSV
 */
export function exportMeasurementsCsv(rows, layout) {
  const header = [
    'painel_id',
    'painel_nome',
    'largura_publicada_m',
    'altura_publicada_m',
    'pos_x_m',
    'pos_y_m',
    'pos_z_m',
    'rotacao_y_rad',
    'parede_index',
    'deslocamento_lateral_m',
    'distancia_da_parede_m',
    'disposicao',
    'raio_m',
    'angulo_graus',
  ];
  const nome = (id) => {
    const map = {
      frades: 'Frades',
      pescadores: 'Pescadores',
      infante: 'Infante',
      arcebispo: 'Arcebispo',
      cavaleiros: 'Cavaleiros',
      reliquia: 'Relíquia',
    };
    return map[id] || id;
  };
  const lines = [header.join(';')];
  for (const r of rows) {
    lines.push([
      r.panelId,
      nome(r.panelId),
      r.width.toFixed(4),
      r.height.toFixed(4),
      r.position.x.toFixed(4),
      r.position.y.toFixed(4),
      r.position.z.toFixed(4),
      r.rotationY.toFixed(4),
      r.wallIndex,
      r.lateralOffset.toFixed(4),
      r.distanceToWall.toFixed(4),
      layout.layoutId,
      layout.radius.toFixed(4),
      (layout.angleDeg ?? '').toString(),
    ].join(';'));
  }
  return lines.join('\n') + '\n';
}

/**
 * Anotações por painel (JSON): segmentos UV normalizados.
 * @param {Record<string, Array<{id:string, a:{u:number,v:number}, b:{u:number,v:number}}>>} byPanel
 *   saída de `annotations.serialize()` (chave = id do painel)
 * @returns {string} JSON
 */
export function exportAnnotationsJson(byPanel) {
  const out = {};
  for (const [panelId, segments] of Object.entries(byPanel ?? {})) {
    out[panelId] = segments.map((s) => ({
      id: s.id,
      a: { u: s.a.u, v: s.a.v },
      b: { u: s.b.u, v: s.b.v },
    }));
  }
  return JSON.stringify(
    {
      schema: 'svicente-annotations-v1',
      app_version: APP_VERSION,
      note: PROVENANCE_NOTE,
      panels: out,
    },
    null,
    2
  );
}

/**
 * Versão + parâmetros da configuração (JSON).
 * @param {{layoutId: string, radius: number, angleDeg?: number,
 *   camera: object, description?: string, name?: string}} params
 * @returns {string} JSON
 */
export function exportParamsJson(params) {
  return JSON.stringify(
    {
      schema: 'svicente-params-v1',
      app_version: APP_VERSION,
      name: params.name ?? '',
      description: params.description ?? '',
      layout: {
        id: params.layoutId,
        radius: params.radius,
        angleDeg: params.angleDeg ?? null,
      },
      camera: params.camera ?? null,
      note: PROVENANCE_NOTE,
    },
    null,
    2
  );
}

/**
 * Projecto completo (JSON bundle) — export/import roundtrip (SPEC §10.10).
 * Inclui disposição, parâmetros, estados dos painéis, anotações, elementos
 * de arquitetura, visibilidade de camadas e câmara.
 *
 * Reutiliza `captureSnapshot` (main.js) para o estado; aqui apenas
 * serializa e descarrega.
 *
 * @param {object} snapshot objeto já capturado via captureSnapshot()
 * @param {string} name
 * @returns {string} JSON
 */
export function exportProjectJson(snapshot, name) {
  const bundle = {
    schema: SCENARIO_SCHEMA, // 'svicente/scenario' v1 → diretamente re-importável (§10.10)
    version: SCENARIO_VERSION,
    app_version: APP_VERSION, // metadados do projeto (ignorados por parseScenario)
    name,
    description: snapshot.description ?? '',
    created_at: new Date().toISOString(),
    note: PROVENANCE_NOTE,
    ...snapshot,
  };
  return JSON.stringify(bundle, null, 2);
}

/**
 * Valida um ficheiro JSON de importação contra o esquema mínimo do
 * repositório. Devolve { ok: true, scenario } ou { ok: false, errors }.
 * A validação completa fica a cargo de `parseScenario` (model/scenarios.js);
 * aqui verificamos apenas a forma do ficheiro antes de entregar.
 * @param {string} text
 * @returns {{ok: boolean, scenario?: object, errors?: string[]}}
 */
export function validateImportJson(text) {
  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch (e) {
    return { ok: false, errors: [`JSON inválido: ${e.message}`] };
  }
  const errors = [];
  if (!parsed || typeof parsed !== 'object') {
    errors.push('conteúdo não é um objeto JSON');
  }
  if (!parsed.schema) errors.push('faltam metadados de schema');
  if (!parsed.panels || typeof parsed.panels !== 'object') {
    errors.push('faltam estados de painéis');
  }
  if (!parsed.annotations) {
    errors.push('faltam anotações');
  }
  if (errors.length) return { ok: false, errors };
  return { ok: true, scenario: parsed };
}
