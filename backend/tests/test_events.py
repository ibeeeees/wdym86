"""
Tests for the /events router.

All event endpoints require authentication (get_current_user dependency).
Uses the auth_headers fixture to provide a valid JWT.
"""


async def test_get_active_events_initially_empty(client, auth_headers):
    """GET /events/active returns an empty event list when nothing has been simulated."""
    resp = await client.get("/events/active", headers=auth_headers)
    assert resp.status_code == 200

    data = resp.json()
    assert "events" in data
    assert isinstance(data["events"], list)
    assert "disruption_signals" in data
    assert "recommendations" in data
    assert "timestamp" in data


async def test_simulate_events(client, auth_headers):
    """POST /events/simulate generates the requested number of events."""
    resp = await client.post(
        "/events/simulate",
        json={"num_events": 2},
        headers=auth_headers,
    )
    assert resp.status_code == 200

    data = resp.json()
    assert "simulated_events" in data
    assert isinstance(data["simulated_events"], list)
    assert len(data["simulated_events"]) == 2
    assert "disruption_signals" in data
    assert "recommendations" in data
    assert "message" in data


async def test_get_disruption_signals(client, auth_headers):
    """GET /events/disruption-signals returns structured disruption data."""
    resp = await client.get("/events/disruption-signals", headers=auth_headers)
    assert resp.status_code == 200

    data = resp.json()
    assert "signals" in data
    signals = data["signals"]
    assert "weather_risk" in signals
    assert "traffic_risk" in signals
    assert "hazard_flag" in signals

    assert "demand_impact" in data
    assert "supply_chain_impact" in data
    assert "overall_severity" in data


async def test_clear_events(client, auth_headers):
    """DELETE /events/clear resets all simulated events."""
    # Simulate some events first
    await client.post(
        "/events/simulate",
        json={"num_events": 3},
        headers=auth_headers,
    )

    resp = await client.delete("/events/clear", headers=auth_headers)
    assert resp.status_code == 200

    data = resp.json()
    assert data["message"] == "All simulated events cleared"

    # Verify events are actually cleared
    active = await client.get("/events/active", headers=auth_headers)
    assert active.status_code == 200
    assert len(active.json()["events"]) == 0


async def test_get_event_scenarios(client, auth_headers):
    """GET /events/scenarios returns preset scenario options."""
    resp = await client.get("/events/scenarios", headers=auth_headers)
    assert resp.status_code == 200

    data = resp.json()
    assert "scenarios" in data
    scenarios = data["scenarios"]
    assert isinstance(scenarios, list)
    assert len(scenarios) > 0

    # Each scenario should have the expected shape
    first = scenarios[0]
    assert "id" in first
    assert "name" in first
    assert "description" in first
    assert "events" in first
    assert "impact_summary" in first
