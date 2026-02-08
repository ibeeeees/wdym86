"""Tests for the /suppliers endpoints."""

import uuid


# ---- helpers ---------------------------------------------------------------

SUPPLIERS_URL = "/suppliers/"

NEW_SUPPLIER = {
    "name": "Aegean Foods Wholesale",
    "lead_time_days": 2,
    "min_order_quantity": 25.0,
    "reliability_score": 0.92,
    "shipping_cost": 18.50,
}


# ---- tests -----------------------------------------------------------------


async def test_list_suppliers_empty(client, auth_headers, test_restaurant):
    """Listing suppliers for a restaurant with none returns an empty list."""
    resp = await client.get(
        SUPPLIERS_URL,
        params={"restaurant_id": test_restaurant.id},
        headers=auth_headers,
    )
    assert resp.status_code == 200
    assert resp.json() == []


async def test_create_supplier(client, auth_headers, test_restaurant):
    """Creating a supplier returns 200 with the new supplier data."""
    resp = await client.post(
        SUPPLIERS_URL,
        params={"restaurant_id": test_restaurant.id},
        json=NEW_SUPPLIER,
        headers=auth_headers,
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["name"] == NEW_SUPPLIER["name"]
    assert body["lead_time_days"] == NEW_SUPPLIER["lead_time_days"]
    assert body["min_order_quantity"] == NEW_SUPPLIER["min_order_quantity"]
    assert body["reliability_score"] == NEW_SUPPLIER["reliability_score"]
    assert body["shipping_cost"] == NEW_SUPPLIER["shipping_cost"]
    assert body["restaurant_id"] == test_restaurant.id
    assert "id" in body
    assert "created_at" in body


async def test_get_supplier_by_id(client, auth_headers, test_restaurant):
    """Getting a supplier by ID returns the correct supplier."""
    # Create
    create_resp = await client.post(
        SUPPLIERS_URL,
        params={"restaurant_id": test_restaurant.id},
        json=NEW_SUPPLIER,
        headers=auth_headers,
    )
    assert create_resp.status_code == 200
    created = create_resp.json()

    # Get by ID
    get_resp = await client.get(
        f"{SUPPLIERS_URL}{created['id']}",
        headers=auth_headers,
    )
    assert get_resp.status_code == 200
    body = get_resp.json()
    assert body["id"] == created["id"]
    assert body["name"] == NEW_SUPPLIER["name"]
    assert body["restaurant_id"] == test_restaurant.id


async def test_get_supplier_not_found(client, auth_headers):
    """Getting a non-existent supplier returns 404."""
    fake_id = str(uuid.uuid4())
    resp = await client.get(
        f"{SUPPLIERS_URL}{fake_id}",
        headers=auth_headers,
    )
    assert resp.status_code == 404
    assert resp.json()["detail"] == "Supplier not found"
