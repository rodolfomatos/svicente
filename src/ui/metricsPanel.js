/**
 * Painel de métricas (T007, SPEC §7): direções dominantes, pontos de
 * fuga, ângulos diedro entre painéis vizinhos e continuidade
 * transfronteira das linhas do pavimento.
 *
 * PROVENIÊNCIA na UI: traçados = MEDIDO (investigador); cortes de
 * leitura = ESTIMADO (TOLERANCES). Nada aqui conclui hipóteses —
 * quantifica compatibilidade para H1/H2 (SPEC §1, §8).
 */
import { analyzeLayout, TOLERANCES } from '../model/analysis.js';

/**
 * @param {HTMLElement} container
 * @param {() => Array} getPanels dados de mundo + traçados (analyzeLayout)
 */
export function createMetricsPanel(container, { getPanels }) {
  const hint = document.createElement('p');
  hint.className = 'hint';
  hint.textContent =
    'Métricas dos traçados (MEDIDO) e da disposição activa. Cortes de ' +
    'leitura: ±5° e 0,10 m (ESTIMADO). Compatibilidade, não conclusão.';

  const btn = document.createElement('button');
  btn.type = 'button';
  btn.textContent = 'Calcular métricas';

  const out = document.createElement('div');
  out.className = 'metrics-out';

  btn.addEventListener('click', () => render(analyzeLayout(getPanels())));
  container.replaceChildren(hint, btn, out);

  function row(label, value) {
    const li = document.createElement('li');
    const k = document.createElement('span');
    k.textContent = label;
    const v = document.createElement('span');
    v.className = 'metric-value';
    v.textContent = value;
    li.append(k, v);
    return li;
  }

  function render(report) {
    out.replaceChildren();

    // --- Por painel ---
    const hP = document.createElement('h3');
    hP.textContent = 'Por painel (traçados)';
    out.append(hP);
    const ulP = document.createElement('ul');
    ulP.className = 'metrics-list';
    for (const p of report.panels) {
      if (!p.nSegments) {
        ulP.append(row(p.id, 'sem traçados'));
        continue;
      }
      const vp = p.vp
        ? ` VP (${p.vp.u.toFixed(2)}, ${p.vp.v.toFixed(2)}) ±${p.vp.rms.toFixed(3)}`
        : '';
      ulP.append(
        row(
          p.id,
          `${p.nSegments} linha(s) — direção ${p.dominantDeg.toFixed(1)}°` +
            ` (dispersão ${p.spreadDeg.toFixed(1)}°)${vp}`
        )
      );
    }
    out.append(ulP);

    // --- Pares vizinhos ---
    const hPr = document.createElement('h3');
    hPr.textContent = 'Pares vizinhos (disposição activa)';
    out.append(hPr);
    const ulPr = document.createElement('ul');
    ulPr.className = 'metrics-list';
    if (!report.pairs.length) {
      ulPr.append(
        row('—', 'sem pares a menos de ' + TOLERANCES.adjacencyDistanceM + ' m')
      );
    }
    for (const pr of report.pairs) {
      const c = pr.continuity;
      let cont = 'sem traçados na aresta comum';
      if (c.nCandidates) {
        const b = c.best;
        const ok =
          b.angleDeg <= TOLERANCES.continuityAngleDeg &&
          b.gapM <= TOLERANCES.continuityGapM;
        cont =
          `${c.nCandidates} par(es) candidato(s) — melhor: Δ${b.angleDeg.toFixed(1)}°` +
          `, afast. ${b.gapM.toFixed(3)} m → ${ok ? 'CONTÍNUA' : 'QUEBRADA'}` +
          (ok ? '' : ' (excede cortes ESTIMADOS)');
      }
      ulPr.append(
        row(
          `${pr.a} ↔ ${pr.b}`,
          `dist. ${pr.distanceM.toFixed(2)} m — diedro ${pr.dihedralDeg.toFixed(1)}°` +
            ` (${pr.dihedralDeg < 1 ? 'coplanar' : 'não-coplanar'}); ${cont}`
        )
      );
    }
    out.append(ulPr);

    // --- Nota de proveniência (SPEC §8) ---
    const note = document.createElement('p');
    note.className = 'hint';
    note.textContent =
      'Diedro 0° = faces paralelas (linhas de continuidade plausíveis no' +
      ' mesmo plano). Diedro ≠ 0 não falsifica nada: exige que as linhas' +
      ' traçadas expliquem a quebra em 3D (teste de H1/H2).';
    out.append(note);
  }

  return {
    /** Recalcula automaticamente (ex.: após trocar disposição). */
    refresh(report) {
      render(report);
    },
  };
}
