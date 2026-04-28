# 🎯 Sensitivity Analysis - Quick Reference Card

## 🚀 Quick Start (30 seconds)

1. **Calculate results** in Step 4
2. Click **"🔬 Sensitivity Analysis"** button
3. **Drag sliders** to adjust weights
4. **Watch rankings** change in real-time
5. **Check stability** indicator
6. Click **"✕ Exit"** when done

---

## 🎛️ Controls

| Control | Action | Result |
|---------|--------|--------|
| **Weight Slider** | Drag left/right | Adjust criterion importance (0-100%) |
| **↺ Reset** | Click button | Restore original weights |
| **✕ Exit** | Click button | Close analysis panel |

---

## 📊 What You See

### Left Panel
- **Weight Sliders**: Adjust each criterion
- **Stability Indicator**: Decision robustness
- **Critical Criteria**: Top 3 influential factors

### Right Panel
- **Ranking Comparison**: Before vs After table
- **Score Comparison**: Bar chart (original vs new)
- **Weight Distribution**: Radar chart

---

## 🚦 Stability Levels

| Icon | Level | Meaning | Action |
|------|-------|---------|--------|
| 🟢 | **Highly Stable** | Rankings unchanged | ✅ High confidence - proceed |
| 🟡 | **Moderately Stable** | Minor shifts, top unchanged | ⚠️ Good confidence - validate |
| 🔴 | **Fragile Decision** | Major changes or top changed | 🛑 Low confidence - review criteria |

---

## 🎯 Ranking Change Indicators

| Symbol | Meaning |
|--------|---------|
| ↑ | Moved up in ranking |
| ↓ | Moved down in ranking |
| → | No change in ranking |

---

## 💡 Common Use Cases

### "Is my decision robust?"
→ Adjust weights ±10% and check if winner changes

### "What really matters?"
→ Check Critical Criteria section

### "What if X was more important?"
→ Increase X's weight and observe impact

### "Should I trust this recommendation?"
→ Look at stability indicator

---

## ⚡ Pro Tips

### ✅ Do This
- Test extreme scenarios (0%, 100%)
- Focus on high-impact criteria
- Check stability before deciding
- Document your weight rationale

### ❌ Avoid This
- Adjusting weights to get desired outcome
- Ignoring fragile decision warnings
- Skipping critical criteria review
- Making decisions without testing

---

## 🔢 Understanding Impact Scores

| Impact | Level | Interpretation |
|--------|-------|----------------|
| **80-100%** | 🔴 Critical | Small changes = big ranking shifts |
| **50-79%** | 🟠 High | Moderate influence on outcome |
| **20-49%** | 🟡 Medium | Some effect on rankings |
| **0-19%** | 🟢 Low | Minimal impact on decision |

---

## 🎨 Color Guide

| Color | Meaning |
|-------|---------|
| 🟢 Green | Positive change / Stable / Good |
| 🔴 Red | Negative change / Fragile / Warning |
| 🟡 Yellow | Neutral / Moderate / Caution |
| 🟣 Purple | Current values / Active state |
| ⚪ Gray | Original values / Inactive |

---

## 🧮 The Math (Simple)

```
Weighted Score = (Raw Score ÷ 5) × Weight

Example:
- Raw Score: 4/5
- Weight: 30%
- Weighted Score: (4 ÷ 5) × 30 = 24 points

Total Score = Sum of all weighted scores
```

---

## 🔄 Auto-Normalization

**What it does**: Keeps total weight at 100%

**How it works**:
1. You increase Criterion A by 10%
2. System reduces others proportionally
3. Total always equals 100%

**Example**:
```
Before:  A=30%, B=40%, C=30% (Total: 100%)
Change:  A → 50% (+20%)
After:   A=50%, B=30%, C=20% (Total: 100%)
         ↑      ↓-10%  ↓-10%
```

---

## 🐛 Troubleshooting

| Problem | Solution |
|---------|----------|
| Button disabled | Calculate results first (Step 4) |
| Sliders not moving | Check browser console for errors |
| Charts not showing | Ensure Chart.js is loaded |
| Panel won't close | Click "✕ Exit" or refresh page |
| Weights seem wrong | Click "↺ Reset to Original" |

---

## ⌨️ Keyboard Shortcuts

| Key | Action |
|-----|--------|
| **Tab** | Navigate between sliders |
| **Arrow Keys** | Adjust focused slider |
| **Esc** | Close panel (if implemented) |

---

## 📱 Mobile Tips

- Swipe sliders with finger
- Pinch to zoom charts
- Scroll comparison table horizontally
- Tap stability badge for details

---

## 🎓 Learning Path

### Beginner
1. Enable analysis mode
2. Move one slider
3. Observe ranking changes
4. Check stability indicator

### Intermediate
1. Test multiple scenarios
2. Compare original vs new scores
3. Identify critical criteria
4. Understand trade-offs

### Advanced
1. Test extreme weight distributions
2. Analyze stability patterns
3. Document decision rationale
4. Use for stakeholder communication

---

## 📚 Related Docs

- **[Full Guide](SENSITIVITY_ANALYSIS.md)** - Complete documentation
- **[Example](SENSITIVITY_EXAMPLE.md)** - Real-world walkthrough
- **[Implementation](SENSITIVITY_IMPLEMENTATION.md)** - Developer guide
- **[README](README.md)** - Main project docs

---

## 🆘 Quick Help

**Q: What's a good stability level?**
A: 🟢 or 🟡 = Good. 🔴 = Review your criteria weights.

**Q: How much should I adjust weights?**
A: Start with ±10%, then try extremes (0%, 100%).

**Q: What if my top choice keeps changing?**
A: Your decision is fragile. Clarify your priorities or gather more data.

**Q: Should I trust a fragile decision?**
A: No. Either refine your criteria or accept the uncertainty.

**Q: Can I save different scenarios?**
A: Not yet (coming soon). Take screenshots for now.

---

## 🎯 Decision Confidence Checklist

Before finalizing your decision:

- [ ] Tested at least 3 weight scenarios
- [ ] Checked stability indicator
- [ ] Reviewed critical criteria
- [ ] Winner has 10+ point lead OR decision is stable
- [ ] Team agrees on weight priorities
- [ ] Documented reasoning
- [ ] Ready to proceed with confidence

---

## 💬 Quick Glossary

| Term | Definition |
|------|------------|
| **Weight** | Importance of a criterion (0-100%) |
| **Raw Score** | Original rating (1-5 scale) |
| **Weighted Score** | Raw score × weight |
| **Total Score** | Sum of all weighted scores |
| **Rank** | Position in sorted results (#1, #2, etc.) |
| **Stability** | How much rankings change with weight adjustments |
| **Critical Criteria** | Factors with highest impact on outcome |
| **Auto-normalization** | Automatic adjustment to keep total = 100% |

---

## 🔗 One-Minute Tutorial

```
1. Click "🔬 Sensitivity Analysis"
   ↓
2. Drag "Cost" slider to 50%
   ↓
3. Watch rankings update instantly
   ↓
4. Check stability: 🟢 🟡 or 🔴?
   ↓
5. Review critical criteria
   ↓
6. Click "↺ Reset" or "✕ Exit"
```

---

## 📞 Support

- **Documentation**: See [SENSITIVITY_ANALYSIS.md](SENSITIVITY_ANALYSIS.md)
- **Examples**: See [SENSITIVITY_EXAMPLE.md](SENSITIVITY_EXAMPLE.md)
- **Issues**: Check browser console
- **Questions**: Review this quick reference

---

## 🎉 You're Ready!

**Remember**: Sensitivity Analysis helps you understand and trust your decision. Use it every time you want confidence in your choice!

---

**Print this card** or **bookmark this page** for quick reference! 📌
