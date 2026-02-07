"""
Automated Disruption Engine

Generates disruption events AUTOMATICALLY based on:
- Restaurant location
- Weather conditions
- Traffic congestion
- Local events
- News affecting supply chains, labor, fuel, or alcohol

⚠️ Users are NEVER allowed to simulate disruptions manually.
All disruptions are system-generated only.
"""

from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta
import random
import math
import hashlib


# Real-world disruption patterns keyed by region
REGIONAL_WEATHER_PATTERNS = {
    "southeast_us": {
        "winter": [
            {"type": "ice_storm", "probability": 0.15, "severity": "high", "impact": {"weather_risk": 0.7, "traffic_risk": 0.8, "delivery_delay_hrs": 12}},
            {"type": "cold_snap", "probability": 0.25, "severity": "moderate", "impact": {"weather_risk": 0.4, "delivery_delay_hrs": 4}},
        ],
        "spring": [
            {"type": "severe_thunderstorms", "probability": 0.35, "severity": "moderate", "impact": {"weather_risk": 0.5, "traffic_risk": 0.4, "delivery_delay_hrs": 6}},
            {"type": "tornado_watch", "probability": 0.08, "severity": "critical", "impact": {"weather_risk": 0.9, "traffic_risk": 0.7, "hazard_flag": True, "delivery_delay_hrs": 24}},
        ],
        "summer": [
            {"type": "heat_wave", "probability": 0.40, "severity": "moderate", "impact": {"weather_risk": 0.3, "spoilage_risk": 0.4, "delivery_delay_hrs": 2}},
            {"type": "tropical_storm", "probability": 0.12, "severity": "critical", "impact": {"weather_risk": 0.85, "traffic_risk": 0.8, "hazard_flag": True, "delivery_delay_hrs": 48}},
        ],
        "fall": [
            {"type": "hurricane_season", "probability": 0.10, "severity": "critical", "impact": {"weather_risk": 0.95, "traffic_risk": 0.9, "hazard_flag": True, "delivery_delay_hrs": 72}},
            {"type": "early_frost", "probability": 0.15, "severity": "low", "impact": {"weather_risk": 0.2, "produce_risk": 0.3}},
        ],
    },
    "northeast_us": {
        "winter": [
            {"type": "noreaster", "probability": 0.20, "severity": "high", "impact": {"weather_risk": 0.8, "traffic_risk": 0.9, "delivery_delay_hrs": 24}},
            {"type": "blizzard", "probability": 0.10, "severity": "critical", "impact": {"weather_risk": 0.95, "traffic_risk": 0.95, "hazard_flag": True, "delivery_delay_hrs": 48}},
        ],
        "spring": [
            {"type": "flooding", "probability": 0.20, "severity": "high", "impact": {"weather_risk": 0.6, "traffic_risk": 0.7, "delivery_delay_hrs": 12}},
        ],
        "summer": [
            {"type": "heat_dome", "probability": 0.25, "severity": "moderate", "impact": {"weather_risk": 0.3, "spoilage_risk": 0.5, "delivery_delay_hrs": 2}},
        ],
        "fall": [
            {"type": "early_snowfall", "probability": 0.15, "severity": "moderate", "impact": {"weather_risk": 0.5, "traffic_risk": 0.4, "delivery_delay_hrs": 6}},
        ],
    },
    "midwest_us": {
        "winter": [
            {"type": "polar_vortex", "probability": 0.15, "severity": "critical", "impact": {"weather_risk": 0.9, "traffic_risk": 0.8, "delivery_delay_hrs": 36}},
        ],
        "spring": [
            {"type": "tornado_alley_activity", "probability": 0.20, "severity": "critical", "impact": {"weather_risk": 0.85, "hazard_flag": True, "delivery_delay_hrs": 24}},
        ],
        "summer": [
            {"type": "severe_storms", "probability": 0.30, "severity": "moderate", "impact": {"weather_risk": 0.5, "traffic_risk": 0.3, "delivery_delay_hrs": 4}},
        ],
        "fall": [
            {"type": "harvest_season_delays", "probability": 0.25, "severity": "low", "impact": {"produce_risk": 0.3, "cost_modifier": 1.08}},
        ],
    },
    "west_coast_us": {
        "winter": [
            {"type": "atmospheric_river", "probability": 0.25, "severity": "high", "impact": {"weather_risk": 0.7, "traffic_risk": 0.6, "delivery_delay_hrs": 18}},
        ],
        "spring": [
            {"type": "mudslides", "probability": 0.10, "severity": "high", "impact": {"traffic_risk": 0.8, "delivery_delay_hrs": 36}},
        ],
        "summer": [
            {"type": "wildfire_smoke", "probability": 0.30, "severity": "high", "impact": {"weather_risk": 0.6, "delivery_delay_hrs": 12, "hazard_flag": True}},
        ],
        "fall": [
            {"type": "santa_ana_winds", "probability": 0.20, "severity": "moderate", "impact": {"weather_risk": 0.4, "delivery_delay_hrs": 6}},
        ],
    },
}

# Supply chain disruptions — global, affects all restaurants
SUPPLY_CHAIN_DISRUPTIONS = [
    {"type": "port_congestion", "probability": 0.05, "severity": "high", "categories_affected": ["seafood", "dry_goods", "beverages"],
     "impact": {"delivery_delay_hrs": 72, "cost_modifier": 1.15, "affected_suppliers": "importers"}},
    {"type": "fuel_price_spike", "probability": 0.10, "severity": "moderate", "categories_affected": ["all"],
     "impact": {"cost_modifier": 1.12, "delivery_delay_hrs": 4}},
    {"type": "produce_recall", "probability": 0.03, "severity": "critical", "categories_affected": ["produce"],
     "impact": {"ingredient_unavailable": True, "delivery_delay_hrs": 168}},
    {"type": "meat_processing_disruption", "probability": 0.04, "severity": "high", "categories_affected": ["meat"],
     "impact": {"cost_modifier": 1.20, "delivery_delay_hrs": 48}},
    {"type": "alcohol_distribution_delay", "probability": 0.06, "severity": "moderate", "categories_affected": ["beverages"],
     "impact": {"delivery_delay_hrs": 72, "cost_modifier": 1.05}},
    {"type": "packaging_shortage", "probability": 0.08, "severity": "low", "categories_affected": ["packaging"],
     "impact": {"delivery_delay_hrs": 24, "cost_modifier": 1.10}},
    {"type": "labor_shortage", "probability": 0.12, "severity": "moderate", "categories_affected": ["all"],
     "impact": {"delivery_delay_hrs": 12, "cost_modifier": 1.08}},
    {"type": "trucking_strike", "probability": 0.02, "severity": "critical", "categories_affected": ["all"],
     "impact": {"delivery_delay_hrs": 120, "cost_modifier": 1.25}},
]

# Local event patterns
LOCAL_EVENT_PATTERNS = [
    {"type": "college_football", "probability": 0.15, "demand_modifier": 1.35, "traffic_risk": 0.4, "days": ["Saturday"]},
    {"type": "nfl_game", "probability": 0.10, "demand_modifier": 1.45, "traffic_risk": 0.5, "days": ["Sunday"]},
    {"type": "concert_nearby", "probability": 0.08, "demand_modifier": 1.25, "traffic_risk": 0.3},
    {"type": "convention", "probability": 0.05, "demand_modifier": 1.30, "traffic_risk": 0.2, "duration_days": 3},
    {"type": "marathon", "probability": 0.03, "demand_modifier": 0.85, "traffic_risk": 0.7},
    {"type": "street_festival", "probability": 0.06, "demand_modifier": 1.20, "traffic_risk": 0.5},
    {"type": "graduation_weekend", "probability": 0.04, "demand_modifier": 1.60, "traffic_risk": 0.6, "seasonal": "spring"},
]


def _get_season(date: Optional[datetime] = None) -> str:
    """Get season from date"""
    date = date or datetime.now()
    month = date.month
    if month in (12, 1, 2):
        return "winter"
    elif month in (3, 4, 5):
        return "spring"
    elif month in (6, 7, 8):
        return "summer"
    else:
        return "fall"


def _deterministic_seed(restaurant_id: str, date: datetime) -> int:
    """Generate a deterministic seed so the same restaurant on the same day gets the same disruptions"""
    key = f"{restaurant_id}:{date.strftime('%Y-%m-%d')}"
    return int(hashlib.md5(key.encode()).hexdigest()[:8], 16)


class AutomatedDisruptionEngine:
    """
    Generates disruptions automatically. Never user-triggered.

    Uses restaurant location, date, and seasonal patterns to produce
    realistic disruption events.
    """

    def __init__(self, restaurant_id: str, location: str = "Athens, GA", region: str = "southeast_us"):
        self.restaurant_id = restaurant_id
        self.location = location
        self.region = region

    def generate_disruptions(self, date: Optional[datetime] = None) -> List[Dict[str, Any]]:
        """
        Auto-generate disruption events for the given date.
        Deterministic per restaurant per day — same inputs = same output.
        """
        date = date or datetime.now()
        seed = _deterministic_seed(self.restaurant_id, date)
        rng = random.Random(seed)
        season = _get_season(date)

        disruptions = []

        # 1. Weather disruptions by region + season
        regional = REGIONAL_WEATHER_PATTERNS.get(self.region, REGIONAL_WEATHER_PATTERNS["southeast_us"])
        season_weather = regional.get(season, [])
        for pattern in season_weather:
            if rng.random() < pattern["probability"]:
                disruptions.append({
                    "id": f"auto-weather-{seed}-{pattern['type']}",
                    "disruption_type": "weather",
                    "source": "auto_simulation",
                    "title": pattern["type"].replace("_", " ").title(),
                    "description": f"Automated weather disruption: {pattern['type'].replace('_', ' ')} detected for {self.location}",
                    "severity": pattern["severity"],
                    "impact_data": pattern["impact"],
                    "location_context": {"city": self.location, "region": self.region},
                    "started_at": date.isoformat(),
                    "auto_generated": True,
                })

        # 2. Supply chain disruptions (global)
        for sc in SUPPLY_CHAIN_DISRUPTIONS:
            if rng.random() < sc["probability"]:
                disruptions.append({
                    "id": f"auto-supply-{seed}-{sc['type']}",
                    "disruption_type": "supply_chain",
                    "source": "auto_simulation",
                    "title": sc["type"].replace("_", " ").title(),
                    "description": f"Supply chain disruption: {sc['type'].replace('_', ' ')}. Affects: {', '.join(sc['categories_affected'])}",
                    "severity": sc["severity"],
                    "impact_data": {**sc["impact"], "categories_affected": sc["categories_affected"]},
                    "location_context": {"scope": "national"},
                    "started_at": date.isoformat(),
                    "auto_generated": True,
                })

        # 3. Local events
        day_name = date.strftime("%A")
        for evt in LOCAL_EVENT_PATTERNS:
            if evt.get("days") and day_name not in evt["days"]:
                continue
            if evt.get("seasonal") and evt["seasonal"] != season:
                continue
            if rng.random() < evt["probability"]:
                disruptions.append({
                    "id": f"auto-local-{seed}-{evt['type']}",
                    "disruption_type": "local_event",
                    "source": "auto_simulation",
                    "title": evt["type"].replace("_", " ").title(),
                    "description": f"Local event near {self.location}: {evt['type'].replace('_', ' ')}",
                    "severity": "moderate",
                    "impact_data": {
                        "demand_modifier": evt["demand_modifier"],
                        "traffic_risk": evt.get("traffic_risk", 0),
                    },
                    "location_context": {"city": self.location, "region": self.region},
                    "started_at": date.isoformat(),
                    "auto_generated": True,
                })

        return disruptions

    def compute_aggregate_impact(self, disruptions: Optional[List[Dict[str, Any]]] = None) -> Dict[str, Any]:
        """Aggregate all active disruptions into a single impact summary"""
        disruptions = disruptions or self.generate_disruptions()

        weather_risk = 0.0
        traffic_risk = 0.0
        hazard_flag = False
        demand_modifier = 1.0
        delivery_delay_hrs = 0
        cost_modifier = 1.0
        spoilage_risk = 0.0
        affected_categories = set()

        for d in disruptions:
            impact = d.get("impact_data", {})
            weather_risk = max(weather_risk, impact.get("weather_risk", 0))
            traffic_risk = max(traffic_risk, impact.get("traffic_risk", 0))
            hazard_flag = hazard_flag or impact.get("hazard_flag", False)
            demand_modifier *= impact.get("demand_modifier", 1.0)
            delivery_delay_hrs = max(delivery_delay_hrs, impact.get("delivery_delay_hrs", 0))
            cost_modifier = max(cost_modifier, impact.get("cost_modifier", 1.0))
            spoilage_risk = max(spoilage_risk, impact.get("spoilage_risk", 0))
            for cat in impact.get("categories_affected", []):
                affected_categories.add(cat)

        overall_severity = "low"
        score = weather_risk * 0.3 + traffic_risk * 0.2 + (1 if hazard_flag else 0) * 0.3 + (cost_modifier - 1) * 2
        if score > 0.7:
            overall_severity = "critical"
        elif score > 0.4:
            overall_severity = "high"
        elif score > 0.2:
            overall_severity = "moderate"

        return {
            "weather_risk": round(weather_risk, 2),
            "traffic_risk": round(traffic_risk, 2),
            "hazard_flag": hazard_flag,
            "demand_modifier": round(demand_modifier, 2),
            "delivery_delay_hrs": delivery_delay_hrs,
            "cost_modifier": round(cost_modifier, 2),
            "spoilage_risk": round(spoilage_risk, 2),
            "affected_categories": list(affected_categories),
            "overall_severity": overall_severity,
            "active_disruptions": len(disruptions),
            "disruption_titles": [d["title"] for d in disruptions],
        }

    def get_ingredient_risk_assessment(
        self,
        ingredients: List[Dict[str, Any]],
        disruptions: Optional[List[Dict[str, Any]]] = None,
    ) -> List[Dict[str, Any]]:
        """
        Assess risk per ingredient based on active disruptions.

        Returns:
            List of { ingredient, risk_level, risk_factors, suggested_substitutions, delivery_delay, cost_impact }
        """
        disruptions = disruptions or self.generate_disruptions()
        impact = self.compute_aggregate_impact(disruptions)

        assessments = []
        for ing in ingredients:
            category = ing.get("category", "").lower()
            risk_factors = []
            risk_score = 0

            # Category-specific risk
            if "all" in impact["affected_categories"] or category in impact["affected_categories"]:
                risk_factors.append(f"Supply chain disruption affecting {category}")
                risk_score += 0.3

            # Weather risk on perishables
            if ing.get("is_perishable") and impact["spoilage_risk"] > 0.2:
                risk_factors.append(f"Spoilage risk elevated ({impact['spoilage_risk']:.0%}) due to weather")
                risk_score += impact["spoilage_risk"] * 0.5

            # Delivery delay impact
            if impact["delivery_delay_hrs"] > 0:
                delay_days = impact["delivery_delay_hrs"] / 24
                days_of_cover = ing.get("days_of_cover", 7)
                if delay_days > days_of_cover * 0.5:
                    risk_factors.append(f"Delivery delay ({delay_days:.0f}d) exceeds half of coverage ({days_of_cover}d)")
                    risk_score += 0.4

            # Hazard flag
            if impact["hazard_flag"]:
                risk_factors.append("Active hazard alert — deliveries may be suspended")
                risk_score += 0.3

            # Cost impact
            cost_impact = (impact["cost_modifier"] - 1) * 100
            if cost_impact > 5:
                risk_factors.append(f"Cost increase estimated at +{cost_impact:.0f}%")

            # Risk level
            if risk_score > 0.6:
                risk_level = "CRITICAL"
            elif risk_score > 0.3:
                risk_level = "HIGH"
            elif risk_score > 0.1:
                risk_level = "MODERATE"
            else:
                risk_level = "LOW"

            assessments.append({
                "ingredient": ing.get("name", "Unknown"),
                "ingredient_id": ing.get("id"),
                "category": category,
                "risk_level": risk_level,
                "risk_score": round(risk_score, 2),
                "risk_factors": risk_factors,
                "delivery_delay_hrs": impact["delivery_delay_hrs"],
                "cost_impact_pct": round(cost_impact, 1),
            })

        return sorted(assessments, key=lambda x: -x["risk_score"])

    def get_menu_impact_analysis(
        self,
        dishes: List[Dict[str, Any]],
        ingredient_risks: List[Dict[str, Any]],
    ) -> List[Dict[str, Any]]:
        """
        Analyze how disruptions affect the menu.

        Returns dishes that may be impacted, with affected ingredients and recommendations.
        """
        # Build ingredient risk lookup
        risk_map = {r["ingredient"]: r for r in ingredient_risks}

        menu_impacts = []
        for dish in dishes:
            affected_ingredients = []
            max_risk = "LOW"
            risk_order = {"LOW": 0, "MODERATE": 1, "HIGH": 2, "CRITICAL": 3}

            for recipe_item in dish.get("recipe", []):
                ing_name = recipe_item.get("ingredient_name", "")
                if ing_name in risk_map and risk_map[ing_name]["risk_level"] in ("HIGH", "CRITICAL"):
                    affected_ingredients.append({
                        "name": ing_name,
                        "risk_level": risk_map[ing_name]["risk_level"],
                        "factors": risk_map[ing_name]["risk_factors"],
                    })
                    if risk_order.get(risk_map[ing_name]["risk_level"], 0) > risk_order.get(max_risk, 0):
                        max_risk = risk_map[ing_name]["risk_level"]

            if affected_ingredients:
                menu_impacts.append({
                    "dish": dish.get("name"),
                    "dish_id": dish.get("id"),
                    "max_risk": max_risk,
                    "affected_ingredients": affected_ingredients,
                    "recommendation": "Consider removing from specials" if max_risk == "CRITICAL" else "Monitor closely",
                })

        return sorted(menu_impacts, key=lambda x: -{"LOW": 0, "MODERATE": 1, "HIGH": 2, "CRITICAL": 3}.get(x["max_risk"], 0))
