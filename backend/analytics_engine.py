"""
analytics_engine.py
Aggregates historical decisions into a decision analytics dashboard payload.
"""

from __future__ import annotations

from collections import Counter, defaultdict
from datetime import datetime
from statistics import mean
from typing import Any, Dict, List, Optional


def _parse_date(iso_value: str) -> Optional[datetime]:
    if not iso_value:
        return None
    try:
        return datetime.fromisoformat(iso_value.replace("Z", "+00:00"))
    except ValueError:
        return None


def _std_dev(values: List[float]) -> float:
    if not values:
        return 0.0
    avg = sum(values) / len(values)
    variance = sum((value - avg) ** 2 for value in values) / len(values)
    return variance ** 0.5


def _calculate_confidence(decision: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    criteria = decision.get("criteria", []) or []
    results = decision.get("ranked_results", []) or []

    if not criteria or not results:
        return None

    criteria_count = len(criteria)
    criteria_depth = 1.0 if criteria_count >= 5 else 0.7 if criteria_count >= 3 else 0.4

    weights = [float(item.get("weight", 0)) for item in criteria]
    weight_std = _std_dev(weights)
    weight_balance = 1.0 if weight_std < 10 else 0.7 if weight_std < 20 else 0.4

    if len(results) >= 2:
        score_gap = float(results[0].get("total_score", 0)) - float(results[1].get("total_score", 0))
    else:
        score_gap = 0.0
    score_separation = 1.0 if score_gap > 20 else 0.7 if score_gap > 10 else 0.4

    stability = 0.8
    overall = (criteria_depth + weight_balance + score_separation + stability) / 4
    percentage = round(overall * 100, 1)

    if percentage >= 75:
        level = "High"
    elif percentage >= 50:
        level = "Medium"
    else:
        level = "Low"

    return {
        "score": percentage,
        "level": level,
        "score_gap": score_gap,
    }


def _extract_top_biases(bias_analysis: Dict[str, Any]) -> List[Dict[str, Any]]:
    biases = bias_analysis.get("biases", []) or []
    severity_order = {"strong": 0, "moderate": 1, "mild": 2}
    return sorted(
        [
            {
                "title": bias.get("title", "Untitled bias"),
                "description": bias.get("description", ""),
                "severity": bias.get("severity", "mild"),
                "impact": bias.get("impact", "low"),
            }
            for bias in biases
        ],
        key=lambda item: severity_order.get(item["severity"], 99),
    )[:4]


def _generate_improvement_suggestions(
    reviewed_count: int,
    success_rate: Optional[float],
    pending_reviews: int,
    confidence_by_level: Dict[str, Dict[str, Any]],
    criteria_usage: List[Dict[str, Any]],
    weight_distribution: List[Dict[str, Any]],
    top_biases: List[Dict[str, Any]],
) -> List[str]:
    suggestions: List[str] = []

    if pending_reviews >= 3:
        suggestions.append("Review more past decisions to improve the reliability of your learning signals.")

    if success_rate is not None and reviewed_count >= 3:
        if success_rate < 60:
            suggestions.append("Revisit decisions with incorrect outcomes and compare the winning option against the missed trade-offs.")
        elif success_rate >= 80:
            suggestions.append("Your reviewed decisions are trending well. Capture more reflections so you can repeat what is working.")

    high_conf = confidence_by_level.get("High", {})
    low_conf = confidence_by_level.get("Low", {})
    if high_conf.get("reviewed", 0) >= 2 and high_conf.get("success_rate", 0) < 60:
        suggestions.append("High-confidence decisions are underperforming. Challenge your assumptions before finalizing future choices.")
    if low_conf.get("reviewed", 0) >= 2 and low_conf.get("success_rate", 0) >= 70:
        suggestions.append("Some low-confidence decisions are still succeeding. Consider whether you are underestimating your analysis quality.")

    if criteria_usage:
        dominant = criteria_usage[0]
        if dominant["usage_pct"] >= 70:
            suggestions.append(f"'{dominant['criterion']}' shows up in most decisions. Make sure it is not crowding out other important factors.")

    if weight_distribution:
        top_weight = weight_distribution[0]
        if top_weight["avg_weight"] >= 28:
            suggestions.append(f"You consistently assign heavy weight to '{top_weight['criterion']}'. Try pressure-testing decisions with more balanced weights.")

    if top_biases:
        suggestions.append(top_biases[0]["description"])

    if not suggestions:
        suggestions.append("Your decision patterns look balanced so far. Keep reviewing outcomes to unlock deeper trend analysis.")

    deduped: List[str] = []
    seen = set()
    for suggestion in suggestions:
        if suggestion not in seen:
            seen.add(suggestion)
            deduped.append(suggestion)
    return deduped[:5]


def analyze_decision_analytics(decisions: List[Dict[str, Any]], bias_analysis: Dict[str, Any]) -> Dict[str, Any]:
    total_decisions = len(decisions)
    if total_decisions < 3:
        return {
            "insufficient_data": True,
            "minimum_required": 3,
            "total_decisions": total_decisions,
            "message": "Need at least 3 decisions to unlock decision analytics.",
        }

    reviewed = [decision for decision in decisions if decision.get("outcome", {}).get("status") == "reviewed"]
    correct = [decision for decision in reviewed if decision.get("outcome", {}).get("correct") is True]
    incorrect = [decision for decision in reviewed if decision.get("outcome", {}).get("correct") is False]
    pending_reviews = total_decisions - len(reviewed)

    confidence_entries = []
    criteria_frequency = Counter()
    criteria_weight_sums = defaultdict(float)
    criteria_weight_counts = Counter()
    timeline_counter = Counter()

    for decision in decisions:
        confidence = _calculate_confidence(decision)
        if confidence:
            confidence_entries.append({
                "id": decision.get("id"),
                "title": decision.get("title", "Untitled"),
                "score": confidence["score"],
                "level": confidence["level"],
                "reviewed": decision.get("outcome", {}).get("status") == "reviewed",
                "correct": decision.get("outcome", {}).get("correct"),
            })

        for criterion in decision.get("criteria", []) or []:
            name = (criterion.get("name") or "").strip()
            if not name:
                continue
            criteria_frequency[name] += 1
            criteria_weight_sums[name] += float(criterion.get("weight", 0))
            criteria_weight_counts[name] += 1

        decision_date = _parse_date(decision.get("timestamp", ""))
        if decision_date:
            key = decision_date.strftime("%Y-%m")
            timeline_counter[key] += 1

    avg_confidence = round(mean(entry["score"] for entry in confidence_entries), 1) if confidence_entries else None
    success_rate = round((len(correct) / len(reviewed)) * 100, 1) if reviewed else None

    criteria_usage = []
    for criterion, frequency in criteria_frequency.items():
        criteria_usage.append({
            "criterion": criterion,
            "count": frequency,
            "usage_pct": round((frequency / total_decisions) * 100, 1),
            "avg_weight": round(criteria_weight_sums[criterion] / max(criteria_weight_counts[criterion], 1), 1),
        })
    criteria_usage.sort(key=lambda item: (-item["count"], -item["avg_weight"], item["criterion"].lower()))

    weight_distribution = sorted(
        [
            {
                "criterion": item["criterion"],
                "avg_weight": item["avg_weight"],
            }
            for item in criteria_usage
        ],
        key=lambda item: (-item["avg_weight"], item["criterion"].lower()),
    )

    confidence_by_level: Dict[str, Dict[str, Any]] = {}
    for level in ("High", "Medium", "Low"):
        entries = [item for item in confidence_entries if item["level"] == level]
        reviewed_entries = [item for item in entries if item["reviewed"]]
        correct_entries = [item for item in reviewed_entries if item["correct"] is True]
        confidence_by_level[level] = {
            "count": len(entries),
            "reviewed": len(reviewed_entries),
            "correct": len(correct_entries),
            "success_rate": round((len(correct_entries) / len(reviewed_entries)) * 100, 1) if reviewed_entries else None,
        }

    timeline = [
        {
            "period": period,
            "count": timeline_counter[period],
        }
        for period in sorted(timeline_counter.keys())
    ]

    top_biases = _extract_top_biases(bias_analysis)
    suggestions = _generate_improvement_suggestions(
        reviewed_count=len(reviewed),
        success_rate=success_rate,
        pending_reviews=pending_reviews,
        confidence_by_level=confidence_by_level,
        criteria_usage=criteria_usage,
        weight_distribution=weight_distribution,
        top_biases=top_biases,
    )

    most_used_insight = ""
    if criteria_usage:
        top_names = [item["criterion"] for item in criteria_usage[:2]]
        if len(top_names) == 1:
            most_used_insight = f"You most frequently consider {top_names[0]}."
        else:
            most_used_insight = f"You most frequently consider {top_names[0]} and {top_names[1]}."

    weight_insight = ""
    if weight_distribution:
        top_weight = weight_distribution[0]
        weight_insight = f"You consistently assign higher weight to {top_weight['criterion']}."

    confidence_insight = ""
    high_conf = confidence_by_level.get("High", {})
    low_conf = confidence_by_level.get("Low", {})
    if high_conf.get("reviewed") and high_conf.get("success_rate") is not None:
        confidence_insight = f"High-confidence decisions succeed {high_conf['success_rate']:.0f}% of the time."
    elif low_conf.get("reviewed") and low_conf.get("success_rate") is not None:
        confidence_insight = f"Low-confidence decisions succeed {low_conf['success_rate']:.0f}% of the time."

    return {
        "insufficient_data": False,
        "overview": {
            "total_decisions": total_decisions,
            "reviewed_decisions": len(reviewed),
            "correct_decisions": len(correct),
            "incorrect_decisions": len(incorrect),
            "pending_reviews": pending_reviews,
            "success_rate": success_rate,
            "average_confidence": avg_confidence,
        },
        "criteria_usage": criteria_usage,
        "weight_distribution": weight_distribution,
        "success_breakdown": {
            "correct": len(correct),
            "incorrect": len(incorrect),
            "reviewed": len(reviewed),
            "pending": pending_reviews,
        },
        "confidence_analysis": {
            "by_level": confidence_by_level,
            "entries": confidence_entries,
        },
        "timeline": timeline,
        "bias_summary": {
            "top_biases": top_biases,
            "recommendations": bias_analysis.get("recommendations", [])[:4],
        },
        "insights": {
            "most_used_criteria": most_used_insight,
            "weight_distribution": weight_insight,
            "confidence_vs_outcome": confidence_insight,
            "improvement_suggestions": suggestions,
        },
    }
