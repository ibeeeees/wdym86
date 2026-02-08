"""
Tests for the /disruptions router.

All disruption endpoints are public (no auth required).
Disruption data is auto-generated per restaurant/day using deterministic seeding.
"""

from datetime import date, timedelta


async def test_get_todays_disruptions(client, test_restaurant):
    """GET /disruptions/{restaurant_id}/today returns today's auto-generated disruptions."""
    resp = await client.get(f"/disruptions/{test_restaurant.id}/today")
    assert resp.status_code == 200

    data = resp.json()
    assert data["restaurant_id"] == test_restaurant.id
    assert data["date"] == date.today().isoformat()
    assert data["auto_generated"] is True
    assert "disruptions" in data
    assert "aggregate_impact" in data
    assert isinstance(data["disruptions"], list)


async def test_get_disruptions_range_valid(client, test_restaurant):
    """GET /disruptions/{restaurant_id}/range with a valid date window."""
    start = date.today().isoformat()
    end = (date.today() + timedelta(days=5)).isoformat()

    resp = await client.get(
        f"/disruptions/{test_restaurant.id}/range",
        params={"start_date": start, "end_date": end},
    )
    assert resp.status_code == 200

    data = resp.json()
    assert data["restaurant_id"] == test_restaurant.id
    assert data["start_date"] == start
    assert data["end_date"] == end
    assert data["total_days"] == 6
    assert "data" in data
    assert isinstance(data["data"], list)


async def test_get_disruptions_range_exceeds_30_days(client, test_restaurant):
    """GET /disruptions/{restaurant_id}/range spanning > 30 days returns 400."""
    start = date.today().isoformat()
    end = (date.today() + timedelta(days=31)).isoformat()

    resp = await client.get(
        f"/disruptions/{test_restaurant.id}/range",
        params={"start_date": start, "end_date": end},
    )
    assert resp.status_code == 400


async def test_get_ingredient_risk(client, test_restaurant, test_ingredient):
    """GET /disruptions/{restaurant_id}/ingredient-risk returns risk assessment."""
    resp = await client.get(f"/disruptions/{test_restaurant.id}/ingredient-risk")
    assert resp.status_code == 200

    data = resp.json()
    assert data["restaurant_id"] == test_restaurant.id
    assert data["auto_generated"] is True
    assert data["total_ingredients"] >= 1
    assert "risks" in data
    assert isinstance(data["risks"], list)


async def test_get_menu_impact(client, test_restaurant, test_ingredient):
    """GET /disruptions/{restaurant_id}/menu-impact returns menu impact analysis."""
    resp = await client.get(f"/disruptions/{test_restaurant.id}/menu-impact")
    assert resp.status_code == 200

    data = resp.json()
    assert data["restaurant_id"] == test_restaurant.id
    assert data["auto_generated"] is True
    assert "total_dishes" in data
    assert "menu_impact" in data


async def test_get_disruption_history(client, test_restaurant):
    """GET /disruptions/{restaurant_id}/history returns stored disruption logs."""
    # First call /today to seed at least one day's log into the DB
    await client.get(f"/disruptions/{test_restaurant.id}/today")

    resp = await client.get(
        f"/disruptions/{test_restaurant.id}/history",
        params={"days": 7},
    )
    assert resp.status_code == 200

    data = resp.json()
    assert data["restaurant_id"] == test_restaurant.id
    assert data["days"] == 7
    assert "total_events" in data
    assert isinstance(data["history"], list)


async def test_get_disruptions_nonexistent_restaurant(client):
    """Requesting disruptions for a nonexistent restaurant returns 404."""
    fake_id = "00000000-0000-0000-0000-000000000000"
    resp = await client.get(f"/disruptions/{fake_id}/today")
    assert resp.status_code == 404
