/**
 * Painel de análise: camadas analíticas por painel (SPEC §5.C).
 *
 * T005: camada de linhas do pavimento por painel — contagem de segmentos e
 * visibilidade. Camadas futuras (pontos de fuga, T007) acrescentam-se aqui.
 */
import { getPanel } from '../model/panels.js';

/**
 * @param {HTMLElement} listEl elemento <ul> existente no DOM
 * @param {{onToggle?: (panelId: string, visible: boolean) => void}} [opts]
 */
export function createAnalysisPanel(listEl, { onToggle } = {}) {
  /** @type {Map<string, HTMLInputElement>} checkboxes por painel */
  const checkboxes = new Map();

  /**
   * Reconstrói a lista de camadas de linhas.
   *
   * @param {{id: string}[]} panels todos os painéis
   * @param {(panelId: string) => number} count segmentos por painel
   * @param {(panelId: string) => boolean} isVisible estado de visibilidade
   */
  function renderLines(panels, count, isVisible) {
    listEl.replaceChildren();
    checkboxes.clear();

    const heading = document.createElement('li');
    heading.className = 'layer-heading';
    heading.textContent = 'Linhas do pavimento (T005)';
    listEl.append(heading);

    for (const p of panels) {
      const li = document.createElement('li');
      li.className = 'layer';

      const label = document.createElement('label');
      const cb = document.createElement('input');
      cb.type = 'checkbox';
      cb.checked = isVisible(p.id);
      cb.addEventListener('change', () => onToggle?.(p.id, cb.checked));

      const name = document.createElement('span');
      name.textContent = getPanel(p.id).name;

      const n = document.createElement('span');
      n.className = 'layer-count';
      n.dataset.panelId = p.id;
      n.textContent = String(count(p.id));

      label.append(cb, name);
      li.append(label, n);
      listEl.append(li);
      checkboxes.set(p.id, cb);
    }
  }

  /** Actualiza só as contagens (sem reconstruir — preserva o foco). */
  function updateCounts(count) {
    for (const [panelId, cb] of checkboxes) {
      const li = cb.closest('li');
      const n = li?.querySelector('.layer-count');
      if (n) n.textContent = String(count(panelId));
    }
  }

  function setVisible(panelId, visible) {
    const cb = checkboxes.get(panelId);
    if (cb) cb.checked = visible;
  }

  return { renderLines, updateCounts, setVisible };
}
