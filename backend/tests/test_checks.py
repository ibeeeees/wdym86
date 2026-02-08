"""
Tests for the /checks router.

Check endpoints use soft auth (no strict auth requirement).
The service layer manages check lifecycle: create -> add items -> send -> finalize/void.
"""


async def test_create_check(client, test_restaurant):
    """POST /checks/create creates a new check and returns its details."""
    resp = await client.post(
        "/checks/create",
        json={
            "order_type": "dine_in",
            "check_name": "Table 1",
            "restaurant_id": test_restaurant.id,
        },
    )
    assert resp.status_code == 200

    data = resp.json()
    assert data["check_name"] == "Table 1"
    assert data["order_type"] == "dine_in"
    assert data["status"] == "active"
    assert data["subtotal"] == 0.0
    assert "check_id" in data
    assert "check_number" in data


async def test_get_check_list(client, test_restaurant):
    """GET /checks/list returns checks filtered by restaurant, order type, and status."""
    # Create a check first
    await client.post(
        "/checks/create",
        json={
            "order_type": "dine_in",
            "check_name": "Table 2",
            "restaurant_id": test_restaurant.id,
        },
    )

    resp = await client.get(
        "/checks/list",
        params={
            "restaurant_id": test_restaurant.id,
            "order_type": "dine_in",
            "status": "active",
        },
    )
    assert resp.status_code == 200

    data = resp.json()
    assert isinstance(data, list)
    assert len(data) >= 1
    assert data[0]["order_type"] == "dine_in"


async def test_get_check_by_id(client, test_restaurant):
    """GET /checks/{check_id} retrieves a single check by its ID."""
    create_resp = await client.post(
        "/checks/create",
        json={
            "order_type": "takeout",
            "check_name": "Pickup 1",
            "restaurant_id": test_restaurant.id,
        },
    )
    check_id = create_resp.json()["check_id"]

    resp = await client.get(f"/checks/{check_id}")
    assert resp.status_code == 200

    data = resp.json()
    assert data["check_id"] == check_id
    assert data["check_name"] == "Pickup 1"


async def test_add_item_to_check(client, test_restaurant):
    """POST /checks/{check_id}/items/add adds an item and updates totals."""
    create_resp = await client.post(
        "/checks/create",
        json={
            "order_type": "dine_in",
            "check_name": "Table 3",
            "restaurant_id": test_restaurant.id,
        },
    )
    check_id = create_resp.json()["check_id"]

    resp = await client.post(
        f"/checks/{check_id}/items/add",
        json={"name": "Pasta", "quantity": 1, "price": 15.99},
    )
    assert resp.status_code == 200

    data = resp.json()
    assert data["success"] is True
    assert data["check_id"] == check_id
    assert "item_id" in data
    assert data["updated_subtotal"] >= 15.99


async def test_get_check_items(client, test_restaurant):
    """GET /checks/{check_id}/items returns all items on the check."""
    create_resp = await client.post(
        "/checks/create",
        json={
            "order_type": "dine_in",
            "check_name": "Table 4",
            "restaurant_id": test_restaurant.id,
        },
    )
    check_id = create_resp.json()["check_id"]

    # Add two items
    await client.post(
        f"/checks/{check_id}/items/add",
        json={"name": "Salad", "quantity": 1, "price": 9.50},
    )
    await client.post(
        f"/checks/{check_id}/items/add",
        json={"name": "Steak", "quantity": 1, "price": 29.99},
    )

    resp = await client.get(f"/checks/{check_id}/items")
    assert resp.status_code == 200

    data = resp.json()
    assert isinstance(data, list)
    assert len(data) == 2
    names = {item["name"] for item in data}
    assert "Salad" in names
    assert "Steak" in names


async def test_send_order_to_bohpos(client, test_restaurant):
    """POST /checks/{check_id}/send dispatches unsent items to the kitchen."""
    create_resp = await client.post(
        "/checks/create",
        json={
            "order_type": "dine_in",
            "check_name": "Table 5",
            "restaurant_id": test_restaurant.id,
        },
    )
    check_id = create_resp.json()["check_id"]

    await client.post(
        f"/checks/{check_id}/items/add",
        json={"name": "Fish Tacos", "quantity": 2, "price": 13.50},
    )

    resp = await client.post(
        f"/checks/{check_id}/send",
        json={"item_ids": None},
    )
    assert resp.status_code == 200

    data = resp.json()
    assert data["success"] is True
    assert data["check_id"] == check_id
    assert data["items_sent"] >= 1
    assert "sent_at" in data


async def test_finalize_check_with_tip(client, test_restaurant):
    """POST /checks/{check_id}/finalize closes the check and applies tip."""
    create_resp = await client.post(
        "/checks/create",
        json={
            "order_type": "dine_in",
            "check_name": "Table 6",
            "restaurant_id": test_restaurant.id,
        },
    )
    check_id = create_resp.json()["check_id"]

    await client.post(
        f"/checks/{check_id}/items/add",
        json={"name": "Burger", "quantity": 1, "price": 12.00},
    )

    resp = await client.post(
        f"/checks/{check_id}/finalize",
        json={"tip_amount": 5.0},
    )
    assert resp.status_code == 200

    data = resp.json()
    assert data["success"] is True
    assert data["status"] == "finalized"
    assert data["tip"] == 5.0
    assert data["final_total"] is not None
    assert "finalized_at" in data


async def test_void_check(client, test_restaurant):
    """POST /checks/{check_id}/void marks the check as voided."""
    create_resp = await client.post(
        "/checks/create",
        json={
            "order_type": "dine_in",
            "check_name": "Table 7",
            "restaurant_id": test_restaurant.id,
        },
    )
    check_id = create_resp.json()["check_id"]

    resp = await client.post(f"/checks/{check_id}/void")
    assert resp.status_code == 200

    data = resp.json()
    assert data["success"] is True
    assert data["status"] == "voided"
    assert data["message"] == "Check voided"


async def test_get_nonexistent_check(client):
    """GET /checks/{check_id} for a missing ID returns 404."""
    fake_id = "00000000-0000-0000-0000-000000000000"
    resp = await client.get(f"/checks/{fake_id}")
    assert resp.status_code == 404
