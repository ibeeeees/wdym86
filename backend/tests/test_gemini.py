"""
Tests for Gemini AI advisor endpoints (/gemini prefix).

Covers:
- POST /gemini/chat (no auth required)
- GET  /gemini/context (auth required)
- GET  /gemini/disruption-forecast (no auth required)
- DELETE /gemini/chat/{session_id} (auth required)
"""

async def test_chat_with_advisor_no_auth(client, test_restaurant):
    """POST /gemini/chat succeeds without authentication."""
    response = await client.post(
        "/gemini/chat",
        json={"message": "What should I reorder today?", "session_id": "test"},
    )
    assert response.status_code == 200
    data = response.json()
    assert "response" in data
    assert data["session_id"] == "test"


async def test_get_full_context_with_auth(client, auth_headers, test_restaurant):
    """GET /gemini/context returns restaurant context for authenticated user."""
    response = await client.get("/gemini/context", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert "restaurant" in data
    assert "inventory" in data
    assert "disruptions" in data


async def test_disruption_forecast_no_auth(client, test_restaurant):
    """GET /gemini/disruption-forecast works without authentication."""
    response = await client.get("/gemini/disruption-forecast")
    assert response.status_code == 200
    data = response.json()
    assert "date" in data
    assert "disruptions" in data
    assert "aggregate_impact" in data
    assert "narrative" in data
    assert data["auto_generated"] is True


async def test_disruption_forecast_with_restaurant_id(
    client, test_restaurant
):
    """GET /gemini/disruption-forecast accepts optional restaurant_id param."""
    response = await client.get(
        "/gemini/disruption-forecast",
        params={"restaurant_id": test_restaurant.id},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["restaurant_id"] == test_restaurant.id
    assert data["location"] == "Athens, GA"


async def test_clear_chat_session_with_auth(client, auth_headers):
    """DELETE /gemini/chat/{session_id} clears session for authenticated user."""
    response = await client.delete(
        "/gemini/chat/test-session", headers=auth_headers
    )
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "cleared"
    assert data["session_id"] == "test-session"
