# 🎬 Sensitivity Analysis - Example Walkthrough

## Real-World Scenario: Choosing a Project Management Tool

This walkthrough demonstrates how to use the Sensitivity Analysis feature to make a confident decision.

---

## 📋 Initial Setup

### Decision Context
**Title**: "Which project management tool should our team adopt?"

**Context**: "Our 15-person development team needs a project management tool. We're currently using spreadsheets and email, which is becoming unmanageable. We need better task tracking, collaboration, and reporting."

**Constraints**: "Budget under $500/month, must integrate with Slack and GitHub, onboarding time under 2 weeks"

---

## 🎯 Step 1: Define Criteria & Weights

After AI suggestions and team discussion, we establish:

| Criterion | Weight | Description |
|-----------|--------|-------------|
| **Cost** | 25% | Monthly subscription cost for 15 users |
| **Ease of Use** | 30% | Learning curve and user interface quality |
| **Features** | 20% | Task management, reporting, automation |
| **Integrations** | 15% | Slack, GitHub, and other tool connections |
| **Support** | 10% | Customer service and documentation quality |

**Total**: 100%

---

## 📊 Step 2: Score Options

We evaluate three tools:

### Asana
- Cost: 4/5 (affordable)
- Ease of Use: 5/5 (very intuitive)
- Features: 4/5 (solid feature set)
- Integrations: 5/5 (excellent)
- Support: 4/5 (good docs)

### Jira
- Cost: 3/5 (moderate)
- Ease of Use: 2/5 (steep learning curve)
- Features: 5/5 (comprehensive)
- Integrations: 5/5 (excellent)
- Support: 5/5 (enterprise-grade)

### Monday.com
- Cost: 2/5 (expensive)
- Ease of Use: 4/5 (user-friendly)
- Features: 4/5 (good features)
- Integrations: 4/5 (good)
- Support: 4/5 (responsive)

---

## 🧮 Step 3: Calculate Initial Results

**Results**:

| Rank | Tool | Total Score | Breakdown |
|------|------|-------------|-----------|
| 🥇 #1 | **Asana** | **86.0** | Cost: 20.0, Ease: 30.0, Features: 16.0, Integrations: 15.0, Support: 8.0 |
| 🥈 #2 | Jira | 78.0 | Cost: 15.0, Ease: 12.0, Features: 20.0, Integrations: 15.0, Support: 10.0 |
| 🥉 #3 | Monday.com | 72.0 | Cost: 10.0, Ease: 24.0, Features: 16.0, Integrations: 12.0, Support: 8.0 |

**Initial Recommendation**: Asana wins with 86.0 points

---

## 🔬 Step 4: Enable Sensitivity Analysis

Click **"🔬 Sensitivity Analysis"** button

**Question**: "How confident should we be in this decision?"

---

## 🎛️ Step 5: Test Different Scenarios

### Scenario A: "What if features matter more?"

**Adjustment**: Increase "Features" from 20% → 40%

**Auto-normalization**:
- Cost: 25% → 18.75%
- Ease of Use: 30% → 22.5%
- Features: 20% → **40%**
- Integrations: 15% → 11.25%
- Support: 10% → 7.5%

**New Results**:

| Rank | Tool | Score | Change |
|------|------|-------|--------|
| 🥇 #1 | **Jira** | **88.0** | ↑ from #2 |
| 🥈 #2 | Asana | 84.0 | ↓ from #1 |
| 🥉 #3 | Monday.com | 74.0 | → |

**Stability**: 🔴 **Fragile Decision**
- Top choice changed from Asana to Jira
- Decision is sensitive to feature importance

**Insight**: If features are truly more important than ease of use, Jira becomes the better choice despite its learning curve.

---

### Scenario B: "What if cost is critical?"

**Adjustment**: Increase "Cost" from 25% → 50%

**Auto-normalization**:
- Cost: 25% → **50%**
- Ease of Use: 30% → 20%
- Features: 20% → 13.33%
- Integrations: 15% → 10%
- Support: 10% → 6.67%

**New Results**:

| Rank | Tool | Score | Change |
|------|------|-------|--------|
| 🥇 #1 | **Asana** | **90.0** | → |
| 🥈 #2 | Jira | 76.0 | → |
| 🥉 #3 | Monday.com | 64.0 | → |

**Stability**: 🟢 **Highly Stable**
- Rankings unchanged
- Asana's lead increases
- Decision is robust to cost prioritization

**Insight**: If budget is the primary concern, Asana is clearly the best choice.

---

### Scenario C: "What if ease of use is paramount?"

**Adjustment**: Increase "Ease of Use" from 30% → 60%

**Auto-normalization**:
- Cost: 25% → 14.29%
- Ease of Use: 30% → **60%**
- Features: 20% → 11.43%
- Integrations: 15% → 8.57%
- Support: 10% → 5.71%

**New Results**:

| Rank | Tool | Score | Change |
|------|------|-------|--------|
| 🥇 #1 | **Asana** | **92.0** | → |
| 🥈 #2 | Monday.com | 78.0 | ↑ from #3 |
| 🥉 #3 | Jira | 68.0 | ↓ from #2 |

**Stability**: 🟡 **Moderately Stable**
- Top choice unchanged (Asana)
- Monday.com overtakes Jira
- Jira's complexity becomes a major drawback

**Insight**: For teams prioritizing quick adoption, Asana remains best, but Monday.com becomes a strong alternative.

---

## 📈 Step 6: Review Critical Criteria

**System Analysis**:

| Criterion | Impact Score | Interpretation |
|-----------|--------------|----------------|
| **Ease of Use** | 85% | 🔴 **Critical** - Heavily influences ranking |
| **Features** | 72% | 🟠 **High Impact** - Can change winner |
| **Cost** | 45% | 🟡 **Moderate** - Affects scores but not ranking |
| Integrations | 28% | 🟢 **Low Impact** - All tools score similarly |
| Support | 15% | 🟢 **Minimal** - Small differences between options |

**Key Insight**: The decision is most sensitive to "Ease of Use" and "Features". These two criteria drive the outcome.

---

## 🎯 Step 7: Final Decision

### Analysis Summary

**Original Weights** (Team's initial priorities):
- Asana wins (86.0 pts)
- Stability: 🟡 Moderately Stable
- Critical factors: Ease of Use, Features

**Confidence Assessment**:
- ✅ Asana wins in 2 of 3 scenarios tested
- ✅ Maintains #1 when cost or ease of use is prioritized
- ⚠️ Loses to Jira only when features weight > 35%
- ✅ Score gap to #2 is significant (8 points)

**Critical Questions Answered**:
1. "Is this decision robust?" → **Yes, moderately stable**
2. "What drives this decision?" → **Ease of use and cost**
3. "When would we choose differently?" → **Only if features matter more than usability**

### Recommendation

**Choose Asana** with high confidence because:

1. **Wins under original weights** (86.0 pts)
2. **Robust to cost increases** (maintains lead)
3. **Robust to ease-of-use increases** (extends lead)
4. **Only vulnerable if features > 35%** (unlikely given team needs)
5. **Best balance** of cost, usability, and features

**Action Items**:
- ✅ Proceed with Asana trial
- ✅ Validate feature set meets 90% of needs
- ✅ Confirm team can adopt within 2 weeks
- ⚠️ Keep Jira as backup if feature gaps emerge

---

## 💡 Key Learnings

### What Sensitivity Analysis Revealed

1. **Decision Drivers**: Ease of use and features are the key factors
2. **Robustness**: Decision is stable unless features become dominant priority
3. **Trade-offs**: Jira offers more features but at cost of usability
4. **Confidence**: High confidence in Asana for this team's priorities

### Without Sensitivity Analysis

We might have:
- ❌ Missed that features could change the outcome
- ❌ Not understood why Asana won
- ❌ Been uncertain about the decision
- ❌ Not identified critical criteria

### With Sensitivity Analysis

We now have:
- ✅ Clear understanding of decision drivers
- ✅ Confidence in the recommendation
- ✅ Knowledge of when to reconsider
- ✅ Data to justify the choice to stakeholders

---

## 🎓 Lessons for Future Decisions

### Best Practices Demonstrated

1. **Test extreme scenarios** (50%+ weights)
2. **Focus on critical criteria** (high impact factors)
3. **Check stability** before committing
4. **Document assumptions** (why these weights?)
5. **Validate with stakeholders** (do they agree with priorities?)

### Red Flags to Watch For

- 🚩 **Fragile decisions** with top choice changing easily
- 🚩 **Tied scores** (within 5 points)
- 🚩 **High sensitivity** to single criterion (>80% impact)
- 🚩 **Unclear priorities** (can't justify weights)

### Green Flags for Confidence

- ✅ **Stable rankings** across scenarios
- ✅ **Clear winner** (10+ point lead)
- ✅ **Low sensitivity** to minor weight changes
- ✅ **Aligned priorities** (team agrees on weights)

---

## 📊 Visual Summary

```
Original Decision:
┌─────────────┬───────┬──────────┐
│ Tool        │ Score │ Rank     │
├─────────────┼───────┼──────────┤
│ Asana       │ 86.0  │ #1 🥇    │
│ Jira        │ 78.0  │ #2 🥈    │
│ Monday.com  │ 72.0  │ #3 🥉    │
└─────────────┴───────┴──────────┘

Sensitivity Tests:
┌──────────────────┬─────────┬────────────┐
│ Scenario         │ Winner  │ Stability  │
├──────────────────┼─────────┼────────────┤
│ Original         │ Asana   │ 🟡 Moderate│
│ Features +20%    │ Jira    │ 🔴 Fragile │
│ Cost +25%        │ Asana   │ 🟢 Stable  │
│ Ease of Use +30% │ Asana   │ 🟡 Moderate│
└──────────────────┴─────────┴────────────┘

Critical Criteria:
Ease of Use  ████████████████████ 85%
Features     ██████████████░░░░░░ 72%
Cost         █████████░░░░░░░░░░░ 45%
Integrations ██████░░░░░░░░░░░░░░ 28%
Support      ███░░░░░░░░░░░░░░░░░ 15%
```

---

## 🚀 Next Steps

1. **Save this decision** for future reference
2. **Share analysis** with team and stakeholders
3. **Proceed with Asana trial** (30 days)
4. **Review in Timeline** after 3 months
5. **Mark outcome** as correct/incorrect
6. **Learn from experience** for next tool selection

---

## 📝 Template for Your Decisions

Use this structure for your own sensitivity analysis:

```markdown
## My Decision: [Title]

### Initial Results
- Winner: [Option] ([Score] pts)
- Runner-up: [Option] ([Score] pts)

### Sensitivity Tests
1. Scenario A: [Description]
   - Adjustment: [Criterion] from X% → Y%
   - New winner: [Option]
   - Stability: [Level]

2. Scenario B: [Description]
   - Adjustment: [Criterion] from X% → Y%
   - New winner: [Option]
   - Stability: [Level]

### Critical Criteria
- [Criterion]: [Impact]% - [Interpretation]

### Final Decision
- Choose: [Option]
- Confidence: [High/Medium/Low]
- Reasoning: [Why]
```

---

**Remember**: Sensitivity Analysis doesn't make the decision for you—it helps you understand your decision and make it with confidence! 🎯
