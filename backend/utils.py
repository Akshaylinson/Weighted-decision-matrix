"""
utils.py
Shared helpers: ID generation, JSON file I/O, response helpers.
"""

import uuid
import json
import os
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict

DATA_DIR = Path(__file__).parent.parent / "data" / "decisions"


def new_id(prefix: str = "") -> str:
    """Generate a short, unique ID."""
    uid = uuid.uuid4().hex[:10]
    return f"{prefix}{uid}" if prefix else uid


def now_iso() -> str:
    """Return current UTC timestamp in ISO-8601 format."""
    return datetime.now(timezone.utc).isoformat()


def save_decision(decision: Dict[str, Any]) -> str:
    """
    Persist a decision dict to /data/decisions/<id>.json.
    Returns the file path.
    """
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    did = decision.get("id") or new_id("dec_")
    decision["id"] = did
    fp = DATA_DIR / f"{did}.json"
    with open(fp, "w", encoding="utf-8") as f:
        json.dump(decision, f, indent=2, ensure_ascii=False)
    return str(fp)


def load_decision(decision_id: str) -> Dict[str, Any]:
    """Load a single decision by ID. Raises FileNotFoundError if missing."""
    fp = DATA_DIR / f"{decision_id}.json"
    with open(fp, "r", encoding="utf-8") as f:
        return json.load(f)


def delete_decision(decision_id: str) -> bool:
    """Delete a decision file. Returns True if deleted, False if not found."""
    fp = DATA_DIR / f"{decision_id}.json"
    if fp.exists():
        fp.unlink()
        return True
    return False


def list_decisions() -> list:
    """Return a summary list of all stored decisions (no score breakdown)."""
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    summaries = []
    for fp in sorted(DATA_DIR.glob("*.json"), key=os.path.getmtime, reverse=True):
        try:
            with open(fp, "r", encoding="utf-8") as f:
                d = json.load(f)
            summaries.append({
                "id": d.get("id", fp.stem),
                "title": d.get("title", "Untitled"),
                "context": d.get("context", ""),
                "final_choice": d.get("final_choice", ""),
                "timestamp": d.get("timestamp", ""),
                "options_count": len(d.get("options", [])),
                "criteria_count": len(d.get("criteria", [])),
            })
        except (json.JSONDecodeError, IOError):
            continue
    return summaries


def ok(data: Any = None, message: str = "OK") -> Dict[str, Any]:
    """Standard success response envelope."""
    return {"status": "ok", "message": message, "data": data}


def err(message: str, code: int = 400) -> tuple:
    """Standard error response envelope."""
    return {"status": "error", "message": message}, code
