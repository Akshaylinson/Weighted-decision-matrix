# 🔧 Sensitivity Analysis - Implementation Guide

## Quick Start for Developers

This guide explains how the Sensitivity Analysis module is implemented and how to extend it.

---

## 📁 File Structure

```
frontend/
├── sensitivity.js          # Core sensitivity analysis logic
├── app.js                  # Main application (integrates with sensitivity)
├── index.html              # UI markup (sensitivity panel)
└── styles.css              # Sensitivity-specific styles
```

---

## 🏗️ Architecture

### State Management

The module uses an isolated state object to prevent contamination of the main decision state:

```javascript
const sensitivityState = {
  active: false,              // Toggle for analysis mode
  original: {                 // Immutable snapshot
    criteria: [...],
    results: [...]
  },
  current: {                  // Working copy for adjustments
    criteria: [...],
    results: [...]
  },
  charts: {                   // Chart.js instances
    comparison: null,
    radar: null
  }
};
```

### Key Functions

#### 1. `toggleSensitivityMode()`
- Entry point for enabling/disabling analysis
- Clones original state using `JSON.parse(JSON.stringify())`
- Manages UI transitions and animations

#### 2. `adjustWeight(criterionId, newWeight)`
- Core weight adjustment logic
- Implements auto-normalization algorithm
- Triggers instant recalculation

#### 3. `recalculateSensitivity()`
- Pure frontend calculation (no API calls)
- Uses same formula as backend: `(raw/5) * weight`
- Sorts and ranks results

#### 4. `calculateStability()`
- Compares original vs current rankings
- Returns stability level (high/medium/low)
- Checks if top choice changed

#### 5. `findCriticalCriteria()`
- Tests each criterion with +10% weight
- Measures ranking impact
- Returns top 3 most influential criteria

---

## 🔄 Auto-Normalization Algorithm

```javascript
function adjustWeight(criterionId, newWeight) {
  const criterion = sensitivityState.current.criteria.find(c => c.id === criterionId);
  const oldWeight = criterion.weight;
  const delta = newWeight - oldWeight;
  
  // Get all other criteria
  const others = sensitivityState.current.criteria.filter(c => c.id !== criterionId);
  const othersTotal = others.reduce((sum, c) => sum + c.weight, 0) || 1;
  
  // Update target criterion
  criterion.weight = newWeight;
  
  // Redistribute proportionally
  others.forEach(c => {
    const proportion = c.weight / othersTotal;
    c.weight = Math.max(0, c.weight - (delta * proportion));
  });
  
  // Normalize to ensure total = 100
  const total = sensitivityState.current.criteria.reduce((sum, c) => sum + c.weight, 0);
  if (Math.abs(total - 100) > 0.1) {
    const factor = 100 / total;
    sensitivityState.current.criteria.forEach(c => c.weight *= factor);
  }
  
  recalculateSensitivity();
  renderSensitivityPanel();
}
```

---

## 🎨 UI Components

### Weight Sliders

```html
<input
  type="range"
  min="0"
  max="100"
  step="0.5"
  value="${c.weight}"
  class="weight-slider"
  oninput="adjustWeight('${c.id}', parseFloat(this.value))"
/>
```

**Styling**: Custom CSS with smooth thumb animations

### Comparison Table

```javascript
function renderComparisonTable() {
  const original = sensitivityState.original.results;
  const current = sensitivityState.current.results;
  
  const rows = current.map(curr => {
    const orig = original.find(o => o.id === curr.id);
    const rankChange = orig ? orig.rank - curr.rank : 0;
    const scoreChange = orig ? curr.total_score - orig.total_score : 0;
    
    // Render row with indicators
  });
}
```

### Stability Indicator

```javascript
function calculateStability() {
  let rankChanges = 0;
  const topChanged = original[0].id !== current[0].id;
  
  if (rankChanges === 0) return { level: 'high', icon: '🟢', ... };
  else if (rankChanges <= 2 && !topChanged) return { level: 'medium', icon: '🟡', ... };
  else return { level: 'low', icon: '🔴', ... };
}
```

---

## 📊 Chart Integration

### Comparison Bar Chart

```javascript
sensitivityState.charts.comparison = new Chart(ctx, {
  type: 'bar',
  data: {
    labels: current.map(r => r.name),
    datasets: [
      {
        label: 'Original Score',
        data: original.map(r => r.total_score),
        backgroundColor: 'rgba(148, 163, 184, 0.6)'
      },
      {
        label: 'New Score',
        data: current.map(r => r.total_score),
        backgroundColor: 'rgba(139, 92, 246, 0.7)'
      }
    ]
  },
  options: buildChartOptions({ legend: true })
});
```

### Weight Distribution Radar

```javascript
sensitivityState.charts.radar = new Chart(ctx, {
  type: 'radar',
  data: {
    labels: criteria.map(c => c.name),
    datasets: [
      {
        label: 'Original Weights',
        data: original.criteria.map(c => c.weight)
      },
      {
        label: 'Current Weights',
        data: current.criteria.map(c => c.weight)
      }
    ]
  }
});
```

---

## 🚀 Performance Optimizations

### 1. **Frontend-Only Calculation**
- No API calls during weight adjustments
- Instant feedback (<100ms)
- Reduces server load

### 2. **Efficient State Cloning**
- Deep clone only when entering analysis mode
- Shallow updates during adjustments
- Minimal memory footprint

### 3. **Debounced Rendering**
- Charts update after calculation completes
- No intermediate render states
- Smooth animations

### 4. **Chart Destruction**
- Properly destroy Chart.js instances
- Prevent memory leaks
- Clean state on exit

---

## 🔌 Integration Points

### With Main App

```javascript
// In app.js - ensure sensitivity module is loaded
// sensitivity.js must be included before app.js in HTML

// The module exposes these global functions:
// - toggleSensitivityMode()
// - resetSensitivityWeights()
// - adjustWeight(id, value)
```

### With Existing Charts

```javascript
// Reuses buildChartOptions() from app.js
// Maintains consistent styling
// Uses same color palette via chartPalette()
```

---

## 🧪 Testing Checklist

- [ ] Weight sliders adjust smoothly
- [ ] Total weight always equals 100%
- [ ] Rankings update instantly
- [ ] Stability indicator changes correctly
- [ ] Critical criteria detection works
- [ ] Charts render without errors
- [ ] Reset button restores original state
- [ ] Exit button closes panel cleanly
- [ ] No console errors
- [ ] Responsive on mobile devices

---

## 🔧 Extending the Module

### Add New Stability Levels

```javascript
function calculateStability() {
  // Add custom logic
  if (customCondition) {
    return {
      level: 'custom',
      icon: '🟠',
      label: 'Custom Level',
      description: 'Your description'
    };
  }
}
```

### Add New Charts

```javascript
function renderSensitivityCharts() {
  // Add your chart
  sensitivityState.charts.myChart = new Chart(ctx, {
    type: 'line',
    data: { /* your data */ }
  });
}

function destroySensitivityCharts() {
  // Don't forget to destroy
  if (sensitivityState.charts.myChart) {
    sensitivityState.charts.myChart.destroy();
  }
}
```

### Add Export Functionality

```javascript
function exportSensitivityReport() {
  const report = {
    original: sensitivityState.original,
    current: sensitivityState.current,
    stability: calculateStability(),
    critical: findCriticalCriteria()
  };
  
  // Export as JSON
  const blob = new Blob([JSON.stringify(report, null, 2)], 
    { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'sensitivity-report.json';
  a.click();
}
```

---

## 🐛 Common Issues

### Issue: Weights don't sum to 100%

**Cause**: Floating point precision errors

**Solution**: Normalization step at end of adjustWeight()

```javascript
const total = criteria.reduce((sum, c) => sum + c.weight, 0);
if (Math.abs(total - 100) > 0.1) {
  const factor = 100 / total;
  criteria.forEach(c => c.weight *= factor);
}
```

### Issue: Charts not updating

**Cause**: Chart.js instance not destroyed before re-render

**Solution**: Always call destroySensitivityCharts() first

```javascript
function renderSensitivityCharts() {
  destroySensitivityCharts();  // Clean up first
  // Then create new charts
}
```

### Issue: Original state modified

**Cause**: Shallow copy instead of deep clone

**Solution**: Use JSON parse/stringify for deep clone

```javascript
sensitivityState.original = {
  criteria: JSON.parse(JSON.stringify(state.decision.criteria)),
  results: JSON.parse(JSON.stringify(state.results))
};
```

---

## 📚 Dependencies

- **Chart.js**: For visualizations (already included in project)
- **No additional libraries required**

---

## 🎯 Future Enhancements

### Planned Features
1. **Scenario Comparison**: Save and compare multiple weight configurations
2. **Monte Carlo Mode**: Random weight variations to test robustness
3. **Export Reports**: PDF/CSV export of sensitivity analysis
4. **Undo/Redo**: History of weight adjustments
5. **Preset Scenarios**: Quick-load common weight distributions

### Implementation Ideas

```javascript
// Scenario saving
const scenarios = [];

function saveScenario(name) {
  scenarios.push({
    name,
    criteria: JSON.parse(JSON.stringify(sensitivityState.current.criteria)),
    timestamp: new Date().toISOString()
  });
}

function loadScenario(index) {
  sensitivityState.current.criteria = 
    JSON.parse(JSON.stringify(scenarios[index].criteria));
  recalculateSensitivity();
  renderSensitivityPanel();
}
```

---

## 💡 Best Practices

1. **Always clone state** - Never mutate original decision data
2. **Destroy charts** - Prevent memory leaks
3. **Validate inputs** - Ensure weights are 0-100
4. **Provide feedback** - Show loading states for heavy calculations
5. **Test edge cases** - Zero weights, single criterion, etc.

---

## 📞 Support

For implementation questions:
- Review [SENSITIVITY_ANALYSIS.md](SENSITIVITY_ANALYSIS.md) for user guide
- Check browser console for errors
- Verify Chart.js is loaded
- Ensure results are calculated before enabling analysis

---

**Happy coding! 🚀**
