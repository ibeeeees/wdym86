"""Tests for the /forecasts router."""

import uuid


async def test_generate_forecast(client, auth_headers, test_ingredient):
    """POST /forecasts/{ingredient_id}?horizon=7 generates a forecast."""
    resp = await client.post(
        f"/forecasts/{test_ingredient.id}",
        params={"horizon": 7},
        headers=auth_headers,
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["ingredient_id"] == test_ingredient.id
    assert data["ingredient_name"] == "Test Tomatoes"
    assert len(data["forecasts"]) == 7
    assert "point_forecast" in data
    assert "lower_bound" in data
    assert "upper_bound" in data
    assert "variance" in data
    assert data["point_forecast"] > 0


async def test_get_forecasts(client, auth_headers, test_ingredient):
    """GET /forecasts/{ingredient_id} returns previously generated forecasts."""
    # Generate forecasts first
    await client.post(
        f"/forecasts/{test_ingredient.id}",
        params={"horizon": 5},
        headers=auth_headers,
    )

    resp = await client.get(
        f"/forecasts/{test_ingredient.id}",
        headers=auth_headers,
    )
    assert resp.status_code == 200
    data = resp.json()
    assert isinstance(data, list)
    assert len(data) >= 1
    # Each forecast should have expected fields
    forecast = data[0]
    assert "ingredient_id" in forecast
    assert "forecast_date" in forecast
    assert "mu" in forecast
    assert "k" in forecast


async def test_generate_forecast_nonexistent_ingredient(client, auth_headers):
    """POST /forecasts/{ingredient_id} returns 404 for unknown ingredient."""
    fake_id = str(uuid.uuid4())
    resp = await client.post(
        f"/forecasts/{fake_id}",
        params={"horizon": 7},
        headers=auth_headers,
    )
    assert resp.status_code == 404
