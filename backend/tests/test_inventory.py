"""Tests for the /inventory router."""

import uuid
from datetime import datetime


async def test_get_inventory(client, auth_headers, test_inventory, test_ingredient):
    """GET /inventory/{ingredient_id} returns current inventory."""
    resp = await client.get(
        f"/inventory/{test_ingredient.id}",
        headers=auth_headers,
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["ingredient_id"] == test_ingredient.id
    assert data["quantity"] == 100.0


async def test_update_inventory(client, auth_headers, test_ingredient):
    """POST /inventory/{ingredient_id} creates a new inventory record."""
    resp = await client.post(
        f"/inventory/{test_ingredient.id}",
        headers=auth_headers,
        json={"quantity": 75.5},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["ingredient_id"] == test_ingredient.id
    assert data["quantity"] == 75.5


async def test_get_inventory_history(client, auth_headers, test_inventory, test_ingredient):
    """GET /inventory/{ingredient_id}/history returns a list of records."""
    # Add a second record so the history has more than one entry
    await client.post(
        f"/inventory/{test_ingredient.id}",
        headers=auth_headers,
        json={"quantity": 80.0},
    )

    resp = await client.get(
        f"/inventory/{test_ingredient.id}/history",
        headers=auth_headers,
    )
    assert resp.status_code == 200
    data = resp.json()
    assert isinstance(data, list)
    assert len(data) >= 2


async def test_get_inventory_not_found(client, auth_headers):
    """GET /inventory/{ingredient_id} returns 404 for a non-existent ingredient."""
    fake_id = str(uuid.uuid4())
    resp = await client.get(
        f"/inventory/{fake_id}",
        headers=auth_headers,
    )
    assert resp.status_code == 404


async def test_record_usage(client, auth_headers, test_ingredient):
    """POST /inventory/{ingredient_id}/usage records usage data."""
    usage_payload = {
        "date": datetime.now().isoformat(),
        "quantity_used": 12.5,
        "event_flag": False,
        "weather_severity": 0.2,
        "traffic_index": 0.5,
        "hazard_flag": False,
    }
    resp = await client.post(
        f"/inventory/{test_ingredient.id}/usage",
        headers=auth_headers,
        json=usage_payload,
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["ingredient_id"] == test_ingredient.id
    assert data["quantity_used"] == 12.5
    assert data["event_flag"] is False


async def test_get_usage_history(client, auth_headers, test_ingredient):
    """GET /inventory/{ingredient_id}/usage returns recorded usage entries."""
    # Seed two usage records
    for qty in (10.0, 15.0):
        await client.post(
            f"/inventory/{test_ingredient.id}/usage",
            headers=auth_headers,
            json={
                "date": datetime.now().isoformat(),
                "quantity_used": qty,
                "event_flag": False,
                "weather_severity": 0.0,
                "traffic_index": 0.0,
                "hazard_flag": False,
            },
        )

    resp = await client.get(
        f"/inventory/{test_ingredient.id}/usage",
        headers=auth_headers,
    )
    assert resp.status_code == 200
    data = resp.json()
    assert isinstance(data, list)
    assert len(data) >= 2
