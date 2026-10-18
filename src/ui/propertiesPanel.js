/**
 * Painel de propriedades com edição numérica (SPEC §5.B).
 *
 * Posição/rotação/dimensões são editáveis por teclado para experiências
 * reproduzíveis. Alterações são notificadas via `onEdit(field, value)` —
 * a aplicação à malha cabe ao chamador (main.js).
 */
import { getPanel, PROVENANCE } from '../model/panels.js';

const ROWS = [
  ['positionX', 'Posição X (m)', 'number', 0.001],
  ['positionY', 'Posição Y (m)', 'number', 0.001],
  ['positionZ', 'Posição Z (m)', 'number', 0.001],
  ['rotationDeg', 'Rotação Y (°)', 'number', 0.5],
  ['width', 'Largura (m)', 'number', 0.001],
  ['height', 'Altura (m)', 'number', 0.001],
  ['distanceToWall', 'Distância à parede (m)', 'number', 0.001],
];

/**
 * @param {HTMLElement} container
 * @param {{onEdit: (field: string, value: number) => void}} opts
 */
export function createPropertiesPanel(container, { onEdit }) {
  const hint = document.createElement('p');
  hint.className = 'hint';
  hint.textContent = 'Seleccione um painel na vista 3D.';

  const form = document.createElement('form');
  form.hidden = true;
  form.addEventListener('submit', (e) => e.preventDefault());

  const title = document.createElement('h2');
  form.append(title);

  const inputs = {};
  for (const [field, label, type, step] of ROWS) {
    const wrap = document.createElement('label');
    wrap.className = 'field';
    wrap.textContent = label;
    const input = document.createElement('input');
    input.type = type;
    input.step = String(step);
    input.addEventListener('change', () => {
      const v = Number(input.value);
      if (Number.isFinite(v)) onEdit(field, v);
    });
    inputs[field] = input;
    wrap.append(input);
    form.append(wrap);
  }

  // Parede associada (SPEC §5.B).
  const wallLabel = document.createElement('label');
  wallLabel.className = 'field';
  wallLabel.textContent = 'Parede associada';
  const wallSelect = document.createElement('select');
  for (let i = 0; i < 6; i++) {
    const opt = document.createElement('option');
    opt.value = String(i);
    opt.textContent = `Parede ${i + 1}`;
    wallSelect.append(opt);
  }
  wallSelect.addEventListener('change', () => {
    onEdit('wallIndex', Number(wallSelect.value));
  });
  wallLabel.append(wallSelect);
  form.append(wallLabel);

  // Orientação da face pintada (SPEC §5.B).
  const flipLabel = document.createElement('label');
  flipLabel.className = 'field';
  flipLabel.textContent = 'Face pintada';
  const flipSelect = document.createElement('select');
  for (const [v, txt] of [
    ['in', 'Virada para o centro'],
    ['out', 'Virada para fora'],
  ]) {
    const opt = document.createElement('option');
    opt.value = v;
    opt.textContent = txt;
    flipSelect.append(opt);
  }
  flipSelect.addEventListener('change', () => {
    onEdit('faceFlipped', flipSelect.value === 'out' ? 1 : 0);
  });
  flipLabel.append(flipSelect);
  form.append(flipLabel);

  const prov = document.createElement('p');
  prov.className = 'provenance';
  form.append(prov);

  const note = document.createElement('p');
  note.className = 'hint';
  note.textContent =
    'Dimensões editadas são ajustes do investigador (HIPÓTESE) — as ' +
    'dimensões publicadas permanecem no modelo (SPEC §3, §8).';
  form.append(note);

  container.replaceChildren(hint, form);

  let currentId = null;

  return {
    /** Mostra o painel seleccionado (ou a dica inicial). */
    show(mesh) {
      if (!mesh || mesh.userData.type !== 'panel') {
        currentId = null;
        container.replaceChildren(hint, form);
        form.hidden = true;
        hint.hidden = false;
        return;
      }
      hint.hidden = true;
      form.hidden = false;
      container.replaceChildren(form);
      const { panel } = mesh.userData;
      currentId = panel.id;
      title.textContent = panel.name;
      prov.textContent = `${PROVENANCE[panel.provenance] ?? panel.provenance} — ${panel.source.label}`;
    },
    /** Sincroniza os campos com o estado actual da malha. */
    sync(mesh) {
      if (!mesh || mesh.userData.panel?.id !== currentId) return;
      const st = mesh.userData.state ?? {};
      inputs.positionX.value = mesh.position.x.toFixed(3);
      inputs.positionY.value = mesh.position.y.toFixed(3);
      inputs.positionZ.value = mesh.position.z.toFixed(3);
      inputs.rotationDeg.value = ((mesh.rotation.y * 180) / Math.PI).toFixed(1);
      inputs.width.value = (st.width ?? getPanel(currentId).width).toFixed(3);
      inputs.height.value = (st.height ?? getPanel(currentId).height).toFixed(3);
      inputs.distanceToWall.value = (st.distanceToWall ?? 0).toFixed(3);
      wallSelect.value = String(st.wallIndex ?? 0);
      flipSelect.value = st.faceFlipped ? 'out' : 'in';
    },
  };
}
