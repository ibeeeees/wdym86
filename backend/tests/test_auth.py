"""Tests for the /auth router (registration, login, profile, onboarding)."""

import uuid


# ---- Registration --------------------------------------------------------

async def test_register_success(client):
    """Register a brand-new user and verify the response shape."""
    payload = {
        "email": f"newuser-{uuid.uuid4().hex[:8]}@example.com",
        "password": "strongpassword1",
        "name": "New User",
    }
    resp = await client.post("/auth/register", json=payload)
    assert resp.status_code == 200
    data = resp.json()
    assert data["email"] == payload["email"]
    assert data["name"] == payload["name"]
    assert "id" in data
    # Password hash must never leak to the client
    assert "password_hash" not in data
    assert "password" not in data


async def test_register_duplicate_email(client):
    """Registering the same email twice returns 400."""
    payload = {
        "email": "duplicate@example.com",
        "password": "password123",
        "name": "First",
    }
    resp1 = await client.post("/auth/register", json=payload)
    assert resp1.status_code == 200

    resp2 = await client.post("/auth/register", json=payload)
    assert resp2.status_code == 400
    assert "already registered" in resp2.json()["detail"].lower()


# ---- Login ---------------------------------------------------------------

async def test_login_success(client, test_user):
    """Login with correct credentials returns a bearer token."""
    resp = await client.post(
        "/auth/login",
        data={"username": "testuser@example.com", "password": "testpassword123"},
    )
    assert resp.status_code == 200
    body = resp.json()
    assert "access_token" in body
    assert body["token_type"] == "bearer"


async def test_login_wrong_password(client, test_user):
    """Login with an incorrect password returns 401."""
    resp = await client.post(
        "/auth/login",
        data={"username": "testuser@example.com", "password": "wrongpassword"},
    )
    assert resp.status_code == 401


# ---- GET /me -------------------------------------------------------------

async def test_get_me_authenticated(client, auth_headers, test_user):
    """GET /auth/me with a valid token returns the user profile."""
    resp = await client.get("/auth/me", headers=auth_headers)
    assert resp.status_code == 200
    data = resp.json()
    assert data["email"] == "testuser@example.com"
    assert data["id"] == test_user.id


async def test_get_me_no_token(client):
    """GET /auth/me without an Authorization header returns 401 or 403."""
    resp = await client.get("/auth/me")
    assert resp.status_code in (401, 403)


# ---- Onboarding ---------------------------------------------------------

async def test_complete_onboarding_creates_restaurant(client, auth_headers, test_user):
    """POST /auth/complete-onboarding should create a restaurant for the user."""
    payload = {
        "restaurant_name": "Onboarding Grill",
        "restaurant_location": "Athens, GA",
        "cuisine_type": "American",
        "subscription_tier": "starter",
    }
    resp = await client.post(
        "/auth/complete-onboarding", json=payload, headers=auth_headers
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "ok"
    assert "restaurant_id" in data

    # Verify the restaurant shows up in the restaurants list
    list_resp = await client.get("/restaurants/", headers=auth_headers)
    assert list_resp.status_code == 200
    restaurants = list_resp.json()
    names = [r["name"] for r in restaurants]
    assert "Onboarding Grill" in names
