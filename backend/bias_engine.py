"""
bias_engine.py
Analyzes historical decision patterns to detect cognitive biases.
"""

from typing import List, Dict, Any
from collections import defaultdict
import statistics


def analyze_decision_biases(decisions: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Analyze all decisions to detect behavioral patterns and biases.
    
    Returns:
    {
        "biases": [list of detected bias objects],
        "criteria_analysis": {criterion_name: stats},
        "patterns": {pattern insights},
        "recommendations": [list of suggestions]
    }
    """
    if len(decisions) < 3:
        return {
            "biases": [],
            "criteria_analysis": {},
            "patterns": {},
            "recommendations": [],
            "insufficient_data": True,
            "message": "Need at least 3 decisions to detect patterns"
        }
    
    # Aggregate data
    criteria_usage = defaultdict(int)
    criteria_weights = defaultdict(list)
    criteria_positions = defaultdict(list)  # Track if criterion is top-weighted
    total_decisions = len(decisions)
    
    for decision in decisions:
        criteria = decision.get("criteria", [])
        if not criteria:
            continue
        
        # Sort by weight to find top criterion
        sorted_criteria = sorted(criteria, key=lambda c: c.get("weight", 0), reverse=True)
        top_criterion = sorted_criteria[0]["name"] if sorted_criteria else None
        
        for idx, criterion in enumerate(criteria):
            name = criterion.get("name", "").strip()
            if not name:
                continue
            
            weight = float(criterion.get("weight", 0))
            criteria_usage[name] += 1
            criteria_weights[name].append(weight)
            
            # Track if this is the top-weighted criterion
            if name == top_criterion:
                criteria_positions[name].append(1)
            else:
                criteria_positions[name].append(0)
    
    # Calculate statistics
    criteria_analysis = {}
    for name in criteria_usage:
        weights = criteria_weights[name]
        positions = criteria_positions[name]
        
        criteria_analysis[name] = {
            "frequency": criteria_usage[name],
            "frequency_pct": (criteria_usage[name] / total_decisions) * 100,
            "avg_weight": statistics.mean(weights),
            "median_weight": statistics.median(weights),
            "std_weight": statistics.stdev(weights) if len(weights) > 1 else 0,
            "top_priority_count": sum(positions),
            "top_priority_pct": (sum(positions) / len(positions)) * 100 if positions else 0,
        }
    
    # Detect biases
    biases = detect_biases(criteria_analysis, total_decisions)
    
    # Generate patterns
    patterns = detect_patterns(criteria_analysis, decisions)
    
    # Generate recommendations
    recommendations = generate_recommendations(biases, criteria_analysis)
    
    return {
        "biases": biases,
        "criteria_analysis": criteria_analysis,
        "patterns": patterns,
        "recommendations": recommendations,
        "total_decisions": total_decisions,
        "insufficient_data": False
    }


def detect_biases(criteria_analysis: Dict[str, Any], total_decisions: int) -> List[Dict[str, Any]]:
    """
    Detect specific bias patterns from criteria analysis.
    """
    biases = []
    
    for name, stats in criteria_analysis.items():
        # Bias 1: Dominant Criterion (appears frequently + high weight)
        if stats["frequency_pct"] >= 70 and stats["avg_weight"] >= 25:
            severity = "strong" if stats["avg_weight"] >= 35 else "moderate"
            biases.append({
                "type": "dominant_criterion",
                "criterion": name,
                "severity": severity,
                "title": f"Over-Prioritization: {name}",
                "description": f"You consistently prioritize '{name}' across {stats['frequency_pct']:.0f}% of decisions with an average weight of {stats['avg_weight']:.1f}%.",
                "impact": "high",
                "frequency_pct": stats["frequency_pct"],
                "avg_weight": stats["avg_weight"],
            })
        
        # Bias 2: Consistent Top Priority
        if stats["top_priority_pct"] >= 70:
            biases.append({
                "type": "top_priority_bias",
                "criterion": name,
                "severity": "strong",
                "title": f"Habitual Top Priority: {name}",
                "description": f"'{name}' is your #1 priority in {stats['top_priority_pct']:.0f}% of decisions. This may indicate a fixed mindset.",
                "impact": "medium",
                "top_priority_pct": stats["top_priority_pct"],
            })
        
        # Bias 3: Neglected Criterion (appears rarely or low weight)
        if stats["frequency_pct"] <= 30 and stats["avg_weight"] <= 15:
            biases.append({
                "type": "neglected_criterion",
                "criterion": name,
                "severity": "mild",
                "title": f"Under-Weighted: {name}",
                "description": f"'{name}' appears in only {stats['frequency_pct']:.0f}% of decisions with low average weight ({stats['avg_weight']:.1f}%).",
                "impact": "low",
                "frequency_pct": stats["frequency_pct"],
                "avg_weight": stats["avg_weight"],
            })
    
    # Bias 4: Weight Imbalance Pattern (check if user always has imbalanced weights)
    imbalanced_count = 0
    for name, stats in criteria_analysis.items():
        if stats["std_weight"] > 20:  # High variance = inconsistent weighting
            imbalanced_count += 1
    
    if imbalanced_count >= len(criteria_analysis) * 0.5:
        biases.append({
            "type": "weight_imbalance",
            "severity": "moderate",
            "title": "Inconsistent Weight Distribution",
            "description": f"Your weight distributions vary significantly across decisions, suggesting unclear priorities.",
            "impact": "medium",
        })
    
    return biases


def detect_patterns(criteria_analysis: Dict[str, Any], decisions: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Detect higher-level patterns in decision-making.
    """
    patterns = {}
    
    # Pattern 1: Short-term vs Long-term bias
    short_term_keywords = ["cost", "price", "speed", "quick", "immediate", "fast"]
    long_term_keywords = ["scalability", "maintenance", "sustainability", "growth", "future", "long-term"]
    
    short_term_weight = 0
    long_term_weight = 0
    short_term_count = 0
    long_term_count = 0
    
    for name, stats in criteria_analysis.items():
        name_lower = name.lower()
        if any(kw in name_lower for kw in short_term_keywords):
            short_term_weight += stats["avg_weight"]
            short_term_count += 1
        if any(kw in name_lower for kw in long_term_keywords):
            long_term_weight += stats["avg_weight"]
            long_term_count += 1
    
    if short_term_count > 0 and long_term_count > 0:
        ratio = short_term_weight / long_term_weight if long_term_weight > 0 else float('inf')
        if ratio > 2:
            patterns["temporal_bias"] = {
                "type": "short_term_bias",
                "description": "You tend to prioritize short-term factors over long-term considerations.",
                "short_term_weight": short_term_weight,
                "long_term_weight": long_term_weight,
                "ratio": ratio,
            }
        elif ratio < 0.5:
            patterns["temporal_bias"] = {
                "type": "long_term_bias",
                "description": "You tend to prioritize long-term factors over immediate concerns.",
                "short_term_weight": short_term_weight,
                "long_term_weight": long_term_weight,
                "ratio": ratio,
            }
    
    # Pattern 2: Risk aversion (if "risk" or "safety" criteria are consistently high)
    risk_keywords = ["risk", "safety", "security", "reliability", "stable"]
    risk_weight_sum = 0
    risk_count = 0
    
    for name, stats in criteria_analysis.items():
        name_lower = name.lower()
        if any(kw in name_lower for kw in risk_keywords):
            risk_weight_sum += stats["avg_weight"]
            risk_count += 1
    
    if risk_count > 0:
        avg_risk_weight = risk_weight_sum / risk_count
        if avg_risk_weight > 25:
            patterns["risk_profile"] = {
                "type": "risk_averse",
                "description": "You consistently prioritize safety and risk mitigation.",
                "avg_risk_weight": avg_risk_weight,
            }
    
    # Pattern 3: Criteria diversity
    unique_criteria = len(criteria_analysis)
    avg_criteria_per_decision = sum(
        len(d.get("criteria", [])) for d in decisions
    ) / len(decisions) if decisions else 0
    
    patterns["diversity"] = {
        "unique_criteria_count": unique_criteria,
        "avg_criteria_per_decision": avg_criteria_per_decision,
        "diversity_score": unique_criteria / (avg_criteria_per_decision * len(decisions)) if avg_criteria_per_decision > 0 else 0,
    }
    
    return patterns


def generate_recommendations(biases: List[Dict[str, Any]], criteria_analysis: Dict[str, Any]) -> List[str]:
    """
    Generate actionable recommendations based on detected biases.
    """
    recommendations = []
    
    # Recommendations based on bias types
    dominant_biases = [b for b in biases if b["type"] == "dominant_criterion"]
    if dominant_biases:
        criterion = dominant_biases[0]["criterion"]
        recommendations.append(
            f"Consider reducing emphasis on '{criterion}' in future decisions. "
            f"Try limiting its weight to 20-25% to allow other factors more influence."
        )
    
    top_priority_biases = [b for b in biases if b["type"] == "top_priority_bias"]
    if top_priority_biases:
        criterion = top_priority_biases[0]["criterion"]
        recommendations.append(
            f"Challenge yourself to make '{criterion}' a secondary priority in your next decision. "
            f"This will help you explore alternative perspectives."
        )
    
    neglected_biases = [b for b in biases if b["type"] == "neglected_criterion"]
    if neglected_biases:
        criteria_names = [b["criterion"] for b in neglected_biases[:2]]
        recommendations.append(
            f"Pay more attention to: {', '.join(criteria_names)}. "
            f"These factors may be more important than you realize."
        )
    
    # General recommendations
    if len(biases) >= 3:
        recommendations.append(
            "You show multiple decision-making patterns. "
            "Try using the Sensitivity Analysis feature to test how different priorities affect outcomes."
        )
    
    if not recommendations:
        recommendations.append(
            "Your decision-making shows good balance. "
            "Continue to evaluate decisions across diverse criteria."
        )
    
    return recommendations


def calculate_bias_score(criteria_analysis: Dict[str, Any]) -> float:
    """
    Calculate an overall bias score (0-100).
    Higher score = more biased decision-making.
    """
    if not criteria_analysis:
        return 0.0
    
    bias_factors = []
    
    for name, stats in criteria_analysis.items():
        # Factor 1: Frequency dominance
        freq_factor = min(stats["frequency_pct"] / 100, 1.0)
        
        # Factor 2: Weight dominance
        weight_factor = min(stats["avg_weight"] / 50, 1.0)
        
        # Factor 3: Top priority dominance
        priority_factor = min(stats["top_priority_pct"] / 100, 1.0)
        
        # Combined bias score for this criterion
        criterion_bias = (freq_factor + weight_factor + priority_factor) / 3
        bias_factors.append(criterion_bias)
    
    # Overall bias = max individual bias (most biased criterion drives score)
    overall_bias = max(bias_factors) * 100 if bias_factors else 0
    
    return round(overall_bias, 1)
