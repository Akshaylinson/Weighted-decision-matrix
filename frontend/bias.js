/* ════════════════════════════════════════════════
   BIAS DETECTION SYSTEM
   Analyzes historical decision patterns
   ════════════════════════════════════════════════ */

const biasState = {
  analysis: null,
  chart: null,
};

// ════════════════════════════════════════════════
// LOAD BIAS ANALYSIS
// ════════════════════════════════════════════════

async function loadBiasAnalysis() {
  const container = document.getElementById('bias-analysis-container');
  if (!container) return;
  
  container.innerHTML = '<div class="table-empty"><span class="spinner"></span><p style="margin-top:12px;">Analyzing decision patterns...</p></div>';
  
  try {
    const data = await apiFetch('/decisions/biases');
    biasState.analysis = data;
    renderBiasAnalysis(data);
  } catch (error) {
    container.innerHTML = `<div class="table-empty"><p class="empty-copy">Failed to load bias analysis: ${esc(error.message)}</p></div>`;
  }
}

// ════════════════════════════════════════════════
// RENDER BIAS ANALYSIS
// ════════════════════════════════════════════════

function renderBiasAnalysis(analysis) {
  const container = document.getElementById('bias-analysis-container');
  if (!container) return;
  
  if (analysis.insufficient_data) {
    container.innerHTML = `
      <div class="bias-insufficient">
        <div class="bias-insufficient-icon">📊</div>
        <h4>Not Enough Data Yet</h4>
        <p>${esc(analysis.message || 'Need at least 3 decisions to detect patterns')}</p>
        <p class="field-hint" style="margin-top:12px;">
          Make more decisions and return here to discover your decision-making patterns.
        </p>
      </div>
    `;
    return;
  }
  
  const { biases, criteria_analysis, patterns, recommendations, total_decisions } = analysis;
  
  container.innerHTML = `
    <div class="bias-header">
      <div>
        <h4>Decision Pattern Analysis</h4>
        <p class="bias-subtitle">
          Analyzed ${total_decisions} decisions to identify behavioral patterns and cognitive biases
        </p>
      </div>
      <button class="button button-ghost" onclick="loadBiasAnalysis()">
        ↻ Refresh Analysis
      </button>
    </div>
    
    ${biases.length > 0 ? `
      <div class="bias-section">
        <h4>🧠 Detected Biases</h4>
        <p class="field-hint">Consistent patterns in your decision-making that may limit objectivity</p>
        <div class="bias-cards">
          ${biases.map(bias => renderBiasCard(bias)).join('')}
        </div>
      </div>
    ` : `
      <div class="bias-section">
        <div class="bias-positive">
          <span class="bias-positive-icon">✅</span>
          <div>
            <strong>No Significant Biases Detected</strong>
            <p>Your decision-making shows good balance across criteria. Keep up the diverse evaluation approach!</p>
          </div>
        </div>
      </div>
    `}
    
    <div class="bias-section">
      <h4>📊 Criteria Usage Analysis</h4>
      <p class="field-hint">How often and how heavily you weight different factors</p>
      <div class="bias-chart-container">
        <canvas id="bias-criteria-chart"></canvas>
      </div>
      <div class="criteria-stats-grid">
        ${renderCriteriaStats(criteria_analysis)}
      </div>
    </div>
    
    ${Object.keys(patterns).length > 0 ? `
      <div class="bias-section">
        <h4>🔍 Decision Patterns</h4>
        <p class="field-hint">Higher-level insights about your decision-making style</p>
        <div class="pattern-cards">
          ${renderPatterns(patterns)}
        </div>
      </div>
    ` : ''}
    
    ${recommendations.length > 0 ? `
      <div class="bias-section">
        <h4>💡 Recommendations</h4>
        <p class="field-hint">Actionable suggestions to improve decision quality</p>
        <div class="recommendation-list">
          ${recommendations.map(rec => `
            <div class="recommendation-item">
              <span class="recommendation-icon">→</span>
              <p>${esc(rec)}</p>
            </div>
          `).join('')}
        </div>
      </div>
    ` : ''}
  `;
  
  renderBiasChart(criteria_analysis);
}

// ════════════════════════════════════════════════
// RENDER BIAS CARD
// ════════════════════════════════════════════════

function renderBiasCard(bias) {
  const severityColors = {
    strong: 'danger',
    moderate: 'warning',
    mild: 'info',
  };
  
  const impactIcons = {
    high: '🔴',
    medium: '🟡',
    low: '🟢',
  };
  
  const color = severityColors[bias.severity] || 'info';
  const icon = impactIcons[bias.impact] || '🔵';
  
  return `
    <div class="bias-card ${color}">
      <div class="bias-card-header">
        <div class="bias-card-icon">${icon}</div>
        <div class="bias-card-title">
          <strong>${esc(bias.title)}</strong>
          <span class="bias-severity ${color}">${bias.severity}</span>
        </div>
      </div>
      <p class="bias-card-description">${esc(bias.description)}</p>
      ${bias.frequency_pct ? `
        <div class="bias-card-stats">
          <div class="bias-stat">
            <span>Frequency</span>
            <strong>${bias.frequency_pct.toFixed(0)}%</strong>
          </div>
          ${bias.avg_weight ? `
            <div class="bias-stat">
              <span>Avg Weight</span>
              <strong>${bias.avg_weight.toFixed(1)}%</strong>
            </div>
          ` : ''}
          ${bias.top_priority_pct ? `
            <div class="bias-stat">
              <span>Top Priority</span>
              <strong>${bias.top_priority_pct.toFixed(0)}%</strong>
            </div>
          ` : ''}
        </div>
      ` : ''}
    </div>
  `;
}

// ════════════════════════════════════════════════
// RENDER CRITERIA STATS
// ════════════════════════════════════════════════

function renderCriteriaStats(criteria_analysis) {
  const sorted = Object.entries(criteria_analysis)
    .sort((a, b) => b[1].avg_weight - a[1].avg_weight)
    .slice(0, 8);  // Top 8 criteria
  
  return sorted.map(([name, stats]) => `
    <div class="criteria-stat-card">
      <div class="criteria-stat-header">
        <strong>${esc(name)}</strong>
        <span class="criteria-stat-badge">${stats.frequency} uses</span>
      </div>
      <div class="criteria-stat-bar">
        <div class="criteria-stat-bar-fill" style="width: ${Math.min(stats.avg_weight * 2, 100)}%"></div>
      </div>
      <div class="criteria-stat-details">
        <span>Avg: ${stats.avg_weight.toFixed(1)}%</span>
        <span>Median: ${stats.median_weight.toFixed(1)}%</span>
        <span>Used: ${stats.frequency_pct.toFixed(0)}%</span>
      </div>
    </div>
  `).join('');
}

// ════════════════════════════════════════════════
// RENDER PATTERNS
// ════════════════════════════════════════════════

function renderPatterns(patterns) {
  let html = '';
  
  if (patterns.temporal_bias) {
    const tb = patterns.temporal_bias;
    const icon = tb.type === 'short_term_bias' ? '⚡' : '🌱';
    const title = tb.type === 'short_term_bias' ? 'Short-Term Focus' : 'Long-Term Orientation';
    
    html += `
      <div class="pattern-card">
        <div class="pattern-icon">${icon}</div>
        <div class="pattern-content">
          <strong>${title}</strong>
          <p>${esc(tb.description)}</p>
          <div class="pattern-stats">
            <span>Short-term: ${tb.short_term_weight.toFixed(1)}%</span>
            <span>Long-term: ${tb.long_term_weight.toFixed(1)}%</span>
            <span>Ratio: ${tb.ratio.toFixed(2)}x</span>
          </div>
        </div>
      </div>
    `;
  }
  
  if (patterns.risk_profile) {
    const rp = patterns.risk_profile;
    html += `
      <div class="pattern-card">
        <div class="pattern-icon">🛡️</div>
        <div class="pattern-content">
          <strong>Risk Profile: ${rp.type === 'risk_averse' ? 'Risk Averse' : 'Risk Tolerant'}</strong>
          <p>${esc(rp.description)}</p>
          <div class="pattern-stats">
            <span>Avg risk/safety weight: ${rp.avg_risk_weight.toFixed(1)}%</span>
          </div>
        </div>
      </div>
    `;
  }
  
  if (patterns.diversity) {
    const div = patterns.diversity;
    const diversityPct = (div.diversity_score * 100).toFixed(0);
    const icon = diversityPct > 50 ? '🌈' : '📌';
    const title = diversityPct > 50 ? 'High Criteria Diversity' : 'Focused Criteria Set';
    
    html += `
      <div class="pattern-card">
        <div class="pattern-icon">${icon}</div>
        <div class="pattern-content">
          <strong>${title}</strong>
          <p>You use ${div.unique_criteria_count} unique criteria across decisions, averaging ${div.avg_criteria_per_decision.toFixed(1)} per decision.</p>
          <div class="pattern-stats">
            <span>Diversity score: ${diversityPct}%</span>
          </div>
        </div>
      </div>
    `;
  }
  
  return html || '<p class="empty-copy">No significant patterns detected.</p>';
}

// ════════════════════════════════════════════════
// RENDER BIAS CHART
// ════════════════════════════════════════════════

function renderBiasChart(criteria_analysis) {
  if (biasState.chart) {
    biasState.chart.destroy();
  }
  
  if (!window.Chart || !criteria_analysis) return;
  
  const sorted = Object.entries(criteria_analysis)
    .sort((a, b) => b[1].avg_weight - a[1].avg_weight)
    .slice(0, 10);  // Top 10 criteria
  
  const labels = sorted.map(([name]) => name);
  const avgWeights = sorted.map(([, stats]) => stats.avg_weight);
  const frequencies = sorted.map(([, stats]) => stats.frequency);
  
  const ctx = document.getElementById('bias-criteria-chart');
  if (!ctx) return;
  
  biasState.chart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [
        {
          label: 'Average Weight (%)',
          data: avgWeights,
          backgroundColor: 'rgba(139, 92, 246, 0.7)',
          borderColor: 'rgba(139, 92, 246, 1)',
          borderWidth: 1,
          borderRadius: 8,
          yAxisID: 'y',
        },
        {
          label: 'Usage Frequency',
          data: frequencies,
          backgroundColor: 'rgba(56, 189, 248, 0.7)',
          borderColor: 'rgba(56, 189, 248, 1)',
          borderWidth: 1,
          borderRadius: 8,
          yAxisID: 'y1',
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: 'index',
        intersect: false,
      },
      plugins: {
        legend: {
          display: true,
          labels: {
            color: 'rgba(226, 232, 240, 0.82)',
          },
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              let label = context.dataset.label || '';
              if (label) {
                label += ': ';
              }
              if (context.parsed.y !== null) {
                label += context.parsed.y.toFixed(1);
                if (context.datasetIndex === 0) {
                  label += '%';
                } else {
                  label += ' times';
                }
              }
              return label;
            }
          }
        }
      },
      scales: {
        x: {
          ticks: { color: 'rgba(226, 232, 240, 0.82)' },
          grid: { color: 'transparent' },
        },
        y: {
          type: 'linear',
          display: true,
          position: 'left',
          beginAtZero: true,
          ticks: { 
            color: 'rgba(226, 232, 240, 0.82)',
            callback: function(value) {
              return value + '%';
            }
          },
          grid: { color: 'rgba(148, 163, 184, 0.12)' },
          title: {
            display: true,
            text: 'Average Weight (%)',
            color: 'rgba(226, 232, 240, 0.82)',
          },
        },
        y1: {
          type: 'linear',
          display: true,
          position: 'right',
          beginAtZero: true,
          ticks: { 
            color: 'rgba(226, 232, 240, 0.82)',
            stepSize: 1,
          },
          grid: { drawOnChartArea: false },
          title: {
            display: true,
            text: 'Usage Count',
            color: 'rgba(226, 232, 240, 0.82)',
          },
        },
      },
    },
  });
}

// ════════════════════════════════════════════════
// INTEGRATION
// ════════════════════════════════════════════════

// Auto-load when switching to bias tab
const originalSwitchTab = typeof switchTab !== 'undefined' ? switchTab : null;
if (originalSwitchTab) {
  window.switchTab = function(tabName) {
    originalSwitchTab(tabName);
    if (tabName === 'biases') {
      loadBiasAnalysis();
    }
  };
}
