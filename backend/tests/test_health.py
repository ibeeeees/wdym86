"""
Tests for root and health check endpoints (no prefix, no auth).

Note: GET / is shadowed by the floor_plan router (registered without a prefix),
so it returns 401 without auth instead of app info. The health endpoint is
unaffected and works as expected.

Covers:
- GET / (floor plan list, requires auth -- shadows app root)
- GET /health (health check, no auth)
"""


async def test_root_requires_auth(client):
    """GET / returns 401 without auth (floor_plan router shadows app root)."""
    response = await client.get("/")
    assert response.status_code == 401


async def test_health_check_returns_healthy(client):
    """GET /health returns healthy status payload."""
    response = await client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"


async def test_health_check_returns_200(client):
    """GET /health returns HTTP 200."""
    response = await client.get("/health")
    assert response.status_code == 200
