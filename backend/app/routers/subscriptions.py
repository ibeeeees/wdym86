"""
Subscription Router

Endpoints for managing restaurant subscriptions and billing with Stripe integration.
"""

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List
from datetime import datetime, timedelta

from ..database import get_session, Restaurant, Subscription, User as UserDB
from ..models.subscription import (
    SubscriptionTier,
    TierFeatures,
    TIER_CONFIGS,
    get_tier_features,
    check_feature_access,
    SubscriptionCreate,
    SubscriptionResponse
)
from .auth import get_current_user
from ..services.stripe_service import stripe_service
from ..config import settings

router = APIRouter(prefix="/subscriptions", tags=["Subscriptions"])


@router.get("/tiers", response_model=List[dict])
async def get_all_tiers():
    """
    Get all available subscription tiers with features and pricing.

    Returns tier information for display on pricing page.
    """
    tiers = []
    for tier_enum, features in TIER_CONFIGS.items():
        tier_dict = features.model_dump()
        tier_dict["tier"] = tier_enum.value
        tier_dict["popular"] = tier_enum == SubscriptionTier.PRO
        tiers.append(tier_dict)
    return tiers


@router.get("/current", response_model=dict)
async def get_current_subscription(
    restaurant_id: str,
    current_user: UserDB = Depends(get_current_user),
    db: AsyncSession = Depends(get_session)
):
    """Get current subscription for a restaurant"""
    result = await db.execute(
        select(Subscription).where(Subscription.restaurant_id == restaurant_id)
    )
    subscription = result.scalar_one_or_none()

    if not subscription:
        # Return free tier if no subscription exists
        features = get_tier_features(SubscriptionTier.FREE)
        return {
            "tier": SubscriptionTier.FREE.value,
            "status": "active",
            "billing_cycle": "monthly",
            "features": features.model_dump(),
            "current_period_start": datetime.now().isoformat(),
            "current_period_end": (datetime.now() + timedelta(days=30)).isoformat()
        }

    features = get_tier_features(SubscriptionTier(subscription.tier))
    return {
        "id": subscription.id,
        "tier": subscription.tier,
        "status": subscription.status,
        "billing_cycle": subscription.billing_cycle,
        "features": features.model_dump(),
        "current_period_start": subscription.current_period_start.isoformat() if subscription.current_period_start else None,
        "current_period_end": subscription.current_period_end.isoformat() if subscription.current_period_end else None,
        "cancel_at_period_end": subscription.cancel_at_period_end
    }


@router.post("/subscribe", response_model=dict)
async def create_subscription(
    restaurant_id: str,
    request: SubscriptionCreate,
    current_user: UserDB = Depends(get_current_user),
    db: AsyncSession = Depends(get_session)
):
    """
    Create or update subscription for a restaurant using Stripe.
    
    This creates a Stripe Checkout Session for the user to complete payment.
    """
    # Verify restaurant exists and belongs to user
    result = await db.execute(
        select(Restaurant).where(Restaurant.id == restaurant_id)
    )
    restaurant = result.scalar_one_or_none()

    if not restaurant:
        raise HTTPException(status_code=404, detail="Restaurant not found")

    if restaurant.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")

    # Get or create Stripe customer
    result = await db.execute(
        select(Subscription).where(Subscription.restaurant_id == restaurant_id)
    )
    subscription = result.scalar_one_or_none()
    
    stripe_customer_id = None
    if subscription and subscription.stripe_customer_id:
        stripe_customer_id = subscription.stripe_customer_id
    else:
        # Create new Stripe customer
        try:
            customer = await stripe_service.create_customer(
                email=current_user.email,
                name=current_user.name or current_user.email,
                metadata={
                    "restaurant_id": restaurant_id,
                    "user_id": current_user.id
                }
            )
            stripe_customer_id = customer.get("id")
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to create customer: {str(e)}")
    
    # Get Stripe price ID for the tier
    price_id = stripe_service.get_price_id_for_tier(
        request.tier.value,
        request.billing_cycle
    )
    
    if not price_id:
        raise HTTPException(status_code=400, detail="Invalid tier or billing cycle")
    
    # Create Stripe Checkout Session
    try:
        success_url = f"{settings.frontend_url}/dashboard?subscription=success&restaurant_id={restaurant_id}"
        cancel_url = f"{settings.frontend_url}/pricing?subscription=cancelled"
        
        checkout_session = await stripe_service.create_checkout_session(
            customer_id=stripe_customer_id,
            price_id=price_id,
            success_url=success_url,
            cancel_url=cancel_url,
            metadata={
                "restaurant_id": restaurant_id,
                "user_id": current_user.id,
                "tier": request.tier.value,
                "billing_cycle": request.billing_cycle
            }
        )
        
        # Update or create subscription record (will be finalized by webhook)
        now = datetime.now()
        if request.billing_cycle == "yearly":
            period_end = now + timedelta(days=365)
        else:
            period_end = now + timedelta(days=30)
        
        if subscription:
            subscription.stripe_customer_id = stripe_customer_id
            subscription.tier = request.tier.value
            subscription.billing_cycle = request.billing_cycle
            subscription.status = "pending"  # Will be updated by webhook
            subscription.current_period_start = now
            subscription.current_period_end = period_end
        else:
            subscription = Subscription(
                restaurant_id=restaurant_id,
                tier=request.tier.value,
                billing_cycle=request.billing_cycle,
                stripe_customer_id=stripe_customer_id,
                status="pending",
                current_period_start=now,
                current_period_end=period_end
            )
            db.add(subscription)
        
        await db.commit()
        
        return {
            "success": True,
            "checkout_url": checkout_session.get("url"),
            "session_id": checkout_session.get("id"),
            "message": "Redirect to Stripe Checkout to complete payment"
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create checkout session: {str(e)}")


@router.post("/cancel", response_model=dict)
async def cancel_subscription(
    restaurant_id: str,
    current_user: UserDB = Depends(get_current_user),
    db: AsyncSession = Depends(get_session)
):
    """Cancel subscription at end of current period using Stripe"""
    result = await db.execute(
        select(Subscription).where(Subscription.restaurant_id == restaurant_id)
    )
    subscription = result.scalar_one_or_none()

    if not subscription:
        raise HTTPException(status_code=404, detail="No subscription found")
    
    if not subscription.stripe_subscription_id:
        # No Stripe subscription, just mark as cancelled locally
        subscription.cancel_at_period_end = True
        subscription.status = "canceled"
        await db.commit()
        return {
            "success": True,
            "message": "Subscription cancelled",
            "cancellation_date": subscription.current_period_end.isoformat() if subscription.current_period_end else None
        }
    
    # Cancel via Stripe
    try:
        stripe_subscription = await stripe_service.cancel_subscription(
            subscription.stripe_subscription_id,
            at_period_end=True
        )
        
        subscription.cancel_at_period_end = True
        await db.commit()

        return {
            "success": True,
            "message": "Subscription will be cancelled at end of billing period",
            "cancellation_date": subscription.current_period_end.isoformat() if subscription.current_period_end else None
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to cancel subscription: {str(e)}")


@router.get("/check-feature/{feature_name}", response_model=dict)
async def check_feature(
    restaurant_id: str,
    feature_name: str,
    current_user: UserDB = Depends(get_current_user),
    db: AsyncSession = Depends(get_session)
):
    """Check if restaurant has access to a specific feature"""
    result = await db.execute(
        select(Restaurant).where(Restaurant.id == restaurant_id)
    )
    restaurant = result.scalar_one_or_none()

    if not restaurant:
        raise HTTPException(status_code=404, detail="Restaurant not found")

    tier = SubscriptionTier(restaurant.subscription_tier or "free")
    has_access = check_feature_access(tier, feature_name)

    return {
        "feature": feature_name,
        "has_access": has_access,
        "current_tier": tier.value,
        "upgrade_required": not has_access
    }


@router.get("/usage", response_model=dict)
async def get_usage(
    restaurant_id: str,
    current_user: UserDB = Depends(get_current_user),
    db: AsyncSession = Depends(get_session)
):
    """Get current usage vs tier limits"""
    from ..database import Ingredient, Supplier, Dish

    result = await db.execute(
        select(Restaurant).where(Restaurant.id == restaurant_id)
    )
    restaurant = result.scalar_one_or_none()

    if not restaurant:
        raise HTTPException(status_code=404, detail="Restaurant not found")

    tier = SubscriptionTier(restaurant.subscription_tier or "free")
    features = get_tier_features(tier)

    # Count current usage
    ingredients_result = await db.execute(
        select(Ingredient).where(Ingredient.restaurant_id == restaurant_id)
    )
    ingredients_count = len(ingredients_result.scalars().all())

    suppliers_result = await db.execute(
        select(Supplier).where(Supplier.restaurant_id == restaurant_id)
    )
    suppliers_count = len(suppliers_result.scalars().all())

    dishes_result = await db.execute(
        select(Dish).where(Dish.restaurant_id == restaurant_id)
    )
    dishes_count = len(dishes_result.scalars().all())

    return {
        "tier": tier.value,
        "usage": {
            "ingredients": {
                "current": ingredients_count,
                "max": features.max_ingredients,
                "percentage": (ingredients_count / features.max_ingredients * 100) if features.max_ingredients > 0 else 0
            },
            "suppliers": {
                "current": suppliers_count,
                "max": features.max_suppliers,
                "percentage": (suppliers_count / features.max_suppliers * 100) if features.max_suppliers > 0 else 0
            },
            "dishes": {
                "current": dishes_count,
                "max": features.max_dishes,
                "percentage": (dishes_count / features.max_dishes * 100) if features.max_dishes > 0 else 0
            }
        }
    }
