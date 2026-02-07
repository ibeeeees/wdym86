"""
Automated Disruption Engine

Generates disruption events AUTOMATICALLY based on:
- Restaurant location
- Weather conditions
- Traffic congestion
- Local events
- News affecting supply chains, labor, fuel, or alcohol

Users are NEVER allowed to simulate disruptions manually.
All disruptions are system-generated only.
"""

from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta
import random
import math
import hashlib


# ---------------------------------------------------------------------------
# Location Registry — maps known cities to their regions and metadata
# ---------------------------------------------------------------------------
LOCATION_REGISTRY: Dict[str, Dict[str, Any]] = {
    "Athens, GA": {
        "region": "southeast_us",
        "state": "GA",
        "nickname": "Classic City",
        "nearby_metro": "Atlanta",
        "climate_zone": "humid_subtropical",
    },
    "San Francisco, CA": {
        "region": "west_coast_us",
        "state": "CA",
        "nickname": "The City by the Bay",
        "nearby_metro": "San Jose",
        "climate_zone": "mediterranean",
    },
    "Austin, TX": {
        "region": "south_central_us",
        "state": "TX",
        "nickname": "Live Music Capital",
        "nearby_metro": "San Antonio",
        "climate_zone": "humid_subtropical",
    },
    "Chicago, IL": {
        "region": "midwest_us",
        "state": "IL",
        "nickname": "Windy City",
        "nearby_metro": "Milwaukee",
        "climate_zone": "humid_continental",
    },
    "New York, NY": {
        "region": "northeast_us",
        "state": "NY",
        "nickname": "The Big Apple",
        "nearby_metro": "Newark",
        "climate_zone": "humid_subtropical",
    },
    "Nashville, TN": {
        "region": "mid_south_us",
        "state": "TN",
        "nickname": "Music City",
        "nearby_metro": "Memphis",
        "climate_zone": "humid_subtropical",
    },
}


def lookup_location(location: str) -> Dict[str, Any]:
    """
    Look up a location in the registry.
    Returns registry entry if found, otherwise returns a sensible default
    (southeast_us, matching the original Athens, GA behavior).
    """
    if location in LOCATION_REGISTRY:
        return LOCATION_REGISTRY[location]

    # Fuzzy match on city name
    loc_lower = location.lower()
    for key, entry in LOCATION_REGISTRY.items():
        if key.lower().split(",")[0] in loc_lower:
            return entry

    # Default fallback — southeast (Athens, GA legacy behavior)
    return {
        "region": "southeast_us",
        "state": "Unknown",
        "nickname": "",
        "nearby_metro": "",
        "climate_zone": "humid_subtropical",
    }


# ---------------------------------------------------------------------------
# Real-world disruption patterns keyed by region
# ---------------------------------------------------------------------------
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
            {"type": "coastal_fog", "probability": 0.15, "severity": "low", "impact": {"weather_risk": 0.2, "traffic_risk": 0.3, "delivery_delay_hrs": 2}},
        ],
        "summer": [
            {"type": "heat_dome", "probability": 0.25, "severity": "moderate", "impact": {"weather_risk": 0.3, "spoilage_risk": 0.5, "delivery_delay_hrs": 2}},
            {"type": "severe_thunderstorms", "probability": 0.20, "severity": "moderate", "impact": {"weather_risk": 0.4, "traffic_risk": 0.3, "delivery_delay_hrs": 4}},
        ],
        "fall": [
            {"type": "early_snowfall", "probability": 0.15, "severity": "moderate", "impact": {"weather_risk": 0.5, "traffic_risk": 0.4, "delivery_delay_hrs": 6}},
            {"type": "noreaster", "probability": 0.10, "severity": "high", "impact": {"weather_risk": 0.7, "traffic_risk": 0.8, "delivery_delay_hrs": 18}},
        ],
    },
    "midwest_us": {
        "winter": [
            {"type": "polar_vortex", "probability": 0.15, "severity": "critical", "impact": {"weather_risk": 0.9, "traffic_risk": 0.8, "delivery_delay_hrs": 36}},
            {"type": "blizzard", "probability": 0.18, "severity": "critical", "impact": {"weather_risk": 0.85, "traffic_risk": 0.9, "hazard_flag": True, "delivery_delay_hrs": 48}},
            {"type": "lake_effect_snow", "probability": 0.25, "severity": "high", "impact": {"weather_risk": 0.7, "traffic_risk": 0.75, "delivery_delay_hrs": 18}},
        ],
        "spring": [
            {"type": "tornado_alley_activity", "probability": 0.20, "severity": "critical", "impact": {"weather_risk": 0.85, "hazard_flag": True, "delivery_delay_hrs": 24}},
            {"type": "severe_flooding", "probability": 0.15, "severity": "high", "impact": {"weather_risk": 0.6, "traffic_risk": 0.7, "delivery_delay_hrs": 18}},
        ],
        "summer": [
            {"type": "severe_storms", "probability": 0.30, "severity": "moderate", "impact": {"weather_risk": 0.5, "traffic_risk": 0.3, "delivery_delay_hrs": 4}},
            {"type": "extreme_wind", "probability": 0.12, "severity": "moderate", "impact": {"weather_risk": 0.4, "traffic_risk": 0.3, "delivery_delay_hrs": 6}},
        ],
        "fall": [
            {"type": "harvest_season_delays", "probability": 0.25, "severity": "low", "impact": {"produce_risk": 0.3, "cost_modifier": 1.08}},
            {"type": "early_freeze", "probability": 0.12, "severity": "moderate", "impact": {"weather_risk": 0.4, "produce_risk": 0.4, "delivery_delay_hrs": 6}},
        ],
    },
    "west_coast_us": {
        "winter": [
            {"type": "atmospheric_river", "probability": 0.25, "severity": "high", "impact": {"weather_risk": 0.7, "traffic_risk": 0.6, "delivery_delay_hrs": 18}},
            {"type": "dense_fog", "probability": 0.20, "severity": "moderate", "impact": {"weather_risk": 0.3, "traffic_risk": 0.5, "delivery_delay_hrs": 6}},
        ],
        "spring": [
            {"type": "mudslides", "probability": 0.10, "severity": "high", "impact": {"traffic_risk": 0.8, "delivery_delay_hrs": 36}},
            {"type": "earthquake_tremor", "probability": 0.04, "severity": "critical", "impact": {"weather_risk": 0.5, "traffic_risk": 0.6, "hazard_flag": True, "delivery_delay_hrs": 24}},
        ],
        "summer": [
            {"type": "wildfire_smoke", "probability": 0.30, "severity": "high", "impact": {"weather_risk": 0.6, "delivery_delay_hrs": 12, "hazard_flag": True}},
            {"type": "drought_conditions", "probability": 0.20, "severity": "moderate", "impact": {"weather_risk": 0.3, "produce_risk": 0.4, "cost_modifier": 1.10}},
        ],
        "fall": [
            {"type": "santa_ana_winds", "probability": 0.20, "severity": "moderate", "impact": {"weather_risk": 0.4, "delivery_delay_hrs": 6}},
            {"type": "wildfire_season", "probability": 0.15, "severity": "high", "impact": {"weather_risk": 0.6, "traffic_risk": 0.5, "hazard_flag": True, "delivery_delay_hrs": 18}},
        ],
    },
    "south_central_us": {
        "winter": [
            {"type": "ice_storm", "probability": 0.12, "severity": "high", "impact": {"weather_risk": 0.7, "traffic_risk": 0.8, "delivery_delay_hrs": 18}},
            {"type": "hard_freeze", "probability": 0.08, "severity": "critical", "impact": {"weather_risk": 0.8, "traffic_risk": 0.7, "hazard_flag": True, "delivery_delay_hrs": 36, "produce_risk": 0.5}},
        ],
        "spring": [
            {"type": "severe_thunderstorms", "probability": 0.30, "severity": "moderate", "impact": {"weather_risk": 0.5, "traffic_risk": 0.4, "delivery_delay_hrs": 6}},
            {"type": "flash_flooding", "probability": 0.18, "severity": "high", "impact": {"weather_risk": 0.7, "traffic_risk": 0.8, "hazard_flag": True, "delivery_delay_hrs": 24}},
            {"type": "tornado_watch", "probability": 0.10, "severity": "critical", "impact": {"weather_risk": 0.9, "traffic_risk": 0.7, "hazard_flag": True, "delivery_delay_hrs": 24}},
        ],
        "summer": [
            {"type": "extreme_heat", "probability": 0.45, "severity": "moderate", "impact": {"weather_risk": 0.4, "spoilage_risk": 0.5, "delivery_delay_hrs": 4}},
            {"type": "drought", "probability": 0.20, "severity": "moderate", "impact": {"weather_risk": 0.3, "produce_risk": 0.4, "cost_modifier": 1.12}},
        ],
        "fall": [
            {"type": "lingering_heat", "probability": 0.25, "severity": "low", "impact": {"weather_risk": 0.2, "spoilage_risk": 0.3, "delivery_delay_hrs": 2}},
            {"type": "early_cold_front", "probability": 0.15, "severity": "moderate", "impact": {"weather_risk": 0.3, "delivery_delay_hrs": 4}},
        ],
    },
    "mid_south_us": {
        "winter": [
            {"type": "ice_storm", "probability": 0.18, "severity": "high", "impact": {"weather_risk": 0.75, "traffic_risk": 0.85, "delivery_delay_hrs": 24}},
            {"type": "freezing_rain", "probability": 0.15, "severity": "moderate", "impact": {"weather_risk": 0.5, "traffic_risk": 0.6, "delivery_delay_hrs": 8}},
        ],
        "spring": [
            {"type": "tornado_outbreak", "probability": 0.15, "severity": "critical", "impact": {"weather_risk": 0.9, "traffic_risk": 0.8, "hazard_flag": True, "delivery_delay_hrs": 36}},
            {"type": "severe_thunderstorms", "probability": 0.30, "severity": "moderate", "impact": {"weather_risk": 0.5, "traffic_risk": 0.4, "delivery_delay_hrs": 6}},
            {"type": "river_flooding", "probability": 0.12, "severity": "high", "impact": {"weather_risk": 0.6, "traffic_risk": 0.7, "delivery_delay_hrs": 18}},
        ],
        "summer": [
            {"type": "heat_wave", "probability": 0.35, "severity": "moderate", "impact": {"weather_risk": 0.3, "spoilage_risk": 0.4, "delivery_delay_hrs": 2}},
            {"type": "severe_storms", "probability": 0.20, "severity": "moderate", "impact": {"weather_risk": 0.4, "traffic_risk": 0.3, "delivery_delay_hrs": 4}},
        ],
        "fall": [
            {"type": "late_season_tornado", "probability": 0.08, "severity": "critical", "impact": {"weather_risk": 0.85, "traffic_risk": 0.7, "hazard_flag": True, "delivery_delay_hrs": 24}},
            {"type": "early_frost", "probability": 0.15, "severity": "low", "impact": {"weather_risk": 0.2, "produce_risk": 0.3}},
        ],
    },
}

# Supply chain disruptions -- global, affects all restaurants
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

# ---------------------------------------------------------------------------
# Generic local event patterns (fallback for unknown locations)
# ---------------------------------------------------------------------------
LOCAL_EVENT_PATTERNS = [
    {"type": "college_football", "probability": 0.15, "demand_modifier": 1.35, "traffic_risk": 0.4, "days": ["Saturday"]},
    {"type": "nfl_game", "probability": 0.10, "demand_modifier": 1.45, "traffic_risk": 0.5, "days": ["Sunday"]},
    {"type": "concert_nearby", "probability": 0.08, "demand_modifier": 1.25, "traffic_risk": 0.3},
    {"type": "convention", "probability": 0.05, "demand_modifier": 1.30, "traffic_risk": 0.2, "duration_days": 3},
    {"type": "marathon", "probability": 0.03, "demand_modifier": 0.85, "traffic_risk": 0.7},
    {"type": "street_festival", "probability": 0.06, "demand_modifier": 1.20, "traffic_risk": 0.5},
    {"type": "graduation_weekend", "probability": 0.04, "demand_modifier": 1.60, "traffic_risk": 0.6, "seasonal": "spring"},
]


# ---------------------------------------------------------------------------
# Regional event patterns — location-specific events for each region
# ---------------------------------------------------------------------------
REGIONAL_EVENT_PATTERNS: Dict[str, List[Dict[str, Any]]] = {
    "southeast_us": [
        {"type": "uga_football_gameday", "probability": 0.18, "demand_modifier": 1.50, "traffic_risk": 0.6, "days": ["Saturday"], "seasonal_months": [9, 10, 11]},
        {"type": "uga_graduation", "probability": 0.06, "demand_modifier": 1.70, "traffic_risk": 0.7, "seasonal": "spring"},
        {"type": "athens_music_festival", "probability": 0.05, "demand_modifier": 1.30, "traffic_risk": 0.4},
        {"type": "sec_championship_weekend", "probability": 0.04, "demand_modifier": 1.40, "traffic_risk": 0.3, "seasonal_months": [12]},
        {"type": "college_football", "probability": 0.12, "demand_modifier": 1.35, "traffic_risk": 0.4, "days": ["Saturday"]},
        {"type": "sweet_tea_festival", "probability": 0.03, "demand_modifier": 1.15, "traffic_risk": 0.2, "seasonal": "summer"},
    ],
    "west_coast_us": [
        {"type": "tech_conference", "probability": 0.10, "demand_modifier": 1.40, "traffic_risk": 0.4, "duration_days": 4},
        {"type": "sf_pride_weekend", "probability": 0.05, "demand_modifier": 1.50, "traffic_risk": 0.6, "seasonal": "summer"},
        {"type": "fleet_week", "probability": 0.04, "demand_modifier": 1.35, "traffic_risk": 0.5, "seasonal_months": [10]},
        {"type": "outside_lands_festival", "probability": 0.04, "demand_modifier": 1.45, "traffic_risk": 0.5, "seasonal": "summer"},
        {"type": "bay_to_breakers", "probability": 0.03, "demand_modifier": 0.80, "traffic_risk": 0.7, "seasonal": "spring"},
        {"type": "earthquake_preparedness_drill", "probability": 0.02, "demand_modifier": 0.90, "traffic_risk": 0.4},
        {"type": "farmers_market_season", "probability": 0.15, "demand_modifier": 1.10, "traffic_risk": 0.2, "days": ["Saturday", "Sunday"]},
    ],
    "south_central_us": [
        {"type": "sxsw_festival", "probability": 0.06, "demand_modifier": 1.70, "traffic_risk": 0.7, "seasonal": "spring", "duration_days": 10},
        {"type": "acl_music_festival", "probability": 0.05, "demand_modifier": 1.60, "traffic_risk": 0.6, "seasonal": "fall", "duration_days": 6},
        {"type": "ut_longhorns_gameday", "probability": 0.15, "demand_modifier": 1.45, "traffic_risk": 0.5, "days": ["Saturday"], "seasonal_months": [9, 10, 11]},
        {"type": "texas_state_fair", "probability": 0.04, "demand_modifier": 1.30, "traffic_risk": 0.3, "seasonal": "fall"},
        {"type": "rodeo_weekend", "probability": 0.06, "demand_modifier": 1.25, "traffic_risk": 0.4},
        {"type": "food_truck_rally", "probability": 0.08, "demand_modifier": 0.90, "traffic_risk": 0.3},
        {"type": "brisket_cookoff", "probability": 0.04, "demand_modifier": 1.20, "traffic_risk": 0.2, "seasonal": "summer"},
    ],
    "midwest_us": [
        {"type": "bears_gameday", "probability": 0.12, "demand_modifier": 1.50, "traffic_risk": 0.6, "days": ["Sunday"], "seasonal_months": [9, 10, 11, 12, 1]},
        {"type": "cubs_white_sox_game", "probability": 0.15, "demand_modifier": 1.30, "traffic_risk": 0.4, "seasonal": "summer"},
        {"type": "lollapalooza", "probability": 0.04, "demand_modifier": 1.55, "traffic_risk": 0.6, "seasonal": "summer", "duration_days": 4},
        {"type": "chicago_marathon", "probability": 0.03, "demand_modifier": 0.80, "traffic_risk": 0.8, "seasonal": "fall"},
        {"type": "auto_show", "probability": 0.03, "demand_modifier": 1.25, "traffic_risk": 0.3, "seasonal": "winter", "duration_days": 5},
        {"type": "taste_of_chicago", "probability": 0.04, "demand_modifier": 0.85, "traffic_risk": 0.5, "seasonal": "summer"},
        {"type": "lake_effect_advisory", "probability": 0.10, "demand_modifier": 0.90, "traffic_risk": 0.5, "seasonal": "winter"},
    ],
    "northeast_us": [
        {"type": "broadway_opening_night", "probability": 0.08, "demand_modifier": 1.30, "traffic_risk": 0.3},
        {"type": "nyc_marathon", "probability": 0.03, "demand_modifier": 0.80, "traffic_risk": 0.8, "seasonal_months": [11]},
        {"type": "subway_disruption", "probability": 0.12, "demand_modifier": 0.85, "traffic_risk": 0.6},
        {"type": "times_square_event", "probability": 0.06, "demand_modifier": 1.40, "traffic_risk": 0.5},
        {"type": "restaurant_week", "probability": 0.05, "demand_modifier": 1.55, "traffic_risk": 0.2, "duration_days": 14},
        {"type": "yankees_mets_game", "probability": 0.15, "demand_modifier": 1.35, "traffic_risk": 0.4, "seasonal": "summer"},
        {"type": "new_years_eve_prep", "probability": 0.04, "demand_modifier": 1.80, "traffic_risk": 0.7, "seasonal_months": [12]},
        {"type": "fashion_week", "probability": 0.03, "demand_modifier": 1.35, "traffic_risk": 0.3, "seasonal_months": [2, 9]},
    ],
    "mid_south_us": [
        {"type": "cma_fest", "probability": 0.05, "demand_modifier": 1.65, "traffic_risk": 0.6, "seasonal": "summer", "duration_days": 4},
        {"type": "honky_tonk_weekend", "probability": 0.12, "demand_modifier": 1.30, "traffic_risk": 0.4, "days": ["Friday", "Saturday"]},
        {"type": "titans_gameday", "probability": 0.12, "demand_modifier": 1.45, "traffic_risk": 0.5, "days": ["Sunday"], "seasonal_months": [9, 10, 11, 12, 1]},
        {"type": "nashville_hot_chicken_festival", "probability": 0.03, "demand_modifier": 1.35, "traffic_risk": 0.4, "seasonal": "summer"},
        {"type": "country_music_awards", "probability": 0.03, "demand_modifier": 1.50, "traffic_risk": 0.5, "seasonal_months": [11]},
        {"type": "bonnaroo_weekend", "probability": 0.04, "demand_modifier": 1.20, "traffic_risk": 0.3, "seasonal": "summer"},
        {"type": "predators_hockey_game", "probability": 0.10, "demand_modifier": 1.25, "traffic_risk": 0.3, "seasonal_months": [10, 11, 12, 1, 2, 3, 4]},
        {"type": "grand_ole_opry_night", "probability": 0.15, "demand_modifier": 1.15, "traffic_risk": 0.2, "days": ["Friday", "Saturday"]},
    ],
}


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

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


def infer_region(location: str) -> str:
    """
    Infer US region from a location string.

    First checks the LOCATION_REGISTRY for exact/fuzzy matches,
    then falls back to keyword-based inference.
    Returns a key that matches REGIONAL_WEATHER_PATTERNS (e.g. 'southeast_us').
    """
    if not location:
        return "southeast_us"

    # Check registry first
    entry = lookup_location(location)
    if entry.get("region"):
        return entry["region"]

    # Keyword fallback
    loc = location.lower()

    northeast = ["new york", "boston", "philadelphia", "dc", "baltimore", "connecticut",
                 "new jersey", "maine", "vermont", "manhattan", "brooklyn", "queens"]
    midwest = ["chicago", "detroit", "cleveland", "minneapolis", "st louis", "kansas city",
               "columbus", "indianapolis", "milwaukee", "des moines", "omaha"]
    west_coast = ["los angeles", "san francisco", "seattle", "portland", "denver", "phoenix",
                  "las vegas", "san diego", "sacramento", "oakland", "san jose"]
    south_central = ["austin", "dallas", "houston", "san antonio", "fort worth",
                     "el paso", "oklahoma", "tulsa", "little rock"]
    mid_south = ["nashville", "memphis", "knoxville", "chattanooga", "louisville",
                 "lexington", "birmingham", "huntsville"]

    for term in northeast:
        if term in loc:
            return "northeast_us"
    for term in midwest:
        if term in loc:
            return "midwest_us"
    for term in west_coast:
        if term in loc:
            return "west_coast_us"
    for term in south_central:
        if term in loc:
            return "south_central_us"
    for term in mid_south:
        if term in loc:
            return "mid_south_us"

    return "southeast_us"


# ---------------------------------------------------------------------------
# Engine
# ---------------------------------------------------------------------------

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
        self._location_meta = lookup_location(location)

    def generate_disruptions(self, date: Optional[datetime] = None) -> List[Dict[str, Any]]:
        """
        Auto-generate disruption events for the given date.
        Deterministic per restaurant per day -- same inputs = same output.
        """
        date = date or datetime.now()
        seed = _deterministic_seed(self.restaurant_id, date)
        rng = random.Random(seed)
        season = _get_season(date)
        month = date.month if hasattr(date, 'month') else datetime.now().month

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
                    "description": self._build_weather_description(pattern, season),
                    "severity": pattern["severity"],
                    "impact_data": pattern["impact"],
                    "location_context": self._build_location_context(),
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

        # 3. Local events — region-specific first, then generic fallback
        day_name = date.strftime("%A")
        event_patterns = REGIONAL_EVENT_PATTERNS.get(self.region, LOCAL_EVENT_PATTERNS)

        for evt in event_patterns:
            # Day-of-week filter
            if evt.get("days") and day_name not in evt["days"]:
                continue
            # Season filter
            if evt.get("seasonal") and evt["seasonal"] != season:
                continue
            # Month filter (more granular than season)
            if evt.get("seasonal_months") and month not in evt["seasonal_months"]:
                continue
            if rng.random() < evt["probability"]:
                disruptions.append({
                    "id": f"auto-local-{seed}-{evt['type']}",
                    "disruption_type": "local_event",
                    "source": "auto_simulation",
                    "title": evt["type"].replace("_", " ").title(),
                    "description": self._build_event_description(evt),
                    "severity": "moderate",
                    "impact_data": {
                        "demand_modifier": evt["demand_modifier"],
                        "traffic_risk": evt.get("traffic_risk", 0),
                    },
                    "location_context": self._build_location_context(),
                    "started_at": date.isoformat(),
                    "auto_generated": True,
                    "duration_days": evt.get("duration_days"),
                })

        return disruptions

    # --- Description builders (richer context for Gemini) ---

    def _build_location_context(self) -> Dict[str, Any]:
        """Build enriched location context for Gemini consumption."""
        return {
            "city": self.location,
            "region": self.region,
            "state": self._location_meta.get("state", ""),
            "nickname": self._location_meta.get("nickname", ""),
            "nearby_metro": self._location_meta.get("nearby_metro", ""),
            "climate_zone": self._location_meta.get("climate_zone", ""),
        }

    def _build_weather_description(self, pattern: Dict[str, Any], season: str) -> str:
        """Build a location-aware weather disruption description."""
        event_name = pattern["type"].replace("_", " ")
        severity = pattern["severity"]
        delay = pattern["impact"].get("delivery_delay_hrs", 0)
        nickname = self._location_meta.get("nickname", "")
        metro = self._location_meta.get("nearby_metro", "")

        base = f"{season.capitalize()} weather disruption: {event_name} detected for {self.location}"
        if nickname:
            base += f" ({nickname})"
        if severity == "critical":
            base += f". CRITICAL: Expect significant impact on operations"
        if delay >= 24:
            base += f". Delivery delays estimated at {delay}+ hours"
        if metro:
            base += f". Regional supply routes from {metro} may also be affected"
        base += "."
        return base

    def _build_event_description(self, evt: Dict[str, Any]) -> str:
        """Build a location-aware local event description."""
        event_name = evt["type"].replace("_", " ")
        demand = evt["demand_modifier"]
        traffic = evt.get("traffic_risk", 0)
        duration = evt.get("duration_days")
        nickname = self._location_meta.get("nickname", "")

        base = f"Local event near {self.location}"
        if nickname:
            base += f" ({nickname})"
        base += f": {event_name}"

        if demand > 1.4:
            base += f". Expect HIGH demand surge (+{(demand - 1) * 100:.0f}%)"
        elif demand > 1.1:
            base += f". Expect moderate demand increase (+{(demand - 1) * 100:.0f}%)"
        elif demand < 1.0:
            base += f". May reduce walk-in traffic ({(1 - demand) * 100:.0f}% decrease)"

        if traffic >= 0.5:
            base += ". Significant traffic congestion expected"
        if duration and duration > 1:
            base += f". Multi-day event ({duration} days)"
        base += "."
        return base

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
            "location_context": self._build_location_context(),
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
                risk_factors.append("Active hazard alert -- deliveries may be suspended")
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
