"""Tests for the automated disruption engine (service/utility layer)."""

from datetime import datetime

from app.services.disruption_engine import (
    AutomatedDisruptionEngine,
    infer_region,
    lookup_location,
    _get_season,
    _deterministic_seed,
    LOCATION_REGISTRY,
    REGIONAL_WEATHER_PATTERNS,
    SUPPLY_CHAIN_DISRUPTIONS,
)


# ---- LOCATION_REGISTRY ----------------------------------------------------

def test_location_registry_has_all_cities():
    """Registry contains entries for all six known cities."""
    expected = {
        "Athens, GA",
        "San Francisco, CA",
        "Austin, TX",
        "Chicago, IL",
        "New York, NY",
        "Nashville, TN",
    }
    assert expected == set(LOCATION_REGISTRY.keys())


# ---- lookup_location -------------------------------------------------------

def test_lookup_location_exact():
    """Exact key match returns the correct registry entry."""
    entry = lookup_location("Athens, GA")
    assert entry["region"] == "southeast_us"


def test_lookup_location_fuzzy():
    """Fuzzy match on city name (no state suffix) still resolves."""
    entry = lookup_location("San Francisco")
    assert entry["region"] == "west_coast_us"


def test_lookup_location_unknown():
    """Unknown location falls back to southeast_us default."""
    entry = lookup_location("Unknown City")
    assert entry["region"] == "southeast_us"
    assert entry["state"] == "Unknown"


# ---- infer_region ----------------------------------------------------------

def test_infer_region_athens():
    assert infer_region("Athens, GA") == "southeast_us"


def test_infer_region_nyc():
    assert infer_region("New York, NY") == "northeast_us"


def test_infer_region_chicago():
    assert infer_region("Chicago, IL") == "midwest_us"


def test_infer_region_austin():
    assert infer_region("Austin, TX") == "south_central_us"


def test_infer_region_sf():
    assert infer_region("San Francisco, CA") == "west_coast_us"


def test_infer_region_nashville():
    assert infer_region("Nashville, TN") == "mid_south_us"


def test_infer_region_empty():
    """Empty string defaults to southeast_us."""
    assert infer_region("") == "southeast_us"


# ---- _get_season -----------------------------------------------------------

def test_get_season():
    """Each calendar month maps to the correct season."""
    assert _get_season(datetime(2026, 1, 15)) == "winter"
    assert _get_season(datetime(2026, 2, 1)) == "winter"
    assert _get_season(datetime(2025, 12, 25)) == "winter"

    assert _get_season(datetime(2026, 3, 10)) == "spring"
    assert _get_season(datetime(2026, 4, 20)) == "spring"
    assert _get_season(datetime(2026, 5, 5)) == "spring"

    assert _get_season(datetime(2026, 6, 1)) == "summer"
    assert _get_season(datetime(2026, 7, 4)) == "summer"
    assert _get_season(datetime(2026, 8, 31)) == "summer"

    assert _get_season(datetime(2026, 9, 1)) == "fall"
    assert _get_season(datetime(2026, 10, 31)) == "fall"
    assert _get_season(datetime(2026, 11, 15)) == "fall"


# ---- _deterministic_seed ---------------------------------------------------

def test_deterministic_seed_same_input():
    """Identical restaurant_id + date produce the same seed."""
    d = datetime(2026, 6, 15)
    seed_a = _deterministic_seed("rest-1", d)
    seed_b = _deterministic_seed("rest-1", d)
    assert seed_a == seed_b


def test_deterministic_seed_different_input():
    """Different restaurant_id or date produce different seeds."""
    d = datetime(2026, 6, 15)
    seed_a = _deterministic_seed("rest-1", d)
    seed_b = _deterministic_seed("rest-2", d)
    seed_c = _deterministic_seed("rest-1", datetime(2026, 6, 16))
    assert seed_a != seed_b
    assert seed_a != seed_c


# ---- generate_disruptions --------------------------------------------------

def test_generate_disruptions_deterministic():
    """Same engine + same date always yields identical disruptions."""
    engine = AutomatedDisruptionEngine("rest-1", "Athens, GA", "southeast_us")
    d = datetime(2026, 3, 15)
    result_a = engine.generate_disruptions(d)
    result_b = engine.generate_disruptions(d)
    assert result_a == result_b


def test_generate_disruptions_returns_list():
    """generate_disruptions returns a list of dicts."""
    engine = AutomatedDisruptionEngine("rest-1", "Athens, GA", "southeast_us")
    result = engine.generate_disruptions(datetime(2026, 7, 4))
    assert isinstance(result, list)
    for item in result:
        assert isinstance(item, dict)


def test_disruption_has_required_fields():
    """Every generated disruption carries the minimum set of fields."""
    engine = AutomatedDisruptionEngine("rest-1", "Athens, GA", "southeast_us")
    # Use a fixed date that is likely to produce at least one disruption.
    # Iterate over several dates to guarantee we get some results.
    disruptions = []
    for month in range(1, 13):
        disruptions.extend(engine.generate_disruptions(datetime(2026, month, 15)))
    assert len(disruptions) > 0, "Expected at least one disruption across 12 months"

    required = {"id", "title", "disruption_type", "severity", "description"}
    for d in disruptions:
        missing = required - set(d.keys())
        assert not missing, f"Disruption {d.get('id')} missing fields: {missing}"


# ---- compute_aggregate_impact ----------------------------------------------

def test_compute_aggregate_impact():
    """Aggregate impact returns dict with expected top-level keys."""
    engine = AutomatedDisruptionEngine("rest-1", "Athens, GA", "southeast_us")
    # Note: passing [] is falsy so the engine auto-generates disruptions.
    # We pass a single synthetic disruption to control the output.
    synthetic = [{
        "id": "test-1",
        "title": "Test Event",
        "disruption_type": "weather",
        "severity": "moderate",
        "description": "A test disruption",
        "impact_data": {
            "weather_risk": 0.5,
            "traffic_risk": 0.3,
            "delivery_delay_hrs": 6,
        },
    }]
    impact = engine.compute_aggregate_impact(synthetic)
    expected_keys = {
        "weather_risk",
        "traffic_risk",
        "hazard_flag",
        "demand_modifier",
        "delivery_delay_hrs",
        "cost_modifier",
        "spoilage_risk",
        "affected_categories",
        "overall_severity",
        "active_disruptions",
        "disruption_titles",
        "location_context",
    }
    assert expected_keys.issubset(set(impact.keys()))
    assert impact["weather_risk"] == 0.5
    assert impact["traffic_risk"] == 0.3
    assert impact["active_disruptions"] == 1
    assert impact["disruption_titles"] == ["Test Event"]


# ---- get_ingredient_risk_assessment ----------------------------------------

def test_ingredient_risk_assessment():
    """Risk assessment returns one entry per ingredient."""
    engine = AutomatedDisruptionEngine("rest-1", "Athens, GA", "southeast_us")
    ingredients = [
        {"name": "Tomatoes", "category": "produce", "is_perishable": True, "days_of_cover": 5},
        {"name": "Olive Oil", "category": "dry_goods", "is_perishable": False, "days_of_cover": 30},
    ]
    result = engine.get_ingredient_risk_assessment(ingredients, disruptions=[])
    assert len(result) == 2
    names = {r["ingredient"] for r in result}
    assert names == {"Tomatoes", "Olive Oil"}
    for r in result:
        assert "risk_level" in r
        assert "risk_score" in r
        assert r["risk_level"] in {"LOW", "MODERATE", "HIGH", "CRITICAL"}


def test_ingredient_risk_assessment_empty():
    """Empty ingredient list returns an empty list."""
    engine = AutomatedDisruptionEngine("rest-1", "Athens, GA", "southeast_us")
    result = engine.get_ingredient_risk_assessment([], disruptions=[])
    assert result == []


# ---- get_menu_impact_analysis ----------------------------------------------

def test_menu_impact_analysis():
    """Menu impact analysis flags dishes whose ingredients are at HIGH+ risk."""
    engine = AutomatedDisruptionEngine("rest-1", "Athens, GA", "southeast_us")

    ingredient_risks = [
        {"ingredient": "Salmon", "risk_level": "HIGH", "risk_score": 0.5, "risk_factors": ["Supply disruption"]},
        {"ingredient": "Rice", "risk_level": "LOW", "risk_score": 0.05, "risk_factors": []},
    ]
    dishes = [
        {"name": "Salmon Bowl", "id": "d1", "recipe": [{"ingredient_name": "Salmon"}, {"ingredient_name": "Rice"}]},
        {"name": "Plain Rice", "id": "d2", "recipe": [{"ingredient_name": "Rice"}]},
    ]
    result = engine.get_menu_impact_analysis(dishes, ingredient_risks)
    # Only Salmon Bowl should be flagged (it has a HIGH-risk ingredient)
    assert len(result) == 1
    assert result[0]["dish"] == "Salmon Bowl"
    assert result[0]["max_risk"] == "HIGH"


# ---- REGIONAL_WEATHER_PATTERNS completeness --------------------------------

def test_all_regions_have_weather_patterns():
    """Every region has weather patterns for all four seasons."""
    seasons = {"winter", "spring", "summer", "fall"}
    for region, patterns in REGIONAL_WEATHER_PATTERNS.items():
        missing = seasons - set(patterns.keys())
        assert not missing, f"Region '{region}' is missing seasons: {missing}"


# ---- Different locations produce different disruptions ----------------------

def test_engine_different_locations():
    """Engines with different locations/regions produce different disruptions on the same date."""
    engine_se = AutomatedDisruptionEngine("rest-1", "Athens, GA", "southeast_us")
    engine_wc = AutomatedDisruptionEngine("rest-1", "San Francisco, CA", "west_coast_us")
    d = datetime(2026, 7, 4)

    disruptions_se = engine_se.generate_disruptions(d)
    disruptions_wc = engine_wc.generate_disruptions(d)

    # The two engines share the same restaurant_id and date so they share
    # the same RNG seed, but regional weather pools differ, so at least the
    # weather disruption IDs should diverge (unless both pools happen to
    # produce zero weather events).
    ids_se = {x["id"] for x in disruptions_se if x["disruption_type"] == "weather"}
    ids_wc = {x["id"] for x in disruptions_wc if x["disruption_type"] == "weather"}
    # They CAN overlap on supply-chain (global) but weather should differ
    # when at least one engine produces a weather event.
    if ids_se or ids_wc:
        assert ids_se != ids_wc, "Weather disruptions should differ across regions"
