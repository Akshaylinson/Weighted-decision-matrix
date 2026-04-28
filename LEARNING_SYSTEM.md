# Decision Learning System - Feature Documentation

## Overview

The Decision Learning System transforms PDIS from a simple decision tool into a comprehensive learning platform where users can track, review, and learn from their past decisions.

---

## 🎯 Key Features

### 1. **Decision Timeline**
- Chronological view of all past decisions
- Visual status badges (Pending, Correct, Incorrect)
- Quick stats dashboard showing decision patterns
- Click any decision to view full details

### 2. **Decision Review Modal**
- Complete decision context and criteria
- All options with scores and rankings
- Final choice highlight
- Interactive review system

### 3. **Learning & Reflection**
- Mark decisions as correct/incorrect
- Add detailed reflection notes
- Track review dates
- Update reviews as needed

### 4. **Analytics Dashboard**
- Total decisions made
- Reviewed vs pending count
- Success rate (correct/incorrect ratio)
- Learning patterns over time

---

## 📊 Data Structure

### Decision JSON with Outcome Tracking

```json
{
  "id": "dec_abc123",
  "title": "Decision Title",
  "context": "Background and context",
  "constraints": "Limitations and requirements",
  "criteria": [...],
  "options": [...],
  "final_choice": "Selected Option",
  "timestamp": "2026-01-15T10:00:00Z",
  "ranked_results": [...],
  "outcome": {
    "status": "reviewed",
    "correct": true,
    "notes": "Reflection on why this was correct/incorrect",
    "reviewed_at": "2026-02-01T14:30:00Z"
  }
}
```

### Outcome Status Values
- `"pending"` - Not yet reviewed
- `"reviewed"` - User has evaluated the outcome

### Outcome Correct Values
- `true` - Decision was correct
- `false` - Decision was incorrect
- `null` - Not yet reviewed

---

## 🔌 API Endpoints

### 1. Get Timeline
```http
GET /decisions/timeline
```

**Response:**
```json
{
  "status": "ok",
  "data": [
    {
      "id": "dec_123",
      "title": "...",
      "final_choice": "...",
      "timestamp": "...",
      "outcome": {
        "status": "reviewed",
        "correct": true,
        "notes": "...",
        "reviewed_at": "..."
      }
    }
  ]
}
```

### 2. Review Decision
```http
POST /decisions/{decision_id}/review
Content-Type: application/json

{
  "correct": true,
  "notes": "Reflection notes here..."
}
```

**Response:**
```json
{
  "status": "ok",
  "message": "Review saved successfully",
  "data": {
    "id": "dec_123",
    "outcome": {
      "status": "reviewed",
      "correct": true,
      "notes": "...",
      "reviewed_at": "2026-01-20T10:00:00Z"
    }
  }
}
```

---

## 🎨 UI Components

### Timeline View
- **Location:** Timeline tab in main navigation
- **Features:**
  - Vertical timeline layout
  - Date badges (day + month)
  - Decision cards with metadata
  - Color-coded status badges
  - Click to open detail modal

### Decision Modal
- **Sections:**
  1. Overview (context, date)
  2. Criteria & Weights
  3. Options Evaluated
  4. Final Decision
  5. Learning & Reflection

### Review Interface
- **New Review:**
  - Yes/No buttons for correctness
  - Textarea for reflection notes
  - Save button (enabled after selection)

- **Existing Review:**
  - Display previous review
  - Show review date
  - "Update Review" button to modify

---

## 💡 Usage Flow

### For Users

1. **Make a Decision**
   - Use the Builder to create and evaluate a decision
   - Save the decision

2. **Wait for Real-World Outcome**
   - Implement the decision
   - Observe results over time

3. **Review the Decision**
   - Go to Timeline tab
   - Click on the decision
   - Mark as correct/incorrect
   - Add reflection notes
   - Save review

4. **Learn from Patterns**
   - View stats dashboard
   - Identify successful decision patterns
   - Improve future decision-making

### For Developers

1. **Backend Integration**
   - Decisions automatically include `outcome` structure
   - Use `/decisions/{id}/review` endpoint to update
   - Timeline endpoint returns all decisions with outcomes

2. **Frontend Integration**
   - `switchTab('timeline')` loads timeline view
   - `openDecisionModal(id)` shows decision details
   - `saveReview()` submits review to backend

---

## 🔧 Technical Implementation

### Backend (Python/Flask)
- **File:** `backend/app.py`
- **New Endpoints:**
  - `POST /decisions/<id>/review`
  - `GET /decisions/timeline`
- **Updated:** `utils.py` - `save_decision()` auto-initializes outcome

### Frontend (Vanilla JS)
- **File:** `frontend/app.js`
- **New Functions:**
  - `loadTimeline()`
  - `renderTimeline()`
  - `openDecisionModal()`
  - `saveReview()`
  - `selectReviewAnswer()`

### Styling (CSS)
- **File:** `frontend/styles.css`
- **New Classes:**
  - `.timeline-item`
  - `.outcome-badge`
  - `.modal-overlay`
  - `.review-section`

---

## 🎯 Benefits

1. **Continuous Learning**
   - Track decision accuracy over time
   - Identify patterns in successful decisions

2. **Accountability**
   - Document reasoning and outcomes
   - Build decision-making confidence

3. **Pattern Recognition**
   - See which criteria matter most
   - Understand personal decision biases

4. **Knowledge Base**
   - Build a personal decision journal
   - Reference past decisions for similar situations

---

## 🚀 Future Enhancements

Potential additions:
- Decision success rate charts
- Criteria effectiveness analysis
- AI-powered pattern insights
- Reminder system for pending reviews
- Export learning reports
- Decision templates from successful patterns

---

## 📝 Example Workflow

```
Day 1: Create decision "Choose Cloud Provider"
       → Evaluate AWS, GCP, Azure
       → Select AWS (score: 87.5)
       → Save decision

Day 30: Implement AWS solution
        → Monitor performance
        → Gather team feedback

Day 60: Review decision
        → Open Timeline
        → Click "Choose Cloud Provider"
        → Mark as "Correct"
        → Add notes: "AWS met all requirements, 
           team is productive, costs under budget"
        → Save review

Result: Learn that infrastructure decisions 
        with strong ecosystem support (high weight)
        tend to be successful
```

---

## 🔒 Data Privacy

- All decisions stored locally in `data/decisions/`
- No external tracking
- User controls all review data
- Can delete decisions anytime

---

## 📚 Related Files

- `backend/app.py` - API endpoints
- `backend/utils.py` - Data persistence
- `frontend/app.js` - Timeline logic
- `frontend/index.html` - Timeline UI
- `frontend/styles.css` - Timeline styles
- `data/decisions/*.json` - Decision storage

---

**Version:** 1.0.0  
**Last Updated:** 2026-01-27
