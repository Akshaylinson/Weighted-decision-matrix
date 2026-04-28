/* ════════════════════════════════════════════════
   SENSITIVITY ANALYSIS MODULE
   Real-time weight adjustment & ranking simulation
   ════════════════════════════════════════════════ */

const sensitivityState = {
  active: false,
  original: null,
  current: null,
  charts: { comparison: null, radar: null },
};

function toggleSensitivityMode() {
  if (!state.results) {
    toast('Calculate results first before running sensitivity analysis.', 'warning');
    return;
  }

  sensitivityState.active = !sensitivityState.active;
  const btn = document.getElementById('btn-sensitivity-mode');
  const panel = document.getElementById('sensitivity-panel');

  if (sensitivityState.active) {
    sensitivityState.original = {
      criteria: JSON.parse(JSON.stringify(state.decision.criteria)),
      results: JSON.parse(JSON.stringify(state.results)),
    };
    sensitivityState.current = {
      criteria: JSON.parse(JSON.stringify(state.decision.criteria)),
      results: JSON.parse(JSON.stringify(state.results)),
    };

    btn.textContent = '✕ Exit Analysis';
    btn.classList.add('active');
    panel.classList.add('active');
    renderSensitivityPanel();
  } else {
    btn.textContent = '🔬 Sensitivity Analysis';
    btn.classList.remove('active');
    panel.classList.add('closing');
    setTimeout(() => {
      panel.classList.remove('active', 'closing');
      destroySensitivityCharts();
    }, 300);
  }
}

function resetSensitivityWeights() {
  if (!sensitivityState.original) return;
  sensitivityState.current.criteria = JSON.parse(JSON.stringify(sensitivityState.original.criteria));
  recalculateSensitivity();
  renderSensitivityPanel();
  toast('Weights reset to original values.', 'info');
}

function adjustWeight(criterionId, newWeight) {
  const criterion = sensitivityState.current.criteria.find(c => c.id === criterionId);
  if (!criterion) return;

  const oldWeight = criterion.weight;
  const delta = newWeight - oldWeight;
  const others = sensitivityState.current.criteria.filter(c => c.id !== criterionId);
  const othersTotal = others.reduce((sum, c) => sum + c.weight, 0) || 1;

  criterion.weight = newWeight;

  others.forEach(c => {
    const proportion = c.weight / othersTotal;
    c.weight = Math.max(0, c.weight - (delta * proportion));
  });

  const total = sensitivityState.current.criteria.reduce((sum, c) => sum + c.weight, 0);
  if (Math.abs(total - 100) > 0.1) {
    const factor = 100 / total;
    sensitivityState.current.criteria.forEach(c => c.weight *= factor);
  }

  recalculateSensitivity();
  renderSensitivityPanel();
}

function recalculateSensitivity() {
  const normalized = sensitivityState.current.criteria.map(c => ({
    ...c,
    weight: c.weight,
  }));

  const results = [];
  state.decision.options.forEach(option => {
    let total = 0;
    const breakdown = [];

    normalized.forEach(criterion => {
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

  sensitivityState.current.results = results;
}

function renderSensitivityPanel() {
  const panel = document.getElementById('sensitivity-content');
  if (!panel) return;

  const stability = calculateStability();
  const critical = findCriticalCriteria();

  panel.innerHTML = `
    <div class="sensitivity-grid">
      <div class="sensitivity-left">
        <div class="sensitivity-section">
          <h4>Weight Adjustments</h4>
          <p class="field-hint">Drag sliders to simulate weight changes. Total always equals 100%.</p>
          <div class="weight-sliders">
            ${sensitivityState.current.criteria.map(c => `
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
                  oninput="adjustWeight('${c.id}', parseFloat(this.value))"
                />
              </div>
            `).join('')}
          </div>
          <button class="button button-ghost w-full" onclick="resetSensitivityWeights()">
            ↺ Reset to Original
          </button>
        </div>

        <div class="sensitivity-section">
          <h4>Decision Stability</h4>
          <div class="stability-indicator ${stability.level}">
            <div class="stability-icon">${stability.icon}</div>
            <div>
              <strong>${stability.label}</strong>
              <p>${stability.description}</p>
            </div>
          </div>
        </div>

        <div class="sensitivity-section">
          <h4>Critical Criteria</h4>
          <p class="field-hint">Criteria with highest impact on final ranking:</p>
          <div class="critical-list">
            ${critical.map(c => `
              <div class="critical-item">
                <span>${esc(c.name)}</span>
                <span class="critical-impact">${c.impact.toFixed(1)}% impact</span>
              </div>
            `).join('')}
          </div>
        </div>
      </div>

      <div class="sensitivity-right">
        <div class="sensitivity-section">
          <h4>Ranking Comparison</h4>
          ${renderComparisonTable()}
        </div>

        <div class="sensitivity-section">
          <h4>Score Comparison</h4>
          <div class="chart-frame" style="height: 280px;">
            <canvas id="sensitivity-comparison-chart"></canvas>
          </div>
        </div>

        <div class="sensitivity-section">
          <h4>Weight Distribution</h4>
          <div class="chart-frame" style="height: 280px;">
            <canvas id="sensitivity-radar-chart"></canvas>
          </div>
        </div>
      </div>
    </div>
  `;

  renderSensitivityCharts();
}

function renderComparisonTable() {
  const original = sensitivityState.original.results;
  const current = sensitivityState.current.results;

  const rows = current.map(curr => {
    const orig = original.find(o => o.id === curr.id);
    const rankChange = orig ? orig.rank - curr.rank : 0;
    const scoreChange = orig ? curr.total_score - orig.total_score : 0;

    let rankIcon = '→';
    let rankClass = 'no-change';
    if (rankChange > 0) {
      rankIcon = '↑';
      rankClass = 'rank-up';
    } else if (rankChange < 0) {
      rankIcon = '↓';
      rankClass = 'rank-down';
    }

    return `
      <tr>
        <td>
          <div class="rank-badge-mini ${curr.rank === 1 ? 'rank-1' : ''}">#${curr.rank}</div>
        </td>
        <td><strong>${esc(curr.name)}</strong></td>
        <td class="text-right">${orig ? orig.total_score.toFixed(1) : '-'}</td>
        <td class="text-right">${curr.total_score.toFixed(1)}</td>
        <td class="text-right ${scoreChange > 0 ? 'text-success' : scoreChange < 0 ? 'text-danger' : ''}">
          ${scoreChange > 0 ? '+' : ''}${scoreChange.toFixed(1)}
        </td>
        <td class="text-center">
          <span class="rank-change ${rankClass}">${rankIcon}</span>
        </td>
      </tr>
    `;
  }).join('');

  return `
    <div class="table-scroll">
      <table class="comparison-table">
        <thead>
          <tr>
            <th>Rank</th>
            <th>Option</th>
            <th class="text-right">Original</th>
            <th class="text-right">New</th>
            <th class="text-right">Δ</th>
            <th class="text-center">Change</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
  `;
}

function calculateStability() {
  const original = sensitivityState.original.results;
  const current = sensitivityState.current.results;

  let rankChanges = 0;
  let maxRankChange = 0;

  current.forEach(curr => {
    const orig = original.find(o => o.id === curr.id);
    if (orig) {
      const change = Math.abs(orig.rank - curr.rank);
      if (change > 0) rankChanges++;
      maxRankChange = Math.max(maxRankChange, change);
    }
  });

  const topChanged = original[0].id !== current[0].id;

  if (rankChanges === 0) {
    return {
      level: 'high',
      icon: '🟢',
      label: 'Highly Stable',
      description: 'Rankings unchanged. Decision is robust to weight adjustments.',
    };
  } else if (rankChanges <= 2 && !topChanged) {
    return {
      level: 'medium',
      icon: '🟡',
      label: 'Moderately Stable',
      description: 'Minor ranking shifts. Top choice remains consistent.',
    };
  } else {
    return {
      level: 'low',
      icon: '🔴',
      label: 'Fragile Decision',
      description: topChanged 
        ? 'Top choice changed. Decision highly sensitive to weights.'
        : 'Significant ranking changes. Review criteria importance.',
    };
  }
}

function findCriticalCriteria() {
  const impacts = sensitivityState.current.criteria.map(criterion => {
    const testWeight = criterion.weight + 10;
    const others = sensitivityState.current.criteria.filter(c => c.id !== criterion.id);
    const othersTotal = others.reduce((sum, c) => sum + c.weight, 0) || 1;

    const testCriteria = sensitivityState.current.criteria.map(c => {
      if (c.id === criterion.id) return { ...c, weight: testWeight };
      const proportion = c.weight / othersTotal;
      return { ...c, weight: c.weight - (10 * proportion) };
    });

    const testResults = [];
    state.decision.options.forEach(option => {
      let total = 0;
      testCriteria.forEach(c => {
        const raw = option.scores[c.id] || 0;
        total += (raw / 5.0) * c.weight;
      });
      testResults.push({ id: option.id, score: total });
    });

    testResults.sort((a, b) => b.score - a.score);
    const currentOrder = sensitivityState.current.results.map(r => r.id);
    const testOrder = testResults.map(r => r.id);

    let changes = 0;
    testOrder.forEach((id, idx) => {
      if (currentOrder[idx] !== id) changes++;
    });

    return {
      id: criterion.id,
      name: criterion.name,
      impact: (changes / testOrder.length) * 100,
    };
  });

  impacts.sort((a, b) => b.impact - a.impact);
  return impacts.slice(0, 3);
}

function renderSensitivityCharts() {
  destroySensitivityCharts();
  if (!window.Chart) return;

  const original = sensitivityState.original.results;
  const current = sensitivityState.current.results;
  const labels = current.map(r => r.name);

  sensitivityState.charts.comparison = new Chart(
    document.getElementById('sensitivity-comparison-chart'),
    {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label: 'Original Score',
            data: labels.map(name => {
              const r = original.find(o => o.name === name);
              return r ? r.total_score : 0;
            }),
            backgroundColor: 'rgba(148, 163, 184, 0.6)',
            borderColor: 'rgba(148, 163, 184, 1)',
            borderWidth: 1,
            borderRadius: 8,
          },
          {
            label: 'New Score',
            data: current.map(r => r.total_score),
            backgroundColor: 'rgba(139, 92, 246, 0.7)',
            borderColor: 'rgba(139, 92, 246, 1)',
            borderWidth: 1,
            borderRadius: 8,
          },
        ],
      },
      options: buildChartOptions({ legend: true }),
    }
  );

  sensitivityState.charts.radar = new Chart(
    document.getElementById('sensitivity-radar-chart'),
    {
      type: 'radar',
      data: {
        labels: sensitivityState.current.criteria.map(c => c.name),
        datasets: [
          {
            label: 'Original Weights',
            data: sensitivityState.original.criteria.map(c => c.weight),
            borderColor: 'rgba(148, 163, 184, 1)',
            backgroundColor: 'rgba(148, 163, 184, 0.15)',
            pointBackgroundColor: 'rgba(148, 163, 184, 1)',
          },
          {
            label: 'Current Weights',
            data: sensitivityState.current.criteria.map(c => c.weight),
            borderColor: 'rgba(139, 92, 246, 1)',
            backgroundColor: 'rgba(139, 92, 246, 0.15)',
            pointBackgroundColor: 'rgba(139, 92, 246, 1)',
          },
        ],
      },
      options: buildChartOptions({ radar: true, legend: true }),
    }
  );
}

function destroySensitivityCharts() {
  Object.values(sensitivityState.charts).forEach(chart => {
    if (chart) chart.destroy();
  });
  sensitivityState.charts = { comparison: null, radar: null };
}
