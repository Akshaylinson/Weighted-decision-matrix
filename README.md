# 🧠 Personal Decision Intelligence System (PDIS)

A full-stack, AI-powered web application that helps you make structured, intelligent decisions using a **Weighted Decision Matrix**. PDIS combines deterministic mathematical scoring with generative AI (Groq) to provide criteria suggestions, option discovery, and actionable insights.

![PDIS Screenshot Placeholder](https://via.placeholder.com/1200x600?text=Personal+Decision+Intelligence+System)

## 🚀 Features

* **AI-Assisted Brainstorming**: Uses the Groq API to automatically suggest relevant evaluation criteria, realistic options, and suitable weights based on your decision context.
* **Deterministic Scoring Engine**: Core mathematical calculations are handled purely in Python, ensuring accurate, transparent, and reproducible weighted rankings.
* **Smart RAG Memory System**: Automatically saves past decisions as JSON and uses them to intelligently inform the AI on future related decisions (no heavy database required).
* **Decision Learning Timeline**: Track, review, and learn from past decisions. Mark outcomes as correct/incorrect, add reflection notes, and identify patterns in your decision-making over time.
* **Speech-to-Text Input**: Voice-powered decision context entry using Web Speech API for natural, hands-free input.
* **Interactive Sensitivity Analysis**: Real-time weight adjustment with instant ranking recalculation, stability indicators, and critical criteria detection. Understand how your decision changes with different priorities.
* **Decision Confidence Score**: Data-driven reliability assessment that evaluates decision quality based on criteria depth, weight balance, score separation, and stability. Get High/Medium/Low confidence ratings with actionable warnings.
* **Bias Detection System**: Analyzes historical decisions to identify consistent behavioral patterns like over-prioritizing certain criteria, neglecting long-term factors, or habitual decision structures. Provides personalized recommendations to improve decision-making.
* **Scenario Simulation**: Explore how your decision changes under different future conditions. Create multiple scenarios with varying priorities, compare outcomes side-by-side, and identify robust choices that work across situations.
* **Insights Generator**: Post-decision analysis that highlights pros, cons, and risks based on the final calculated scores.
* **Stunning UI**: Modern, responsive, glassmorphic design built with Tailwind CSS and Vanilla JS.

---

## 🛠 Tech Stack

* **Frontend**: HTML5, Vanilla JavaScript, Tailwind CSS (Custom themes & animations)
* **Backend**: Python (Flask / Gunicorn)
* **AI Integration**: Groq API (Groq) via HTTPX
* **Storage**: File-based JSON Memory System
* **DevOps**: Fully Dockerized (Docker & Docker Compose)

---

## 🐳 Quickstart (Docker)

The absolute easiest way to run the application is via Docker.

**1. Clone the repository**
```bash
git clone https://github.com/Akshaylinson/Weighted-decision-matrix.git
cd Weighted-decision-matrix
```

**2. Configure your Environment variables**
Copy the example file to create your local `.env`:
```bash
cp .env.example .env
```
Open `.env` and add your [Groq API Key](https://console.x.ai/):
```env
GROK_API_KEY=xoxb-your-real-api-key-here
MODEL_NAME=llama3-70b-8192
PORT=5000
```

**3. Build and Run**
```bash
docker-compose up --build
```

**4. Open the App**
Navigate your web browser to: [http://localhost:5000](http://localhost:5000)

---

## 💻 Local Development (Without Docker)

If you prefer to run the application natively on your machine:

**1. Create a virtual environment & install dependencies:**
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

**2. Set up your `.env` file** (same as step 2 above).

**3. Run the Flask Server:**
```bash
python backend/app.py
```
*Note: The frontend static files are served directly from the Flask backend.*

---

## 📂 Project Structure

```text
├── backend/
│   ├── app.py               # Flask REST API & routing
│   ├── decision_engine.py   # Deterministic math scoring logic
│   ├── rag_engine.py        # JSON-based memory & context retrieval
│   └── utils.py             # File I/O and shared utilities
├── frontend/
│   ├── index.html           # Main SPA interface
│   ├── app.js               # Frontend state management & API logic
│   └── styles.css           # Custom Tailwind extensions & dark mode
├── data/decisions/          # Persistent JSON storage for decisions
├── docker-compose.yml       # Docker orchestration
├── Dockerfile               # Production-ready image configuration
├── requirements.txt         # Python dependencies
└── .env                     # Environment variables
```

---

## 🧠 How it Works (The Flow)

1. **Context Phase**: You input the decision you need to make (e.g., "Which cloud provider to use?").
2. **AI Phase (Optional)**: Groq analyzes your context, compares it to past decisions in `data/decisions/`, and suggests criteria (Cost, Speed, Support) and options (AWS, GCP, Azure).
3. **Scoring Phase**: You rate each option 1-5 across your criteria.
4. **Engine Phase**: The Python backend deterministically calculates the weighted sums and ranks the options.
5. **Insight Phase**: Groq returns actionable pros/cons based on the math.
6. **Save Phase**: The entire matrix is saved to a `.json` file to inform future suggestions.
7. **Learning Phase**: After implementing your decision, return to the Timeline to review the outcome, mark it as correct/incorrect, and add reflection notes to improve future decisions.

---

## 📚 Additional Documentation

* **[Scenario Simulation Guide](SCENARIO_SIMULATION.md)** - Multi-scenario comparison and strategic planning
* **[Bias Detection Guide](BIAS_DETECTION.md)** - Historical pattern analysis and cognitive bias detection
* **[Decision Confidence Score Guide](CONFIDENCE_SCORE.md)** - Data-driven reliability assessment system
* **[Sensitivity Analysis Guide](SENSITIVITY_ANALYSIS.md)** - Interactive weight adjustment and decision stability analysis
* **[Decision Learning System Guide](USER_GUIDE_LEARNING.md)** - How to use the Timeline and review system
* **[Learning System Technical Docs](LEARNING_SYSTEM.md)** - API endpoints and data structures
* **[Implementation Summary](IMPLEMENTATION_SUMMARY.md)** - Feature overview and architecture

---

## 📝 License
This project is open-source and available under the MIT License.
