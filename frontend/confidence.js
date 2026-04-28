/* ════════════════════════════════════════════════
   DECISION CONFIDENCE SCORE SYSTEM
   Data-driven reliability assessment
   ════════════════════════════════════════════════ */

const confidenceState = {
  score: null,
  breakdown: null,
  warnings: [],
  level: null,
};

// ════════════════════════════════════════════════
// UTILITY FUNCTIONS
// ════════════════════════════════════════════════

function standardDeviation(values) {
  if (!values.length) return 0;
  const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
  const squaredDiffs = values.map(val => Math.pow(val - mean, 2));
  const variance = squaredDiffs.reduce((sum, val) => sum + val, 0) / values.length;
  return Math.sqrt(variance);
}

// ════════════════════════════════════════════════
// CONFIDENCE CALCULATION FACTORS
// ════════════════════════════════════════════════

function calculateCriteriaCountScore(criteriaCount) {
  if (criteriaCount >= 5) return 1.0;
  if (criteriaCount >= 3) return 0.7;
  return 0.4;
}

function calculateWeightBalanceScore(criteria) {
  if (!criteria.length) return 0;
  
  const weights = criteria.map(c => Number(c.weight || 0));
  const std = standardDeviation(weights);
  
  if (std < 10) return 1.0;
  if (std < 20) return 0.7;
  return 0.4;
}

function calculateScoreVarianceScore(results) {
  if (!results || results.length < 2) return 0;
  
  const topScore = results[0].total_score;
  const secondScore = results[1].total_score;
  const gap = topScore - secondScore;
  
  if (gap > 20) return 1.0;
  if (gap > 10) return 0.7;
  return 0.4;
}

function calculateSensitivityScore() {
  if (!sensitivityState.original || !sensitivityState.current) {
    return 0.8; // Default if sensitivity not run
  }
  
  const original = sensitivityState.original.results;
  const current = sensitivityState.current.results;
  
  let rankChanges = 0;
  current.forEach(curr => {
    const orig = original.find(o => o.id === curr.id);
    if (orig && orig.rank !== curr.rank) rankChanges++;
  });
  
  const topChanged = original[0].id !== current[0].id;
  
  if (rankChanges === 0) return 1.0;
  if (rankChanges <= 2 && !topChanged) return 0.6;
  return 0.3;
}

// ════════════════════════════════════════════════
// WARNING GENERATION
// ════════════════════════════════════════════════

function generateWarnings(breakdown, results, criteria) {
  const warnings = [];
  
  // Low variance warning
  if (breakdown.scoreVariance < 0.5) {
    const gap = results[1] ? (results[0].total_score - results[1].total_score).toFixed(1) : 0;
    warnings.push({
      type: 'variance',
      severity: 'high',
      icon: '⚠️',
      title: 'Close Competition',
      message: `Top options are separated by only ${gap} points. Small changes could alter the outcome.`,
    });
  }
  
  // Weight imbalance warning
  if (breakdown.weightBalance < 0.5) {
    const weights = criteria.map(c => c.weight);
    const maxWeight = Math.max(...weights);
    const dominantCriterion = criteria.find(c => c.weight === maxWeight);
    warnings.push({
      type: 'balance',
      severity: 'medium',
      icon: '⚖️',
      title: 'Weight Imbalance',
      message: `Decision heavily weighted toward "${dominantCriterion.name}" (${maxWeight.toFixed(1)}%). Consider if this reflects true priorities.`,
    });
  }
  
  // Sensitivity warning
  if (breakdown.sensitivity < 0.5) {
    warnings.push({
      type: 'sensitivity',
      severity: 'high',
      icon: '🔄',
      title: 'High Sensitivity',
      message: 'Rankings change significantly with weight adjustments. Decision is fragile to priority shifts.',
    });
  }
  
  // Few criteria warning
  if (breakdown.criteriaCount < 0.5) {
    warnings.push({
      type: 'criteria',
      severity: 'medium',
      icon: '📊',
      title: 'Limited Criteria',
      message: `Only ${criteria.length} criteria used. Consider adding more factors for a comprehensive evaluation.`,
    });
  }
  
  // Perfect score warning (too good to be true)
  if (breakdown.overall >= 0.95) {
    warnings.push({
      type: 'perfect',
      severity: 'info',
      icon: '✨',
      title: 'Exceptional Confidence',
      message: 'All factors indicate a highly reliable decision. Proceed with confidence.',
    });
  }
  
  return warnings;
}

// ════════════════════════════════════════════════
// MAIN CONFIDENCE CALCULATION
// ════════════════════════════════════════════════

function calculateConfidenceScore() {
  if (!state.results || !state.decision.criteria.length) {
    confidenceState.score = null;
    confidenceState.breakdown = null;
    confidenceState.warnings = [];
    confidenceState.level = null;
    return null;
  }
  
  const criteriaCount = calculateCriteriaCountScore(state.decision.criteria.length);
  const weightBalance = calculateWeightBalanceScore(state.decision.criteria);
  const scoreVariance = calculateScoreVarianceScore(state.results);
  const sensitivity = calculateSensitivityScore();
  
  const overall = (criteriaCount + weightBalance + scoreVariance + sensitivity) / 4;
  
  let level, color, icon;
  if (overall >= 0.75) {
    level = 'High';
    color = 'success';
    icon = '🟢';
  } else if (overall >= 0.5) {
    level = 'Medium';
    color = 'warning';
    icon = '🟡';
  } else {
    level = 'Low';
    color = 'danger';
    icon = '🔴';
  }
  
  confidenceState.breakdown = {
    criteriaCount,
    weightBalance,
    scoreVariance,
    sensitivity,
    overall,
  };
  
  confidenceState.score = overall;
  confidenceState.level = level;
  confidenceState.color = color;
  confidenceState.icon = icon;
  confidenceState.warnings = generateWarnings(
    confidenceState.breakdown,
    state.results,
    state.decision.criteria
  );
  
  return confidenceState;
}

// ════════════════════════════════════════════════
// UI RENDERING
// ════════════════════════════════════════════════

function renderConfidenceScore() {
  const container = document.getElementById('confidence-score-container');
  if (!container) return;
  
  const confidence = calculateConfidenceScore();
  
  if (!confidence || !confidence.score) {
    container.innerHTML = `
      <div class="confidence-empty">
        <p class="empty-copy">Calculate results to see decision confidence analysis.</p>
      </div>`;
    return;
  }
  
  const { breakdown, level, color, icon, warnings } = confidence;
  const percentage = (breakdown.overall * 100).toFixed(0);
  
  container.innerHTML = `
    <div class="confidence-header">
      <div>
        <div class="confidence-badge ${color}">
          <span class="confidence-icon">${icon}</span>
          <span class="confidence-level">${level} Confidence</span>
        </div>
        <p class="confidence-subtitle">
          ${percentage}% reliability score based on ${state.decision.criteria.length} criteria and ${state.results.length} options
        </p>
      </div>
      <div class="confidence-meter-wrap">
        <div class="confidence-meter">
          <div class="confidence-meter-fill ${color}" style="width: ${percentage}%">
            <span class="confidence-meter-label">${percentage}%</span>
          </div>
        </div>
      </div>
    </div>
    
    <div class="confidence-breakdown">
      <h4>Confidence Factors</h4>
      <div class="confidence-factors">
        ${renderFactor('Criteria Depth', breakdown.criteriaCount, 
          `${state.decision.criteria.length} evaluation factors`, 
          '📊')}
        ${renderFactor('Weight Balance', breakdown.weightBalance, 
          `${standardDeviation(state.decision.criteria.map(c => c.weight)).toFixed(1)} std deviation`, 
          '⚖️')}
        ${renderFactor('Score Separation', breakdown.scoreVariance, 
          `${state.results[1] ? (state.results[0].total_score - state.results[1].total_score).toFixed(1) : 'N/A'} point gap`, 
          '📈')}
        ${renderFactor('Decision Stability', breakdown.sensitivity, 
          sensitivityState.active ? 'Based on current analysis' : 'Run sensitivity for live score', 
          '🔄')}
      </div>
    </div>
    
    ${warnings.length ? `
      <div class="confidence-warnings">
        <h4>Decision Insights</h4>
        <div class="warning-list">
          ${warnings.map(w => `
            <div class="warning-item ${w.severity}">
              <div class="warning-icon">${w.icon}</div>
              <div class="warning-content">
                <strong>${w.title}</strong>
                <p>${w.message}</p>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    ` : ''}
    
    <div class="confidence-interpretation">
      <h4>What This Means</h4>
      ${renderInterpretation(level, breakdown)}
    </div>
  `;
}

function renderFactor(name, score, detail, icon) {
  const percentage = (score * 100).toFixed(0);
  let status, statusColor;
  
  if (score >= 0.75) {
    status = 'Strong';
    statusColor = 'success';
  } else if (score >= 0.5) {
    status = 'Moderate';
    statusColor = 'warning';
  } else {
    status = 'Weak';
    statusColor = 'danger';
  }
  
  return `
    <div class="confidence-factor">
      <div class="factor-header">
        <div class="factor-icon">${icon}</div>
        <div class="factor-info">
          <div class="factor-name">${name}</div>
          <div class="factor-detail">${detail}</div>
        </div>
        <div class="factor-status ${statusColor}">${status}</div>
      </div>
      <div class="factor-bar">
        <div class="factor-bar-fill ${statusColor}" style="width: ${percentage}%"></div>
      </div>
      <div class="factor-score">${percentage}%</div>
    </div>
  `;
}

function renderInterpretation(level, breakdown) {
  if (level === 'High') {
    return `
      <div class="interpretation-box success">
        <p><strong>Excellent decision quality.</strong> Your analysis is comprehensive, well-balanced, and produces a clear winner. The recommendation is reliable and you can proceed with high confidence.</p>
        <ul>
          <li>✅ Clear separation between options</li>
          <li>✅ Balanced evaluation framework</li>
          <li>✅ Stable under weight variations</li>
        </ul>
      </div>
    `;
  } else if (level === 'Medium') {
    return `
      <div class="interpretation-box warning">
        <p><strong>Reasonable decision quality.</strong> Your analysis is solid but has some areas of uncertainty. Consider validating key assumptions or gathering additional data before finalizing.</p>
        <ul>
          ${breakdown.scoreVariance < 0.7 ? '<li>⚠️ Options are closely matched - validate differentiators</li>' : ''}
          ${breakdown.weightBalance < 0.7 ? '<li>⚠️ Weights may be imbalanced - review priorities</li>' : ''}
          ${breakdown.sensitivity < 0.7 ? '<li>⚠️ Decision sensitive to weight changes - test scenarios</li>' : ''}
          ${breakdown.criteriaCount < 0.7 ? '<li>⚠️ Consider adding more evaluation criteria</li>' : ''}
        </ul>
      </div>
    `;
  } else {
    return `
      <div class="interpretation-box danger">
        <p><strong>Low decision confidence.</strong> Multiple factors indicate uncertainty in this analysis. Review your criteria, weights, and scores before making a final decision.</p>
        <ul>
          ${breakdown.scoreVariance < 0.5 ? '<li>🔴 Top options are too close - need clearer differentiation</li>' : ''}
          ${breakdown.weightBalance < 0.5 ? '<li>🔴 Weights are heavily imbalanced - reconsider priorities</li>' : ''}
          ${breakdown.sensitivity < 0.5 ? '<li>🔴 Rankings are unstable - decision is fragile</li>' : ''}
          ${breakdown.criteriaCount < 0.5 ? '<li>🔴 Too few criteria - expand evaluation framework</li>' : ''}
        </ul>
        <p style="margin-top: 12px;"><strong>Recommendation:</strong> Refine your analysis before proceeding.</p>
      </div>
    `;
  }
}

// ════════════════════════════════════════════════
// INTEGRATION HOOKS
// ════════════════════════════════════════════════

function updateConfidenceScore() {
  if (state.results && state.results.length) {
    renderConfidenceScore();
  }
}

// Auto-update when sensitivity analysis changes
const originalAdjustWeight = typeof adjustWeight !== 'undefined' ? adjustWeight : null;
if (originalAdjustWeight) {
  window.adjustWeight = function(...args) {
    originalAdjustWeight.apply(this, args);
    updateConfidenceScore();
  };
}
