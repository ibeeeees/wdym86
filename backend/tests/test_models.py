"""Tests for Pydantic model validation (sync, no DB or client needed)."""

from datetime import datetime

import pytest
from pydantic import ValidationError

from app.models.user import UserCreate, User, Token, OnboardingData
from app.models.restaurant import RestaurantCreate, Restaurant
from app.models.ingredient import IngredientCreate, Ingredient
from app.models.inventory import InventoryUpdate, UsageHistoryCreate


# ---- UserCreate ------------------------------------------------------------

def test_user_create_valid():
    """Valid email + password creates a UserCreate instance."""
    user = UserCreate(email="a@b.com", password="pass")
    assert user.email == "a@b.com"
    assert user.password == "pass"


def test_user_create_invalid_email():
    """Non-email string raises ValidationError."""
    with pytest.raises(ValidationError):
        UserCreate(email="not-an-email", password="pass")


# ---- RestaurantCreate ------------------------------------------------------

def test_restaurant_create():
    """RestaurantCreate requires only a name; location is optional."""
    r = RestaurantCreate(name="Test")
    assert r.name == "Test"
    assert r.location is None


# ---- IngredientCreate ------------------------------------------------------

def test_ingredient_create():
    """IngredientCreate with required fields and defaults."""
    ing = IngredientCreate(name="Salt", unit="lbs")
    assert ing.name == "Salt"
    assert ing.unit == "lbs"
    assert ing.category is None
    assert ing.is_perishable is False
    assert ing.unit_cost == 1.0


# ---- InventoryUpdate -------------------------------------------------------

def test_inventory_update():
    """InventoryUpdate holds a quantity float."""
    inv = InventoryUpdate(quantity=50.0)
    assert inv.quantity == 50.0


# ---- UsageHistoryCreate ----------------------------------------------------

def test_usage_history_create():
    """Valid UsageHistoryCreate with required and optional fields."""
    now = datetime.now()
    usage = UsageHistoryCreate(date=now, quantity_used=12.5)
    assert usage.date == now
    assert usage.quantity_used == 12.5
    assert usage.event_flag is False
    assert usage.weather_severity == 0
    assert usage.traffic_index == 0
    assert usage.hazard_flag is False


# ---- Token -----------------------------------------------------------------

def test_token_model():
    """Token stores access_token and token_type."""
    token = Token(access_token="abc", token_type="bearer")
    assert token.access_token == "abc"
    assert token.token_type == "bearer"


# ---- OnboardingData --------------------------------------------------------

def test_onboarding_data():
    """OnboardingData requires restaurant_name and accepts optionals."""
    data = OnboardingData(restaurant_name="Test")
    assert data.restaurant_name == "Test"


def test_onboarding_data_defaults():
    """Verify default values for all optional OnboardingData fields."""
    data = OnboardingData(restaurant_name="My Place")
    assert data.subscription_tier == "free"
    assert data.restaurant_location is None
    assert data.cuisine_type is None
    assert data.menu_items is None
    assert data.notifications_enabled is True
    assert data.theme_preference == "system"
    assert data.profile_picture_url is None
