/**
 * Painel de arquitetura (B004, H2): adicionar portas/janelas/altar/trono
 * a paredes, listar, remover e mostrar conflitos com painéis.
 *
 * Elementos são HIPÓTESES com dimensões ESTIMADAS (model/architecture.js)
 * — a UI diz-o explicitamente (SPEC §8).
 */
import { ELEMENT_TYPES } from '../model/architecture.js';
import { getPanel } from '../model/panels.js';

/**
 * @param {HTMLElement} container
 * @param {{onAdd: (type: string, wallIndex: number, lateralOffset: number) => void,
 *          onRemove: (elementId: string) => void}} opts
 */
export function createArchitecturePanel(container, { onAdd, onRemove }) {
  const hint = document.createElement('p');
  hint.className = 'hint';
  hint.textContent =
    'Elementos ilustrativos (HIPÓTESE, dimensões ESTIMADAS, SPEC §8) — ' +
    'testam onde os painéis NÃO podem estar (H2).';

  // --- Formulário de adição ---
  const form = document.createElement('form');
  form.className = 'element-form';
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const type = typeSelect.value;
    const wallIndex = Number(wallSelect.value);
    const lateralOffset = Number(offsetInput.value) || 0;
    onAdd(type, wallIndex, lateralOffset);
  });

  const typeSelect = document.createElement('select');
  for (const t of Object.values(ELEMENT_TYPES)) {
    const opt = document.createElement('option');
    opt.value = t.id;
    opt.textContent = t.name;
    typeSelect.append(opt);
  }

  const wallSelect = document.createElement('select');
  function setWallCount(n) {
    wallSelect.replaceChildren();
    for (let i = 0; i < n; i++) {
      const opt = document.createElement('option');
      opt.value = String(i);
      opt.textContent = `Parede ${i + 1}`;
      wallSelect.append(opt);
    }
  }
  setWallCount(6);

  const offsetInput = document.createElement('input');
  offsetInput.type = 'number';
  offsetInput.step = '0.1';
  offsetInput.value = '0';
  offsetInput.title = 'Deslocamento lateral ao longo da parede (m)';

  const addBtn = document.createElement('button');
  addBtn.type = 'submit';
  addBtn.textContent = 'Adicionar';

  const formRow = document.createElement('div');
  formRow.className = 'element-form-row';
  formRow.append(typeSelect, wallSelect, offsetInput, addBtn);
  form.append(formRow);

  // --- Lista de elementos ---
  const list = document.createElement('ul');
  list.className = 'element-list';

  // --- Conflitos ---
  const conflictsTitle = document.createElement('h3');
  conflictsTitle.textContent = 'Conflitos painel × elemento';
  const conflictsList = document.createElement('ul');
  conflictsList.className = 'conflict-list';

  container.replaceChildren(hint, form, list, conflictsTitle, conflictsList);

  return {
    setWallCount,
    /** Reconstrói a lista de elementos. */
    render(elements) {
      list.replaceChildren();
      for (const el of elements) {
        const type = ELEMENT_TYPES[el.type];
        const li = document.createElement('li');
        const label = document.createElement('span');
        label.textContent = `${type.name} — Parede ${el.wallIndex + 1}, offset ${el.lateralOffset} m`;
        const rm = document.createElement('button');
        rm.type = 'button';
        rm.textContent = '×';
        rm.title = `Remover ${type.name}`;
        rm.addEventListener('click', () => onRemove(el.id));
        li.append(label, rm);
        list.append(li);
      }
    },
    /** Mostra conflitos (ou nota de ausência). */
    renderConflicts(conflicts) {
      conflictsList.replaceChildren();
      if (conflicts.length === 0) {
        const li = document.createElement('li');
        li.className = 'hint';
        li.textContent = 'Nenhum conflito — todos os painéis têm espaço livre.';
        conflictsList.append(li);
        return;
      }
      for (const c of conflicts) {
        const li = document.createElement('li');
        li.textContent = `${getPanel(c.panelId).name}: ${c.reason}`;
        conflictsList.append(li);
      }
    },
  };
}
