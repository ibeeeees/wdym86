"""
Tests for Delivery Services endpoints (/delivery prefix).

All delivery endpoints are public (no auth required).

Covers:
- GET  /delivery/orders
- GET  /delivery/orders/{platform}
- GET  /delivery/stats
- GET  /delivery/platforms
- POST /delivery/orders/{platform}/{external_id}/accept
- PUT  /delivery/orders/{platform}/{external_id}/status
"""


async def test_get_all_delivery_orders(client):
    """GET /delivery/orders returns a list of orders from all platforms."""
    response = await client.get("/delivery/orders")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) > 0
    # Each order should have core fields
    order = data[0]
    assert "id" in order
    assert "platform" in order
    assert "external_id" in order
    assert "total" in order
    assert "status" in order


async def test_get_orders_by_platform(client):
    """GET /delivery/orders/{platform} returns orders for a specific platform."""
    response = await client.get("/delivery/orders/doordash")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) > 0
    for order in data:
        assert order["platform"] == "doordash"


async def test_get_delivery_stats(client):
    """GET /delivery/stats returns aggregated delivery statistics."""
    response = await client.get("/delivery/stats")
    assert response.status_code == 200
    data = response.json()
    assert "total_orders" in data
    assert "total_revenue" in data
    assert "avg_order_value" in data
    assert "by_platform" in data
    assert "by_status" in data
    assert data["total_orders"] > 0


async def test_get_platforms_list(client):
    """GET /delivery/platforms returns all delivery platforms with info."""
    response = await client.get("/delivery/platforms")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) > 0
    platform = data[0]
    assert "id" in platform
    assert "name" in platform
    assert "connected" in platform
    assert "commission" in platform


async def test_accept_delivery_order(client):
    """POST /delivery/orders/{platform}/{external_id}/accept accepts an order."""
    # First fetch orders to get a valid external_id
    orders_resp = await client.get("/delivery/orders/doordash")
    orders = orders_resp.json()
    assert len(orders) > 0

    external_id = orders[0]["external_id"]
    response = await client.post(
        f"/delivery/orders/doordash/{external_id}/accept"
    )
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "accepted"
    assert data["external_id"] == external_id


async def test_update_delivery_order_status(client):
    """PUT /delivery/orders/{platform}/{external_id}/status updates status."""
    # Fetch an order to get a valid external_id
    orders_resp = await client.get("/delivery/orders/doordash")
    orders = orders_resp.json()
    assert len(orders) > 0

    external_id = orders[0]["external_id"]
    response = await client.put(
        f"/delivery/orders/doordash/{external_id}/status",
        json={"status": "preparing"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "preparing"
    assert data["external_id"] == external_id
