# 🧠 Bias Detection System

## Overview

The **Bias Detection System** analyzes your historical decisions to identify consistent behavioral patterns and cognitive biases. By examining how you weight criteria across multiple decisions, the system reveals hidden tendencies that may limit objectivity and provides actionable recommendations for improvement.

---

## 🎯 Core Concept

**Bias is NOT a single-decision issue—it's a pattern across multiple decisions.**

The system looks for:
- Criteria you consistently over-prioritize
- Factors you habitually underweight
- Recurring decision structures
- Temporal preferences (short-term vs long-term)
- Risk tolerance patterns

---

## 📊 How It Works

### Data Requirements

**Minimum**: 3 completed decisions  
**Optimal**: 5+ decisions for reliable pattern detection  
**Best**: 10+ decisions for comprehensive analysis

### Analysis Process

1. **Aggregate All Decisions**
   - Load all saved decisions from JSON storage
   - Extract criteria, weights, and outcomes

2. **Build Criteria Frequency Map**
   - Count how often each criterion appears
   - Track usage percentage across decisions

3. **Calculate Average Weights**
   - Compute mean, median, and standard deviation
   - Identify top-weighted criteria

4. **Detect Bias Patterns**
   - Apply detection rules to identify biases
   - Classify by type and severity

5. **Generate Insights**
   - Create actionable recommendations
   - Highlight patterns and trends

---

## 🔍 Detected Bias Types

### 1. **Dominant Criterion Bias**

**Detection Rule**:
```
IF criterion appears in ≥70% of decisions
AND average weight ≥25%
THEN flag as dominant
```

**Severity**:
- **Strong**: Average weight ≥35%
- **Moderate**: Average weight 25-34%

**Example**:
> "You consistently prioritize 'Cost' across 85% of decisions with an average weight of 38%."

**Impact**: High  
**Risk**: Single-factor decision-making, missing important trade-offs

---

### 2. **Habitual Top Priority Bias**

**Detection Rule**:
```
IF criterion is #1 priority in ≥70% of decisions
THEN flag as habitual top priority
```

**Severity**: Strong

**Example**:
> "'Performance' is your #1 priority in 80% of decisions. This may indicate a fixed mindset."

**Impact**: Medium  
**Risk**: Inflexible prioritization, context-insensitive decisions

---

### 3. **Neglected Criterion Bias**

**Detection Rule**:
```
IF criterion appears in ≤30% of decisions
AND average weight ≤15%
THEN flag as neglected
```

**Severity**: Mild

**Example**:
> "'Scalability' appears in only 25% of decisions with low average weight (12%)."

**Impact**: Low  
**Risk**: Missing important long-term considerations

---

### 4. **Weight Imbalance Pattern**

**Detection Rule**:
```
IF ≥50% of criteria have std deviation >20
THEN flag as inconsistent weighting
```

**Severity**: Moderate

**Example**:
> "Your weight distributions vary significantly across decisions, suggesting unclear priorities."

**Impact**: Medium  
**Risk**: Inconsistent decision framework, unreliable comparisons

---

## 🌐 Pattern Detection

### Temporal Bias (Short-Term vs Long-Term)

**Keywords Analyzed**:
- **Short-term**: cost, price, speed, quick, immediate, fast
- **Long-term**: scalability, maintenance, sustainability, growth, future

**Detection**:
```
ratio = short_term_weight / long_term_weight

IF ratio > 2.0 → Short-term bias
IF ratio < 0.5 → Long-term bias
```

**Example**:
> "You tend to prioritize short-term factors over long-term considerations (ratio: 3.2x)."

---

### Risk Profile

**Keywords Analyzed**: risk, safety, security, reliability, stable

**Detection**:
```
IF average risk/safety weight > 25%
THEN risk_averse profile
```

**Example**:
> "You consistently prioritize safety and risk mitigation (avg: 28% weight)."

---

### Criteria Diversity

**Metrics**:
- Unique criteria count
- Average criteria per decision
- Diversity score

**Interpretation**:
- **High diversity** (>50%): Flexible, context-adaptive
- **Low diversity** (<30%): Focused, potentially rigid

---

## 📈 Criteria Analysis

For each criterion used across decisions:

### Metrics Calculated

| Metric | Description | Interpretation |
|--------|-------------|----------------|
| **Frequency** | Times used | How often you consider this factor |
| **Frequency %** | Usage percentage | Consistency of inclusion |
| **Avg Weight** | Mean weight | Typical importance |
| **Median Weight** | Middle value | Central tendency |
| **Std Weight** | Variation | Consistency of weighting |
| **Top Priority Count** | Times ranked #1 | Dominance frequency |
| **Top Priority %** | Percentage #1 | Habitual prioritization |

### Visual Representation

**Dual-Axis Chart**:
- **Left Y-axis**: Average Weight (%)
- **Right Y-axis**: Usage Frequency (count)
- **X-axis**: Criterion names (top 10)

This reveals both how often AND how heavily you weight each factor.

---

## 💡 Recommendations System

### Recommendation Types

#### 1. **Reduce Dominant Criterion**
*When*: Dominant criterion bias detected  
*Suggestion*: "Consider reducing emphasis on 'X' in future decisions. Try limiting its weight to 20-25%."

#### 2. **Challenge Top Priority**
*When*: Habitual top priority bias detected  
*Suggestion*: "Challenge yourself to make 'X' a secondary priority in your next decision."

#### 3. **Increase Neglected Factors**
*When*: Neglected criterion bias detected  
*Suggestion*: "Pay more attention to: X, Y. These factors may be more important than you realize."

#### 4. **Use Sensitivity Analysis**
*When*: Multiple biases detected  
*Suggestion*: "Try using the Sensitivity Analysis feature to test how different priorities affect outcomes."

#### 5. **Maintain Balance**
*When*: No significant biases  
*Suggestion*: "Your decision-making shows good balance. Continue to evaluate decisions across diverse criteria."

---

## 🎨 UI Components

### 1. **Bias Cards**

**Visual Design**:
- Color-coded by severity (red/yellow/blue)
- Impact icon (🔴 high, 🟡 medium, 🟢 low)
- Title and description
- Statistics (frequency, avg weight, top priority %)

**Severity Colors**:
- **Strong** → Red (danger)
- **Moderate** → Yellow (warning)
- **Mild** → Blue (info)

---

### 2. **Criteria Usage Chart**

**Type**: Dual-axis bar chart  
**Data**: Top 10 criteria by average weight  
**Purpose**: Visual comparison of usage patterns

**Features**:
- Interactive tooltips
- Dual Y-axes (weight % and frequency)
- Color-coded datasets
- Responsive design

---

### 3. **Pattern Cards**

**Displays**:
- Temporal bias (⚡ short-term or 🌱 long-term)
- Risk profile (🛡️ risk averse or 🎲 risk tolerant)
- Criteria diversity (🌈 high or 📌 focused)

**Format**: Icon + title + description + stats

---

### 4. **Recommendation List**

**Visual**: Arrow-prefixed action items  
**Style**: Purple-tinted cards with hover effects  
**Content**: Specific, actionable suggestions

---

### 5. **Insufficient Data State**

**Shown When**: <3 decisions  
**Message**: "Need at least 3 decisions to detect patterns"  
**CTA**: Encourages making more decisions

---

## 🔄 Update Logic

### When Analysis Refreshes

1. **New decision saved** → Patterns may change
2. **Decision reviewed** → Outcome data incorporated
3. **Manual refresh** → User clicks "↻ Refresh Analysis"

### Performance

- **Backend calculation**: <100ms for 50 decisions
- **Frontend rendering**: <200ms
- **Chart generation**: <300ms

---

## 📊 Real-World Example

### Scenario: Software Engineer's Decision History

**10 Decisions Analyzed**:
- Cloud provider selection
- Framework choice
- Database selection
- Deployment strategy
- Monitoring tool
- CI/CD platform
- API design approach
- Testing framework
- Documentation tool
- Code review process

### Detected Biases

#### 1. Dominant Criterion: "Cost"
- **Frequency**: 90% (9/10 decisions)
- **Avg Weight**: 42%
- **Severity**: Strong
- **Impact**: High

#### 2. Habitual Top Priority: "Performance"
- **Top Priority**: 70% (7/10 decisions)
- **Severity**: Strong
- **Impact**: Medium

#### 3. Neglected: "Documentation Quality"
- **Frequency**: 20% (2/10 decisions)
- **Avg Weight**: 8%
- **Severity**: Mild
- **Impact**: Low

### Patterns Detected

**Temporal Bias**: Short-term focus
- Short-term weight: 65%
- Long-term weight: 18%
- Ratio: 3.6x

**Risk Profile**: Risk averse
- Avg risk/safety weight: 28%

**Diversity**: Moderate
- 15 unique criteria
- 4.2 avg per decision
- Diversity score: 36%

### Recommendations

1. "Consider reducing emphasis on 'Cost' in future decisions. Try limiting its weight to 20-25%."
2. "Challenge yourself to make 'Performance' a secondary priority in your next decision."
3. "Pay more attention to: Documentation Quality, Maintainability. These factors may be more important than you realize."
4. "You show multiple decision-making patterns. Try using the Sensitivity Analysis feature to test how different priorities affect outcomes."

### Interpretation

**Strengths**:
- ✅ Consistent evaluation framework
- ✅ Clear priorities (cost and performance)
- ✅ Risk-aware decision-making

**Weaknesses**:
- ⚠️ Over-emphasis on cost may sacrifice quality
- ⚠️ Short-term focus risks technical debt
- ⚠️ Documentation and maintainability undervalued

**Action Plan**:
1. Next decision: Limit cost to 25% weight
2. Elevate long-term factors (scalability, maintainability)
3. Add documentation quality as criterion
4. Run sensitivity analysis to test assumptions

---

## 🎓 Understanding Your Biases

### Why Biases Matter

**Cognitive biases** are systematic patterns of deviation from rationality. In decision-making:

- **Confirmation bias** → Seeking criteria that support pre-existing preferences
- **Anchoring bias** → Over-relying on first criterion considered
- **Recency bias** → Overweighting recent experiences
- **Status quo bias** → Preferring familiar criteria

### How This System Helps

1. **Awareness**: Reveals unconscious patterns
2. **Objectivity**: Quantifies subjective tendencies
3. **Improvement**: Provides specific actions
4. **Tracking**: Monitors progress over time

### Healthy vs Unhealthy Patterns

**Healthy**:
- ✅ Consistent framework with context adaptation
- ✅ Balanced weights across criteria
- ✅ Diverse criteria selection
- ✅ Awareness of trade-offs

**Unhealthy**:
- ❌ Single criterion dominates all decisions
- ❌ Ignoring important factors
- ❌ Extreme short-term or long-term focus
- ❌ Inflexible prioritization

---

## 🔧 Technical Implementation

### Backend (Python)

**File**: `backend/bias_engine.py`

**Key Functions**:
```python
analyze_decision_biases(decisions)
  → Returns: biases, criteria_analysis, patterns, recommendations

detect_biases(criteria_analysis, total_decisions)
  → Returns: List of bias objects

detect_patterns(criteria_analysis, decisions)
  → Returns: Pattern insights dict

generate_recommendations(biases, criteria_analysis)
  → Returns: List of actionable suggestions
```

### Frontend (JavaScript)

**File**: `frontend/bias.js`

**Key Functions**:
```javascript
loadBiasAnalysis()
  → Fetches and renders analysis

renderBiasAnalysis(analysis)
  → Renders all UI components

renderBiasChart(criteria_analysis)
  → Creates Chart.js visualization
```

### API Endpoint

```
GET /decisions/biases

Response:
{
  "status": "ok",
  "data": {
    "biases": [...],
    "criteria_analysis": {...},
    "patterns": {...},
    "recommendations": [...],
    "total_decisions": 10,
    "insufficient_data": false
  }
}
```

---

## 🚀 Usage Guide

### Step 1: Make Decisions

Create at least 3 decisions using the builder:
- Define criteria with weights
- Score options
- Calculate results
- Save decisions

### Step 2: Access Bias Analysis

Click **"Biases"** tab in navigation

### Step 3: Review Insights

Examine:
- Detected biases (if any)
- Criteria usage chart
- Decision patterns
- Recommendations

### Step 4: Take Action

Implement recommendations:
- Adjust weight distributions
- Add neglected criteria
- Challenge habitual priorities
- Use sensitivity analysis

### Step 5: Monitor Progress

Return periodically to see if patterns change

---

## 💡 Best Practices

### ✅ Do:
- Review bias analysis after every 3-5 decisions
- Take recommendations seriously
- Experiment with different weight distributions
- Track improvement over time
- Use insights to inform future decisions

### ❌ Don't:
- Ignore strong biases
- Dismiss patterns as coincidence
- Over-correct (swinging to opposite extreme)
- Expect perfection (some bias is natural)
- Stop making decisions to avoid bias detection

---

## 🐛 Troubleshooting

**Q: "Not Enough Data Yet" message**  
A: Make at least 3 decisions. The system needs multiple data points to detect patterns.

**Q: No biases detected but I feel biased**  
A: The system detects statistical patterns. Subtle biases may not meet thresholds. Review criteria usage chart manually.

**Q: Too many biases detected**  
A: This is valuable feedback! Start with high-severity biases first. Implement one recommendation at a time.

**Q: Recommendations seem generic**  
A: Recommendations are based on detected patterns. More decisions = more specific insights.

**Q: Chart not showing**  
A: Ensure Chart.js is loaded. Check browser console for errors.

---

## 📚 Related Documentation

- [README.md](README.md) - Main project overview
- [CONFIDENCE_SCORE.md](CONFIDENCE_SCORE.md) - Decision confidence system
- [SENSITIVITY_ANALYSIS.md](SENSITIVITY_ANALYSIS.md) - Weight adjustment analysis
- [USER_GUIDE_LEARNING.md](USER_GUIDE_LEARNING.md) - Timeline and learning system

---

## 🎯 Quick Reference

### Bias Types

| Type | Threshold | Severity | Impact |
|------|-----------|----------|--------|
| **Dominant** | ≥70% freq, ≥25% weight | Strong/Moderate | High |
| **Top Priority** | ≥70% #1 rank | Strong | Medium |
| **Neglected** | ≤30% freq, ≤15% weight | Mild | Low |
| **Imbalance** | ≥50% high std dev | Moderate | Medium |

### Pattern Types

| Pattern | Detection | Interpretation |
|---------|-----------|----------------|
| **Short-term bias** | Ratio > 2.0 | Prioritizes immediate gains |
| **Long-term bias** | Ratio < 0.5 | Prioritizes future benefits |
| **Risk averse** | Risk weight > 25% | Prefers safety |
| **High diversity** | Score > 50% | Flexible, adaptive |

---

**Remember**: Bias detection is a tool for self-awareness, not judgment. The goal is continuous improvement, not perfection. Use these insights to make more balanced, thoughtful decisions! 🧠✨
