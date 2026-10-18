/**
 * Vistas dos painéis: plano texturado com a imagem frontal.
 *
 * ENQUANTO NÃO EXISTEM AS IMAGENS OFICIAIS (T004), é aplicada uma textura
 * placeholder gerada por código, claramente identificada como placeholder —
 * nunca se apresenta placeholder como sendo a imagem do painel (rigor
 * histórico, SPEC §8, N3).
 */
import * as THREE from 'three';
import { getPanel } from '../model/panels.js';

const PLACEHOLDER_NOTE = 'TEXTURA PLACEHOLDER — sem imagem oficial (T004)';

/**
 * Textura placeholder: fundo neutro com o nome e o aviso.
 */
function makePlaceholderTexture(panel) {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = Math.round(256 * (panel.height / panel.width));
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#2a2a2a';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = '#737373';
  ctx.lineWidth = 4;
  ctx.strokeRect(2, 2, canvas.width - 4, canvas.height - 4);
  ctx.fillStyle = '#fafafa';
  ctx.font = 'bold 18px Inter, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(panel.name, canvas.width / 2, canvas.height / 2 - 12);
  ctx.fillStyle = '#737373';
  ctx.font = '12px Inter, sans-serif';
  ctx.fillText(
    `${panel.width.toFixed(3)} × ${panel.height.toFixed(3)} m`,
    canvas.width / 2,
    canvas.height / 2 + 12
  );
  ctx.fillText(PLACEHOLDER_NOTE, canvas.width / 2, canvas.height - 16);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/**
 * Cria a malha de um painel: plano vertical de pé no pavimento (base Y=0),
 * proporções das dimensões publicadas, face pintada virada para +Z local
 * (a orientação no espaço é dada por `placeOnWall`).
 *
 * @param {string} id identificador estável do painel
 */
export function createPanelView(id) {
  const panel = getPanel(id);
  const geo = new THREE.PlaneGeometry(panel.width, panel.height);
  const mat = new THREE.MeshBasicMaterial({
    map: makePlaceholderTexture(panel),
    side: THREE.DoubleSide,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.name = `panel-${panel.id}`;
  mesh.userData = { type: 'panel', panelId: panel.id, panel };
  return mesh;
}

/** Cria as vistas dos seis painéis. */
export function createAllPanelViews() {
  return ['frades', 'pescadores', 'infante', 'arcebispo', 'cavaleiros', 'reliquia'].map(
    createPanelView
  );
}
