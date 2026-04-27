"""
decision_engine.py
Deterministic weighted decision matrix calculator.
NO AI is used here — all math is pure Python.
"""

from typing import List, Dict, Any


def normalize_weights(criteria: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Normalize weights so they sum to 100.
    Mutates a copy of the list, returns it.
    """
    total = sum(c.get("weight", 0) for c in criteria)
    if total == 0:
        # equal weights if all are zero
        equal = round(100 / len(criteria), 4) if criteria else 0
        return [{**c, "weight": equal} for c in criteria]
    return [{**c, "weight": round(c.get("weight", 0) / total * 100, 4)} for c in criteria]


def calculate_weighted_scores(
    criteria: List[Dict[str, Any]],
    options: List[Dict[str, Any]],
) -> List[Dict[str, Any]]:
    """
    Core deterministic scoring function.

    criteria: [{"id": "c1", "name": "Cost", "weight": 30}, ...]
    options:  [{"id": "o1", "name": "Option A",
                "scores": {"c1": 4, "c2": 3, ...}}, ...]

    Returns ranked list:
    [
      {
        "id": "o1",
        "name": "Option A",
        "total_score": 78.5,
        "breakdown": [
          {"criterion_id": "c1", "criterion_name": "Cost",
           "weight": 30, "raw_score": 4, "weighted_score": 24.0},
          ...
        ]
      },
      ...
    ]
    """
    normalized = normalize_weights(criteria)
    results = []

    for option in options:
        raw_scores = option.get("scores", {})
        breakdown = []
        total = 0.0

        for criterion in normalized:
            cid = criterion["id"]
            raw = raw_scores.get(cid, 0)
            # Clamp to 1–5 scale
            raw = max(1, min(5, float(raw))) if raw else 0.0
            w = criterion["weight"]
            # Weighted score: (raw/5) * weight  → gives 0-100 range per criterion
            ws = round((raw / 5.0) * w, 4)
            total += ws
            breakdown.append({
                "criterion_id": cid,
                "criterion_name": criterion.get("name", cid),
                "weight": w,
                "raw_score": raw,
                "weighted_score": ws,
            })

        results.append({
            "id": option["id"],
            "name": option["name"],
            "total_score": round(total, 4),
            "breakdown": breakdown,
        })

    # Sort descending by total score
    results.sort(key=lambda x: x["total_score"], reverse=True)

    # Add rank
    for i, r in enumerate(results):
        r["rank"] = i + 1

    return results


def sensitivity_analysis(
    criteria: List[Dict[str, Any]],
    options: List[Dict[str, Any]],
    target_criterion_id: str,
    weight_steps: int = 10,
) -> List[Dict[str, Any]]:
    """
    Sweeps the weight of one criterion from 0→100 in `weight_steps` steps,
    redistributing remaining weight proportionally.
    Returns a list of {weight_value, rankings} for charting.
    """
    results = []
    step_size = 100 / weight_steps

    # Original weights for non-target criteria
    others = [c for c in criteria if c["id"] != target_criterion_id]
    others_total = sum(c.get("weight", 0) for c in others) or 1

    for step in range(weight_steps + 1):
        target_w = round(step * step_size, 2)
        remaining = 100 - target_w

        adjusted = []
        for c in criteria:
            if c["id"] == target_criterion_id:
                adjusted.append({**c, "weight": target_w})
            else:
                # redistribute proportionally
                adj_w = round(c.get("weight", 0) / others_total * remaining, 4)
                adjusted.append({**c, "weight": adj_w})

        scored = calculate_weighted_scores(adjusted, options)
        results.append({
            "target_weight": target_w,
            "rankings": [{"name": r["name"], "total_score": r["total_score"]} for r in scored],
        })

    return results
