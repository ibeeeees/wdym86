"""Tests for the /dishes router."""

import uuid


async def test_list_dishes_empty(client, auth_headers, test_restaurant):
    """GET /dishes/?restaurant_id=X returns an empty list when no dishes exist."""
    resp = await client.get(
        "/dishes/",
        params={"restaurant_id": test_restaurant.id},
        headers=auth_headers,
    )
    assert resp.status_code == 200
    assert resp.json() == []


async def test_create_dish(client, auth_headers, test_restaurant):
    """POST /dishes/?restaurant_id=X creates a new dish."""
    resp = await client.post(
        "/dishes/",
        params={"restaurant_id": test_restaurant.id},
        headers=auth_headers,
        json={"name": "Grilled Halloumi", "category": "Appetizer", "price": 11.99},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["name"] == "Grilled Halloumi"
    assert data["category"] == "Appetizer"
    assert data["price"] == 11.99
    assert data["is_active"] is True
    assert data["recipe"] == []


async def test_get_dish_by_id(client, auth_headers, test_dish):
    """GET /dishes/{id} returns the dish with its recipe."""
    resp = await client.get(
        f"/dishes/{test_dish.id}",
        headers=auth_headers,
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["id"] == test_dish.id
    assert data["name"] == "Test Pasta"


async def test_update_dish(client, auth_headers, test_dish):
    """PUT /dishes/{id} updates dish fields."""
    resp = await client.put(
        f"/dishes/{test_dish.id}",
        headers=auth_headers,
        json={"name": "Updated Pasta", "category": "Entree", "price": 18.99},
    )
    assert resp.status_code == 200
    assert resp.json()["status"] == "updated"

    # Verify the update persisted
    get_resp = await client.get(
        f"/dishes/{test_dish.id}",
        headers=auth_headers,
    )
    assert get_resp.json()["name"] == "Updated Pasta"
    assert get_resp.json()["price"] == 18.99


async def test_toggle_dish_active(client, auth_headers, test_dish):
    """PUT /dishes/{id}/active?is_active=false deactivates a dish."""
    resp = await client.put(
        f"/dishes/{test_dish.id}/active",
        params={"is_active": False},
        headers=auth_headers,
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "updated"
    assert data["is_active"] is False


async def test_delete_dish(client, auth_headers, test_restaurant):
    """DELETE /dishes/{id} removes the dish."""
    # Create a dish to delete
    create_resp = await client.post(
        "/dishes/",
        params={"restaurant_id": test_restaurant.id},
        headers=auth_headers,
        json={"name": "Temp Dish", "category": "Side", "price": 5.00},
    )
    dish_id = create_resp.json()["id"]

    resp = await client.delete(
        f"/dishes/{dish_id}",
        headers=auth_headers,
    )
    assert resp.status_code == 200
    assert resp.json()["status"] == "deleted"

    # Confirm it is gone
    get_resp = await client.get(
        f"/dishes/{dish_id}",
        headers=auth_headers,
    )
    assert get_resp.status_code == 404


async def test_get_nonexistent_dish(client, auth_headers):
    """GET /dishes/{id} returns 404 for a non-existent dish."""
    fake_id = str(uuid.uuid4())
    resp = await client.get(
        f"/dishes/{fake_id}",
        headers=auth_headers,
    )
    assert resp.status_code == 404


async def test_add_recipe_item(client, auth_headers, test_dish, test_ingredient):
    """POST /dishes/{id}/recipe adds an ingredient to the recipe."""
    resp = await client.post(
        f"/dishes/{test_dish.id}/recipe",
        headers=auth_headers,
        json={"ingredient_id": test_ingredient.id, "quantity": 2.0},
    )
    assert resp.status_code == 200
    assert resp.json()["status"] == "created"

    # Verify the recipe item appears on the dish
    get_resp = await client.get(
        f"/dishes/{test_dish.id}",
        headers=auth_headers,
    )
    recipe = get_resp.json()["recipe"]
    assert len(recipe) == 1
    assert recipe[0]["ingredient_id"] == test_ingredient.id
    assert recipe[0]["quantity"] == 2.0


async def test_remove_recipe_item(client, auth_headers, test_dish, test_ingredient):
    """DELETE /dishes/{id}/recipe/{ingredient_id} removes the recipe item."""
    # First add the recipe item
    await client.post(
        f"/dishes/{test_dish.id}/recipe",
        headers=auth_headers,
        json={"ingredient_id": test_ingredient.id, "quantity": 3.0},
    )

    # Remove it
    resp = await client.delete(
        f"/dishes/{test_dish.id}/recipe/{test_ingredient.id}",
        headers=auth_headers,
    )
    assert resp.status_code == 200
    assert resp.json()["status"] == "deleted"

    # Verify it is gone
    get_resp = await client.get(
        f"/dishes/{test_dish.id}",
        headers=auth_headers,
    )
    assert get_resp.json()["recipe"] == []
