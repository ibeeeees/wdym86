"""Tests for the /ingredients endpoints."""

import uuid


# ---- helpers ---------------------------------------------------------------

INGREDIENTS_URL = "/ingredients/"

NEW_INGREDIENT = {
    "name": "Feta Cheese",
    "unit": "lbs",
    "category": "dairy",
    "shelf_life_days": 14,
    "is_perishable": True,
    "unit_cost": 6.75,
}


# ---- tests -----------------------------------------------------------------


async def test_list_ingredients_empty(client, auth_headers, test_restaurant):
    """Listing ingredients for a restaurant with none returns an empty list."""
    resp = await client.get(
        INGREDIENTS_URL,
        params={"restaurant_id": test_restaurant.id},
        headers=auth_headers,
    )
    assert resp.status_code == 200
    assert resp.json() == []


async def test_create_ingredient(client, auth_headers, test_restaurant):
    """Creating an ingredient returns 200 with the new ingredient data."""
    resp = await client.post(
        INGREDIENTS_URL,
        params={"restaurant_id": test_restaurant.id},
        json=NEW_INGREDIENT,
        headers=auth_headers,
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["name"] == NEW_INGREDIENT["name"]
    assert body["unit"] == NEW_INGREDIENT["unit"]
    assert body["category"] == NEW_INGREDIENT["category"]
    assert body["shelf_life_days"] == NEW_INGREDIENT["shelf_life_days"]
    assert body["is_perishable"] == NEW_INGREDIENT["is_perishable"]
    assert body["unit_cost"] == NEW_INGREDIENT["unit_cost"]
    assert body["restaurant_id"] == test_restaurant.id
    assert "id" in body
    assert "created_at" in body


async def test_list_ingredients_after_create(client, auth_headers, test_restaurant):
    """After creating an ingredient, listing returns it."""
    # Create first
    create_resp = await client.post(
        INGREDIENTS_URL,
        params={"restaurant_id": test_restaurant.id},
        json=NEW_INGREDIENT,
        headers=auth_headers,
    )
    assert create_resp.status_code == 200
    created_id = create_resp.json()["id"]

    # List
    list_resp = await client.get(
        INGREDIENTS_URL,
        params={"restaurant_id": test_restaurant.id},
        headers=auth_headers,
    )
    assert list_resp.status_code == 200
    items = list_resp.json()
    assert len(items) == 1
    assert items[0]["id"] == created_id
    assert items[0]["name"] == NEW_INGREDIENT["name"]


async def test_get_ingredient_by_id(client, auth_headers, test_restaurant):
    """Getting an ingredient by ID returns the correct ingredient."""
    # Create
    create_resp = await client.post(
        INGREDIENTS_URL,
        params={"restaurant_id": test_restaurant.id},
        json=NEW_INGREDIENT,
        headers=auth_headers,
    )
    assert create_resp.status_code == 200
    created = create_resp.json()

    # Get by ID
    get_resp = await client.get(
        f"{INGREDIENTS_URL}{created['id']}",
        headers=auth_headers,
    )
    assert get_resp.status_code == 200
    body = get_resp.json()
    assert body["id"] == created["id"]
    assert body["name"] == NEW_INGREDIENT["name"]
    assert body["restaurant_id"] == test_restaurant.id
    # Should include current_inventory field (defaults to 0 with no inventory)
    assert body["current_inventory"] == 0


async def test_get_ingredient_not_found(client, auth_headers):
    """Getting a non-existent ingredient returns 404."""
    fake_id = str(uuid.uuid4())
    resp = await client.get(
        f"{INGREDIENTS_URL}{fake_id}",
        headers=auth_headers,
    )
    assert resp.status_code == 404
    assert resp.json()["detail"] == "Ingredient not found"


async def test_list_ingredients_nonexistent_restaurant(client, auth_headers):
    """Listing ingredients for a non-existent restaurant returns 404."""
    fake_id = str(uuid.uuid4())
    resp = await client.get(
        INGREDIENTS_URL,
        params={"restaurant_id": fake_id},
        headers=auth_headers,
    )
    assert resp.status_code == 404
    assert resp.json()["detail"] == "Restaurant not found"
