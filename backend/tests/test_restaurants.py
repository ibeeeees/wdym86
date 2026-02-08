"""Tests for the /restaurants router (CRUD operations)."""

import uuid


# ---- List restaurants ----------------------------------------------------

async def test_list_restaurants_empty(client, auth_headers):
    """A fresh user with no restaurants sees an empty list."""
    resp = await client.get("/restaurants/", headers=auth_headers)
    assert resp.status_code == 200
    assert resp.json() == []


# ---- Create restaurant ---------------------------------------------------

async def test_create_restaurant(client, auth_headers):
    """POST /restaurants/ creates a new restaurant and returns it."""
    payload = {"name": "Mykonos Mediterranean", "location": "Athens, GA"}
    resp = await client.post("/restaurants/", json=payload, headers=auth_headers)
    assert resp.status_code == 200
    data = resp.json()
    assert data["name"] == "Mykonos Mediterranean"
    assert data["location"] == "Athens, GA"
    assert "id" in data
    assert "user_id" in data


# ---- List restaurants after creation -------------------------------------

async def test_list_restaurants_after_create(client, auth_headers):
    """After creating a restaurant, it appears in the list."""
    # Create one restaurant first
    payload = {"name": "Test Tavern", "location": "Atlanta, GA"}
    create_resp = await client.post("/restaurants/", json=payload, headers=auth_headers)
    assert create_resp.status_code == 200
    created_id = create_resp.json()["id"]

    # List should contain exactly that restaurant
    list_resp = await client.get("/restaurants/", headers=auth_headers)
    assert list_resp.status_code == 200
    restaurants = list_resp.json()
    assert len(restaurants) >= 1
    ids = [r["id"] for r in restaurants]
    assert created_id in ids


# ---- Get by ID -----------------------------------------------------------

async def test_get_restaurant_by_id(client, auth_headers, test_restaurant):
    """GET /restaurants/{id} returns the correct restaurant."""
    resp = await client.get(
        f"/restaurants/{test_restaurant.id}", headers=auth_headers
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["id"] == test_restaurant.id
    assert data["name"] == "Test Restaurant"
    assert data["location"] == "Athens, GA"


# ---- Not found -----------------------------------------------------------

async def test_get_nonexistent_restaurant(client, auth_headers):
    """GET /restaurants/{bad_id} returns 404."""
    fake_id = str(uuid.uuid4())
    resp = await client.get(f"/restaurants/{fake_id}", headers=auth_headers)
    assert resp.status_code == 404
    assert "not found" in resp.json()["detail"].lower()
