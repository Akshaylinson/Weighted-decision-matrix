# 🔬 Sensitivity Analysis Module

## Overview

The **Sensitivity Analysis Module** is an advanced interactive feature that allows users to understand how their decision changes when they adjust the importance (weights) of different criteria. This helps identify decision stability and critical factors that most influence the outcome.

---

## 🎯 Key Features

### 1. **Interactive Weight Sliders**
- Adjust any criterion weight from 0-100% using smooth sliders
- **Auto-normalization**: Total weight always equals 100%
- When one weight increases, others adjust proportionally
- Real-time visual feedback with instant recalculation

### 2. **Real-Time Recalculation**
- Scores update instantly (<100ms) as you adjust weights
- No backend calls required - pure frontend calculation
- Rankings re-sort automatically
- Smooth animations for all changes

### 3. **Before vs After Comparison**
- Side-by-side comparison table showing:
  - Original scores vs new scores
  - Score deltas (Δ)
  - Ranking changes with visual indicators (↑ ↓ →)
  - Highlighted top choice

### 4. **Decision Stability Indicator**
- **🟢 Highly Stable**: Rankings unchanged, decision is robust
- **🟡 Moderately Stable**: Minor shifts, top choice consistent
- **🔴 Fragile Decision**: Significant changes, review criteria importance

### 5. **Critical Criteria Detection**
- Automatically identifies which criteria have the highest impact
- Shows top 3 most influential factors
- Impact percentage for each criterion
- Helps users understand what drives their decision

### 6. **Visual Charts**
- **Comparison Bar Chart**: Original vs new scores side-by-side
- **Weight Distribution Radar**: Visual representation of weight changes
- Interactive Chart.js visualizations
- Smooth transitions and animations

### 7. **Reset Functionality**
- One-click reset to original weights
- Preserves original decision data
- Clean state management

---

## 🚀 How to Use

### Step 1: Calculate Results
First, complete your decision matrix and calculate results in Step 4.

### Step 2: Enable Sensitivity Mode
Click the **"🔬 Sensitivity Analysis"** button in the Advanced Analysis section.

### Step 3: Adjust Weights
Use the sliders on the left panel to modify criterion weights:
- Drag any slider to change its weight
- Watch other weights adjust automatically
- Observe real-time ranking changes

### Step 4: Analyze Impact
Review the analysis panels:
- **Ranking Comparison**: See how options moved
- **Stability Indicator**: Understand decision robustness
- **Critical Criteria**: Identify key decision drivers
- **Charts**: Visual comparison of changes

### Step 5: Reset or Exit
- Click **"↺ Reset to Original"** to restore initial weights
- Click **"✕ Exit Analysis"** to close the panel

---

## 🧠 Understanding the Analysis

### Stability Levels

**Highly Stable (🟢)**
- No ranking changes occurred
- Decision is robust to weight adjustments
- High confidence in the recommendation
- Example: Top choice remains #1 regardless of weight changes

**Moderately Stable (🟡)**
- Minor ranking shifts (1-2 positions)
- Top choice remains consistent
- Reasonable confidence level
- Example: Options 3 and 4 swap, but winner unchanged

**Fragile Decision (🔴)**
- Significant ranking changes
- Top choice may have changed
- Low confidence - review criteria
- Example: Winner changes with small weight adjustments

### Critical Criteria

The system tests each criterion by:
1. Increasing its weight by 10%
2. Redistributing remaining weight proportionally
3. Recalculating rankings
4. Measuring how many positions changed

**High Impact Criteria** (>50% impact):
- Small weight changes cause major ranking shifts
- These are your decision drivers
- Ensure these weights reflect true priorities

**Low Impact Criteria** (<20% impact):
- Weight changes have minimal effect
- May be less critical to the decision
- Consider if they're necessary

---

## 💡 Use Cases

### 1. **Validate Decision Confidence**
*"Is my decision robust or fragile?"*

Run sensitivity analysis to see if small weight changes dramatically alter your choice. A stable decision gives you confidence to proceed.

### 2. **Identify Key Decision Drivers**
*"What really matters in this decision?"*

Check the Critical Criteria section to understand which factors have the most influence. Focus your research and validation efforts here.

### 3. **Explore Alternative Scenarios**
*"What if cost was more important than speed?"*

Adjust weights to simulate different priority scenarios. See how your recommendation changes under different assumptions.

### 4. **Communicate Trade-offs**
*"Show stakeholders how priorities affect outcomes"*

Use the visual charts and comparison table to demonstrate how different stakeholder priorities would change the recommendation.

### 5. **Refine Criteria Weights**
*"Are my weights accurately reflecting priorities?"*

Experiment with different weight distributions to find the configuration that best represents your true priorities.

---

## 🔧 Technical Details

### Architecture

**Frontend-Only Calculation**
- No backend API calls during weight adjustments
- Instant feedback (<100ms response time)
- Uses cloned state to preserve original data

**State Management**
```javascript
sensitivityState = {
  active: boolean,           // Is analysis mode active?
  original: {                // Preserved original data
    criteria: [...],
    results: [...]
  },
  current: {                 // Working copy for adjustments
    criteria: [...],
    results: [...]
  },
  charts: {                  // Chart.js instances
    comparison: Chart,
    radar: Chart
  }
}
```

### Auto-Normalization Algorithm

When a criterion weight changes:
1. Calculate delta: `newWeight - oldWeight`
2. Get other criteria and their total weight
3. For each other criterion:
   - Calculate its proportion: `criterion.weight / othersTotal`
   - Adjust: `criterion.weight -= delta * proportion`
4. Normalize to ensure total = 100%

### Scoring Formula

```javascript
weightedScore = (rawScore / 5.0) * criterionWeight
totalScore = Σ(weightedScore) for all criteria
```

### Stability Calculation

```javascript
if (rankChanges === 0) → Highly Stable
else if (rankChanges <= 2 && topUnchanged) → Moderately Stable
else → Fragile
```

---

## 🎨 UI Components

### Weight Sliders
- Custom styled range inputs
- Smooth thumb animations on hover
- Real-time value display
- Accessible keyboard controls

### Comparison Table
- Sortable columns
- Color-coded deltas (green/red)
- Ranking change indicators
- Responsive design

### Stability Badge
- Dynamic color based on level
- Icon + label + description
- Animated transitions
- Clear visual hierarchy

### Charts
- Chart.js powered visualizations
- Responsive canvas sizing
- Smooth data transitions
- Consistent color palette

---

## 📊 Example Workflow

**Scenario**: Choosing a cloud provider

1. **Initial Results**:
   - AWS: 78.5 pts (#1)
   - GCP: 76.2 pts (#2)
   - Azure: 74.8 pts (#3)

2. **Enable Sensitivity Analysis**

3. **Adjust "Cost" weight from 30% → 50%**:
   - GCP: 82.1 pts (#1) ↑
   - AWS: 79.3 pts (#2) ↓
   - Azure: 75.5 pts (#3) →

4. **Stability**: 🟡 Moderately Stable
   - Top choice changed
   - Decision sensitive to cost priority

5. **Critical Criteria**:
   - Cost: 85% impact
   - Performance: 45% impact
   - Support: 20% impact

6. **Insight**: Decision heavily depends on cost vs performance trade-off. Validate cost assumptions before proceeding.

---

## 🔒 Data Safety

- **Non-Destructive**: Original decision data never modified
- **Isolated State**: Analysis works on cloned copies
- **Exit Anytime**: Close panel without affecting saved decision
- **Reset Available**: Restore original weights instantly

---

## 🚦 Best Practices

### ✅ Do:
- Run sensitivity analysis after calculating results
- Test extreme weight scenarios (0%, 100%)
- Focus on criteria with high impact
- Use stability indicator to gauge confidence
- Share visualizations with stakeholders

### ❌ Don't:
- Adjust weights without understanding criteria
- Ignore fragile decision warnings
- Over-optimize for specific outcomes
- Forget to reset before making final adjustments
- Skip validation of critical criteria

---

## 🐛 Troubleshooting

**Issue**: Sliders not responding
- **Solution**: Ensure results are calculated first

**Issue**: Charts not rendering
- **Solution**: Check Chart.js library is loaded

**Issue**: Weights don't sum to 100%
- **Solution**: Auto-normalization handles this automatically

**Issue**: Panel won't close
- **Solution**: Click "✕ Exit Analysis" or click outside panel

---

## 🔮 Future Enhancements

Potential additions:
- Multi-criteria simultaneous adjustment
- Scenario saving and comparison
- Monte Carlo simulation mode
- Export sensitivity report
- Historical sensitivity tracking
- AI-powered weight recommendations

---

## 📚 Related Documentation

- [README.md](README.md) - Main project documentation
- [USER_GUIDE_LEARNING.md](USER_GUIDE_LEARNING.md) - Decision learning system
- [LEARNING_SYSTEM.md](LEARNING_SYSTEM.md) - Technical API docs

---

## 🎓 Learning Resources

**Understanding Sensitivity Analysis**:
- [Wikipedia: Sensitivity Analysis](https://en.wikipedia.org/wiki/Sensitivity_analysis)
- [Decision Matrix Method](https://en.wikipedia.org/wiki/Decision_matrix)

**Weighted Decision Making**:
- Multi-Criteria Decision Analysis (MCDA)
- Analytic Hierarchy Process (AHP)
- Weighted Sum Model (WSM)

---

## 💬 Support

For questions or issues:
1. Check this documentation
2. Review the main README
3. Inspect browser console for errors
4. Open a GitHub issue with details

---

**Built with ❤️ for better decision-making**
