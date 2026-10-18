/**
 * Visor 3D: renderer, câmara perspectiva/ortográfica, OrbitControls,
 * TransformControls, seleção por clique e vistas predefinidas (SPEC §5.A).
 */
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { TransformControls } from 'three/addons/controls/TransformControls.js';

/**
 * @param {HTMLCanvasElement} canvas
 * @param {{onSelect?: (obj: THREE.Object3D|null) => void,
 *          onChange?: (obj: THREE.Object3D) => void,
 *          onDrawPreview?: (panelId: string|null,
 *                           a?: {u:number,v:number},
 *                           b?: {u:number,v:number}) => void,
 *          onDrawSegment?: (panelId: string,
 *                           a: {u:number,v:number},
 *                           b: {u:number,v:number}) => void}} [opts]
 *   onDrawPreview/onDrawSegment: modo de traço de linhas (SPEC §6.1);
 *   durante o traço a orbita é suspensa para não deslizar a câmara.
 */
export function createViewer(
  canvas,
  { onSelect, onChange, onDrawPreview, onDrawSegment } = {}
) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(window.devicePixelRatio);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0a0a0a);
  const aspect = () => canvas.clientWidth / canvas.clientHeight || 1;

  const persp = new THREE.PerspectiveCamera(50, aspect(), 0.05, 100);
  persp.position.set(0, 2, 8);

  const ORTHO_HALF = 5; // meia-extensão em metros
  const ortho = new THREE.OrthographicCamera(
    -ORTHO_HALF,
    ORTHO_HALF,
    ORTHO_HALF,
    -ORTHO_HALF,
    0.05,
    100
  );
  ortho.position.copy(persp.position);
  let active = persp;

  const orbit = new OrbitControls(persp, canvas);
  orbit.enableDamping = true;
  orbit.target.set(0, 1.2, 0);

  // three r170+: TransformControls deixou de ser Object3D — o helper é o
  // objecto que entra na cena (sem isto, scene.add avisava e o gizmo não
  // aparecia; apanhado pelo cheque visual Playwright, T005).
  const transform = new TransformControls(persp, canvas);
  transform.addEventListener('dragging-changed', (e) => {
    orbit.enabled = !e.value;
  });
  transform.addEventListener('objectChange', () => {
    if (selected) onChange?.(selected);
  });
  scene.add(transform.getHelper());

  // --- Seleção por clique (raycast nos painéis) ---
  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  let downPos = null;
  let selected = null;

  function select(obj) {
    selected = obj;
    onSelect?.(obj);
  }

  function hitPanel(e) {
    const rect = canvas.getBoundingClientRect();
    pointer.set(
      ((e.clientX - rect.left) / rect.width) * 2 - 1,
      -((e.clientY - rect.top) / rect.height) * 2 + 1
    );
    raycaster.setFromCamera(pointer, active);
    const hits = raycaster.intersectObjects(
      scene.children.filter((o) => o.userData?.type === 'panel'),
      false
    );
    const hit = hits[0];
    return hit && hit.uv
      ? { object: hit.object, uv: { u: hit.uv.x, v: hit.uv.y } }
      : null;
  }

  // --- Modo de traço de linhas (SPEC §6.1) ---
  let drawMode = false;
  let drawStart = null; // { panelId, a } enquanto se arrasta

  canvas.addEventListener('pointerdown', (e) => {
    downPos = { x: e.clientX, y: e.clientY };
    if (drawMode) {
      const hit = hitPanel(e);
      if (hit) {
        drawStart = { panelId: hit.object.userData.panelId, a: hit.uv };
        orbit.enabled = false; // sem orbitar enquanto se traça
        onDrawPreview?.(drawStart.panelId, drawStart.a, drawStart.a);
      }
    }
  });
  canvas.addEventListener('pointermove', (e) => {
    if (drawStart) {
      const hit = hitPanel(e);
      const b =
        hit && hit.object.userData.panelId === drawStart.panelId ? hit.uv : drawStart.a;
      onDrawPreview?.(drawStart.panelId, drawStart.a, b);
    }
  });
  canvas.addEventListener('pointerup', (e) => {
    if (drawStart) {
      const hit = hitPanel(e);
      const b =
        hit && hit.object.userData.panelId === drawStart.panelId ? hit.uv : drawStart.a;
      const { panelId, a } = drawStart;
      drawStart = null;
      orbit.enabled = true;
      onDrawPreview?.(null);
      if (Math.hypot(b.u - a.u, b.v - a.v) >= 0.005) onDrawSegment?.(panelId, a, b);
      downPos = null;
      return;
    }
    if (!downPos) return;
    const moved = Math.hypot(e.clientX - downPos.x, e.clientY - downPos.y);
    downPos = null;
    if (moved > 4) return; // arrastou: não é selecção
    const hit = hitPanel(e);
    select(hit?.object ?? null);
  });

  // --- Alternação perspectiva/ortográfica (SPEC §5.A, §7) ---
  function setOrthographic(useOrtho) {
    const from = active;
    const to = useOrtho ? ortho : persp;
    to.position.copy(from.position);
    to.quaternion.copy(from.quaternion);
    if (to.isOrthographicCamera) {
      const half =
        ORTHO_HALF *
        (from.isPerspectiveCamera ? from.position.distanceTo(orbit.target) / 8 : 1);
      to.left = -half;
      to.right = half;
      to.top = half;
      to.bottom = -half;
    }
    orbit.object = to;
    transform.camera = to;
    active = to;
    resize();
  }

  // --- Vistas predefinidas (SPEC §5.A) ---
  const VIEWS = {
    frontal: { pos: [0, 1.5, 8], target: [0, 1.2, 0] },
    superior: { pos: [0.01, 9, 0.01], target: [0, 0, 0] },
    lateral: { pos: [8, 1.5, 0], target: [0, 1.2, 0] },
    centro: { pos: [0, 1.6, 0], target: [0, 1.6, -5] },
  };
  function setView(name) {
    const v = VIEWS[name];
    if (!v) throw new Error(`vista desconhecida: ${name}`);
    active.position.set(...v.pos);
    orbit.target.set(...v.target);
    active.updateProjectionMatrix();
  }

  // --- Estado da câmara (SPEC §7: guardado com o cenário, T008) ---
  function getCameraState() {
    return {
      position: {
        x: active.position.x,
        y: active.position.y,
        z: active.position.z,
      },
      target: { x: orbit.target.x, y: orbit.target.y, z: orbit.target.z },
      orthographic: active.isOrthographicCamera === true,
    };
  }

  function setCameraState(state) {
    if (!state) return;
    setOrthographic(Boolean(state.orthographic));
    active.position.set(state.position.x, state.position.y, state.position.z);
    orbit.target.set(state.target.x, state.target.y, state.target.z);
    active.updateProjectionMatrix();
  }

  function resize() {
    const w = canvas.clientWidth || 1;
    const h = canvas.clientHeight || 1;
    renderer.setSize(w, h, false);
    persp.aspect = w / h;
    persp.updateProjectionMatrix();
    const half = ortho.right;
    ortho.left = -half;
    ortho.right = half;
    ortho.top = half * (h / w);
    ortho.bottom = -half * (h / w);
    ortho.updateProjectionMatrix();
  }
  window.addEventListener('resize', resize);
  resize();

  let disposed = false;
  function frame() {
    if (disposed) return;
    requestAnimationFrame(frame);
    orbit.update();
    renderer.render(scene, active);
  }
  frame();

  return {
    scene,
    get camera() {
      return active;
    },
    setOrthographic,
    setView,
    getCameraState,
    setCameraState,
    select,
    /** Liga/desliga o modo de traço de linhas (SPEC §6.1). */
    setDrawMode(on) {
      drawMode = on;
      if (!on && drawStart) {
        drawStart = null;
        orbit.enabled = true;
        onDrawPreview?.(null);
      }
    },
    get drawMode() {
      return drawMode;
    },
    get selected() {
      return selected;
    },
    dispose() {
      disposed = true;
    },
  };
}
