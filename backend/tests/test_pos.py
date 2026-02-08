"""
Comprehensive tests for the POS (Point of Sale) API.

Tests cover: orders (CRUD, items, payment, refund), tables (list, status, assign),
and quick actions (menu, checkout, stats).

Important: The POS router uses module-level in-memory dicts (_orders, _tables, _payments)
that persist across tests within the same process. Each test that depends on specific
state creates its own orders with unique customer_name values.
"""

import pytest
from datetime import datetime, timezone

from app.routers.pos import _orders, _tables, _payments


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _clear_pos_memory():
    """Reset the in-memory POS stores so tests start with a clean slate."""
    _orders.clear()
    _tables.clear()
    _payments.clear()


@pytest.fixture(autouse=True)
def reset_pos_state():
    """Auto-clear POS in-memory dicts before every test."""
    _clear_pos_memory()
    yield
    _clear_pos_memory()


# ---------------------------------------------------------------------------
# Helper to create an order via the API and return the response JSON
# ---------------------------------------------------------------------------

async def _create_order(client, auth_headers, restaurant_id, items=None,
                        customer_name=None, table_id=None):
    payload = {
        "restaurant_id": restaurant_id,
        "items": items or [],
    }
    if customer_name:
        payload["customer_name"] = customer_name
    if table_id:
        payload["table_id"] = table_id
    resp = await client.post("/pos/orders", json=payload, headers=auth_headers)
    return resp


async def _transition_order_to_served(client, auth_headers, order_id):
    """Walk an order through PENDING -> IN_PROGRESS -> READY -> SERVED."""
    for next_status in ("in_progress", "ready", "served"):
        resp = await client.put(
            f"/pos/orders/{order_id}",
            json={"status": next_status},
            headers=auth_headers,
        )
        assert resp.status_code == 200, (
            f"Failed transitioning to {next_status}: {resp.text}"
        )
    return resp


# =========================================================================
# Menu Tests
# =========================================================================

async def test_get_pos_menu_empty(client, auth_headers, test_restaurant):
    """GET /pos/menu with no dishes returns an empty list."""
    resp = await client.get(
        "/pos/menu",
        params={"restaurant_id": test_restaurant.id},
        headers=auth_headers,
    )
    assert resp.status_code == 200
    assert resp.json() == []


async def test_get_pos_menu_with_dishes(client, auth_headers, test_dish, test_restaurant):
    """GET /pos/menu returns active dishes for the restaurant."""
    resp = await client.get(
        "/pos/menu",
        params={"restaurant_id": test_restaurant.id},
        headers=auth_headers,
    )
    assert resp.status_code == 200
    data = resp.json()
    assert len(data) >= 1

    dish = data[0]
    assert dish["id"] == test_dish.id
    assert dish["name"] == "Test Pasta"
    assert dish["category"] == "Main"
    assert dish["price"] == 15.99
    assert dish["is_available"] is True


# =========================================================================
# Order CRUD Tests
# =========================================================================

async def test_create_order_empty(client, auth_headers, test_restaurant):
    """POST /pos/orders with no items creates a PENDING order with zero totals."""
    resp = await _create_order(
        client, auth_headers, test_restaurant.id,
        customer_name="Empty Order Customer",
    )
    assert resp.status_code == 201
    data = resp.json()
    assert data["status"] == "pending"
    assert data["items"] == []
    assert data["subtotal"] == 0
    assert data["tax"] == 0
    assert data["total"] == 0
    assert data["customer_name"] == "Empty Order Customer"
    assert data["restaurant_id"] == test_restaurant.id


async def test_create_order_with_items(client, auth_headers, test_restaurant, test_dish):
    """POST /pos/orders with a dish item calculates correct subtotal, 8% tax, and total."""
    resp = await _create_order(
        client, auth_headers, test_restaurant.id,
        items=[{"dish_id": test_dish.id, "quantity": 2}],
        customer_name="Items Customer",
    )
    assert resp.status_code == 201
    data = resp.json()

    expected_subtotal = round(15.99 * 2, 2)
    expected_tax = round(expected_subtotal * 0.08, 2)
    expected_total = round(expected_subtotal + expected_tax, 2)

    assert data["subtotal"] == expected_subtotal
    assert data["tax"] == expected_tax
    assert data["total"] == expected_total
    assert len(data["items"]) == 1
    assert data["items"][0]["dish_name"] == "Test Pasta"
    assert data["items"][0]["quantity"] == 2
    assert data["items"][0]["unit_price"] == 15.99


async def test_list_orders(client, auth_headers, test_restaurant):
    """GET /pos/orders returns orders for the restaurant."""
    # Create two orders
    await _create_order(
        client, auth_headers, test_restaurant.id,
        customer_name="List Test A",
    )
    await _create_order(
        client, auth_headers, test_restaurant.id,
        customer_name="List Test B",
    )

    resp = await client.get(
        "/pos/orders",
        params={"restaurant_id": test_restaurant.id},
        headers=auth_headers,
    )
    assert resp.status_code == 200
    data = resp.json()
    assert len(data) == 2
    names = {o["customer_name"] for o in data}
    assert "List Test A" in names
    assert "List Test B" in names


async def test_get_order_by_id(client, auth_headers, test_restaurant):
    """GET /pos/orders/{id} returns the correct order."""
    create_resp = await _create_order(
        client, auth_headers, test_restaurant.id,
        customer_name="ById Customer",
    )
    order_id = create_resp.json()["id"]

    resp = await client.get(
        f"/pos/orders/{order_id}",
        headers=auth_headers,
    )
    assert resp.status_code == 200
    assert resp.json()["id"] == order_id
    assert resp.json()["customer_name"] == "ById Customer"


async def test_get_order_not_found(client, auth_headers, test_restaurant):
    """GET /pos/orders/{fake_id} returns 404."""
    resp = await client.get(
        "/pos/orders/nonexistent-order-id-12345",
        headers=auth_headers,
    )
    assert resp.status_code == 404


# =========================================================================
# Order Update / Status Transition Tests
# =========================================================================

async def test_update_order_status(client, auth_headers, test_restaurant):
    """PUT /pos/orders/{id} transitions PENDING -> IN_PROGRESS."""
    create_resp = await _create_order(
        client, auth_headers, test_restaurant.id,
        customer_name="Status Customer",
    )
    order_id = create_resp.json()["id"]

    resp = await client.put(
        f"/pos/orders/{order_id}",
        json={"status": "in_progress"},
        headers=auth_headers,
    )
    assert resp.status_code == 200
    assert resp.json()["status"] == "in_progress"


async def test_update_order_invalid_transition(client, auth_headers, test_restaurant):
    """PUT /pos/orders/{id} with invalid transition PENDING -> PAID returns 400."""
    create_resp = await _create_order(
        client, auth_headers, test_restaurant.id,
        customer_name="Invalid Transition Customer",
    )
    order_id = create_resp.json()["id"]

    resp = await client.put(
        f"/pos/orders/{order_id}",
        json={"status": "paid"},
        headers=auth_headers,
    )
    assert resp.status_code == 400
    assert "Cannot transition" in resp.json()["detail"]


# =========================================================================
# Order Items Tests
# =========================================================================

async def test_add_item_to_order(client, auth_headers, test_restaurant, test_dish):
    """POST /pos/orders/{id}/items adds an item and recalculates totals."""
    # Create empty order first
    create_resp = await _create_order(
        client, auth_headers, test_restaurant.id,
        customer_name="AddItem Customer",
    )
    order_id = create_resp.json()["id"]
    assert create_resp.json()["subtotal"] == 0

    # Add item
    resp = await client.post(
        f"/pos/orders/{order_id}/items",
        json={"dish_id": test_dish.id, "quantity": 3},
        headers=auth_headers,
    )
    assert resp.status_code == 200
    data = resp.json()

    expected_subtotal = round(15.99 * 3, 2)
    expected_tax = round(expected_subtotal * 0.08, 2)
    expected_total = round(expected_subtotal + expected_tax, 2)

    assert len(data["items"]) == 1
    assert data["subtotal"] == expected_subtotal
    assert data["tax"] == expected_tax
    assert data["total"] == expected_total


async def test_remove_item_from_order(client, auth_headers, test_restaurant, test_dish):
    """DELETE /pos/orders/{id}/items/{item_id} removes the item and recalculates totals."""
    # Create order with one item
    create_resp = await _create_order(
        client, auth_headers, test_restaurant.id,
        items=[{"dish_id": test_dish.id, "quantity": 1}],
        customer_name="RemoveItem Customer",
    )
    order_id = create_resp.json()["id"]
    item_id = create_resp.json()["items"][0]["id"]

    # Remove the item
    resp = await client.delete(
        f"/pos/orders/{order_id}/items/{item_id}",
        headers=auth_headers,
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["items"] == []
    assert data["subtotal"] == 0
    assert data["tax"] == 0
    assert data["total"] == 0


# =========================================================================
# Payment Tests
# =========================================================================

async def test_process_payment(client, auth_headers, test_restaurant, test_dish):
    """POST /pos/orders/{id}/pay with sufficient amount succeeds."""
    # Create order with item
    create_resp = await _create_order(
        client, auth_headers, test_restaurant.id,
        items=[{"dish_id": test_dish.id, "quantity": 1}],
        customer_name="Payment Customer",
    )
    order_id = create_resp.json()["id"]
    order_total = create_resp.json()["total"]

    # Transition to SERVED (required path: PENDING -> IN_PROGRESS -> READY -> SERVED)
    await _transition_order_to_served(client, auth_headers, order_id)

    # Pay with exact amount
    resp = await client.post(
        f"/pos/orders/{order_id}/pay",
        json={"method": "card", "amount": order_total, "tip": 0},
        headers=auth_headers,
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["order_id"] == order_id
    assert data["amount_paid"] == order_total
    assert data["change_due"] == 0
    assert data["payment_method"] == "card"
    assert "transaction_id" in data

    # Verify order is now PAID
    order_resp = await client.get(
        f"/pos/orders/{order_id}",
        headers=auth_headers,
    )
    assert order_resp.json()["status"] == "paid"


async def test_process_payment_insufficient(client, auth_headers, test_restaurant, test_dish):
    """POST /pos/orders/{id}/pay with too little amount returns 400."""
    create_resp = await _create_order(
        client, auth_headers, test_restaurant.id,
        items=[{"dish_id": test_dish.id, "quantity": 1}],
        customer_name="Insufficient Payment Customer",
    )
    order_id = create_resp.json()["id"]

    # Transition to SERVED
    await _transition_order_to_served(client, auth_headers, order_id)

    # Pay with insufficient amount
    resp = await client.post(
        f"/pos/orders/{order_id}/pay",
        json={"method": "cash", "amount": 1.00, "tip": 0},
        headers=auth_headers,
    )
    assert resp.status_code == 400
    assert "Insufficient payment" in resp.json()["detail"]


# =========================================================================
# Refund Tests
# =========================================================================

async def test_process_refund(client, auth_headers, test_restaurant, test_dish):
    """POST /pos/orders/{id}/refund on a paid order succeeds."""
    # Create order, transition to SERVED, then pay
    create_resp = await _create_order(
        client, auth_headers, test_restaurant.id,
        items=[{"dish_id": test_dish.id, "quantity": 1}],
        customer_name="Refund Customer",
    )
    order_id = create_resp.json()["id"]
    order_total = create_resp.json()["total"]

    await _transition_order_to_served(client, auth_headers, order_id)

    await client.post(
        f"/pos/orders/{order_id}/pay",
        json={"method": "card", "amount": order_total, "tip": 0},
        headers=auth_headers,
    )

    # Now refund
    resp = await client.post(
        f"/pos/orders/{order_id}/refund",
        json={"amount": order_total, "reason": "Customer complaint"},
        headers=auth_headers,
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["order_id"] == order_id
    assert data["refund_amount"] == order_total
    assert data["reason"] == "Customer complaint"
    assert "transaction_id" in data


async def test_process_refund_unpaid(client, auth_headers, test_restaurant, test_dish):
    """POST /pos/orders/{id}/refund on an unpaid order returns 400."""
    create_resp = await _create_order(
        client, auth_headers, test_restaurant.id,
        items=[{"dish_id": test_dish.id, "quantity": 1}],
        customer_name="Refund Unpaid Customer",
    )
    order_id = create_resp.json()["id"]

    resp = await client.post(
        f"/pos/orders/{order_id}/refund",
        json={"amount": 5.00, "reason": "Testing"},
        headers=auth_headers,
    )
    assert resp.status_code == 400
    assert "Can only refund paid orders" in resp.json()["detail"]


# =========================================================================
# Table Tests
# =========================================================================

async def test_list_tables(client, auth_headers, test_restaurant):
    """GET /pos/tables returns 20 auto-initialized tables."""
    resp = await client.get(
        "/pos/tables",
        params={"restaurant_id": test_restaurant.id},
        headers=auth_headers,
    )
    assert resp.status_code == 200
    data = resp.json()
    assert len(data) == 20

    # Tables should be numbered 1-20
    table_numbers = sorted([int(t["table_number"]) for t in data])
    assert table_numbers == list(range(1, 21))

    # All should start as available
    for table in data:
        assert table["status"] == "available"
        assert table["restaurant_id"] == test_restaurant.id


async def test_update_table_status(client, auth_headers, test_restaurant):
    """PUT /pos/tables/{id}/status updates the table status to RESERVED."""
    # First, initialize tables by listing them
    await client.get(
        "/pos/tables",
        params={"restaurant_id": test_restaurant.id},
        headers=auth_headers,
    )

    table_id = f"{test_restaurant.id}_table_1"

    resp = await client.put(
        f"/pos/tables/{table_id}/status",
        json={"status": "reserved"},
        headers=auth_headers,
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["id"] == table_id
    assert data["status"] == "reserved"


async def test_assign_order_to_table(client, auth_headers, test_restaurant):
    """POST /pos/tables/{id}/assign assigns an order to the table."""
    # Create an order (no table initially)
    create_resp = await _create_order(
        client, auth_headers, test_restaurant.id,
        customer_name="Table Assign Customer",
    )
    order_id = create_resp.json()["id"]

    # Initialize tables
    await client.get(
        "/pos/tables",
        params={"restaurant_id": test_restaurant.id},
        headers=auth_headers,
    )

    table_id = f"{test_restaurant.id}_table_5"

    resp = await client.post(
        f"/pos/tables/{table_id}/assign",
        json={"order_id": order_id},
        headers=auth_headers,
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["id"] == table_id
    assert data["status"] == "occupied"
    assert data["current_order_id"] == order_id


# =========================================================================
# Quick Action Tests
# =========================================================================

async def test_quick_checkout(client, auth_headers, test_restaurant, test_dish):
    """POST /pos/checkout creates a paid order and returns a payment response."""
    resp = await client.post(
        "/pos/checkout",
        json={
            "restaurant_id": test_restaurant.id,
            "items": [{"dish_id": test_dish.id, "quantity": 2}],
            "payment_method": "card",
            "customer_name": "Quick Checkout Customer",
        },
        headers=auth_headers,
    )
    assert resp.status_code == 200
    data = resp.json()

    expected_subtotal = round(15.99 * 2, 2)
    expected_tax = round(expected_subtotal * 0.08, 2)
    expected_total = round(expected_subtotal + expected_tax, 2)

    assert data["amount_paid"] == expected_total
    assert data["payment_method"] == "card"
    assert data["tip"] == 0
    assert data["change_due"] == 0
    assert "order_id" in data
    assert "transaction_id" in data

    # Verify the order is stored and marked PAID
    order_resp = await client.get(
        f"/pos/orders/{data['order_id']}",
        headers=auth_headers,
    )
    assert order_resp.status_code == 200
    assert order_resp.json()["status"] == "paid"
    assert order_resp.json()["customer_name"] == "Quick Checkout Customer"


async def test_get_pos_stats(client, auth_headers, test_restaurant, test_dish):
    """GET /pos/stats returns the expected stats structure."""
    # Create a paid order via quick checkout so there is data
    await client.post(
        "/pos/checkout",
        json={
            "restaurant_id": test_restaurant.id,
            "items": [{"dish_id": test_dish.id, "quantity": 1}],
            "payment_method": "cash",
            "customer_name": "Stats Customer",
        },
        headers=auth_headers,
    )

    # The POS stores use datetime.utcnow() for created_at, while
    # the stats endpoint defaults to date.today() (local tz).
    # Pass the explicit UTC date to avoid timezone mismatches.
    utc_today = datetime.utcnow().strftime("%Y-%m-%d")

    resp = await client.get(
        "/pos/stats",
        params={
            "restaurant_id": test_restaurant.id,
            "stats_date": utc_today,
        },
        headers=auth_headers,
    )
    assert resp.status_code == 200
    data = resp.json()

    # Validate response structure
    assert "date" in data
    assert "total_revenue" in data
    assert "total_orders" in data
    assert "average_ticket" in data
    assert "orders_by_status" in data
    assert "top_selling_items" in data
    assert "hourly_breakdown" in data

    # There should be at least 1 order
    assert data["total_orders"] >= 1
    assert data["total_revenue"] > 0
    assert data["average_ticket"] > 0

    # orders_by_status should contain all status keys
    for status_key in ("pending", "in_progress", "ready", "served", "paid", "cancelled"):
        assert status_key in data["orders_by_status"]
