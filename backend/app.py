"""
app.py
Flask backend for the Personal Decision Intelligence System (PDIS).
Serves REST API endpoints — frontend is served as static files.
"""

import os
import json
import httpx
from pathlib import Path
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from dotenv import load_dotenv

# Load .env from project root
load_dotenv(Path(__file__).parent.parent / ".env")

from decision_engine import calculate_weighted_scores, normalize_weights, sensitivity_analysis
from rag_engine import prepare_context_for_ai, find_similar_decisions, load_all_decisions
from utils import (
    new_id, now_iso,
    save_decision, load_decision, delete_decision, list_decisions,
    ok, err,
)

# ──────────────────────────────────────────────
# App setup
# ──────────────────────────────────────────────
BASE_DIR   = Path(__file__).parent.parent
FRONT_DIR  = BASE_DIR / "frontend"

app = Flask(__name__, static_folder=str(FRONT_DIR), static_url_path="")
CORS(app)  # allow frontend on different port during dev

# ──────────────────────────────────────────────
# AI config (OpenAI-compatible)
# ──────────────────────────────────────────────
AI_API_KEY   = os.getenv("OPENAI_API_KEY", "")
AI_BASE_URL  = os.getenv("AI_BASE_URL", "https://api.openai.com/v1")
AI_MODEL     = os.getenv("AI_MODEL", "gpt-4o-mini")


def call_ai(messages: list, temperature: float = 0.7) -> str:
    """
    Call the OpenAI-compatible chat completion API.
    Returns the assistant message content.
    Raises RuntimeError on failure.
    """
    if not AI_API_KEY:
        raise RuntimeError("AI_API_KEY not set. Add it to your .env file.")

    headers = {
        "Authorization": f"Bearer {AI_API_KEY}",
        "Content-Type": "application/json",
    }
    payload = {
        "model": AI_MODEL,
        "messages": messages,
        "temperature": temperature,
    }
    resp = httpx.post(
        f"{AI_BASE_URL}/chat/completions",
        headers=headers,
        json=payload,
        timeout=60,
    )
    resp.raise_for_status()
    return resp.json()["choices"][0]["message"]["content"]


# ──────────────────────────────────────────────
# Frontend
# ──────────────────────────────────────────────
@app.route("/")
def index():
    return send_from_directory(str(FRONT_DIR), "index.html")


# ──────────────────────────────────────────────
# Health check
# ──────────────────────────────────────────────
@app.route("/health")
def health():
    return jsonify(ok({"ai_configured": bool(AI_API_KEY), "model": AI_MODEL}))


# ──────────────────────────────────────────────
# AI — Suggest criteria, options, weights
# ──────────────────────────────────────────────
@app.route("/ai/suggest", methods=["POST"])
def ai_suggest():
    body = request.get_json(force=True) or {}
    title       = body.get("title", "").strip()
    context     = body.get("context", "").strip()
    constraints = body.get("constraints", "").strip()

    if not title:
        return jsonify(*err("title is required"))

    # Inject RAG context from past decisions
    query      = f"{title} {context}"
    rag_ctx    = prepare_context_for_ai(query)

    system_msg = (
        "You are a decision analysis expert. "
        "Given a decision topic, suggest evaluation criteria with weights, "
        "and options to compare. Respond ONLY with valid JSON — no markdown fences, "
        "no explanation, just the raw JSON object.\n\n"
        "JSON schema:\n"
        "{\n"
        '  "criteria": [\n'
        '    {"id": "c1", "name": "string", "weight": number_0_to_100, "description": "string"},\n'
        "    ...\n"
        "  ],\n"
        '  "options": [\n'
        '    {"id": "o1", "name": "string", "description": "string"},\n'
        "    ...\n"
        "  ],\n"
        '  "rationale": "brief explanation string"\n'
        "}\n"
        "Weights must sum to 100. Provide 3-6 criteria and 2-5 options."
    )

    user_msg_parts = []
    if rag_ctx:
        user_msg_parts.append(rag_ctx)
    user_msg_parts.append(f"Decision Title: {title}")
    if context:
        user_msg_parts.append(f"Context/Description: {context}")
    if constraints:
        user_msg_parts.append(f"Constraints: {constraints}")

    try:
        raw = call_ai([
            {"role": "system", "content": system_msg},
            {"role": "user",   "content": "\n".join(user_msg_parts)},
        ])
        # Strip accidental markdown fences if the model adds them
        raw = raw.strip().lstrip("```json").lstrip("```").rstrip("```").strip()
        data = json.loads(raw)
        return jsonify(ok(data, "Suggestions generated"))
    except json.JSONDecodeError as e:
        return jsonify(*err(f"AI returned invalid JSON: {e}"))
    except RuntimeError as e:
        return jsonify(*err(str(e), 503))
    except Exception as e:
        return jsonify(*err(f"AI call failed: {str(e)}", 502))


# ──────────────────────────────────────────────
# AI — Suggest scores for an option
# ──────────────────────────────────────────────
@app.route("/ai/score", methods=["POST"])
def ai_score():
    body    = request.get_json(force=True) or {}
    title   = body.get("title", "")
    context = body.get("context", "")
    option  = body.get("option", {})
    criteria = body.get("criteria", [])

    if not option or not criteria:
        return jsonify(*err("option and criteria are required"))

    criteria_desc = "\n".join(
        f"- {c['name']} (id: {c['id']}): {c.get('description','')}" for c in criteria
    )
    system_msg = (
        "You are a decision analysis expert. "
        "Given an option and evaluation criteria, suggest scores from 1-5 for each criterion. "
        "1=very poor, 3=average, 5=excellent. "
        "Respond ONLY with valid JSON (no markdown). "
        'Schema: {"scores": {"<criterion_id>": <1-5 integer>, ...}, "rationale": "string"}'
    )
    user_msg = (
        f"Decision: {title}\nContext: {context}\n\n"
        f"Option to score: {option.get('name')} — {option.get('description','')}\n\n"
        f"Criteria:\n{criteria_desc}"
    )

    try:
        raw  = call_ai([
            {"role": "system", "content": system_msg},
            {"role": "user",   "content": user_msg},
        ])
        raw  = raw.strip().lstrip("```json").lstrip("```").rstrip("```").strip()
        data = json.loads(raw)
        return jsonify(ok(data, "Scores suggested"))
    except json.JSONDecodeError as e:
        return jsonify(*err(f"AI returned invalid JSON: {e}"))
    except RuntimeError as e:
        return jsonify(*err(str(e), 503))
    except Exception as e:
        return jsonify(*err(f"AI call failed: {str(e)}", 502))


# ──────────────────────────────────────────────
# AI — Generate insights from final results
# ──────────────────────────────────────────────
@app.route("/ai/insights", methods=["POST"])
def ai_insights():
    body    = request.get_json(force=True) or {}
    title   = body.get("title", "")
    context = body.get("context", "")
    results = body.get("results", [])   # ranked options
    criteria = body.get("criteria", [])

    if not results:
        return jsonify(*err("results are required"))

    winner  = results[0] if results else {}
    summary = "\n".join(
        f"{r['rank']}. {r['name']} — score: {r['total_score']:.1f}/100"
        for r in results
    )

    system_msg = (
        "You are a senior decision consultant. "
        "Given a weighted decision matrix result, provide concise, actionable insights. "
        "Respond ONLY with valid JSON (no markdown). "
        "Schema:\n"
        '{"explanation": "string", "pros": ["string",...], "cons": ["string",...], '
        '"risks": ["string",...], "recommendation": "string"}'
    )
    user_msg = (
        f"Decision: {title}\nContext: {context}\n\n"
        f"Ranking:\n{summary}\n\n"
        f"Top option: {winner.get('name')} with score {winner.get('total_score')}/100\n"
        f"Criteria: {', '.join(c['name'] for c in criteria)}"
    )

    try:
        raw  = call_ai([
            {"role": "system", "content": system_msg},
            {"role": "user",   "content": user_msg},
        ])
        raw  = raw.strip().lstrip("```json").lstrip("```").rstrip("```").strip()
        data = json.loads(raw)
        return jsonify(ok(data, "Insights generated"))
    except json.JSONDecodeError as e:
        return jsonify(*err(f"AI returned invalid JSON: {e}"))
    except RuntimeError as e:
        return jsonify(*err(str(e), 503))
    except Exception as e:
        return jsonify(*err(f"AI call failed: {str(e)}", 502))


# ──────────────────────────────────────────────
# Decision Engine — Calculate scores
# ──────────────────────────────────────────────
@app.route("/engine/calculate", methods=["POST"])
def engine_calculate():
    body    = request.get_json(force=True) or {}
    criteria = body.get("criteria", [])
    options  = body.get("options", [])

    if not criteria:
        return jsonify(*err("criteria list is required"))
    if not options:
        return jsonify(*err("options list is required"))

    ranked = calculate_weighted_scores(criteria, options)
    normalized_criteria = normalize_weights(criteria)
    return jsonify(ok({
        "ranked_options": ranked,
        "normalized_criteria": normalized_criteria,
    }, "Calculation complete"))


# ──────────────────────────────────────────────
# Decision Engine — Sensitivity analysis
# ──────────────────────────────────────────────
@app.route("/engine/sensitivity", methods=["POST"])
def engine_sensitivity():
    body    = request.get_json(force=True) or {}
    criteria = body.get("criteria", [])
    options  = body.get("options", [])
    target   = body.get("target_criterion_id", "")

    if not criteria or not options or not target:
        return jsonify(*err("criteria, options, and target_criterion_id are required"))

    analysis = sensitivity_analysis(criteria, options, target)
    return jsonify(ok(analysis, "Sensitivity analysis complete"))


# ──────────────────────────────────────────────
# Decisions CRUD
# ──────────────────────────────────────────────
@app.route("/decisions", methods=["GET"])
def get_decisions():
    return jsonify(ok(list_decisions()))


@app.route("/decisions", methods=["POST"])
def create_decision():
    body = request.get_json(force=True) or {}
    if not body.get("title"):
        return jsonify(*err("title is required"))

    body.setdefault("id", new_id("dec_"))
    body.setdefault("timestamp", now_iso())
    path = save_decision(body)
    return jsonify(ok({"id": body["id"], "path": path}, "Decision saved")), 201


@app.route("/decisions/<decision_id>", methods=["GET"])
def get_decision(decision_id):
    try:
        return jsonify(ok(load_decision(decision_id)))
    except FileNotFoundError:
        return jsonify(*err("Decision not found", 404))


@app.route("/decisions/<decision_id>", methods=["PUT"])
def update_decision(decision_id):
    try:
        existing = load_decision(decision_id)
    except FileNotFoundError:
        return jsonify(*err("Decision not found", 404))

    body = request.get_json(force=True) or {}
    existing.update(body)
    existing["id"] = decision_id  # prevent ID change
    existing["updated_at"] = now_iso()
    save_decision(existing)
    return jsonify(ok({"id": decision_id}, "Decision updated"))


@app.route("/decisions/<decision_id>", methods=["DELETE"])
def remove_decision(decision_id):
    if delete_decision(decision_id):
        return jsonify(ok(message="Decision deleted"))
    return jsonify(*err("Decision not found", 404))


@app.route("/decisions/search", methods=["GET"])
def search_decisions():
    q = request.args.get("q", "").strip()
    if not q:
        return jsonify(ok(list_decisions()))
    similar = find_similar_decisions(q, top_k=10)
    return jsonify(ok(similar))


# ──────────────────────────────────────────────
# Entry point
# ──────────────────────────────────────────────
if __name__ == "__main__":
    port = int(os.getenv("PORT", 5000))
    print(f"[PDIS] Backend running at http://localhost:{port}")
    app.run(debug=True, port=port)
