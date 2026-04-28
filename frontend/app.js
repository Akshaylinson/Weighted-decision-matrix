const API = 'http://localhost:5000';

const STEP_META = {
  1: 'Define Decision',
  2: 'Criteria Builder',
  3: 'Scoring Matrix',
  4: 'Results Dashboard',
};

const state = {
  decision: {
    id: null,
    title: '',
    context: '',
    constraints: '',
    criteria: [],
    options: [],
  },
  results: null,
  insights: null,
  step: 1,
  history: [],
  sensitivity: null,
  charts: {
    bar: null,
    radar: null,
    pie: null,
  },
};

let idCounter = 0;
const uid = (prefix = 'x') => `${prefix}_${Date.now()}_${++idCounter}`;

async function apiFetch(path, { method = 'GET', body } = {}) {
  const options = {
    method,
    headers: { 'Content-Type': 'application/json' },
  };
  if (body) options.body = JSON.stringify(body);

  const res = await fetch(API + path, options);
  const json = await res.json();
  if (!res.ok || json.status === 'error') {
    throw new Error(json.message || `HTTP ${res.status}`);
  }
  return json.data;
}

function esc(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function toast(msg, type = 'info', duration = 3500) {
  const icons = {
    success: 'OK',
    error: 'ER',
    info: 'IN',
    warning: 'WA',
  };

  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.innerHTML = `<strong>${icons[type] || 'IN'}</strong><span>${esc(msg)}</span>`;
  document.getElementById('toast-container').appendChild(el);

  setTimeout(() => {
    el.classList.add('out');
    setTimeout(() => el.remove(), 300);
  }, duration);
}

function setLoading(btn, loading, originalHTML) {
  if (!btn) return;
  if (loading) {
    btn.disabled = true;
    btn.dataset.originalHtml = btn.innerHTML;
    btn.innerHTML = `<span class="spinner"></span><span>Working...</span>`;
  } else {
    btn.disabled = false;
    btn.innerHTML = originalHTML || btn.dataset.originalHtml || btn.innerHTML;
  }
}

function readDecisionDetails() {
  state.decision.title = document.getElementById('inp-title').value.trim();
  state.decision.context = document.getElementById('inp-context').value.trim();
  state.decision.constraints = document.getElementById('inp-constraints').value.trim();
}

function handleDecisionFieldChange() {
  readDecisionDetails();
  updateStepButtons();
  renderSidebarSnapshot();
}

function validateStep1(showToast = true) {
  readDecisionDetails();
  const title = document.getElementById('inp-title');
  const error = document.getElementById('title-error');
  const valid = Boolean(state.decision.title);

  title.classList.toggle('invalid', !valid);
  error.textContent = valid ? '' : 'A decision title is required before continuing.';

  if (!valid && showToast) {
    toast('Please enter a decision title.', 'error');
  }
  return valid;
}

function canGoToStep(step) {
  if (step === 1) return true;
  if (step === 2) return validateStep1(false);
  if (step === 3) return validateStep1(false) && state.decision.criteria.length > 0;
  if (step === 4) return (
    validateStep1(false) &&
    state.decision.criteria.length > 0 &&
    state.decision.options.length > 0
  );
  return true;
}

function goToStep(step) {
  if (step > 1 && !canGoToStep(step)) {
    if (!validateStep1(false)) {
      validateStep1(true);
      return;
    }
    if (step >= 3 && !state.decision.criteria.length) {
      toast('Add at least one criterion first.', 'warning');
      return;
    }
    if (step >= 4 && !state.decision.options.length) {
      toast('Add at least one option first.', 'warning');
      return;
    }
  }

  state.step = step;
  document.querySelectorAll('.step-panel').forEach((panel) => panel.classList.remove('active'));
  document.getElementById(`step-panel-${step}`)?.classList.add('active');

  document.querySelectorAll('.progress-step').forEach((node) => {
    const nodeStep = Number(node.dataset.step);
    node.classList.toggle('active', nodeStep === step);
    node.classList.toggle('done', nodeStep < step);
  });

  document.querySelectorAll('.step-link').forEach((node) => {
    node.classList.toggle('active', Number(node.dataset.step) === step);
  });

  document.getElementById('progress-step-label').textContent = `Step ${step} of 4`;
  document.getElementById('progress-step-title').textContent = STEP_META[step];
  document.getElementById('progress-track-fill').style.width = `${((step - 1) / 3) * 100}%`;

  updateStepButtons();
}

function switchTab(tabName) {
  document.querySelectorAll('.view').forEach((view) => view.classList.remove('active'));
  document.querySelectorAll('.view-tab').forEach((tab) => tab.classList.remove('active'));
  document.getElementById(`view-${tabName}`)?.classList.add('active');
  document.querySelector(`.view-tab[data-tab="${tabName}"]`)?.classList.add('active');
  
  if (tabName === 'history') {
    loadHistory();
  } else if (tabName === 'timeline') {
    loadTimeline();
  }
}

function renderSidebarSnapshot() {
  const criteriaCount = state.decision.criteria.length;
  const optionsCount = state.decision.options.length;
  const scoreCompletion = getScoreCompletion().percent;
  const checkpoints = [
    validateStep1(false),
    criteriaCount > 0,
    optionsCount > 0,
    scoreCompletion === 100 || Boolean(state.results),
  ];
  const complete = checkpoints.filter(Boolean).length;
  document.getElementById('sidebar-criteria-count').textContent = String(criteriaCount);
  document.getElementById('sidebar-options-count').textContent = String(optionsCount);
  document.getElementById('sidebar-completion').textContent = `${Math.round((complete / checkpoints.length) * 100)}%`;
}

function updateStepButtons() {
  const step1Next = document.getElementById('step1-next');
  const step2Next = document.getElementById('step2-next');
  const exportBtn = document.getElementById('btn-export-pdf');

  if (step1Next) step1Next.disabled = !validateStep1(false);
  if (step2Next) step2Next.disabled = state.decision.criteria.length === 0;
  if (exportBtn) exportBtn.disabled = !state.results;

  updateCriteriaSummary();
  updateScoreSummary();
  renderSidebarSnapshot();
}

function updateCriteriaSummary() {
  const total = state.decision.criteria.reduce((sum, criterion) => sum + Number(criterion.weight || 0), 0);
  const normalized = state.decision.criteria.length ? 'Auto-normalization active' : 'Auto-normalization inactive';
  const fill = Math.min(total, 100);

  document.getElementById('criteria-total-weight').textContent = `${total.toFixed(0)}%`;
  document.getElementById('criteria-status').textContent =
    state.decision.criteria.length === 0 ? 'Needs setup' : total === 100 ? 'Balanced' : 'Will normalize';
  document.getElementById('weight-progress-fill').style.width = `${fill}%`;
  document.getElementById('weight-summary-text').textContent =
    state.decision.criteria.length === 0
      ? 'Add criteria to begin.'
      : `${state.decision.criteria.length} criteria ready for comparison.`;
  document.getElementById('normalization-indicator').textContent = normalized;
}

function invalidateResults() {
  if (!state.results && !state.insights && !state.sensitivity) return;
  state.results = null;
  state.insights = null;
  state.sensitivity = null;
  document.getElementById('winner-callout').classList.remove('active');
  document.getElementById('sensitivity-wrap').innerHTML = '';
  destroyCharts();
  renderResults();
}

function getNormalizedWeight(criterion) {
  const total = state.decision.criteria.reduce((sum, item) => sum + Number(item.weight || 0), 0) || 1;
  return ((Number(criterion.weight || 0) / total) * 100).toFixed(1);
}

function addCriterion(name = '', weight = 20, description = '') {
  invalidateResults();
  state.decision.criteria.push({ id: uid('c'), name, weight, description });
  renderCriteria();
  renderScoringTable();
}

function updateCriterion(id, field, value) {
  const criterion = state.decision.criteria.find((item) => item.id === id);
  if (!criterion) return;
  invalidateResults();
  criterion[field] = field === 'weight' ? Number(value) : value;
  renderCriteria();
  renderScoringTable();
}

function removeCriterion(id) {
  invalidateResults();
  state.decision.criteria = state.decision.criteria.filter((criterion) => criterion.id !== id);
  state.decision.options.forEach((option) => {
    delete option.scores[id];
  });
  renderCriteria();
  renderScoringTable();
}

function renderCriteria() {
  const list = document.getElementById('criteria-list');
  if (!list) return;

  if (!state.decision.criteria.length) {
    list.innerHTML = `
      <div class="criteria-list-empty">
        <p class="empty-copy">No criteria yet. Add one manually or use AI suggestions from the decision brief.</p>
      </div>`;
    updateStepButtons();
    return;
  }

  list.innerHTML = state.decision.criteria.map((criterion, index) => `
    <article class="criteria-card">
      <div class="criteria-heading">
        <div>
          <p class="eyebrow">Criterion ${index + 1}</p>
          <div class="criteria-meta">Weighted factor for evaluation</div>
        </div>
        <span class="normalized-pill">${getNormalizedWeight(criterion)}% normalized</span>
      </div>
      <div class="criteria-body">
        <div>
          <label class="field-label">Name</label>
          <input
            class="field-input"
            value="${esc(criterion.name)}"
            placeholder="e.g. Cost efficiency"
            oninput="updateCriterion('${criterion.id}', 'name', this.value)"
          />
          <label class="field-label" style="margin-top:12px;">Description</label>
          <input
            class="field-input"
            value="${esc(criterion.description || '')}"
            placeholder="What does success look like for this criterion?"
            oninput="updateCriterion('${criterion.id}', 'description', this.value)"
          />
        </div>
        <div class="range-stack">
          <label class="field-label">Weight</label>
          <input
            type="range"
            min="1"
            max="100"
            value="${criterion.weight}"
            oninput="updateCriterion('${criterion.id}', 'weight', this.value)"
          />
          <div class="range-labels">
            <span>Priority</span>
            <strong>${criterion.weight}%</strong>
          </div>
        </div>
        <button class="button button-danger button-icon" onclick="removeCriterion('${criterion.id}')" title="Remove criterion">
          X
        </button>
      </div>
    </article>`).join('');

  updateStepButtons();
}

function addOption(name = '', description = '') {
  invalidateResults();
  state.decision.options.push({ id: uid('o'), name, description, scores: {} });
  renderOptions();
  renderScoringTable();
}

function updateOption(id, field, value) {
  const option = state.decision.options.find((item) => item.id === id);
  if (!option) return;
  invalidateResults();
  option[field] = value;
  renderOptions();
  renderScoringTable();
}

function removeOption(id) {
  invalidateResults();
  state.decision.options = state.decision.options.filter((option) => option.id !== id);
  renderOptions();
  renderScoringTable();
}

function renderOptions() {
  const list = document.getElementById('options-list');
  if (!list) return;

  document.getElementById('options-total-count').textContent = String(state.decision.options.length);

  if (!state.decision.options.length) {
    list.innerHTML = `
      <div class="options-list-empty">
        <p class="empty-copy">No options yet. Add alternatives before filling out the scoring matrix.</p>
      </div>`;
    updateStepButtons();
    return;
  }

  list.innerHTML = state.decision.options.map((option, index) => `
    <article class="option-card">
      <div class="option-heading">
        <div style="display:flex; gap:12px; align-items:center;">
          <div class="option-index">${index + 1}</div>
          <div>
            <p class="eyebrow">Option ${index + 1}</p>
            <div class="criteria-meta">Alternative under consideration</div>
          </div>
        </div>
        <button class="button button-danger button-icon" onclick="removeOption('${option.id}')" title="Remove option">X</button>
      </div>
      <div>
        <label class="field-label">Name</label>
        <input
          class="field-input"
          value="${esc(option.name)}"
          placeholder="e.g. AWS"
          oninput="updateOption('${option.id}', 'name', this.value)"
        />
      </div>
      <div>
        <label class="field-label">Description</label>
        <input
          class="field-input"
          value="${esc(option.description || '')}"
          placeholder="Short summary of this option"
          oninput="updateOption('${option.id}', 'description', this.value)"
        />
      </div>
    </article>`).join('');

  updateStepButtons();
}

function updateScore(optionId, criterionId, value) {
  const option = state.decision.options.find((item) => item.id === optionId);
  if (!option) return;
  invalidateResults();

  if (!value) {
    delete option.scores[criterionId];
  } else {
    option.scores[criterionId] = Math.max(1, Math.min(5, Number(value)));
  }

  updateScoreSummary();
  renderSidebarSnapshot();
}

function getScoreCompletion() {
  const totalCells = state.decision.criteria.length * state.decision.options.length;
  let filled = 0;
  state.decision.options.forEach((option) => {
    state.decision.criteria.forEach((criterion) => {
      if (option.scores[criterion.id]) filled += 1;
    });
  });
  return {
    filled,
    totalCells,
    percent: totalCells ? Math.round((filled / totalCells) * 100) : 0,
  };
}

function updateScoreSummary() {
  const { filled, totalCells, percent } = getScoreCompletion();
  document.getElementById('score-completion').textContent = `${percent}%`;
  document.getElementById('score-cell-count').textContent = `${filled}/${totalCells || 0}`;
}

function renderScoringTable() {
  const wrap = document.getElementById('scoring-table-wrap');
  if (!wrap) return;

  const { criteria, options } = state.decision;
  if (!criteria.length || !options.length) {
    wrap.innerHTML = `
      <div class="table-empty">
        <p class="empty-copy">Add at least one criterion and one option to unlock the scoring matrix.</p>
      </div>`;
    updateScoreSummary();
    updateStepButtons();
    return;
  }

  const header = criteria.map((criterion) => `
    <th>
      <div>${esc(criterion.name || 'Untitled criterion')}</div>
      <div class="field-hint">${criterion.weight}% weight</div>
    </th>`).join('');

  const rows = options.map((option) => `
    <tr>
      <td>
        <div class="score-option-name">${esc(option.name || 'Untitled option')}</div>
        ${option.description ? `<div class="score-option-desc">${esc(option.description)}</div>` : ''}
      </td>
      ${criteria.map((criterion) => `
        <td>
          <input
            type="number"
            min="1"
            max="5"
            step="1"
            class="score-input"
            value="${option.scores[criterion.id] || ''}"
            placeholder="1-5"
            oninput="updateScore('${option.id}', '${criterion.id}', this.value)"
            onchange="updateScore('${option.id}', '${criterion.id}', this.value)"
          />
        </td>`).join('')}
      <td>
        <button
          class="button button-secondary"
          id="ai-score-btn-${option.id}"
          onclick="aiScoreOption('${option.id}')"
        >
          AI Score
        </button>
      </td>
    </tr>`).join('');

  wrap.innerHTML = `
    <div class="table-scroll">
      <table class="score-table">
        <thead>
          <tr>
            <th>Option</th>
            ${header}
            <th>Assist</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
    <div class="score-meta">
      <span>Keyboard friendly numeric inputs. Use AI Score for option-level suggestions.</span>
      <span>Scale: 1 = poor fit, 5 = excellent fit.</span>
    </div>`;

  updateScoreSummary();
  updateStepButtons();
}

async function aiSuggest() {
  if (!validateStep1()) return;

  const btn = document.getElementById('btn-ai-suggest');
  setLoading(btn, true);
  try {
    const data = await apiFetch('/ai/suggest', {
      method: 'POST',
      body: {
        title: state.decision.title,
        context: state.decision.context,
        constraints: state.decision.constraints,
      },
    });

    if (data.criteria?.length) {
      state.decision.criteria = data.criteria.map((criterion) => ({
        id: uid('c'),
        name: criterion.name,
        weight: criterion.weight || 20,
        description: criterion.description || '',
      }));
    }

    if (data.options?.length) {
      state.decision.options = data.options.map((option) => ({
        id: uid('o'),
        name: option.name,
        description: option.description || '',
        scores: {},
      }));
    }

    const rationaleCard = document.getElementById('ai-rationale-card');
    const rationale = document.getElementById('ai-rationale');
    if (data.rationale) {
      rationale.textContent = data.rationale;
      rationaleCard.classList.remove('hidden');
    }

    renderCriteria();
    renderOptions();
    renderScoringTable();
    goToStep(2);
    toast('AI suggestions loaded. Review and refine them before scoring.', 'success');
  } catch (error) {
    toast(`AI Suggest failed: ${error.message}`, 'error', 5000);
  } finally {
    setLoading(btn, false);
  }
}

async function aiScoreOption(optionId) {
  const option = state.decision.options.find((item) => item.id === optionId);
  if (!option) return;
  if (!state.decision.criteria.length) {
    toast('Add criteria first.', 'warning');
    return;
  }

  const btn = document.getElementById(`ai-score-btn-${optionId}`);
  setLoading(btn, true);
  try {
    const data = await apiFetch('/ai/score', {
      method: 'POST',
      body: {
        title: state.decision.title,
        context: state.decision.context,
        option,
        criteria: state.decision.criteria,
      },
    });

    if (data.scores) {
      state.decision.criteria.forEach((criterion) => {
        const value = data.scores[criterion.id] ?? data.scores[criterion.name];
        if (value !== undefined) {
          option.scores[criterion.id] = Math.max(1, Math.min(5, Number(value)));
        }
      });
      renderScoringTable();
      toast(`Scores set for "${option.name || 'option'}".`, 'success');
    }
  } catch (error) {
    toast(`AI Score failed: ${error.message}`, 'error', 5000);
  } finally {
    setLoading(btn, false);
  }
}

async function calculateScores() {
  if (!state.decision.criteria.length) {
    toast('Add criteria first.', 'warning');
    return;
  }
  if (!state.decision.options.length) {
    toast('Add options first.', 'warning');
    return;
  }

  let missing = false;
  state.decision.options.forEach((option) => {
    state.decision.criteria.forEach((criterion) => {
      if (!option.scores[criterion.id]) missing = true;
    });
  });

  if (missing) {
    toast('Some scores are missing. Fill in every cell or use AI Score.', 'warning', 4500);
    return;
  }

  const btn = document.getElementById('btn-calculate');
  setLoading(btn, true);
  try {
    const data = await apiFetch('/engine/calculate', {
      method: 'POST',
      body: {
        criteria: state.decision.criteria,
        options: state.decision.options,
      },
    });

    state.results = data.ranked_options;
    state.decision.criteria = data.normalized_criteria;
    renderCriteria();
    renderResults();
    goToStep(4);
    toast('Results calculated successfully.', 'success');
  } catch (error) {
    toast(`Calculation failed: ${error.message}`, 'error', 5000);
  } finally {
    setLoading(btn, false);
  }
}

function renderResults() {
  const wrap = document.getElementById('results-wrap');
  if (!wrap) return;

  if (!state.results?.length) {
    wrap.innerHTML = `<div class="table-empty"><p class="empty-copy">Run a calculation to populate the dashboard.</p></div>`;
    document.getElementById('score-breakdown-wrap').innerHTML = `<div class="table-empty"><p class="empty-copy">Breakdown table will appear here after scoring.</p></div>`;
    document.getElementById('insights-wrap').innerHTML = `<div class="insights-empty"><p class="empty-copy">Generate AI insights after the results are ready.</p></div>`;
    document.getElementById('winner-callout').innerHTML = `<p class="empty-copy">No recommendation yet. Calculate scores to see the leading option.</p>`;
    destroyCharts();
    updateStepButtons();
    return;
  }

  const winner = state.results[0];
  const runnerUp = state.results[1];
  const maxScore = winner.total_score || 1;

  wrap.innerHTML = state.results.map((result) => {
    const pct = Math.max(6, Math.round((result.total_score / maxScore) * 100));
    const badgeClass = result.rank === 1 ? 'rank-1' : result.rank === 2 ? 'rank-2' : result.rank === 3 ? 'rank-3' : '';
    const badgeText = result.rank <= 3 ? `#${result.rank}` : String(result.rank);

    return `
      <article class="result-item">
        <div class="result-item-header">
          <div class="rank-badge ${badgeClass}">${badgeText}</div>
          <div class="result-info">
            <h4>${esc(result.name)}</h4>
            <div class="result-meta">
              <span>Total Score: ${result.total_score.toFixed(1)}</span>
              <span>${result.breakdown.length} criteria evaluated</span>
            </div>
          </div>
        </div>
        <div class="result-scorebar">
          <div class="result-scorebar-fill" style="width:${pct}%"></div>
        </div>
      </article>`;
  }).join('');

  document.getElementById('winner-callout').classList.add('active');
  document.getElementById('winner-callout').innerHTML = `
    <span class="winner-label">Recommended Choice</span>
    <div class="winner-name">${esc(winner.name)}</div>
    <p class="result-meta">Highest weighted score across the full criteria set.</p>
    <div class="summary-metrics">
      <div class="metric-card">
        <span>Final Score</span>
        <strong>${winner.total_score.toFixed(1)}</strong>
      </div>
      <div class="metric-card">
        <span>Confidence Gap</span>
        <strong>${runnerUp ? (winner.total_score - runnerUp.total_score).toFixed(1) : 'N/A'}</strong>
      </div>
      <div class="metric-card">
        <span>Leading Rank</span>
        <strong>#1</strong>
      </div>
    </div>`;

  document.getElementById('top-score-metric').textContent = winner.total_score.toFixed(1);
  document.getElementById('score-gap-metric').textContent = runnerUp
    ? (winner.total_score - runnerUp.total_score).toFixed(1)
    : 'N/A';
  document.getElementById('weighted-criteria-metric').textContent = `${state.decision.criteria.length}`;
  document.getElementById('results-subtitle').textContent =
    `${state.decision.title || 'Decision'} evaluated across ${state.decision.criteria.length} weighted criteria and ${state.decision.options.length} options.`;

  document.getElementById('score-breakdown-wrap').innerHTML = renderBreakdownTable();

  const sensitivitySelect = document.getElementById('sensitivity-criterion-sel');
  sensitivitySelect.innerHTML = state.decision.criteria.map((criterion) => `
    <option value="${criterion.id}">${esc(criterion.name)}</option>`).join('');

  if (!state.insights) {
    document.getElementById('insights-wrap').innerHTML = `
      <div class="insights-empty">
        <p class="empty-copy">AI insights are ready to generate. Use the button above for pros, cons, risks, and recommendation commentary.</p>
      </div>`;
  } else {
    renderInsights(state.insights);
  }

  renderCharts();
  updateStepButtons();
}

function renderBreakdownTable() {
  const criteria = state.decision.criteria;
  const optionMap = new Map(state.decision.options.map((option) => [option.name, option]));
  const header = state.results.map((result) => `<th>${esc(result.name)}</th>`).join('');

  const rows = criteria.map((criterion) => {
    const scoreCells = state.results.map((result) => {
      const option = optionMap.get(result.name);
      const score = option?.scores?.[criterion.id] || '-';
      return `<td>${score}</td>`;
    }).join('');

    return `
      <tr>
        <td>${esc(criterion.name)}</td>
        <td>${Number(criterion.weight).toFixed(1)}%</td>
        ${scoreCells}
      </tr>`;
  }).join('');

  return `
    <div class="table-scroll">
      <table class="breakdown-table">
        <thead>
          <tr>
            <th>Criterion</th>
            <th>Weight</th>
            ${header}
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>`;
}

function destroyCharts() {
  Object.values(state.charts).forEach((chart) => {
    if (chart) chart.destroy();
  });
  state.charts = { bar: null, radar: null, pie: null };
}

function chartPalette(index, alpha = 1) {
  const colors = [
    [139, 92, 246],
    [37, 99, 235],
    [16, 185, 129],
    [245, 158, 11],
    [244, 114, 182],
    [56, 189, 248],
  ];
  const [r, g, b] = colors[index % colors.length];
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function renderCharts() {
  destroyCharts();
  if (!window.Chart || !state.results?.length) return;

  const labels = state.results.map((result) => result.name);
  const totalScores = state.results.map((result) => Number(result.total_score.toFixed(2)));
  const criteriaLabels = state.decision.criteria.map((criterion) => criterion.name);

  state.charts.bar = new Chart(document.getElementById('bar-chart'), {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: 'Total Score',
        data: totalScores,
        borderRadius: 14,
        backgroundColor: labels.map((_, index) => chartPalette(index, 0.7)),
        borderColor: labels.map((_, index) => chartPalette(index, 1)),
        borderWidth: 1,
      }],
    },
    options: buildChartOptions({ legend: false }),
  });

  state.charts.radar = new Chart(document.getElementById('radar-chart'), {
    type: 'radar',
    data: {
      labels: criteriaLabels,
      datasets: state.results.map((result, index) => ({
        label: result.name,
        data: state.decision.criteria.map((criterion) => {
          const item = result.breakdown.find((entry) => entry.criterion_name === criterion.name);
          return item ? Number(item.raw_score) : 0;
        }),
        borderColor: chartPalette(index, 1),
        backgroundColor: chartPalette(index, 0.15),
        pointBackgroundColor: chartPalette(index, 1),
      })),
    },
    options: buildChartOptions({ radar: true }),
  });

  state.charts.pie = new Chart(document.getElementById('pie-chart'), {
    type: 'pie',
    data: {
      labels: criteriaLabels,
      datasets: [{
        data: state.decision.criteria.map((criterion) => Number(criterion.weight)),
        backgroundColor: state.decision.criteria.map((_, index) => chartPalette(index, 0.8)),
        borderColor: state.decision.criteria.map((_, index) => chartPalette(index, 1)),
        borderWidth: 1,
      }],
    },
    options: buildChartOptions({ pie: true }),
  });
}

function buildChartOptions({ legend = true, radar = false, pie = false } = {}) {
  const light = 'rgba(226, 232, 240, 0.82)';
  const grid = 'rgba(148, 163, 184, 0.12)';

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: legend,
        labels: {
          color: light,
        },
      },
    },
  };

  if (pie) return options;

  if (radar) {
    options.scales = {
      r: {
        suggestedMin: 0,
        suggestedMax: 5,
        angleLines: { color: grid },
        grid: { color: grid },
        pointLabels: { color: light },
        ticks: {
          color: light,
          backdropColor: 'transparent',
        },
      },
    };
    return options;
  }

  options.scales = {
    x: {
      ticks: { color: light },
      grid: { color: 'transparent' },
    },
    y: {
      beginAtZero: true,
      ticks: { color: light },
      grid: { color: grid },
    },
  };
  return options;
}

async function generateInsights() {
  if (!state.results) {
    toast('Calculate scores first.', 'warning');
    return;
  }

  const btn = document.getElementById('btn-insights');
  setLoading(btn, true);
  try {
    const data = await apiFetch('/ai/insights', {
      method: 'POST',
      body: {
        title: state.decision.title,
        context: state.decision.context,
        results: state.results,
        criteria: state.decision.criteria,
      },
    });
    state.insights = data;
    renderInsights(data);
    toast('AI insights generated.', 'success');
  } catch (error) {
    toast(`Insights failed: ${error.message}`, 'error', 5000);
  } finally {
    setLoading(btn, false);
  }
}

function renderInsightList(title, className, icon, items) {
  if (!items?.length) return '';
  return `
    <article class="insight-card ${className}">
      <div class="insight-title">
        <span>${icon}</span>
        <h4>${title}</h4>
      </div>
      <ul class="insight-list">
        ${items.map((item) => `<li>${esc(item)}</li>`).join('')}
      </ul>
    </article>`;
}

function renderInsights(insights) {
  const wrap = document.getElementById('insights-wrap');
  if (!wrap) return;

  wrap.innerHTML = `
    <article class="insight-card explanation">
      <div class="insight-title">
        <span>AI</span>
        <h4>Explanation</h4>
      </div>
      <p>${esc(insights.explanation || '')}</p>
    </article>
    ${renderInsightList('Pros', 'pros', '+', insights.pros)}
    ${renderInsightList('Cons', 'cons', '-', insights.cons)}
    ${renderInsightList('Risks', 'risks', '!', insights.risks)}
    ${insights.recommendation ? `
      <article class="insight-card recommendation">
        <div class="insight-title">
          <span>GO</span>
          <h4>Recommendation</h4>
        </div>
        <p>${esc(insights.recommendation)}</p>
      </article>` : ''}`;
}

async function runSensitivity() {
  const select = document.getElementById('sensitivity-criterion-sel');
  if (!select?.value) {
    toast('Select a criterion.', 'warning');
    return;
  }
  if (!state.results) {
    toast('Calculate scores first.', 'warning');
    return;
  }

  const btn = document.getElementById('btn-sensitivity');
  setLoading(btn, true);
  try {
    const data = await apiFetch('/engine/sensitivity', {
      method: 'POST',
      body: {
        criteria: state.decision.criteria,
        options: state.decision.options,
        target_criterion_id: select.value,
      },
    });
    state.sensitivity = data;
    renderSensitivityChart(data, select.options[select.selectedIndex].text);
    toast('Sensitivity analysis updated.', 'success');
  } catch (error) {
    toast(`Sensitivity failed: ${error.message}`, 'error', 5000);
  } finally {
    setLoading(btn, false);
  }
}

function renderSensitivityChart(data, criterionName) {
  const wrap = document.getElementById('sensitivity-wrap');
  if (!wrap) return;

  if (!data?.length) {
    wrap.innerHTML = `<div class="sensitivity-empty"><p class="empty-copy">No sensitivity data returned.</p></div>`;
    return;
  }

  const width = 680;
  const height = 260;
  const padding = { top: 20, right: 24, bottom: 40, left: 50 };
  const plotWidth = width - padding.left - padding.right;
  const plotHeight = height - padding.top - padding.bottom;
  const optionNames = [...new Set(data.flatMap((point) => point.rankings.map((item) => item.name)))];

  const xScale = (i) => padding.left + (plotWidth * i) / Math.max(1, data.length - 1);
  const yScale = (value) => padding.top + plotHeight - (plotHeight * value) / 100;

  const grid = [0, 25, 50, 75, 100].map((value) => `
    <g>
      <line x1="${padding.left}" x2="${width - padding.right}" y1="${yScale(value)}" y2="${yScale(value)}" stroke="rgba(148,163,184,0.18)" />
      <text x="${padding.left - 8}" y="${yScale(value)}" text-anchor="end" fill="#94a3b8" font-size="11" dominant-baseline="middle">${value}</text>
    </g>`).join('');

  const lines = optionNames.map((name, index) => {
    const points = data.map((point, i) => {
      const ranking = point.rankings.find((item) => item.name === name);
      return `${xScale(i)},${yScale(ranking ? ranking.total_score : 0)}`;
    }).join(' ');
    return `<polyline fill="none" stroke="${chartPalette(index, 1)}" stroke-width="3" points="${points}" />`;
  }).join('');

  const labels = data.map((point, i) => `
    <text x="${xScale(i)}" y="${height - 12}" text-anchor="middle" fill="#94a3b8" font-size="10">${point.target_weight}%</text>`).join('');

  const legend = optionNames.map((name, index) => `
    <div style="display:flex;align-items:center;gap:8px;">
      <span style="width:12px;height:12px;border-radius:999px;background:${chartPalette(index, 1)};"></span>
      <span>${esc(name)}</span>
    </div>`).join('');

  wrap.innerHTML = `
    <div class="criteria-meta" style="margin-bottom:14px;">
      Sensitivity view for <strong>${esc(criterionName)}</strong> from 0% to 100% target weight.
    </div>
    <div class="table-scroll" style="padding:14px;">
      <svg viewBox="0 0 ${width} ${height}" role="img" aria-label="Sensitivity analysis chart">
        ${grid}
        ${lines}
        ${labels}
      </svg>
    </div>
    <div class="inline-stats" style="margin-top:12px;">${legend}</div>`;
}

async function exportResultsAsPDF() {
  if (!state.results) {
    toast('Calculate results before exporting.', 'warning');
    return;
  }
  if (!window.html2canvas || !window.jspdf) {
    toast('PDF libraries are not available.', 'error');
    return;
  }

  const button = document.getElementById('btn-export-pdf');
  setLoading(button, true);
  const section = document.getElementById('results-section');
  section.classList.add('pdf-export-mode');

  try {
    await new Promise((resolve) => setTimeout(resolve, 250));
    const canvas = await html2canvas(section, {
      backgroundColor: '#ffffff',
      scale: 2,
      useCORS: true,
      scrollY: -window.scrollY,
    });

    const imgData = canvas.toDataURL('image/png');
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const imgHeight = (canvas.height * pageWidth) / canvas.width;
    let heightLeft = imgHeight;
    let position = 0;

    pdf.addImage(imgData, 'PNG', 0, position, pageWidth, imgHeight);
    heightLeft -= pageHeight;

    while (heightLeft > 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, pageWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    const safeTitle = (state.decision.title || 'decision-report')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
    pdf.save(`${safeTitle || 'decision-report'}.pdf`);
    toast('PDF report exported successfully.', 'success');
  } catch (error) {
    toast(`PDF export failed: ${error.message}`, 'error', 5000);
  } finally {
    section.classList.remove('pdf-export-mode');
    setLoading(button, false);
  }
}

async function saveDecision() {
  if (!state.decision.title) {
    toast('No decision to save.', 'warning');
    return;
  }

  const btn = document.getElementById('btn-save');
  setLoading(btn, true);
  try {
    const payload = {
      ...state.decision,
      final_choice: state.results?.[0]?.name || '',
      ranked_results: state.results || [],
      insights: state.insights || null,
    };
    const data = await apiFetch('/decisions', { method: 'POST', body: payload });
    state.decision.id = data.id;
    toast('Decision saved successfully.', 'success');
  } catch (error) {
    toast(`Save failed: ${error.message}`, 'error', 5000);
  } finally {
    setLoading(btn, false);
  }
}

async function loadHistory() {
  const wrap = document.getElementById('history-list');
  wrap.innerHTML = `<div class="history-empty"><span class="spinner"></span></div>`;
  try {
    const data = await apiFetch('/decisions');
    state.history = data;
    renderHistory(data);
  } catch (error) {
    wrap.innerHTML = `<div class="history-empty"><p class="empty-copy">Failed to load history: ${esc(error.message)}</p></div>`;
  }
}

function renderHistory(list) {
  const wrap = document.getElementById('history-list');
  if (!list.length) {
    wrap.innerHTML = `<div class="history-empty"><p class="empty-copy">No saved decisions yet.</p></div>`;
    return;
  }

  wrap.innerHTML = list.map((decision) => `
    <article class="history-card" onclick="loadDecision('${decision.id}')">
      <div class="history-meta">
        <p class="history-title">${esc(decision.title)}</p>
        <p class="history-date">
          ${formatDate(decision.timestamp)} · ${decision.criteria_count} criteria · ${decision.options_count} options
          ${decision.final_choice ? ` · Winner: <strong>${esc(decision.final_choice)}</strong>` : ''}
        </p>
      </div>
      <div class="action-cluster">
        <button class="button button-ghost" onclick="event.stopPropagation(); deleteDecision('${decision.id}')">Delete</button>
      </div>
    </article>`).join('');
}

async function loadDecision(id) {
  try {
    const decision = await apiFetch(`/decisions/${id}`);
    state.decision = {
      id: decision.id,
      title: decision.title || '',
      context: decision.context || '',
      constraints: decision.constraints || '',
      criteria: decision.criteria || [],
      options: decision.options || [],
    };
    state.results = decision.ranked_results || null;
    state.insights = decision.insights || null;
    state.sensitivity = null;

    document.getElementById('inp-title').value = state.decision.title;
    document.getElementById('inp-context').value = state.decision.context;
    document.getElementById('inp-constraints').value = state.decision.constraints;

    renderCriteria();
    renderOptions();
    renderScoringTable();
    if (state.results) renderResults();
    else {
      state.insights = null;
      renderResults();
    }

    switchTab('builder');
    goToStep(state.results ? 4 : 2);
    toast(`Loaded "${decision.title}".`, 'success');
  } catch (error) {
    toast(`Load failed: ${error.message}`, 'error', 5000);
  }
}

async function deleteDecision(id) {
  if (!confirm('Delete this decision?')) return;
  try {
    await apiFetch(`/decisions/${id}`, { method: 'DELETE' });
    toast('Decision deleted.', 'success');
    loadHistory();
  } catch (error) {
    toast(`Delete failed: ${error.message}`, 'error', 5000);
  }
}

async function searchHistory() {
  const query = document.getElementById('history-search').value.trim();
  const path = query ? `/decisions/search?q=${encodeURIComponent(query)}` : '/decisions';
  try {
    const data = await apiFetch(path);
    renderHistory(data);
  } catch (error) {
    toast(`Search failed: ${error.message}`, 'error');
  }
}

function resetResultsView() {
  state.results = null;
  state.insights = null;
  state.sensitivity = null;
  document.getElementById('winner-callout').classList.remove('active');
  document.getElementById('sensitivity-wrap').innerHTML = '';
  destroyCharts();
  renderResults();
}

function newDecision() {
  if (!confirm('Start a new decision? Current unsaved data will be lost.')) return;
  state.decision = {
    id: null,
    title: '',
    context: '',
    constraints: '',
    criteria: [],
    options: [],
  };
  document.getElementById('inp-title').value = '';
  document.getElementById('inp-context').value = '';
  document.getElementById('inp-constraints').value = '';
  document.getElementById('ai-rationale-card').classList.add('hidden');
  document.getElementById('ai-rationale').textContent = '';
  resetResultsView();
  renderCriteria();
  renderOptions();
  renderScoringTable();
  switchTab('builder');
  goToStep(1);
  toast('New decision started.', 'info');
}

function formatDate(iso) {
  if (!iso) return '-';
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return iso;
  }
}

document.addEventListener('DOMContentLoaded', () => {
  goToStep(1);
  renderCriteria();
  renderOptions();
  renderScoringTable();
  renderResults();
  renderSidebarSnapshot();
  initializeSpeechRecognition();

  apiFetch('/health').then((data) => {
    const pill = document.getElementById('ai-status-pill');
    if (!data.ai_configured) {
      pill.textContent = 'AI Key Missing';
      toast('AI is not configured. Add OPENAI_API_KEY to .env.', 'warning', 7000);
    } else {
      pill.textContent = 'AI Connected';
    }
  }).catch(() => {
    document.getElementById('ai-status-pill').textContent = 'Backend Offline';
    toast('Cannot connect to backend. Is Flask running on port 5000?', 'error', 8000);
  });
});

/* ════════════════════════════════════════════════
   Speech-to-Text (Web Speech API)
   ════════════════════════════════════════════════ */
let recognition = null;
let isListening = false;
let finalTranscript = '';
let lastInterimTranscript = '';

function initializeSpeechRecognition() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const micButton = document.getElementById('mic-button');
  const micStatus = document.getElementById('mic-status');

  if (!SpeechRecognition) {
    if (micButton) {
      micButton.disabled = true;
      micButton.title = 'Speech recognition not supported in this browser';
    }
    console.warn('Web Speech API not supported in this browser.');
    return;
  }

  recognition = new SpeechRecognition();
  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.lang = 'en-US';
  recognition.maxAlternatives = 1;

  recognition.onstart = () => {
    isListening = true;
    micButton.classList.add('listening');
    micStatus.classList.add('active', 'listening');
    micStatus.innerHTML = '<span class="mic-status-dot"></span><span>Listening...</span>';
  };

  recognition.onresult = (event) => {
    let interimTranscript = '';
    
    for (let i = event.resultIndex; i < event.results.length; i++) {
      const transcript = event.results[i][0].transcript;
      
      if (event.results[i].isFinal) {
        finalTranscript += transcript + ' ';
      } else {
        interimTranscript += transcript;
      }
    }

    const textarea = document.getElementById('inp-context');
    if (textarea) {
      textarea.value = (finalTranscript + interimTranscript).trim();
      lastInterimTranscript = interimTranscript;
      
      textarea.scrollTop = textarea.scrollHeight;
      handleDecisionFieldChange();
    }
  };

  recognition.onerror = (event) => {
    console.error('Speech recognition error:', event.error);
    
    let errorMessage = 'Speech recognition error';
    switch (event.error) {
      case 'not-allowed':
      case 'permission-denied':
        errorMessage = 'Microphone permission denied. Please allow microphone access.';
        break;
      case 'no-speech':
        return;
      case 'audio-capture':
        errorMessage = 'No microphone found. Please connect a microphone.';
        break;
      case 'network':
        errorMessage = 'Network error occurred during speech recognition.';
        break;
      case 'aborted':
        return;
      default:
        errorMessage = `Speech recognition error: ${event.error}`;
    }
    
    toast(errorMessage, 'error', 5000);
    stopSpeechRecognition();
  };

  recognition.onend = () => {
    if (isListening) {
      try {
        recognition.start();
      } catch (e) {
        stopSpeechRecognition();
      }
    }
  };
}

function toggleSpeechRecognition() {
  if (!recognition) {
    toast('Speech recognition is not available in this browser.', 'warning');
    return;
  }

  if (isListening) {
    stopSpeechRecognition();
  } else {
    startSpeechRecognition();
  }
}

function startSpeechRecognition() {
  if (!recognition) return;
  
  const textarea = document.getElementById('inp-context');
  if (textarea && textarea.value.trim()) {
    finalTranscript = textarea.value.trim() + ' ';
  } else {
    finalTranscript = '';
  }
  
  lastInterimTranscript = '';

  try {
    recognition.start();
    toast('Voice input started. Speak naturally.', 'info', 2000);
  } catch (error) {
    console.error('Failed to start recognition:', error);
    toast('Failed to start voice input. Please try again.', 'error');
  }
}

function stopSpeechRecognition() {
  if (!recognition) return;
  
  isListening = false;
  const micButton = document.getElementById('mic-button');
  const micStatus = document.getElementById('mic-status');
  
  try {
    recognition.stop();
  } catch (error) {
    console.error('Error stopping recognition:', error);
  }
  
  if (micButton) {
    micButton.classList.remove('listening');
  }
  
  if (micStatus) {
    micStatus.classList.remove('active', 'listening');
  }
  
  const textarea = document.getElementById('inp-context');
  if (textarea && finalTranscript) {
    textarea.value = finalTranscript.trim();
    handleDecisionFieldChange();
  }
  
  finalTranscript = '';
  lastInterimTranscript = '';
}

/* ════════════════════════════════════════════════
   Decision Timeline & Learning System
   ════════════════════════════════════════════════ */
let currentReviewDecisionId = null;
let currentReviewCorrect = null;

async function loadTimeline() {
  const wrap = document.getElementById('timeline-list');
  if (!wrap) return;
  
  wrap.innerHTML = '<div class="table-empty"><span class="spinner"></span></div>';
  
  try {
    const data = await apiFetch('/decisions/timeline');
    renderTimeline(data);
    updateTimelineStats(data);
  } catch (error) {
    wrap.innerHTML = `<div class="table-empty"><p class="empty-copy">Failed to load timeline: ${esc(error.message)}</p></div>`;
  }
}

function updateTimelineStats(decisions) {
  const total = decisions.length;
  const reviewed = decisions.filter(d => d.outcome?.status === 'reviewed').length;
  const correct = decisions.filter(d => d.outcome?.correct === true).length;
  const incorrect = decisions.filter(d => d.outcome?.correct === false).length;
  const pending = total - reviewed;
  
  document.getElementById('stat-total').textContent = String(total);
  document.getElementById('stat-reviewed').textContent = String(reviewed);
  document.getElementById('stat-correct').textContent = String(correct);
  document.getElementById('stat-incorrect').textContent = String(incorrect);
  document.getElementById('stat-pending').textContent = String(pending);
}

function renderTimeline(decisions) {
  const wrap = document.getElementById('timeline-list');
  if (!wrap) return;
  
  if (!decisions.length) {
    wrap.innerHTML = '<div class="table-empty"><p class="empty-copy">No decisions yet. Create your first decision to start learning.</p></div>';
    return;
  }
  
  wrap.innerHTML = `<div class="timeline-list">${decisions.map(decision => {
    const date = decision.timestamp ? new Date(decision.timestamp) : new Date();
    const day = date.getDate();
    const month = date.toLocaleDateString('en-US', { month: 'short' });
    
    const outcome = decision.outcome || { status: 'pending', correct: null };
    let badgeClass = 'pending';
    let badgeText = '⏳ Pending Review';
    
    if (outcome.status === 'reviewed') {
      if (outcome.correct === true) {
        badgeClass = 'correct';
        badgeText = '✅ Correct Decision';
      } else if (outcome.correct === false) {
        badgeClass = 'incorrect';
        badgeText = '❌ Incorrect Decision';
      }
    }
    
    return `
      <article class="timeline-item" onclick="openDecisionModal('${decision.id}')">
        <div class="timeline-date">
          <span class="timeline-date-day">${day}</span>
          <span class="timeline-date-month">${month}</span>
        </div>
        <div class="timeline-content">
          <h4>${esc(decision.title)}</h4>
          <div class="timeline-meta">
            <span>${decision.criteria_count} criteria</span>
            <span>•</span>
            <span>${decision.options_count} options</span>
            ${decision.final_choice ? `
              <span>•</span>
              <span class="timeline-choice">
                <span>🎯</span>
                <span>${esc(decision.final_choice)}</span>
              </span>
            ` : ''}
          </div>
        </div>
        <div class="outcome-badge ${badgeClass}">${badgeText}</div>
      </article>
    `;
  }).join('')}</div>`;
}

async function openDecisionModal(decisionId) {
  const modal = document.getElementById('decision-modal');
  const modalBody = document.getElementById('modal-body');
  const modalTitle = document.getElementById('modal-title');
  
  currentReviewDecisionId = decisionId;
  currentReviewCorrect = null;
  
  modalBody.innerHTML = '<div class="table-empty"><span class="spinner"></span></div>';
  modal.classList.add('active');
  
  try {
    const decision = await apiFetch(`/decisions/${decisionId}`);
    modalTitle.textContent = decision.title || 'Decision Details';
    renderDecisionModal(decision);
  } catch (error) {
    modalBody.innerHTML = `<div class="table-empty"><p class="empty-copy">Failed to load decision: ${esc(error.message)}</p></div>`;
  }
}

function closeDecisionModal() {
  const modal = document.getElementById('decision-modal');
  modal.classList.remove('active');
  currentReviewDecisionId = null;
  currentReviewCorrect = null;
  
  if (document.getElementById('view-timeline').classList.contains('active')) {
    loadTimeline();
  }
}

function renderDecisionModal(decision) {
  const modalBody = document.getElementById('modal-body');
  const outcome = decision.outcome || { status: 'pending', correct: null, notes: '', reviewed_at: null };
  
  const criteriaHtml = decision.criteria?.length ? decision.criteria.map(c => `
    <div class="criteria-item">
      <div class="criteria-item-header">
        <span class="criteria-item-name">${esc(c.name)}</span>
        <span class="criteria-weight">${Number(c.weight).toFixed(1)}%</span>
      </div>
      ${c.description ? `<p class="criteria-meta">${esc(c.description)}</p>` : ''}
    </div>
  `).join('') : '<p class="empty-copy">No criteria defined.</p>';
  
  const optionsHtml = decision.options?.length ? decision.options.map(o => {
    const totalScore = decision.ranked_results?.find(r => r.name === o.name)?.total_score;
    return `
      <div class="option-item">
        <div class="option-item-header">
          <span class="option-item-name">${esc(o.name)}</span>
          ${totalScore !== undefined ? `<span class="option-score">${totalScore.toFixed(1)} pts</span>` : ''}
        </div>
        ${o.description ? `<p class="criteria-meta">${esc(o.description)}</p>` : ''}
      </div>
    `;
  }).join('') : '<p class="empty-copy">No options defined.</p>';
  
  const finalChoiceHtml = decision.final_choice ? `
    <div class="timeline-choice" style="font-size:1rem;padding:12px 18px;">
      <span>🎯</span>
      <span>${esc(decision.final_choice)}</span>
    </div>
  ` : '<p class="empty-copy">No final choice recorded.</p>';
  
  const reviewHtml = outcome.status === 'reviewed' ? `
    <div class="review-existing">
      <div class="review-existing-label">Previous Review</div>
      <div class="outcome-badge ${outcome.correct ? 'correct' : 'incorrect'}" style="margin-bottom:12px;">
        ${outcome.correct ? '✅ Marked as Correct' : '❌ Marked as Incorrect'}
      </div>
      ${outcome.notes ? `<div class="review-existing-notes">${esc(outcome.notes)}</div>` : ''}
      <div class="review-existing-date">Reviewed on ${formatDate(outcome.reviewed_at)}</div>
    </div>
    <div style="margin-top:16px;">
      <button class="button button-secondary w-full" onclick="enableReReview()">Update Review</button>
    </div>
  ` : `
    <div class="review-question">Was this decision correct?</div>
    <div class="review-buttons">
      <button class="review-button yes" id="review-yes" onclick="selectReviewAnswer(true)">👍 Yes, it was correct</button>
      <button class="review-button no" id="review-no" onclick="selectReviewAnswer(false)">👎 No, it was incorrect</button>
    </div>
    <label class="field-label">Reflection Notes</label>
    <textarea
      class="review-notes"
      id="review-notes"
      placeholder="Why was this decision correct or incorrect? What did you learn?"
    ></textarea>
    <div style="margin-top:16px;">
      <button class="button button-primary w-full" id="save-review-btn" onclick="saveReview()" disabled>
        Save Review
      </button>
    </div>
  `;
  
  modalBody.innerHTML = `
    <div class="modal-section">
      <p class="eyebrow">Overview</p>
      <h4>Decision Context</h4>
      <p style="color:var(--muted);line-height:1.6;">${esc(decision.context || 'No context provided.')}</p>
      <p style="margin-top:8px;font-size:0.85rem;color:var(--subtle);">Created on ${formatDate(decision.timestamp)}</p>
    </div>
    
    <div class="modal-section">
      <p class="eyebrow">Evaluation Framework</p>
      <h4>📊 Criteria & Weights</h4>
      <div class="criteria-grid">${criteriaHtml}</div>
    </div>
    
    <div class="modal-section">
      <p class="eyebrow">Alternatives</p>
      <h4>🎯 Options Evaluated</h4>
      <div class="options-grid">${optionsHtml}</div>
    </div>
    
    <div class="modal-section">
      <p class="eyebrow">Final Decision</p>
      <h4>🏆 Selected Option</h4>
      ${finalChoiceHtml}
    </div>
    
    <div class="modal-section">
      <p class="eyebrow">Learning & Reflection</p>
      <h4>🧠 Evaluate This Decision</h4>
      <div class="review-section">
        ${reviewHtml}
      </div>
    </div>
  `;
}

function selectReviewAnswer(correct) {
  currentReviewCorrect = correct;
  
  const yesBtn = document.getElementById('review-yes');
  const noBtn = document.getElementById('review-no');
  const saveBtn = document.getElementById('save-review-btn');
  
  if (yesBtn && noBtn) {
    yesBtn.classList.toggle('selected', correct === true);
    noBtn.classList.toggle('selected', correct === false);
  }
  
  if (saveBtn) {
    saveBtn.disabled = false;
  }
}

function enableReReview() {
  if (!currentReviewDecisionId) return;
  openDecisionModal(currentReviewDecisionId);
}

async function saveReview() {
  if (!currentReviewDecisionId || currentReviewCorrect === null) {
    toast('Please select whether the decision was correct or incorrect.', 'warning');
    return;
  }
  
  const notes = document.getElementById('review-notes')?.value.trim() || '';
  const saveBtn = document.getElementById('save-review-btn');
  
  setLoading(saveBtn, true);
  
  try {
    await apiFetch(`/decisions/${currentReviewDecisionId}/review`, {
      method: 'POST',
      body: {
        correct: currentReviewCorrect,
        notes: notes,
      },
    });
    
    toast('Review saved successfully! Decision outcome recorded.', 'success');
    closeDecisionModal();
  } catch (error) {
    toast(`Failed to save review: ${error.message}`, 'error', 5000);
  } finally {
    setLoading(saveBtn, false);
  }
}
