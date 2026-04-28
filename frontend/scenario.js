/* ════════════════════════════════════════════════
   SCENARIO SIMULATION SYSTEM
   Multi-scenario decision comparison
   ════════════════════════════════════════════════ */

const scenarioState = {
  active: false,
  base: null,
  scenarios: [],
  activeScenarioId: null,
  charts: {
    multiBar: null,
    line: null,
  },
};

let scenarioIdCounter = 0;
const scenarioUid = () => `scenario_${Date.now()}_${++scenarioIdCounter}`;

// ════════════════════════════════════════════════
// SCENARIO MODE TOGGLE
// ════════════════════════════════════════════════

function toggleScenarioMode() {
  if (!state.results) {
    toast('Calculate results first before running scenario simulation.', 'warning');
    return;
  }

  scenarioState.active = !scenarioState.active;
  const btn = document.getElementById('btn-scenario-mode');
  const panel = document.getElementById('scenario-panel');

  if (scenarioState.active) {
    // Clone base decision
    scenarioState.base = {
      criteria: JSON.parse(JSON.stringify(state.decision.criteria)),
      options: JSON.parse(JSON.stringify(state.decision.options)),
      results: JSON.parse(JSON.stringify(state.results)),
    };

    // Generate default scenarios
    generateDefaultScenarios();

    btn.textContent = '✕ Exit Scenarios';
    btn.classList.add('active');
    panel.classList.add('active');
    renderScenarioPanel();
  } else {
    btn.textContent = '🎬 Scenario Simulation';
    btn.classList.remove('active');
    panel.classList.add('closing');
    setTimeout(() => {
      panel.classList.remove('active', 'closing');
      destroyScenarioCharts();
    }, 300);
  }
}

// ════════════════════════════════════════════════
// DEFAULT SCENARIO GENERATION
// ════════════════════════════════════════════════

function generateDefaultScenarios() {
  scenarioState.scenarios = [];

  // Find cost and performance criteria (or use first two)
  const costCriterion = scenarioState.base.criteria.find(c => 
    c.name.toLowerCase().includes('cost') || c.name.toLowerCase().includes('price')
  ) || scenarioState.base.criteria[0];

  const perfCriterion = scenarioState.base.criteria.find(c => 
    c.name.toLowerCase().includes('performance') || 
    c.name.toLowerCase().includes('speed') ||
    c.name.toLowerCase().includes('quality')
  ) || scenarioState.base.criteria[1] || scenarioState.base.criteria[0];

  // Scenario A: Cost-Focused
  const costFocused = createScenario(
    'Cost-Focused',
    'Prioritizes budget constraints and cost efficiency',
    scenarioState.base.criteria.map(c => {
      if (c.id === costCriterion.id) {
        return { ...c, weight: 50 };
      }
      const remaining = 50 / (scenarioState.base.criteria.length - 1);
      return { ...c, weight: remaining };
    })
  );

  // Scenario B: Performance-Focused
  const perfFocused = createScenario(
    'Performance-Focused',
    'Prioritizes quality, speed, and performance over cost',
    scenarioState.base.criteria.map(c => {
      if (c.id === perfCriterion.id) {
        return { ...c, weight: 50 };
      }
      const remaining = 50 / (scenarioState.base.criteria.length - 1);
      return { ...c, weight: remaining };
    })
  );

  // Scenario C: Balanced
  const balanced = createScenario(
    'Balanced',
    'Equal weight distribution across all criteria',
    scenarioState.base.criteria.map(c => ({
      ...c,
      weight: 100 / scenarioState.base.criteria.length,
    }))
  );

  scenarioState.scenarios = [costFocused, perfFocused, balanced];
  scenarioState.activeScenarioId = costFocused.id;
}

// ════════════════════════════════════════════════
// SCENARIO MANAGEMENT
// ════════════════════════════════════════════════

function createScenario(name, description, criteria) {
  const scenario = {
    id: scenarioUid(),
    name,
    description,
    criteria: normalizeScenarioCriteria(criteria),
    results: null,
  };

  scenario.results = calculateScenarioResults(scenario.criteria);
  return scenario;
}

function addCustomScenario() {
  const scenario = createScenario(
    `Custom Scenario ${scenarioState.scenarios.length + 1}`,
    'User-defined weight distribution',
    JSON.parse(JSON.stringify(scenarioState.base.criteria))
  );

  scenarioState.scenarios.push(scenario);
  scenarioState.activeScenarioId = scenario.id;
  renderScenarioPanel();
  toast('Custom scenario added', 'success');
}

function removeScenario(scenarioId) {
  if (scenarioState.scenarios.length <= 1) {
    toast('Must have at least one scenario', 'warning');
    return;
  }

  scenarioState.scenarios = scenarioState.scenarios.filter(s => s.id !== scenarioId);
  
  if (scenarioState.activeScenarioId === scenarioId) {
    scenarioState.activeScenarioId = scenarioState.scenarios[0].id;
  }

  renderScenarioPanel();
  toast('Scenario removed', 'info');
}

function setActiveScenario(scenarioId) {
  scenarioState.activeScenarioId = scenarioId;
  renderScenarioPanel();
}

// ════════════════════════════════════════════════
// WEIGHT ADJUSTMENT
// ════════════════════════════════════════════════

function adjustScenarioWeight(scenarioId, criterionId, newWeight) {
  const scenario = scenarioState.scenarios.find(s => s.id === scenarioId);
  if (!scenario) return;

  const criterion = scenario.criteria.find(c => c.id === criterionId);
  if (!criterion) return;

  const oldWeight = criterion.weight;
  const delta = newWeight - oldWeight;
  const others = scenario.criteria.filter(c => c.id !== criterionId);
  const othersTotal = others.reduce((sum, c) => sum + c.weight, 0) || 1;

  criterion.weight = newWeight;

  others.forEach(c => {
    const proportion = c.weight / othersTotal;
    c.weight = Math.max(0, c.weight - (delta * proportion));
  });

  // Normalize
  scenario.criteria = normalizeScenarioCriteria(scenario.criteria);

  // Recalculate results
  scenario.results = calculateScenarioResults(scenario.criteria);

  renderScenarioPanel();
}

function normalizeScenarioCriteria(criteria) {
  const total = criteria.reduce((sum, c) => sum + c.weight, 0);
  if (Math.abs(total - 100) > 0.1) {
    const factor = 100 / total;
    criteria.forEach(c => c.weight *= factor);
  }
  return criteria;
}

// ════════════════════════════════════════════════
// CALCULATION ENGINE
// ════════════════════════════════════════════════

function calculateScenarioResults(criteria) {
  const results = [];

  scenarioState.base.options.forEach(option => {
    let total = 0;
    const breakdown = [];

    criteria.forEach(criterion => {
      const raw = option.scores[criterion.id] || 0;
      const weighted = (raw / 5.0) * criterion.weight;
      total += weighted;
      breakdown.push({
        criterion_id: criterion.id,
        criterion_name: criterion.name,
        weight: criterion.weight,
        raw_score: raw,
        weighted_score: weighted,
      });
    });

    results.push({
      id: option.id,
      name: option.name,
      total_score: total,
      breakdown,
    });
  });

  results.sort((a, b) => b.total_score - a.total_score);
  results.forEach((r, i) => r.rank = i + 1);

  return results;
}

// ════════════════════════════════════════════════
// COMPARISON ANALYSIS
// ════════════════════════════════════════════════

function analyzeScenarioChanges() {
  const baseWinner = scenarioState.base.results[0];
  const scenarioWinners = scenarioState.scenarios.map(s => ({
    scenario: s.name,
    winner: s.results[0].name,
    score: s.results[0].total_score,
  }));

  // Detect stable options (same rank across all scenarios)
  const optionStability = {};
  scenarioState.base.options.forEach(option => {
    const ranks = [
      scenarioState.base.results.find(r => r.id === option.id).rank,
      ...scenarioState.scenarios.map(s => s.results.find(r => r.id === option.id).rank),
    ];
    const allSame = ranks.every(r => r === ranks[0]);
    optionStability[option.name] = {
      stable: allSame,
      ranks,
      variance: Math.max(...ranks) - Math.min(...ranks),
    };
  });

  // Generate insights
  const insights = [];

  // Winner consistency
  const uniqueWinners = new Set(scenarioWinners.map(sw => sw.winner));
  if (uniqueWinners.size === 1) {
    insights.push({
      type: 'stable',
      icon: '🎯',
      message: `"${baseWinner.name}" wins across all scenarios. This is a robust choice regardless of conditions.`,
    });
  } else {
    insights.push({
      type: 'variable',
      icon: '🔄',
      message: `Winner changes across scenarios. Your decision is sensitive to priority shifts.`,
    });
  }

  // Stable options
  const stableOptions = Object.entries(optionStability)
    .filter(([, data]) => data.stable)
    .map(([name]) => name);

  if (stableOptions.length > 0) {
    insights.push({
      type: 'info',
      icon: '📌',
      message: `Stable options: ${stableOptions.join(', ')}. These maintain consistent rankings.`,
    });
  }

  // Volatile options
  const volatileOptions = Object.entries(optionStability)
    .filter(([, data]) => data.variance >= 2)
    .map(([name]) => name);

  if (volatileOptions.length > 0) {
    insights.push({
      type: 'warning',
      icon: '⚡',
      message: `Volatile options: ${volatileOptions.join(', ')}. Rankings vary significantly by scenario.`,
    });
  }

  // Scenario-specific winners
  scenarioWinners.forEach(sw => {
    if (sw.winner !== baseWinner.name) {
      insights.push({
        type: 'info',
        icon: '💡',
        message: `"${sw.winner}" wins in "${sw.scenario}" scenario (${sw.score.toFixed(1)} pts).`,
      });
    }
  });

  return {
    baseWinner: baseWinner.name,
    scenarioWinners,
    optionStability,
    insights,
  };
}

// ════════════════════════════════════════════════
// UI RENDERING
// ════════════════════════════════════════════════

function renderScenarioPanel() {
  const panel = document.getElementById('scenario-content');
  if (!panel) return;

  const analysis = analyzeScenarioChanges();

  panel.innerHTML = `
    <div class="scenario-grid">
      <div class="scenario-left">
        <div class="scenario-section">
          <div class="scenario-section-header">
            <h4>Scenarios</h4>
            <button class="button button-secondary button-sm" onclick="addCustomScenario()">
              + Add Custom
            </button>
          </div>
          <div class="scenario-list">
            ${renderScenarioList()}
          </div>
        </div>

        <div class="scenario-section">
          <h4>Weight Adjustments</h4>
          <p class="field-hint">Adjust weights for active scenario</p>
          ${renderWeightSliders()}
        </div>
      </div>

      <div class="scenario-right">
        <div class="scenario-section">
          <h4>Winner Comparison</h4>
          ${renderWinnerComparison(analysis)}
        </div>

        <div class="scenario-section">
          <h4>Score Comparison</h4>
          <div class="chart-frame" style="height: 300px;">
            <canvas id="scenario-multibar-chart"></canvas>
          </div>
        </div>

        <div class="scenario-section">
          <h4>Scenario Comparison Table</h4>
          ${renderComparisonTable()}
        </div>

        <div class="scenario-section">
          <h4>Insights</h4>
          ${renderScenarioInsights(analysis.insights)}
        </div>
      </div>
    </div>
  `;

  renderScenarioCharts();
}

function renderScenarioList() {
  return scenarioState.scenarios.map(scenario => {
    const isActive = scenario.id === scenarioState.activeScenarioId;
    const winner = scenario.results[0];

    return `
      <div class="scenario-card ${isActive ? 'active' : ''}" onclick="setActiveScenario('${scenario.id}')">
        <div class="scenario-card-header">
          <strong>${esc(scenario.name)}</strong>
          ${scenarioState.scenarios.length > 1 ? `
            <button class="button button-ghost button-icon-sm" onclick="event.stopPropagation(); removeScenario('${scenario.id}')" title="Remove">
              ×
            </button>
          ` : ''}
        </div>
        <p class="scenario-card-desc">${esc(scenario.description || '')}</p>
        <div class="scenario-card-winner">
          <span>Winner:</span>
          <strong>${esc(winner.name)}</strong>
          <span class="scenario-card-score">${winner.total_score.toFixed(1)}</span>
        </div>
      </div>
    `;
  }).join('');
}

function renderWeightSliders() {
  const scenario = scenarioState.scenarios.find(s => s.id === scenarioState.activeScenarioId);
  if (!scenario) return '<p class="empty-copy">No scenario selected</p>';

  return `
    <div class="weight-sliders">
      ${scenario.criteria.map(c => `
        <div class="weight-slider-row">
          <div class="weight-slider-label">
            <span>${esc(c.name)}</span>
            <strong>${c.weight.toFixed(1)}%</strong>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            step="0.5"
            value="${c.weight}"
            class="weight-slider"
            oninput="adjustScenarioWeight('${scenario.id}', '${c.id}', parseFloat(this.value))"
          />
        </div>
      `).join('')}
    </div>
  `;
}

function renderWinnerComparison(analysis) {
  return `
    <div class="winner-comparison">
      <div class="winner-comparison-item base">
        <span class="winner-label">Base Decision</span>
        <strong class="winner-name">${esc(analysis.baseWinner)}</strong>
      </div>
      ${analysis.scenarioWinners.map(sw => `
        <div class="winner-comparison-item ${sw.winner === analysis.baseWinner ? 'same' : 'different'}">
          <span class="winner-label">${esc(sw.scenario)}</span>
          <strong class="winner-name">${esc(sw.winner)}</strong>
          <span class="winner-score">${sw.score.toFixed(1)}</span>
        </div>
      `).join('')}
    </div>
  `;
}

function renderComparisonTable() {
  const options = scenarioState.base.options;
  const headers = ['Base', ...scenarioState.scenarios.map(s => s.name)];

  const rows = options.map(option => {
    const baseResult = scenarioState.base.results.find(r => r.id === option.id);
    const scenarioResults = scenarioState.scenarios.map(s => 
      s.results.find(r => r.id === option.id)
    );

    return `
      <tr>
        <td><strong>${esc(option.name)}</strong></td>
        <td class="text-center">
          <div class="rank-badge-mini">#${baseResult.rank}</div>
          <div class="score-mini">${baseResult.total_score.toFixed(1)}</div>
        </td>
        ${scenarioResults.map(sr => {
          const rankChange = baseResult.rank - sr.rank;
          let changeIcon = '→';
          let changeClass = 'no-change';
          if (rankChange > 0) {
            changeIcon = '↑';
            changeClass = 'rank-up';
          } else if (rankChange < 0) {
            changeIcon = '↓';
            changeClass = 'rank-down';
          }

          return `
            <td class="text-center">
              <div class="rank-badge-mini">#${sr.rank}</div>
              <div class="score-mini">${sr.total_score.toFixed(1)}</div>
              <span class="rank-change-mini ${changeClass}">${changeIcon}</span>
            </td>
          `;
        }).join('')}
      </tr>
    `;
  }).join('');

  return `
    <div class="table-scroll">
      <table class="comparison-table">
        <thead>
          <tr>
            <th>Option</th>
            ${headers.map(h => `<th class="text-center">${esc(h)}</th>`).join('')}
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
  `;
}

function renderScenarioInsights(insights) {
  if (!insights.length) {
    return '<p class="empty-copy">No insights available</p>';
  }

  return `
    <div class="insight-list">
      ${insights.map(insight => `
        <div class="insight-item ${insight.type}">
          <span class="insight-icon">${insight.icon}</span>
          <p>${esc(insight.message)}</p>
        </div>
      `).join('')}
    </div>
  `;
}

// ════════════════════════════════════════════════
// CHART RENDERING
// ════════════════════════════════════════════════

function renderScenarioCharts() {
  destroyScenarioCharts();
  if (!window.Chart) return;

  const options = scenarioState.base.options.map(o => o.name);
  const datasets = [
    {
      label: 'Base',
      data: scenarioState.base.results.map(r => r.total_score),
      backgroundColor: 'rgba(148, 163, 184, 0.7)',
      borderColor: 'rgba(148, 163, 184, 1)',
      borderWidth: 1,
      borderRadius: 8,
    },
    ...scenarioState.scenarios.map((scenario, idx) => ({
      label: scenario.name,
      data: options.map(name => {
        const result = scenario.results.find(r => r.name === name);
        return result ? result.total_score : 0;
      }),
      backgroundColor: chartPalette(idx, 0.7),
      borderColor: chartPalette(idx, 1),
      borderWidth: 1,
      borderRadius: 8,
    })),
  ];

  scenarioState.charts.multiBar = new Chart(
    document.getElementById('scenario-multibar-chart'),
    {
      type: 'bar',
      data: { labels: options, datasets },
      options: {
        ...buildChartOptions({ legend: true }),
        plugins: {
          ...buildChartOptions({ legend: true }).plugins,
          legend: {
            display: true,
            position: 'top',
            labels: { color: 'rgba(226, 232, 240, 0.82)' },
          },
        },
      },
    }
  );
}

function destroyScenarioCharts() {
  Object.values(scenarioState.charts).forEach(chart => {
    if (chart) chart.destroy();
  });
  scenarioState.charts = { multiBar: null, line: null };
}
