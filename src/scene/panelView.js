/**
 * Vistas dos painéis: plano texturado com a imagem frontal.
 *
 * Textura primária: recorte da fotografia de Daniel Villafruela
 * (CC BY-SA 3.0; obra original em domínio público) — ver
 * assets/images/panels/manifest.json para metadados completos e
 * limitações de medição (SPEC §8, N4).
 *
 * Os limites de recorte são ESTIMADOS (proporção de larguras publicadas);
 * se o investigador detetar desalinhamento, corrige no manifest e corre
 * `python3 analysis/crop_panels.py` (reprodutível).
 *
 * Fallback: textura placeholder gerada por código, usada apenas se a
 * imagem real falhar ao carregar — nunca se apresenta placeholder como
 * sendo a imagem do painel (rigor histórico, SPEC §8, N3).
 */
import * as THREE from 'three';
import { getPanel } from '../model/panels.js';

const PLACEHOLDER_NOTE = 'TEXTURA PLACEHOLDER — imagem real indisponível';

const textureLoader = new THREE.TextureLoader();

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

  // Carrega a imagem real (recorte ESTIMADO do manifesto, SPEC §8).
  textureLoader.load(
    `./assets/images/panels/${panel.id}.jpg`,
    (tex) => {
      tex.colorSpace = THREE.SRGBColorSpace;
      mat.map?.dispose();
      mat.map = tex;
      mat.needsUpdate = true;
      mesh.userData.imageSource = 'villafruela-2014';
    },
    undefined,
    () => {
      // Fallback mantém a textura placeholder já aplicada (N3).
      console.warn(`Imagem de ${panel.id} indisponível — placeholder activo.`);
    }
  );

  return mesh;
}

/** Cria as vistas dos seis painéis. */
export function createAllPanelViews() {
  return ['frades', 'pescadores', 'infante', 'arcebispo', 'cavaleiros', 'reliquia'].map(
    createPanelView
  );
}
