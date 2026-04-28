const analyticsState = {
  data: null,
  charts: {
    criteriaUsage: null,
    weightDistribution: null,
    successAnalysis: null,
    confidenceOutcome: null,
    timeline: null,
  },
};

function destroyAnalyticsCharts() {
  Object.values(analyticsState.charts).forEach((chart) => {
    if (chart) chart.destroy();
  });
  analyticsState.charts = {
    criteriaUsage: null,
    weightDistribution: null,
    successAnalysis: null,
    confidenceOutcome: null,
    timeline: null,
  };
}

function analyticsPalette(index, alpha = 1) {
  const colors = [
    [99, 102, 241],
    [59, 130, 246],
    [16, 185, 129],
    [245, 158, 11],
    [244, 114, 182],
    [148, 163, 184],
  ];
  const [r, g, b] = colors[index % colors.length];
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function analyticsChartOptions({ horizontal = false, legend = true, line = false } = {}) {
  const tick = 'rgba(226, 232, 240, 0.82)';
  const grid = 'rgba(148, 163, 184, 0.12)';

  return {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: horizontal ? 'y' : 'x',
    plugins: {
      legend: {
        display: legend,
        labels: {
          color: tick,
        },
      },
    },
    scales: {
      x: {
        ticks: { color: tick },
        grid: { color: line ? grid : 'transparent' },
      },
      y: {
        beginAtZero: true,
        ticks: { color: tick },
        grid: { color: grid },
      },
    },
  };
}

function formatTimelineLabel(period) {
  const [year, month] = String(period).split('-');
  if (!year || !month) return period;
  const date = new Date(Number(year), Number(month) - 1, 1);
  return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
}

async function loadAnalyticsDashboard() {
  const container = document.getElementById('analytics-dashboard-container');
  if (!container) return;

  container.innerHTML = '<div class="table-empty"><span class="spinner"></span><p style="margin-top:12px;">Loading decision analytics...</p></div>';

  try {
    const data = await apiFetch('/decisions/analytics');
    analyticsState.data = data;
    renderAnalyticsDashboard(data);
  } catch (error) {
    container.innerHTML = `<div class="table-empty"><p class="empty-copy">Failed to load analytics: ${esc(error.message)}</p></div>`;
  }
}

function renderAnalyticsDashboard(data) {
  const container = document.getElementById('analytics-dashboard-container');
  if (!container) return;

  destroyAnalyticsCharts();

  if (data.insufficient_data) {
    container.innerHTML = `
      <div class="analytics-empty">
        <div class="analytics-empty-icon">📈</div>
        <h4>Not enough decisions yet</h4>
        <p>${esc(data.message || 'Need more decisions to unlock analytics.')}</p>
        <p class="field-hint">Create and review at least ${data.minimum_required || 3} decisions to see patterns over time.</p>
      </div>`;
    return;
  }

  const overview = data.overview || {};
  const successRateText = overview.success_rate !== null && overview.success_rate !== undefined
    ? `${overview.success_rate.toFixed(0)}%`
    : 'N/A';
  const avgConfidenceText = overview.average_confidence !== null && overview.average_confidence !== undefined
    ? `${overview.average_confidence.toFixed(0)}%`
    : 'N/A';

  container.innerHTML = `
    <section class="analytics-stack">
      <div class="analytics-card-grid">
        <article class="analytics-kpi-card">
          <span>Total Decisions</span>
          <strong>${overview.total_decisions || 0}</strong>
          <p>All recorded decisions in your workspace.</p>
        </article>
        <article class="analytics-kpi-card">
          <span>Success Rate</span>
          <strong>${successRateText}</strong>
          <p>Reviewed decisions marked as correct.</p>
        </article>
        <article class="analytics-kpi-card">
          <span>Pending Reviews</span>
          <strong>${overview.pending_reviews || 0}</strong>
          <p>Decisions still waiting for outcome feedback.</p>
        </article>
        <article class="analytics-kpi-card">
          <span>Average Confidence</span>
          <strong>${avgConfidenceText}</strong>
          <p>Average decision confidence across saved analyses.</p>
        </article>
      </div>

      <div class="analytics-grid analytics-grid-two">
        <article class="analytics-panel">
          <div class="analytics-panel-head">
            <div>
              <p class="eyebrow">Criteria Usage</p>
              <h4>Most used criteria</h4>
            </div>
            <span class="analytics-inline-insight">${esc(data.insights?.most_used_criteria || 'Usage patterns will appear here.')}</span>
          </div>
          <div class="analytics-chart-frame"><canvas id="analytics-criteria-usage-chart"></canvas></div>
        </article>

        <article class="analytics-panel">
          <div class="analytics-panel-head">
            <div>
              <p class="eyebrow">Weight Trends</p>
              <h4>Average weight by criterion</h4>
            </div>
            <span class="analytics-inline-insight">${esc(data.insights?.weight_distribution || 'Weight trends will appear here.')}</span>
          </div>
          <div class="analytics-chart-frame"><canvas id="analytics-weight-distribution-chart"></canvas></div>
        </article>
      </div>

      <div class="analytics-grid analytics-grid-two">
        <article class="analytics-panel">
          <div class="analytics-panel-head">
            <div>
              <p class="eyebrow">Outcome Analysis</p>
              <h4>Decision success analysis</h4>
            </div>
          </div>
          <div class="analytics-chart-frame analytics-chart-frame-sm"><canvas id="analytics-success-chart"></canvas></div>
        </article>

        <article class="analytics-panel">
          <div class="analytics-panel-head">
            <div>
              <p class="eyebrow">Confidence vs Outcome</p>
              <h4>How confidence aligns with results</h4>
            </div>
            <span class="analytics-inline-insight">${esc(data.insights?.confidence_vs_outcome || 'Confidence patterns will appear here.')}</span>
          </div>
          <div class="analytics-chart-frame"><canvas id="analytics-confidence-chart"></canvas></div>
        </article>
      </div>

      <div class="analytics-grid analytics-grid-two">
        <article class="analytics-panel">
          <div class="analytics-panel-head">
            <div>
              <p class="eyebrow">Timeline</p>
              <h4>Decision frequency over time</h4>
            </div>
          </div>
          <div class="analytics-chart-frame"><canvas id="analytics-timeline-chart"></canvas></div>
        </article>

        <article class="analytics-panel">
          <div class="analytics-panel-head">
            <div>
              <p class="eyebrow">Bias Summary</p>
              <h4>Top detected patterns</h4>
            </div>
          </div>
          <div class="analytics-bias-list">
            ${renderAnalyticsBiasSummary(data.bias_summary)}
          </div>
        </article>
      </div>

      <div class="analytics-grid analytics-grid-two">
        <article class="analytics-panel">
          <div class="analytics-panel-head">
            <div>
              <p class="eyebrow">Improvement Signals</p>
              <h4>Suggested next adjustments</h4>
            </div>
          </div>
          <div class="analytics-suggestion-list">
            ${renderAnalyticsSuggestions(data.insights?.improvement_suggestions || [])}
          </div>
        </article>

        <article class="analytics-panel">
          <div class="analytics-panel-head">
            <div>
              <p class="eyebrow">Decision Intelligence</p>
              <h4>What your dashboard says</h4>
            </div>
          </div>
          <div class="analytics-summary-notes">
            ${renderAnalyticsSummaryNotes(data)}
          </div>
        </article>
      </div>
    </section>`;

  renderAnalyticsCharts(data);
}

function renderAnalyticsBiasSummary(biasSummary) {
  const biases = biasSummary?.top_biases || [];
  if (!biases.length) {
    return '<div class="analytics-empty-small">No strong biases detected yet. Keep adding reviewed decisions for deeper pattern analysis.</div>';
  }

  return biases.map((bias) => `
    <article class="analytics-bias-item ${bias.severity || 'mild'}">
      <div class="analytics-bias-head">
        <strong>${esc(bias.title)}</strong>
        <span>${esc(bias.severity || 'mild')}</span>
      </div>
      <p>${esc(bias.description)}</p>
    </article>`).join('');
}

function renderAnalyticsSuggestions(suggestions) {
  if (!suggestions.length) {
    return '<div class="analytics-empty-small">No suggestions yet. More reviewed decisions will unlock clearer coaching.</div>';
  }

  return suggestions.map((item) => `
    <div class="analytics-suggestion-item">
      <span class="analytics-suggestion-dot"></span>
      <p>${esc(item)}</p>
    </div>`).join('');
}

function renderAnalyticsSummaryNotes(data) {
  const notes = [];
  const overview = data.overview || {};

  if (overview.reviewed_decisions >= 3 && overview.success_rate !== null) {
    notes.push(`You have reviewed ${overview.reviewed_decisions} decisions, with a ${overview.success_rate.toFixed(0)}% success rate.`);
  }
  if (data.insights?.most_used_criteria) {
    notes.push(data.insights.most_used_criteria);
  }
  if (data.insights?.weight_distribution) {
    notes.push(data.insights.weight_distribution);
  }
  if (data.bias_summary?.recommendations?.length) {
    notes.push(data.bias_summary.recommendations[0]);
  }

  if (!notes.length) {
    notes.push('This dashboard will become more insightful as you save and review more decisions.');
  }

  return notes.map((note) => `<p>${esc(note)}</p>`).join('');
}

function renderAnalyticsCharts(data) {
  if (!window.Chart) return;

  const criteriaUsage = (data.criteria_usage || []).slice(0, 8);
  analyticsState.charts.criteriaUsage = new Chart(document.getElementById('analytics-criteria-usage-chart'), {
    type: 'bar',
    data: {
      labels: criteriaUsage.map((item) => item.criterion),
      datasets: [{
        label: 'Usage Count',
        data: criteriaUsage.map((item) => item.count),
        backgroundColor: criteriaUsage.map((_, index) => analyticsPalette(index, 0.72)),
        borderColor: criteriaUsage.map((_, index) => analyticsPalette(index, 1)),
        borderWidth: 1,
        borderRadius: 12,
      }],
    },
    options: analyticsChartOptions({ legend: false }),
  });

  const weightDistribution = (data.weight_distribution || []).slice(0, 8);
  analyticsState.charts.weightDistribution = new Chart(document.getElementById('analytics-weight-distribution-chart'), {
    type: 'bar',
    data: {
      labels: weightDistribution.map((item) => item.criterion),
      datasets: [{
        label: 'Average Weight',
        data: weightDistribution.map((item) => item.avg_weight),
        backgroundColor: weightDistribution.map((_, index) => analyticsPalette(index, 0.68)),
        borderColor: weightDistribution.map((_, index) => analyticsPalette(index, 1)),
        borderWidth: 1,
        borderRadius: 12,
      }],
    },
    options: analyticsChartOptions({ horizontal: true, legend: false }),
  });

  analyticsState.charts.successAnalysis = new Chart(document.getElementById('analytics-success-chart'), {
    type: 'pie',
    data: {
      labels: ['Correct', 'Incorrect'],
      datasets: [{
        data: [data.success_breakdown?.correct || 0, data.success_breakdown?.incorrect || 0],
        backgroundColor: [analyticsPalette(2, 0.78), analyticsPalette(4, 0.72)],
        borderColor: [analyticsPalette(2, 1), analyticsPalette(4, 1)],
        borderWidth: 1,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          labels: { color: 'rgba(226, 232, 240, 0.82)' },
        },
      },
    },
  });

  const confidenceLevels = ['High', 'Medium', 'Low'];
  const confidenceData = data.confidence_analysis?.by_level || {};
  analyticsState.charts.confidenceOutcome = new Chart(document.getElementById('analytics-confidence-chart'), {
    type: 'bar',
    data: {
      labels: confidenceLevels,
      datasets: [
        {
          label: 'Reviewed',
          data: confidenceLevels.map((level) => confidenceData[level]?.reviewed || 0),
          backgroundColor: analyticsPalette(1, 0.6),
          borderColor: analyticsPalette(1, 1),
          borderWidth: 1,
          borderRadius: 10,
        },
        {
          label: 'Correct',
          data: confidenceLevels.map((level) => confidenceData[level]?.correct || 0),
          backgroundColor: analyticsPalette(2, 0.72),
          borderColor: analyticsPalette(2, 1),
          borderWidth: 1,
          borderRadius: 10,
        },
      ],
    },
    options: analyticsChartOptions(),
  });

  const timeline = data.timeline || [];
  analyticsState.charts.timeline = new Chart(document.getElementById('analytics-timeline-chart'), {
    type: 'line',
    data: {
      labels: timeline.map((item) => formatTimelineLabel(item.period)),
      datasets: [{
        label: 'Decisions',
        data: timeline.map((item) => item.count),
        borderColor: analyticsPalette(0, 1),
        backgroundColor: analyticsPalette(0, 0.18),
        fill: true,
        tension: 0.35,
        pointRadius: 4,
        pointBackgroundColor: analyticsPalette(1, 1),
      }],
    },
    options: analyticsChartOptions({ legend: false, line: true }),
  });
}
