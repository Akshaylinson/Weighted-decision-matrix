/* ═══════════════════════════════════════════════════
   PDIS — Personal Decision Intelligence System
   app.js  — Vanilla JS, no frameworks
   ═══════════════════════════════════════════════════ */

const API = 'http://localhost:5000';

/* ── Application State ─────────────────────────── */
const state = {
  // Current decision being built
  decision: {
    id: null,
    title: '',
    context: '',
    constraints: '',
    criteria: [],    // [{id, name, weight, description}]
    options:  [],    // [{id, name, description, scores:{cid:val}}]
  },
  // Results from /engine/calculate
  results: null,
  // AI insights
  insights: null,
  // Current step (1-5)
  step: 1,
  // History
  history: [],
  // Sensitivity data
  sensitivity: null,
};

/* ── ID generator ───────────────────────────────── */
let _idCounter = 0;
const uid = (prefix = 'x') => `${prefix}_${Date.now()}_${++_idCounter}`;

/* ── API helper ─────────────────────────────────── */
async function apiFetch(path, { method = 'GET', body } = {}) {
  const opts = {
    method,
    headers: { 'Content-Type': 'application/json' },
  };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(API + path, opts);
  const json = await res.json();
  if (!res.ok || json.status === 'error') {
    throw new Error(json.message || `HTTP ${res.status}`);
  }
  return json.data;
}

/* ── Toast notifications ────────────────────────── */
function toast(msg, type = 'info', duration = 3500) {
  const icons = { success: '✅', error: '❌', info: 'ℹ️', warning: '⚠️' };
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.innerHTML = `<span>${icons[type] || 'ℹ️'}</span><span>${msg}</span>`;
  const container = document.getElementById('toast-container');
  container.appendChild(el);
  setTimeout(() => {
    el.classList.add('out');
    setTimeout(() => el.remove(), 300);
  }, duration);
}

/* ── Loading button helper ──────────────────────── */
function setLoading(btn, loading, originalHTML) {
  if (loading) {
    btn.disabled = true;
    btn._orig = btn.innerHTML;
    btn.innerHTML = `<span class="spinner"></span> Working…`;
  } else {
    btn.disabled = false;
    btn.innerHTML = originalHTML || btn._orig || btn.innerHTML;
  }
}

/* ── Step navigation ────────────────────────────── */
function goToStep(n) {
  state.step = n;
  // Update dots
  document.querySelectorAll('.step-dot').forEach((dot, i) => {
    dot.classList.remove('active', 'done');
    if (i + 1 < n)  dot.classList.add('done');
    if (i + 1 === n) dot.classList.add('active');
  });
  document.querySelectorAll('.step-line').forEach((line, i) => {
    line.classList.toggle('done', i + 1 < n);
  });
  // Show/hide step panels
  document.querySelectorAll('.step-panel').forEach((panel, i) => {
    panel.style.display = (i + 1 === n) ? '' : 'none';
  });
}

/* ── Tab navigation ─────────────────────────────── */
function switchTab(tabName) {
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
  document.getElementById(`view-${tabName}`)?.classList.add('active');
  document.querySelector(`[data-tab="${tabName}"]`)?.classList.add('active');
  if (tabName === 'history') loadHistory();
}

/* ════════════════════════════════════════════════
   STEP 1 — Decision Details
   ════════════════════════════════════════════════ */
function readDecisionDetails() {
  state.decision.title       = document.getElementById('inp-title').value.trim();
  state.decision.context     = document.getElementById('inp-context').value.trim();
  state.decision.constraints = document.getElementById('inp-constraints').value.trim();
}

function validateStep1() {
  readDecisionDetails();
  if (!state.decision.title) {
    toast('Please enter a decision title.', 'error');
    return false;
  }
  return true;
}

/* ════════════════════════════════════════════════
   STEP 2 — Criteria Builder
   ════════════════════════════════════════════════ */
function renderCriteria() {
  const list = document.getElementById('criteria-list');
  if (!list) return;
  if (!state.decision.criteria.length) {
    list.innerHTML = `<div class="empty-state"><div class="empty-icon">📊</div>
      <p>No criteria yet. Add one below or use AI Suggest.</p></div>`;
    return;
  }
  list.innerHTML = state.decision.criteria.map((c, i) => `
    <div class="criteria-row" id="cr-${c.id}">
      <div>
        <input class="form-input" style="margin-bottom:4px" placeholder="Criterion name"
          value="${esc(c.name)}" oninput="updateCriterion('${c.id}','name',this.value)" />
        <input class="form-input" style="font-size:0.78rem;padding:6px 10px" placeholder="Description (optional)"
          value="${esc(c.description||'')}" oninput="updateCriterion('${c.id}','description',this.value)" />
      </div>
      <div class="weight-badge" style="flex-direction:column;align-items:flex-start;gap:4px">
        <input type="range" min="1" max="100" value="${c.weight}"
          oninput="updateCriterion('${c.id}','weight',+this.value);renderCriteria()"
          style="width:100%;accent-color:var(--accent)" />
        <div style="display:flex;justify-content:space-between;width:100%;font-size:0.72rem;color:var(--text-muted)">
          <span>Weight</span><span class="weight-label" id="wl-${c.id}">${c.weight}%</span>
        </div>
      </div>
      <div style="text-align:center;font-size:0.8rem;color:var(--text-muted)">
        Normalized:<br><strong style="color:var(--accent-light)" id="nw-${c.id}">-</strong>
      </div>
      <button class="btn btn-danger btn-icon" onclick="removeCriterion('${c.id}')" title="Remove">✕</button>
    </div>`).join('');
  updateNormalizedWeights();
}

function updateNormalizedWeights() {
  const total = state.decision.criteria.reduce((s, c) => s + (c.weight || 0), 0) || 1;
  state.decision.criteria.forEach(c => {
    const el = document.getElementById(`nw-${c.id}`);
    if (el) el.textContent = ((c.weight / total) * 100).toFixed(1) + '%';
  });
}

function updateCriterion(id, field, value) {
  const c = state.decision.criteria.find(x => x.id === id);
  if (c) {
    c[field] = field === 'weight' ? +value : value;
    const wl = document.getElementById(`wl-${id}`);
    if (wl && field === 'weight') wl.textContent = value + '%';
    updateNormalizedWeights();
  }
}

function addCriterion(name = '', weight = 20, description = '') {
  state.decision.criteria.push({ id: uid('c'), name, weight, description });
  renderCriteria();
  renderScoringTable();
}

function removeCriterion(id) {
  state.decision.criteria = state.decision.criteria.filter(c => c.id !== id);
  // Remove scores for this criterion from all options
  state.decision.options.forEach(o => { delete o.scores[id]; });
  renderCriteria();
  renderScoringTable();
}

/* ════════════════════════════════════════════════
   STEP 3 — Options
   ════════════════════════════════════════════════ */
function renderOptions() {
  const list = document.getElementById('options-list');
  if (!list) return;
  if (!state.decision.options.length) {
    list.innerHTML = `<div class="empty-state"><div class="empty-icon">🎯</div>
      <p>No options yet. Add one below or use AI Suggest.</p></div>`;
    return;
  }
  list.innerHTML = state.decision.options.map((o, i) => `
    <div style="background:rgba(255,255,255,0.025);border:1px solid var(--border);
      border-radius:10px;padding:12px 14px;margin-bottom:8px;animation:slideIn 0.2s ease">
      <div style="display:flex;gap:10px;align-items:flex-start">
        <span style="background:var(--accent);color:#fff;border-radius:8px;width:28px;height:28px;
          display:flex;align-items:center;justify-content:center;font-size:0.8rem;font-weight:700;flex-shrink:0">${i+1}</span>
        <div style="flex:1">
          <input class="form-input" style="margin-bottom:6px" placeholder="Option name"
            value="${esc(o.name)}" oninput="updateOption('${o.id}','name',this.value)" />
          <input class="form-input" style="font-size:0.78rem;padding:6px 10px" placeholder="Brief description (optional)"
            value="${esc(o.description||'')}" oninput="updateOption('${o.id}','description',this.value)" />
        </div>
        <button class="btn btn-danger btn-icon" onclick="removeOption('${o.id}')" title="Remove">✕</button>
      </div>
    </div>`).join('');
}

function updateOption(id, field, value) {
  const o = state.decision.options.find(x => x.id === id);
  if (o) o[field] = value;
}

function addOption(name = '', description = '') {
  state.decision.options.push({ id: uid('o'), name, description, scores: {} });
  renderOptions();
  renderScoringTable();
}

function removeOption(id) {
  state.decision.options = state.decision.options.filter(o => o.id !== id);
  renderOptions();
  renderScoringTable();
}

/* ════════════════════════════════════════════════
   STEP 4 — Scoring Table
   ════════════════════════════════════════════════ */
function renderScoringTable() {
  const wrap = document.getElementById('scoring-table-wrap');
  if (!wrap) return;
  const { criteria, options } = state.decision;

  if (!criteria.length || !options.length) {
    wrap.innerHTML = `<div class="empty-state"><div class="empty-icon">📋</div>
      <p>Complete criteria and options first.</p></div>`;
    return;
  }

  const headerCols = criteria.map(c =>
    `<th title="${esc(c.description||'')}">
      ${esc(c.name)}<br>
      <span style="font-size:0.68rem;color:var(--text-muted);font-weight:400">${c.weight}%</span>
    </th>`).join('');

  const rows = options.map(o => {
    const scoreCells = criteria.map(c => `
      <td>
        <input type="number" class="score-input" min="1" max="5" step="1"
          value="${o.scores[c.id] || ''}"
          placeholder="1-5"
          oninput="updateScore('${o.id}','${c.id}',+this.value)"
          onchange="updateScore('${o.id}','${c.id}',+this.value)" />
      </td>`).join('');
    return `<tr>
      <td>
        <div style="font-weight:600">${esc(o.name)}</div>
        ${o.description ? `<div style="font-size:0.75rem;color:var(--text-muted)">${esc(o.description)}</div>` : ''}
      </td>
      ${scoreCells}
      <td>
        <button class="btn btn-warning btn-sm" onclick="aiScoreOption('${o.id}')"
          id="ai-score-btn-${o.id}" title="AI suggests scores for this option">
          🤖 AI Score
        </button>
      </td>
    </tr>`;
  }).join('');

  wrap.innerHTML = `
    <div class="scoring-table-wrapper">
      <table class="scoring-table">
        <thead><tr>
          <th>Option</th>${headerCols}<th>AI Assist</th>
        </tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
    <p style="margin-top:10px;font-size:0.78rem;color:var(--text-muted)">
      💡 Score each option 1 (very poor) → 5 (excellent) per criterion.
    </p>`;
}

function updateScore(optionId, criterionId, value) {
  const o = state.decision.options.find(x => x.id === optionId);
  if (o) {
    const clamped = Math.max(1, Math.min(5, value));
    o.scores[criterionId] = clamped || value; // keep raw if 0
  }
}

/* ── HTML escape helper ──── */
function esc(str) {
  return String(str ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

/* ════════════════════════════════════════════════
   AI — Suggest Criteria + Options
   ════════════════════════════════════════════════ */
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
    // Populate criteria
    if (data.criteria?.length) {
      state.decision.criteria = data.criteria.map(c => ({
        id: uid('c'), name: c.name, weight: c.weight || 20, description: c.description || '',
      }));
    }
    // Populate options
    if (data.options?.length) {
      state.decision.options = data.options.map(o => ({
        id: uid('o'), name: o.name, description: o.description || '', scores: {},
      }));
    }
    renderCriteria();
    renderOptions();
    renderScoringTable();
    // Show rationale
    if (data.rationale) {
      const el = document.getElementById('ai-rationale');
      if (el) {
        el.textContent = data.rationale;
        el.parentElement.style.display = '';
      }
    }
    toast('AI suggestions loaded! Review and edit below.', 'success');
    goToStep(2);
  } catch (e) {
    toast(`AI Suggest failed: ${e.message}`, 'error', 5000);
  } finally {
    setLoading(btn, false);
  }
}

/* ════════════════════════════════════════════════
   AI — Score a single option
   ════════════════════════════════════════════════ */
async function aiScoreOption(optionId) {
  const option = state.decision.options.find(o => o.id === optionId);
  if (!option) return;
  if (!state.decision.criteria.length) {
    toast('Add criteria first.', 'warning'); return;
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
      // Map AI criterion names/ids to our IDs
      state.decision.criteria.forEach(c => {
        // Try direct id match first, then name match
        const val = data.scores[c.id] ?? data.scores[c.name];
        if (val !== undefined) option.scores[c.id] = Math.max(1, Math.min(5, +val));
      });
      renderScoringTable();
      toast(`Scores set for "${option.name}"`, 'success');
    }
  } catch (e) {
    toast(`AI Score failed: ${e.message}`, 'error', 5000);
  } finally {
    setLoading(btn, false);
  }
}

/* ════════════════════════════════════════════════
   STEP 5 — Calculate (Deterministic Engine)
   ════════════════════════════════════════════════ */
async function calculateScores() {
  if (!state.decision.criteria.length) { toast('Add criteria first.', 'warning'); return; }
  if (!state.decision.options.length)  { toast('Add options first.', 'warning'); return; }

  // Validate all scores filled
  let missing = false;
  state.decision.options.forEach(o => {
    state.decision.criteria.forEach(c => {
      if (!o.scores[c.id]) missing = true;
    });
  });
  if (missing) {
    toast('Some scores are missing. Fill in all cells (1-5) or use AI Score.', 'warning', 5000);
  }

  const btn = document.getElementById('btn-calculate');
  setLoading(btn, true);
  try {
    const data = await apiFetch('/engine/calculate', {
      method: 'POST',
      body: {
        criteria: state.decision.criteria,
        options:  state.decision.options,
      },
    });
    state.results = data.ranked_options;
    state.decision.criteria = data.normalized_criteria; // use normalized
    renderResults();
    goToStep(5);
    toast('Scores calculated!', 'success');
  } catch (e) {
    toast(`Calculation failed: ${e.message}`, 'error', 5000);
  } finally {
    setLoading(btn, false);
  }
}

/* ════════════════════════════════════════════════
   Results Rendering
   ════════════════════════════════════════════════ */
function renderResults() {
  const wrap = document.getElementById('results-wrap');
  if (!wrap || !state.results) return;

  const maxScore = state.results[0]?.total_score || 1;

  wrap.innerHTML = state.results.map((r, i) => {
    const rankClass = r.rank === 1 ? 'winner' : r.rank === 2 ? 'rank-2' : r.rank === 3 ? 'rank-3' : '';
    const badgeClass = r.rank <= 3 ? `rank-${r.rank}` : 'rank-other';
    const rankEmoji = r.rank === 1 ? '🥇' : r.rank === 2 ? '🥈' : r.rank === 3 ? '🥉' : r.rank;
    const pct = ((r.total_score / 100) * 100).toFixed(0);

    const breakdownRows = r.breakdown.map(b =>
      `<tr>
        <td>${esc(b.criterion_name)}</td>
        <td style="color:var(--accent-light)">${b.weight.toFixed(1)}%</td>
        <td>${b.raw_score}/5</td>
        <td style="color:var(--success)">${b.weighted_score.toFixed(2)}</td>
      </tr>`).join('');

    return `
    <div class="result-card ${rankClass}">
      <div class="rank-badge ${badgeClass}">${rankEmoji}</div>
      <div class="result-info">
        <div class="result-name">${esc(r.name)}</div>
        <div class="score-bar-wrap">
          <div class="score-bar-bg">
            <div class="score-bar-fill" style="width:${pct}%"></div>
          </div>
          <span class="score-value">${r.total_score.toFixed(1)}</span>
        </div>
        <details style="margin-top:8px">
          <summary style="font-size:0.78rem;color:var(--text-muted);cursor:pointer">Score breakdown</summary>
          <table class="breakdown-table">
            <thead><tr><th>Criterion</th><th>Weight</th><th>Raw</th><th>Weighted</th></tr></thead>
            <tbody>${breakdownRows}</tbody>
          </table>
        </details>
      </div>
    </div>`;
  }).join('');

  // Winner callout
  const winner = state.results[0];
  const callout = document.getElementById('winner-callout');
  if (callout && winner) {
    callout.innerHTML = `
      <div style="display:flex;align-items:center;gap:12px">
        <span style="font-size:2rem">🏆</span>
        <div>
          <div style="font-size:0.78rem;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:var(--success)">Recommended Choice</div>
          <div style="font-size:1.3rem;font-weight:800">${esc(winner.name)}</div>
          <div style="font-size:0.85rem;color:var(--text-muted)">Score: ${winner.total_score.toFixed(1)}/100</div>
        </div>
      </div>`;
    callout.style.display = '';
  }

  // Populate sensitivity criterion selector
  const sel = document.getElementById('sensitivity-criterion-sel');
  if (sel) {
    sel.innerHTML = state.decision.criteria.map(c =>
      `<option value="${c.id}">${esc(c.name)}</option>`).join('');
  }
}

/* ════════════════════════════════════════════════
   AI Insights
   ════════════════════════════════════════════════ */
async function generateInsights() {
  if (!state.results) { toast('Calculate scores first.', 'warning'); return; }
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
    toast('AI insights generated!', 'success');
  } catch (e) {
    toast(`Insights failed: ${e.message}`, 'error', 5000);
  } finally {
    setLoading(btn, false);
  }
}

function renderInsights(ins) {
  const wrap = document.getElementById('insights-wrap');
  if (!wrap) return;

  const prosList  = (ins.pros  || []).map(p => `<li>${esc(p)}</li>`).join('');
  const consList  = (ins.cons  || []).map(c => `<li>${esc(c)}</li>`).join('');
  const risksList = (ins.risks || []).map(r => `<li>${esc(r)}</li>`).join('');

  wrap.innerHTML = `
    <div class="insight-block accent">
      <div class="insight-label" style="color:var(--accent-light)">💡 Explanation</div>
      <p style="font-size:0.875rem">${esc(ins.explanation || '')}</p>
    </div>
    ${prosList ? `<div class="insight-block success">
      <div class="insight-label" style="color:var(--success)">✅ Pros</div>
      <ul style="padding-left:1.2rem;font-size:0.875rem">${prosList}</ul>
    </div>` : ''}
    ${consList ? `<div class="insight-block warning">
      <div class="insight-label" style="color:var(--warning)">⚠️ Cons</div>
      <ul style="padding-left:1.2rem;font-size:0.875rem">${consList}</ul>
    </div>` : ''}
    ${risksList ? `<div class="insight-block danger">
      <div class="insight-label" style="color:var(--danger)">🚨 Risks</div>
      <ul style="padding-left:1.2rem;font-size:0.875rem">${risksList}</ul>
    </div>` : ''}
    ${ins.recommendation ? `<div class="insight-block success">
      <div class="insight-label" style="color:var(--success)">🎯 Final Recommendation</div>
      <p style="font-size:0.875rem;font-weight:600">${esc(ins.recommendation)}</p>
    </div>` : ''}`;
  wrap.style.display = '';
}

/* ════════════════════════════════════════════════
   Sensitivity Analysis
   ════════════════════════════════════════════════ */
async function runSensitivity() {
  const sel = document.getElementById('sensitivity-criterion-sel');
  if (!sel || !sel.value) { toast('Select a criterion.', 'warning'); return; }
  if (!state.results) { toast('Calculate scores first.', 'warning'); return; }
  const btn = document.getElementById('btn-sensitivity');
  setLoading(btn, true);
  try {
    const data = await apiFetch('/engine/sensitivity', {
      method: 'POST',
      body: {
        criteria: state.decision.criteria,
        options:  state.decision.options,
        target_criterion_id: sel.value,
      },
    });
    state.sensitivity = data;
    renderSensitivityChart(data, sel.options[sel.selectedIndex].text);
  } catch (e) {
    toast(`Sensitivity failed: ${e.message}`, 'error', 4000);
  } finally {
    setLoading(btn, false);
  }
}

function renderSensitivityChart(data, criterionName) {
  const wrap = document.getElementById('sensitivity-wrap');
  if (!wrap) return;

  // Build a simple SVG bar-line chart
  const W = 600, H = 220, PAD = { t: 20, r: 20, b: 40, l: 50 };
  const chartW = W - PAD.l - PAD.r;
  const chartH = H - PAD.t - PAD.b;

  // Collect all option names
  const optNames = [...new Set(data.flatMap(d => d.rankings.map(r => r.name)))];
  const colors   = ['#6366f1','#10b981','#f59e0b','#ef4444','#a855f7','#06b6d4'];

  const xScale = i => PAD.l + (i / (data.length - 1)) * chartW;
  const yScale = v => PAD.t + chartH - (v / 100) * chartH;

  const lines = optNames.map((name, ni) => {
    const pts = data.map((d, i) => {
      const r = d.rankings.find(r => r.name === name);
      return r ? `${xScale(i).toFixed(1)},${yScale(r.total_score).toFixed(1)}` : null;
    }).filter(Boolean).join(' ');
    return `<polyline points="${pts}" fill="none" stroke="${colors[ni % colors.length]}" stroke-width="2.5" stroke-linejoin="round"/>
      <text x="${W - PAD.r + 4}" y="${yScale(data[data.length-1].rankings.find(r=>r.name===name)?.total_score||0).toFixed(1)}"
        fill="${colors[ni % colors.length]}" font-size="11" dominant-baseline="middle">${esc(name)}</text>`;
  }).join('');

  // x-axis labels every 2 steps
  const xLabels = data.filter((_, i) => i % 2 === 0).map((d, j) => {
    const i = j * 2;
    return `<text x="${xScale(i).toFixed(1)}" y="${H - 8}" fill="#64748b" font-size="10" text-anchor="middle">${d.target_weight}%</text>`;
  }).join('');

  // y-axis labels
  const yLabels = [0, 25, 50, 75, 100].map(v =>
    `<text x="${PAD.l - 6}" y="${yScale(v).toFixed(1)}" fill="#64748b" font-size="10" text-anchor="end" dominant-baseline="middle">${v}</text>
     <line x1="${PAD.l}" y1="${yScale(v).toFixed(1)}" x2="${W - PAD.r}" y2="${yScale(v).toFixed(1)}" stroke="#1f2d45" stroke-width="1"/>`
  ).join('');

  wrap.innerHTML = `
    <div style="font-size:0.85rem;font-weight:600;margin-bottom:10px;color:var(--text-subtle)">
      Sensitivity: <span style="color:var(--accent-light)">"${esc(criterionName)}"</span> weight 0%→100%
    </div>
    <div class="sensitivity-chart" style="overflow-x:auto">
      <svg viewBox="0 0 ${W} ${H}" style="width:100%;max-width:${W}px;font-family:Inter,sans-serif">
        ${yLabels}
        ${lines}
        ${xLabels}
        <text x="${PAD.l + chartW/2}" y="${H}" fill="#64748b" font-size="11" text-anchor="middle">
          "${esc(criterionName)}" Weight (%)
        </text>
        <text x="10" y="${PAD.t + chartH/2}" fill="#64748b" font-size="11" text-anchor="middle"
          transform="rotate(-90,10,${PAD.t + chartH/2})">Score</text>
      </svg>
    </div>`;
  wrap.style.display = '';
}

/* ════════════════════════════════════════════════
   Save Decision
   ════════════════════════════════════════════════ */
async function saveDecision() {
  if (!state.decision.title) { toast('No decision to save.', 'warning'); return; }
  const btn = document.getElementById('btn-save');
  setLoading(btn, true);
  try {
    const winner = state.results?.[0]?.name || '';
    const payload = {
      ...state.decision,
      final_choice: winner,
      ranked_results: state.results || [],
      insights: state.insights || null,
    };
    const data = await apiFetch('/decisions', { method: 'POST', body: payload });
    state.decision.id = data.id;
    toast('Decision saved to memory! 💾', 'success');
  } catch (e) {
    toast(`Save failed: ${e.message}`, 'error', 5000);
  } finally {
    setLoading(btn, false);
  }
}

/* ════════════════════════════════════════════════
   History
   ════════════════════════════════════════════════ */
async function loadHistory() {
  const wrap = document.getElementById('history-list');
  if (!wrap) return;
  wrap.innerHTML = `<div style="text-align:center;padding:32px;color:var(--text-muted)"><span class="spinner"></span></div>`;
  try {
    const data = await apiFetch('/decisions');
    state.history = data;
    renderHistory(data);
  } catch (e) {
    wrap.innerHTML = `<div class="empty-state"><p style="color:var(--danger)">Failed to load history: ${e.message}</p></div>`;
  }
}

function renderHistory(list) {
  const wrap = document.getElementById('history-list');
  if (!wrap) return;
  if (!list.length) {
    wrap.innerHTML = `<div class="empty-state"><div class="empty-icon">📂</div><p>No saved decisions yet.</p></div>`;
    return;
  }
  wrap.innerHTML = list.map(d => `
    <div class="history-card" onclick="loadDecision('${d.id}')">
      <div style="font-size:1.5rem">🧠</div>
      <div class="history-meta">
        <div class="history-title">${esc(d.title)}</div>
        <div class="history-date">${formatDate(d.timestamp)} · ${d.criteria_count} criteria · ${d.options_count} options
          ${d.final_choice ? ` · Chose: <strong>${esc(d.final_choice)}</strong>` : ''}
        </div>
      </div>
      <div style="display:flex;gap:6px">
        <button class="btn btn-ghost btn-sm" onclick="event.stopPropagation();deleteDecision('${d.id}')">🗑</button>
      </div>
    </div>`).join('');
}

async function loadDecision(id) {
  try {
    const dec = await apiFetch(`/decisions/${id}`);
    // Restore state
    state.decision = {
      id: dec.id,
      title:       dec.title || '',
      context:     dec.context || '',
      constraints: dec.constraints || '',
      criteria:    dec.criteria || [],
      options:     dec.options || [],
    };
    state.results  = dec.ranked_results || null;
    state.insights = dec.insights || null;

    // Populate form fields
    document.getElementById('inp-title').value       = state.decision.title;
    document.getElementById('inp-context').value     = state.decision.context;
    document.getElementById('inp-constraints').value = state.decision.constraints;

    renderCriteria();
    renderOptions();
    renderScoringTable();
    if (state.results) renderResults();
    if (state.insights) renderInsights(state.insights);

    switchTab('builder');
    goToStep(state.results ? 5 : 2);
    toast(`Loaded: "${dec.title}"`, 'success');
  } catch (e) {
    toast(`Load failed: ${e.message}`, 'error', 5000);
  }
}

async function deleteDecision(id) {
  if (!confirm('Delete this decision?')) return;
  try {
    await apiFetch(`/decisions/${id}`, { method: 'DELETE' });
    toast('Decision deleted.', 'info');
    loadHistory();
  } catch (e) {
    toast(`Delete failed: ${e.message}`, 'error');
  }
}

async function searchHistory() {
  const q = document.getElementById('history-search').value.trim();
  const url = q ? `/decisions/search?q=${encodeURIComponent(q)}` : '/decisions';
  try {
    const data = await apiFetch(url);
    renderHistory(data);
  } catch(e) {
    toast(`Search failed: ${e.message}`, 'error');
  }
}

function newDecision() {
  if (!confirm('Start a new decision? Current unsaved data will be lost.')) return;
  state.decision = { id: null, title: '', context: '', constraints: '', criteria: [], options: [] };
  state.results  = null;
  state.insights = null;
  document.getElementById('inp-title').value       = '';
  document.getElementById('inp-context').value     = '';
  document.getElementById('inp-constraints').value = '';
  const rat = document.getElementById('ai-rationale');
  if (rat) rat.parentElement.style.display = 'none';
  const iw = document.getElementById('insights-wrap');
  if (iw) iw.style.display = 'none';
  renderCriteria();
  renderOptions();
  renderScoringTable();
  switchTab('builder');
  goToStep(1);
  toast('New decision started.', 'info');
}

/* ── Date formatter ──── */
function formatDate(iso) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString(undefined, { day:'numeric', month:'short', year:'numeric' });
  } catch { return iso; }
}

/* ════════════════════════════════════════════════
   INIT
   ════════════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {
  goToStep(1);
  renderCriteria();
  renderOptions();
  renderScoringTable();

  // Health check
  apiFetch('/health').then(d => {
    if (!d.ai_configured) {
      toast('⚠️ AI not configured (no API key). Add OPENAI_API_KEY to .env', 'warning', 8000);
    }
  }).catch(() => {
    toast('Cannot connect to backend. Is Flask running on port 5000?', 'error', 8000);
  });
});
