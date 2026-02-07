"""
Subscription Tier Models

Defines pricing tiers and feature limits for restaurants.
"""

from pydantic import BaseModel
from typing import Optional, List
from enum import Enum
from datetime import datetime


class SubscriptionTier(str, Enum):
    """Available subscription tiers"""
    FREE = "free"
    STARTER = "starter"
    PRO = "pro"
    ENTERPRISE = "enterprise"


class TierFeatures(BaseModel):
    """Features available at each tier"""
    tier: SubscriptionTier
    name: str
    price_monthly: float
    price_yearly: float

    # Limits
    max_ingredients: int
    max_suppliers: int
    max_dishes: int
    max_users: int
    max_locations: int

    # Features
    ai_forecasting: bool
    risk_alerts: bool
    reorder_recommendations: bool
    supplier_strategy: bool
    gemini_chat: bool
    delivery_integration: bool
    pos_system: bool
    api_access: bool
    custom_reports: bool
    priority_support: bool
    dedicated_account_manager: bool
    custom_integrations: bool

    # Data retention (days)
    data_retention_days: int

    # API rate limits (requests per hour)
    api_rate_limit: int


# Define tier configurations
TIER_CONFIGS: dict[SubscriptionTier, TierFeatures] = {
    SubscriptionTier.FREE: TierFeatures(
        tier=SubscriptionTier.FREE,
        name="Free",
        price_monthly=0,
        price_yearly=0,
        max_ingredients=10,
        max_suppliers=3,
        max_dishes=20,
        max_users=1,
        max_locations=1,
        ai_forecasting=True,
        risk_alerts=True,
        reorder_recommendations=False,
        supplier_strategy=False,
        gemini_chat=False,
        delivery_integration=False,
        pos_system=False,
        api_access=False,
        custom_reports=False,
        priority_support=False,
        dedicated_account_manager=False,
        custom_integrations=False,
        data_retention_days=30,
        api_rate_limit=100
    ),
    SubscriptionTier.STARTER: TierFeatures(
        tier=SubscriptionTier.STARTER,
        name="Starter",
        price_monthly=49,
        price_yearly=470,  # ~20% discount
        max_ingredients=50,
        max_suppliers=10,
        max_dishes=100,
        max_users=3,
        max_locations=1,
        ai_forecasting=True,
        risk_alerts=True,
        reorder_recommendations=True,
        supplier_strategy=False,
        gemini_chat=True,
        delivery_integration=False,
        pos_system=True,
        api_access=False,
        custom_reports=False,
        priority_support=False,
        dedicated_account_manager=False,
        custom_integrations=False,
        data_retention_days=90,
        api_rate_limit=500
    ),
    SubscriptionTier.PRO: TierFeatures(
        tier=SubscriptionTier.PRO,
        name="Pro",
        price_monthly=149,
        price_yearly=1430,  # ~20% discount
        max_ingredients=200,
        max_suppliers=50,
        max_dishes=500,
        max_users=10,
        max_locations=3,
        ai_forecasting=True,
        risk_alerts=True,
        reorder_recommendations=True,
        supplier_strategy=True,
        gemini_chat=True,
        delivery_integration=True,
        pos_system=True,
        api_access=True,
        custom_reports=True,
        priority_support=True,
        dedicated_account_manager=False,
        custom_integrations=False,
        data_retention_days=365,
        api_rate_limit=2000
    ),
    SubscriptionTier.ENTERPRISE: TierFeatures(
        tier=SubscriptionTier.ENTERPRISE,
        name="Enterprise",
        price_monthly=399,
        price_yearly=3830,  # ~20% discount
        max_ingredients=9999,  # Unlimited
        max_suppliers=9999,
        max_dishes=9999,
        max_users=9999,
        max_locations=9999,
        ai_forecasting=True,
        risk_alerts=True,
        reorder_recommendations=True,
        supplier_strategy=True,
        gemini_chat=True,
        delivery_integration=True,
        pos_system=True,
        api_access=True,
        custom_reports=True,
        priority_support=True,
        dedicated_account_manager=True,
        custom_integrations=True,
        data_retention_days=9999,  # Unlimited
        api_rate_limit=10000
    )
}


def get_tier_features(tier: SubscriptionTier) -> TierFeatures:
    """Get features for a specific tier"""
    return TIER_CONFIGS.get(tier, TIER_CONFIGS[SubscriptionTier.FREE])


def check_feature_access(tier: SubscriptionTier, feature: str) -> bool:
    """Check if a tier has access to a specific feature"""
    features = get_tier_features(tier)
    return getattr(features, feature, False)


def check_limit(tier: SubscriptionTier, limit_name: str, current_count: int) -> bool:
    """Check if within tier limits"""
    features = get_tier_features(tier)
    max_allowed = getattr(features, limit_name, 0)
    return current_count < max_allowed


class SubscriptionCreate(BaseModel):
    """Create subscription request"""
    tier: SubscriptionTier
    billing_cycle: str = "monthly"  # monthly or yearly
    payment_method_id: Optional[str] = None


class SubscriptionResponse(BaseModel):
    """Subscription response"""
    id: str
    restaurant_id: str
    tier: SubscriptionTier
    status: str
    billing_cycle: str
    current_period_start: datetime
    current_period_end: datetime
    features: TierFeatures
