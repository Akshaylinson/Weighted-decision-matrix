# 🎬 Scenario Simulation System

## Overview

The **Scenario Simulation System** allows you to explore how your decision changes under different future conditions. By creating multiple scenarios with varying weight priorities, you can understand which options are robust across situations and which are sensitive to changing circumstances.

---

## 🎯 Core Concept

**A scenario is a "what-if" exploration of your decision under different priorities.**

### What Changes:
- ✅ **Criteria weights** (importance/priority)

### What Stays the Same:
- ❌ Options (alternatives being compared)
- ❌ Scores (raw ratings 1-5)
- ❌ Criteria (evaluation factors)

**Key Insight**: Same data, different priorities = different outcomes

---

## 🚀 How It Works

### Step 1: Calculate Base Decision
Complete your decision matrix and calculate results in Step 4.

### Step 2: Enable Scenario Mode
Click **"🎬 Scenario Simulation"** button.

### Step 3: Explore Default Scenarios
System automatically generates three scenarios:
- **Cost-Focused**: Prioritizes budget constraints
- **Performance-Focused**: Prioritizes quality/speed
- **Balanced**: Equal weight distribution

### Step 4: Adjust Weights
Use sliders to modify weights for each scenario.

### Step 5: Compare Results
Review:
- Winner comparison panel
- Score comparison chart
- Comparison table
- Insights

### Step 6: Add Custom Scenarios
Click **"+ Add Custom"** to create your own scenarios.

---

## 🎨 Default Scenarios

### 1. Cost-Focused Scenario

**Purpose**: Simulate budget-constrained conditions

**Weight Distribution**:
- Cost/Price criterion: **50%**
- All other criteria: Split remaining 50%

**Use Case**: "What if budget becomes our top priority?"

**Example**:
```
Original: Cost 25%, Performance 30%, Support 25%, Features 20%
Cost-Focused: Cost 50%, Performance 16.7%, Support 16.7%, Features 16.7%
```

---

### 2. Performance-Focused Scenario

**Purpose**: Simulate quality-first conditions

**Weight Distribution**:
- Performance/Quality criterion: **50%**
- All other criteria: Split remaining 50%

**Use Case**: "What if performance matters most?"

**Example**:
```
Original: Cost 25%, Performance 30%, Support 25%, Features 20%
Performance-Focused: Cost 12.5%, Performance 50%, Support 18.75%, Features 18.75%
```

---

### 3. Balanced Scenario

**Purpose**: Simulate equal-priority conditions

**Weight Distribution**:
- All criteria: **Equal weights** (100 / number of criteria)

**Use Case**: "What if all factors matter equally?"

**Example**:
```
Original: Cost 25%, Performance 30%, Support 25%, Features 20%
Balanced: Cost 25%, Performance 25%, Support 25%, Features 25%
```

---

## 🛠️ Custom Scenarios

### Creating Custom Scenarios

1. Click **"+ Add Custom"** button
2. New scenario appears with base weights
3. Adjust sliders to set custom priorities
4. Rename scenario (future feature)

### Use Cases for Custom Scenarios

**Scenario: "Rapid Growth"**
- Scalability: 40%
- Performance: 30%
- Cost: 20%
- Support: 10%

**Scenario: "Maintenance Mode"**
- Reliability: 40%
- Support: 30%
- Cost: 20%
- Features: 10%

**Scenario: "Innovation Focus"**
- Features: 45%
- Performance: 25%
- Scalability: 20%
- Cost: 10%

---

## 📊 Comparison Features

### 1. Winner Comparison Panel

**Shows**:
- Base decision winner
- Winner for each scenario
- Score for each winner

**Visual Indicators**:
- 🟢 Green: Same winner as base
- 🟡 Yellow: Different winner

**Example**:
```
Base Decision → AWS (86.0)
Cost-Focused → GCP (82.5)
Performance-Focused → AWS (88.2)
Balanced → AWS (84.0)
```

**Insight**: AWS wins in 3/4 scenarios = robust choice

---

### 2. Score Comparison Chart

**Type**: Multi-bar chart (Chart.js)

**Axes**:
- X-axis: Options (AWS, GCP, Azure)
- Y-axis: Total scores (0-100)

**Bars**: One per scenario + base
- Gray: Base
- Purple: Cost-Focused
- Blue: Performance-Focused
- Green: Balanced

**Purpose**: Visual comparison of score changes

---

### 3. Comparison Table

**Format**:

| Option | Base | Cost-Focused | Performance-Focused | Balanced |
|--------|------|--------------|---------------------|----------|
| AWS | #1 (86.0) → | #2 (82.5) ↓ | #1 (88.2) → | #1 (84.0) → |
| GCP | #2 (78.0) → | #1 (85.0) ↑ | #2 (76.5) → | #2 (79.0) → |
| Azure | #3 (74.0) → | #3 (73.0) → | #3 (72.0) → | #3 (75.0) → |

**Indicators**:
- ↑ Moved up in ranking
- ↓ Moved down in ranking
- → No change in ranking

**Purpose**: Detailed rank and score tracking

---

### 4. Insights Generator

**Insight Types**:

#### Stable Winner
**Trigger**: Same winner across all scenarios  
**Message**: "AWS wins across all scenarios. This is a robust choice regardless of conditions."  
**Icon**: 🎯

#### Variable Winner
**Trigger**: Different winners in different scenarios  
**Message**: "Winner changes across scenarios. Your decision is sensitive to priority shifts."  
**Icon**: 🔄

#### Stable Options
**Trigger**: Options maintain same rank across scenarios  
**Message**: "Stable options: AWS, Azure. These maintain consistent rankings."  
**Icon**: 📌

#### Volatile Options
**Trigger**: Options with rank variance ≥2  
**Message**: "Volatile options: GCP. Rankings vary significantly by scenario."  
**Icon**: ⚡

#### Scenario-Specific Winners
**Trigger**: Option wins in specific scenario but not base  
**Message**: "GCP wins in 'Cost-Focused' scenario (85.0 pts)."  
**Icon**: 💡

---

## 🎯 Real-World Example

### Scenario: Choosing a Cloud Provider

**Base Decision**:
- Cost: 25%
- Performance: 30%
- Support: 25%
- Scalability: 20%

**Results**:
- AWS: 86.0 (#1)
- GCP: 78.0 (#2)
- Azure: 74.0 (#3)

---

### Scenario A: Cost-Focused (Budget Cuts)

**Weights**:
- Cost: 50%
- Performance: 16.7%
- Support: 16.7%
- Scalability: 16.7%

**Results**:
- GCP: 85.0 (#1) ↑
- AWS: 82.5 (#2) ↓
- Azure: 73.0 (#3) →

**Insight**: GCP becomes best choice when cost is paramount

---

### Scenario B: Performance-Focused (High Traffic)

**Weights**:
- Cost: 12.5%
- Performance: 50%
- Support: 18.75%
- Scalability: 18.75%

**Results**:
- AWS: 88.2 (#1) →
- GCP: 76.5 (#2) →
- Azure: 72.0 (#3) →

**Insight**: AWS extends lead when performance matters most

---

### Scenario C: Balanced (Uncertain Future)

**Weights**:
- Cost: 25%
- Performance: 25%
- Support: 25%
- Scalability: 25%

**Results**:
- AWS: 84.0 (#1) →
- GCP: 79.0 (#2) →
- Azure: 75.0 (#3) →

**Insight**: Rankings remain stable with equal priorities

---

## 📈 Analysis Summary

### Winner Comparison:
- Base → AWS
- Cost-Focused → GCP
- Performance-Focused → AWS
- Balanced → AWS

### Stability Analysis:
- **AWS**: Wins in 3/4 scenarios (robust)
- **GCP**: Wins only when cost is heavily weighted (conditional)
- **Azure**: Never wins (consistently third)

### Decision Recommendation:
**Choose AWS** if:
- ✅ You value robustness across scenarios
- ✅ Performance is important
- ✅ Budget is flexible

**Choose GCP** if:
- ✅ Cost is absolutely critical
- ✅ You're confident budget will be tight
- ✅ Willing to sacrifice some performance

---

## 💡 Use Cases

### 1. **Strategic Planning**
*"What if our business priorities change?"*

Create scenarios for:
- Growth phase (scalability focus)
- Maturity phase (cost optimization)
- Innovation phase (features focus)

---

### 2. **Risk Assessment**
*"Which option is safest across uncertainties?"*

Test scenarios for:
- Best case conditions
- Worst case conditions
- Most likely conditions

---

### 3. **Stakeholder Alignment**
*"What if different departments have different priorities?"*

Create scenarios for:
- Finance perspective (cost focus)
- Engineering perspective (performance focus)
- Operations perspective (support focus)

---

### 4. **Contingency Planning**
*"What's our backup if conditions change?"*

Identify:
- Primary choice (base scenario)
- Backup choice (alternative scenario)
- Trigger conditions for switching

---

### 5. **Sensitivity Testing**
*"How fragile is our decision?"*

Measure:
- Winner consistency
- Rank stability
- Score variance

---

## 🔧 Technical Implementation

### Frontend-Only Calculation
- No backend API calls required
- Instant recalculation (<50ms)
- Uses existing decision data
- Clones base state (non-destructive)

### Weight Normalization
```javascript
function normalizeScenarioCriteria(criteria) {
  const total = criteria.reduce((sum, c) => sum + c.weight, 0);
  if (Math.abs(total - 100) > 0.1) {
    const factor = 100 / total;
    criteria.forEach(c => c.weight *= factor);
  }
  return criteria;
}
```

### Scoring Formula
```javascript
weighted_score = (raw_score / 5.0) * criterion_weight
total_score = Σ(weighted_score) for all criteria
```

### Stability Detection
```javascript
const ranks = [base_rank, ...scenario_ranks];
const stable = ranks.every(r => r === ranks[0]);
const variance = Math.max(...ranks) - Math.min(...ranks);
```

---

## 🎨 UI Components

### 1. Scenario Cards (Left Panel)
- Name and description
- Current winner and score
- Active state highlighting
- Remove button (if >1 scenario)

### 2. Weight Sliders (Left Panel)
- One slider per criterion
- Real-time value display
- Auto-normalization
- Smooth animations

### 3. Winner Comparison (Right Panel)
- Base winner highlighted
- Scenario winners color-coded
- Score display
- Visual consistency indicators

### 4. Multi-Bar Chart (Right Panel)
- Chart.js powered
- Multiple datasets (base + scenarios)
- Interactive tooltips
- Responsive design

### 5. Comparison Table (Right Panel)
- Rank badges
- Score values
- Change indicators (↑ ↓ →)
- Sortable columns

### 6. Insights Panel (Right Panel)
- Icon-based insights
- Color-coded by type
- Actionable messages
- Auto-generated

---

## 🚦 Best Practices

### ✅ Do:
- Create scenarios for realistic future conditions
- Test extreme scenarios (all weight on one criterion)
- Look for stable options (consistent across scenarios)
- Use insights to inform final decision
- Document scenario assumptions

### ❌ Don't:
- Create too many scenarios (3-5 is optimal)
- Ignore volatile options (they may be risky)
- Assume base scenario is always best
- Forget to consider likelihood of each scenario
- Make decisions based on single scenario

---

## 🐛 Troubleshooting

**Q: Button is disabled**  
A: Calculate results first in Step 4.

**Q: Can't remove scenario**  
A: Must have at least one scenario. Add another before removing.

**Q: Weights don't sum to 100**  
A: Auto-normalization handles this automatically.

**Q: Charts not rendering**  
A: Ensure Chart.js is loaded. Check browser console.

**Q: Same winner in all scenarios**  
A: This is good! It means your decision is robust. Consider it a strength.

---

## 📚 Related Documentation

- [README.md](README.md) - Main project overview
- [SENSITIVITY_ANALYSIS.md](SENSITIVITY_ANALYSIS.md) - Weight adjustment analysis
- [CONFIDENCE_SCORE.md](CONFIDENCE_SCORE.md) - Decision confidence system
- [BIAS_DETECTION.md](BIAS_DETECTION.md) - Pattern analysis

---

## 🎓 Scenario Planning Framework

### Step 1: Identify Key Uncertainties
What factors might change?
- Budget availability
- Time constraints
- Resource availability
- Market conditions
- Stakeholder priorities

### Step 2: Define Scenarios
Create 3-5 plausible futures:
- **Optimistic**: Best case conditions
- **Pessimistic**: Worst case conditions
- **Most Likely**: Expected conditions
- **Wildcard**: Unexpected conditions

### Step 3: Adjust Weights
For each scenario, set weights that reflect:
- Changed priorities
- New constraints
- Shifted focus areas

### Step 4: Analyze Results
Look for:
- Robust options (win across scenarios)
- Conditional options (win in specific scenarios)
- Risky options (volatile rankings)

### Step 5: Make Decision
Choose based on:
- Scenario likelihood
- Risk tolerance
- Flexibility needs
- Stakeholder alignment

---

## 🎯 Quick Reference

### Scenario Types

| Type | Purpose | Weight Strategy |
|------|---------|-----------------|
| **Cost-Focused** | Budget constraints | Cost 50%, others split |
| **Performance-Focused** | Quality priority | Performance 50%, others split |
| **Balanced** | Equal importance | All criteria equal |
| **Custom** | Specific conditions | User-defined |

### Insight Types

| Icon | Type | Meaning |
|------|------|---------|
| 🎯 | Stable | Same winner across all |
| 🔄 | Variable | Winner changes by scenario |
| 📌 | Stable Options | Consistent rankings |
| ⚡ | Volatile | Significant rank changes |
| 💡 | Scenario-Specific | Wins in specific scenario |

### Stability Levels

| Variance | Stability | Interpretation |
|----------|-----------|----------------|
| **0** | Highly Stable | Same rank everywhere |
| **1** | Stable | Minor fluctuation |
| **≥2** | Volatile | Significant changes |

---

**Remember**: Scenario simulation is about exploring possibilities, not predicting the future. Use it to understand your decision's robustness and prepare for different outcomes! 🎬✨
