/**
 * Painel de cenários (T008 — SPEC §6.4, §9): guardar/carregar/APAGAR
 * cenários nomeados no LocalStorage, exportar/importar JSON.
 *
 * UI pura: toda a lógica chega por callbacks (main.js), o que mantém
 * este módulo independente do modelo e da cena.
 *
 * PROVENIÊNCIA visível na UI (SPEC §8, critério 11): um cenário
 * guardado é um EXPERIMENTO (HIPÓTESE) com os traçados do
 * investigador (MEDIDO) — nunca uma reconstrução carregada.
 */

/** Descarrega texto como ficheiro JSON no navegador. */
function downloadJson(filename, text) {
  const blob = new Blob([text], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

const slug = (name) =>
  name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'cenario';

/**
 * @param {HTMLElement} container
 * @param {{repository: object,
 *          save: (name: string, description: string) => ({ok: boolean, scenario?: object, errors?: string[]}),
 *          load: (id: string) => ({ok: boolean, errors?: string[]}),
 *          remove: (id: string) => boolean,
 *          exportJson: (name: string) => string,
 *          importJson: (text: string) => ({ok: boolean, scenario?: object, errors?: string[]}),
 *          seedDefaults: () => ({ok: boolean, count?: number})}} opts
 */
export function createScenarioPanel(container, opts) {
  const hint = document.createElement('p');
  hint.className = 'hint';
  hint.textContent =
    'Cada cenário guarda disposição, painéis, anotações, elementos e câmara ' +
    '(SPEC §6.4). Guardar = registar um EXPERIMENTO (HIPÓTESE) com os seus ' +
    'MEDIDOS — nunca uma reconstrução.';

  const nameInput = document.createElement('input');
  nameInput.type = 'text';
  nameInput.id = 'scenario-name';
  nameInput.placeholder = 'Nome (ex.: A — plana, E — Sé, F — Cortes)';
  nameInput.setAttribute('aria-label', 'Nome do cenário');

  const descInput = document.createElement('input');
  descInput.type = 'text';
  descInput.id = 'scenario-desc';
  descInput.placeholder = 'Hipótese testada (opcional)';
  descInput.setAttribute('aria-label', 'Descrição do cenário');

  const saveBtn = document.createElement('button');
  saveBtn.type = 'button';
  saveBtn.id = 'scenario-save';
  saveBtn.textContent = 'Guardar cenário';

  const list = document.createElement('select');
  list.id = 'scenario-list';
  list.size = 4;
  list.setAttribute('aria-label', 'Cenários guardados');

  const loadBtn = document.createElement('button');
  loadBtn.type = 'button';
  loadBtn.id = 'scenario-load';
  loadBtn.textContent = 'Carregar';

  const delBtn = document.createElement('button');
  delBtn.type = 'button';
  delBtn.id = 'scenario-del';
  delBtn.textContent = 'Apagar';

  const exportBtn = document.createElement('button');
  exportBtn.type = 'button';
  exportBtn.id = 'scenario-export';
  exportBtn.textContent = 'Exportar JSON';
  exportBtn.title = 'Exporta o estado ACTUAL (com o nome acima) como ficheiro JSON';

  const fileInput = document.createElement('input');
  fileInput.type = 'file';
  fileInput.id = 'scenario-import';
  fileInput.accept = '.json,application/json';
  fileInput.hidden = true;

  const importLabel = document.createElement('label');
  importLabel.className = 'file-label';
  importLabel.append('Importar JSON ', fileInput);

  const seedBtn = document.createElement('button');
  seedBtn.type = 'button';
  seedBtn.id = 'scenario-seed';
  seedBtn.textContent = 'Criar A–D predefinidos';
  seedBtn.title = 'Cria os quatro cenários base da SPEC §6.4 (A plana, B angular, C hexágono, D irregular)';

  const row1 = document.createElement('div');
  row1.className = 'btn-row';
  row1.append(saveBtn, exportBtn, importLabel);
  const row2 = document.createElement('div');
  row2.className = 'btn-row';
  row2.append(loadBtn, delBtn, seedBtn);

  const status = document.createElement('p');
  status.id = 'scenario-status';
  status.className = 'hint';

  container.replaceChildren(
    hint,
    nameInput,
    descInput,
    row1,
    list,
    row2,
    status
  );

  function setStatus(text, isError = false) {
    status.textContent = text;
    status.classList.toggle('error', isError);
  }

  function refresh() {
    const items = opts.repository.list();
    list.replaceChildren(
      ...items.map((s) => {
        const opt = document.createElement('option');
        opt.value = s.id;
        const date = s.savedAt ? ` — ${String(s.savedAt).slice(0, 10)}` : '';
        opt.textContent = `${s.name}${date}`;
        return opt;
      })
    );
    const err = opts.repository.lastError;
    if (err) setStatus(err, true);
    else if (!items.length) setStatus('Nenhum cenário guardado.');
    else setStatus(`${items.length} cenário(s) guardado(s).`);
  }

  function selectedId() {
    return list.value || null;
  }

  saveBtn.addEventListener('click', () => {
    const name = nameInput.value.trim();
    if (!name) {
      setStatus('Dê um nome ao cenário antes de guardar.', true);
      return;
    }
    const res = opts.save(name, descInput.value.trim());
    if (!res.ok) {
      setStatus(`Erro ao guardar: ${res.errors.join('; ')}`, true);
      return;
    }
    setStatus(`Cenário «${res.scenario.name}» guardado.`);
    refresh();
    list.value = res.scenario.id;
  });

  loadBtn.addEventListener('click', () => {
    const id = selectedId();
    if (!id) {
      setStatus('Seleccione um cenário para carregar.', true);
      return;
    }
    const res = opts.load(id);
    if (!res.ok) {
      setStatus(`Erro ao carregar: ${(res.errors ?? []).join('; ')}`, true);
      return;
    }
    const scn = opts.repository.get(id);
    setStatus(`Cenário «${scn?.name ?? id}» carregado na cena.`);
  });

  delBtn.addEventListener('click', () => {
    const id = selectedId();
    if (!id) {
      setStatus('Seleccione um cenário para apagar.', true);
      return;
    }
    const scn = opts.repository.get(id);
    opts.remove(id);
    refresh();
    setStatus(`Cenário «${scn?.name ?? id}» apagado.`);
  });

  exportBtn.addEventListener('click', () => {
    const name = nameInput.value.trim() || 'cenario';
    const text = opts.exportJson(name);
    downloadJson(`svicente-${slug(name)}.json`, text);
    setStatus(`Estado actual exportado («${name}»). Ficheiro descarregado.`);
  });

  fileInput.addEventListener('change', () => {
    const file = fileInput.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const res = opts.importJson(String(reader.result));
      if (!res.ok) {
        setStatus(`Importação rejeitada: ${res.errors.join('; ')}`, true);
      } else {
        setStatus(`Cenário «${res.scenario.name}» importado.`);
        refresh();
        list.value = res.scenario.id ?? '';
      }
      fileInput.value = '';
    };
    reader.readAsText(file);
  });

  seedBtn.addEventListener('click', () => {
    const res = opts.seedDefaults();
    if (!res.ok) {
      setStatus('Erro ao criar cenários predefinidos.', true);
      return;
    }
    refresh();
    setStatus(`${res.count} cenários predefinidos (A–D) criados.`);
  });

  refresh();
}
