/**
 * Camada 3D das anotações lineares de um painel (SPEC §6.1, critério 7).
 *
 * As linhas são filhas da malha do painel → acompanham automaticamente
 * posição, rotação e escala. Coordenadas normalizadas (UV) convertidas
 * para o plano local do painel (X = u, Y = v, Z ligeiramente à frente).
 */
import * as THREE from 'three';

const Z_OFFSET = 0.004; // metros à frente do plano (evita z-fighting)
const LINE_COLOR = 0x22c55e;
const PREVIEW_COLOR = 0x737373;

/**
 * @param {THREE.Mesh} panelMesh malha do painel (com geometry PlaneGeometry)
 */
export function createAnnotationLayer(panelMesh) {
  const group = new THREE.Group();
  group.name = 'annotations';
  panelMesh.add(group);

  const material = new THREE.LineBasicMaterial({
    color: LINE_COLOR,
    depthTest: false, // visível mesmo quando o painel está de costas
    transparent: true,
  });
  const previewMaterial = new THREE.LineBasicMaterial({
    color: PREVIEW_COLOR,
    depthTest: false,
    transparent: true,
  });

  let preview = null;

  function toLocal(uv) {
    const { width, height } = panelMesh.geometry.parameters;
    return new THREE.Vector3((uv.u - 0.5) * width, (uv.v - 0.5) * height, Z_OFFSET);
  }

  function makeLine(a, b, mat) {
    const geometry = new THREE.BufferGeometry().setFromPoints([toLocal(a), toLocal(b)]);
    const line = new THREE.Line(geometry, mat);
    line.renderOrder = 999; // desenhar por cima da textura
    return line;
  }

  /** Repõe todas as linhas permanentlyes a partir do modelo. */
  function setSegments(segments) {
    for (const child of [...group.children]) {
      if (child !== preview) {
        child.geometry.dispose();
        group.remove(child);
      }
    }
    for (const s of segments) {
      const line = makeLine(s.a, s.b, material);
      line.userData.annotationId = s.id;
      group.add(line);
    }
  }

  /** Linha de pré-visualização durante o traço (ou null para limpar). */
  function setPreview(a, b) {
    if (preview) {
      preview.geometry.dispose();
      group.remove(preview);
      preview = null;
    }
    if (a && b) {
      preview = makeLine(a, b, previewMaterial);
      preview.userData.isPreview = true;
      group.add(preview);
    }
  }

  function setVisible(visible) {
    group.visible = visible;
  }

  function dispose() {
    for (const child of group.children) child.geometry.dispose();
    material.dispose();
    previewMaterial.dispose();
  }

  return { setSegments, setPreview, setVisible, dispose };
}
