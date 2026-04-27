"""
rag_engine.py
Simple JSON-based Retrieval-Augmented Generation engine.
Loads past decisions from /data/decisions/, finds relevant ones
via keyword matching, and formats them as prompt context.
"""

import os
import json
import re
from typing import List, Dict, Any
from pathlib import Path

DATA_DIR = Path(__file__).parent.parent / "data" / "decisions"


def load_all_decisions() -> List[Dict[str, Any]]:
    """Load every decision JSON from the data directory."""
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    decisions = []
    for fp in DATA_DIR.glob("*.json"):
        try:
            with open(fp, "r", encoding="utf-8") as f:
                data = json.load(f)
                data["_file"] = fp.name
                decisions.append(data)
        except (json.JSONDecodeError, IOError):
            continue
    return decisions


def _tokenize(text: str) -> set:
    """Lowercase, split on non-word chars, return set of tokens."""
    if not text:
        return set()
    return set(re.findall(r"\w+", text.lower()))


def _score_decision(decision: Dict[str, Any], query_tokens: set) -> float:
    """
    Simple keyword overlap score between query and a stored decision.
    Uses title + context + criteria names + option names.
    """
    candidate_text = " ".join([
        decision.get("title", ""),
        decision.get("context", ""),
        decision.get("constraints", ""),
        " ".join(c.get("name", "") for c in decision.get("criteria", [])),
        " ".join(o.get("name", "") for o in decision.get("options", [])),
    ])
    candidate_tokens = _tokenize(candidate_text)
    if not candidate_tokens:
        return 0.0
    overlap = query_tokens & candidate_tokens
    return len(overlap) / (len(query_tokens) + 1)


def find_similar_decisions(query: str, top_k: int = 3) -> List[Dict[str, Any]]:
    """
    Find the top-k most relevant past decisions for a query string.
    Returns list of decision dicts.
    """
    query_tokens = _tokenize(query)
    if not query_tokens:
        return []

    all_decisions = load_all_decisions()
    scored = [
        (d, _score_decision(d, query_tokens))
        for d in all_decisions
    ]
    scored.sort(key=lambda x: x[1], reverse=True)
    return [d for d, score in scored[:top_k] if score > 0]


def prepare_context_for_ai(query: str) -> str:
    """
    Format relevant past decisions into a compact prompt context block.
    Returns an empty string if no relevant decisions found.
    """
    similar = find_similar_decisions(query, top_k=3)
    if not similar:
        return ""

    lines = ["=== RELEVANT PAST DECISIONS (for context) ===\n"]
    for i, dec in enumerate(similar, 1):
        lines.append(f"--- Past Decision {i}: {dec.get('title', 'Untitled')} ---")
        lines.append(f"Context: {dec.get('context', 'N/A')}")
        criteria_names = [c.get("name") for c in dec.get("criteria", [])]
        options_names = [o.get("name") for o in dec.get("options", [])]
        if criteria_names:
            lines.append(f"Criteria used: {', '.join(criteria_names)}")
        if options_names:
            lines.append(f"Options evaluated: {', '.join(options_names)}")
        if dec.get("final_choice"):
            lines.append(f"Final choice: {dec['final_choice']}")
        lines.append("")

    return "\n".join(lines)
