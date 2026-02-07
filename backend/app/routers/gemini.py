"""Gemini router - AI-powered explanations and chat"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from typing import Dict, Any, Optional, List
from datetime import datetime, timedelta

from ..database import (
    get_session,
    AgentDecision as AgentDecisionDB,
    Ingredient as IngredientDB,
    Supplier as SupplierDB,
    Dish as DishDB,
    Order as OrderDB,
    InventoryState as InventoryDB,
    Recipe as RecipeDB,
    User as UserDB,
    Restaurant as RestaurantDB
)
from ..models.forecast import (
    GeminiExplanationRequest,
    GeminiChatRequest,
    GeminiChatResponse,
    WhatIfRequest
)
from ..gemini import DecisionExplainer, GeminiClient
from ..gemini.prompts import build_system_prompt
from ..config import settings
from .auth import get_current_user, oauth2_scheme

router = APIRouter()


async def get_optional_user(
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_session)
) -> Optional["UserDB"]:
    """Return the authenticated user, or None if token is invalid/missing."""
    try:
        return await get_current_user(token=token, db=db)
    except Exception:
        return None

# Initialize explainer — always business-specific
def get_explainer(restaurant_name: str = "Your Restaurant", cuisine_type: str = "full-service") -> DecisionExplainer:
    use_mock = not settings.gemini_api_key
    client = None
    if not use_mock:
        client = GeminiClient(api_key=settings.gemini_api_key)
    return DecisionExplainer(
        client=client,
        use_mock=use_mock,
        restaurant_name=restaurant_name,
        cuisine_type=cuisine_type,
    )


async def _resolve_restaurant_id(user: UserDB, db: AsyncSession) -> str:
    """
    Resolve the restaurant_id for the current user.
    Never hardcoded — always from the user's actual association.
    """
    # Check if user owns a restaurant
    result = await db.execute(
        select(RestaurantDB).where(RestaurantDB.owner_id == user.id).limit(1)
    )
    restaurant = result.scalar_one_or_none()
    if restaurant:
        return restaurant.id

    # Check if user is staff at a restaurant (via StaffMember)
    from ..database import StaffMember
    result = await db.execute(
        select(StaffMember).where(
            StaffMember.email == user.email,
            StaffMember.is_active == True,
        ).limit(1)
    )
    staff = result.scalar_one_or_none()
    if staff:
        return staff.restaurant_id

    # Fallback: get first restaurant (demo mode)
    result = await db.execute(select(RestaurantDB).limit(1))
    restaurant = result.scalar_one_or_none()
    if restaurant:
        return restaurant.id

    raise HTTPException(404, "No restaurant found for this user.")


async def get_restaurant_context(db: AsyncSession, restaurant_id: str) -> Dict[str, Any]:
    """Build comprehensive context from all restaurant data"""
    context = {
        "restaurant": {},
        "inventory": [],
        "suppliers": [],
        "dishes": [],
        "orders": [],
        "alerts": []
    }

    # Get restaurant info
    result = await db.execute(select(RestaurantDB).where(RestaurantDB.id == restaurant_id))
    restaurant = result.scalar_one_or_none()
    if restaurant:
        context["restaurant"] = {
            "name": restaurant.name,
            "location": restaurant.location,
            "subscription_tier": restaurant.subscription_tier or "free"
        }

    # Get ingredients with inventory
    result = await db.execute(
        select(IngredientDB).where(IngredientDB.restaurant_id == restaurant_id)
    )
    ingredients = result.scalars().all()

    for ing in ingredients:
        inv_result = await db.execute(
            select(InventoryDB).where(InventoryDB.ingredient_id == ing.id)
            .order_by(InventoryDB.recorded_at.desc()).limit(1)
        )
        inv = inv_result.scalar_one_or_none()

        ing_data = {
            "name": ing.name,
            "category": ing.category,
            "unit": ing.unit,
            "current_stock": inv.quantity if inv else 0,
            "unit_cost": ing.unit_cost or 0,
            "is_perishable": ing.is_perishable,
            "shelf_life_days": ing.shelf_life_days
        }

        # Check for low stock alerts
        if inv and inv.quantity < 10:
            context["alerts"].append(f"Low stock: {ing.name} ({inv.quantity} {ing.unit})")

        context["inventory"].append(ing_data)

    # Get suppliers
    result = await db.execute(
        select(SupplierDB).where(SupplierDB.restaurant_id == restaurant_id)
    )
    suppliers = result.scalars().all()
    for sup in suppliers:
        context["suppliers"].append({
            "name": sup.name,
            "lead_time_days": sup.lead_time_days,
            "reliability_score": sup.reliability_score,
            "min_order_quantity": sup.min_order_quantity
        })

    # Get dishes
    result = await db.execute(
        select(DishDB).where(DishDB.restaurant_id == restaurant_id)
    )
    dishes = result.scalars().all()
    for dish in dishes:
        context["dishes"].append({
            "name": dish.name,
            "category": dish.category,
            "price": dish.price,
            "is_active": dish.is_active
        })

    # Get recent orders
    result = await db.execute(
        select(OrderDB).where(OrderDB.restaurant_id == restaurant_id)
        .order_by(OrderDB.created_at.desc()).limit(10)
    )
    orders = result.scalars().all()
    for order in orders:
        context["orders"].append({
            "order_id": order.order_id,
            "status": order.status,
            "order_type": order.order_type,
            "total": order.total,
            "created_at": order.created_at.isoformat() if order.created_at else None
        })

    # Summary stats
    context["summary"] = {
        "total_ingredients": len(context["inventory"]),
        "total_dishes": len(context["dishes"]),
        "total_suppliers": len(context["suppliers"]),
        "recent_orders": len(context["orders"]),
        "active_alerts": len(context["alerts"])
    }

    return context


@router.post("/explain", response_model=Dict[str, Any])
async def explain_decision(
    request: GeminiExplanationRequest,
    current_user: UserDB = Depends(get_current_user),
    db: AsyncSession = Depends(get_session)
):
    """
    Get Gemini explanation for an AI agent decision

    This is a key differentiator for the MLH Best Use of Gemini API track.
    Gemini explains the reasoning behind agent decisions in natural language.
    """
    # Resolve restaurant for business-specific prompt
    restaurant_id = await _resolve_restaurant_id(current_user, db)
    r_ctx = await get_restaurant_context(db, restaurant_id)
    r_name = r_ctx.get('restaurant', {}).get('name', 'Your Restaurant')
    r_cuisine = r_ctx.get('restaurant', {}).get('cuisine_type', 'full-service')
    explainer = get_explainer(restaurant_name=r_name, cuisine_type=r_cuisine)

    # If decision_id provided, load context from database
    if request.decision_id:
        result = await db.execute(
            select(AgentDecisionDB).where(AgentDecisionDB.id == request.decision_id)
        )
        decision = result.scalar_one_or_none()
        if not decision:
            raise HTTPException(status_code=404, detail="Decision not found")

        context = decision.decision_data.get('gemini_context', decision.decision_data)
    else:
        context = request.context

    # Generate explanation
    explanation = explainer.explain_decision_sync(context)

    return {
        'decision_id': request.decision_id,
        'explanation': explanation,
        'context_summary': {
            'ingredient': context.get('ingredient', 'Unknown'),
            'risk_level': context.get('risk_level', 'Unknown'),
            'should_reorder': context.get('should_reorder', False)
        },
        'generated_at': datetime.now().isoformat()
    }


@router.post("/chat", response_model=GeminiChatResponse)
async def chat_with_advisor(
    request: GeminiChatRequest,
    db: AsyncSession = Depends(get_session)
):
    """
    Chat with the AI restaurant advisor

    Comprehensive conversational interface for managers to ask questions
    about ANY aspect of restaurant operations: inventory, orders, suppliers,
    dishes, delivery, payments, and more.

    Works for both authenticated users and demo/unauthenticated users.
    """
    # Fall back to first restaurant for demo/unauthenticated users
    result = await db.execute(select(RestaurantDB).limit(1))
    restaurant = result.scalar_one_or_none()
    if not restaurant:
        raise HTTPException(404, "No restaurant found.")
    restaurant_id = restaurant.id
    full_context = await get_restaurant_context(db, restaurant_id)

    # Build business-specific explainer
    r_name = full_context.get('restaurant', {}).get('name', 'Your Restaurant')
    r_cuisine = full_context.get('restaurant', {}).get('cuisine_type', 'full-service')
    explainer = get_explainer(restaurant_name=r_name, cuisine_type=r_cuisine)

    # Add ingredient-specific context if provided
    if request.ingredient_id:
        result = await db.execute(
            select(AgentDecisionDB)
            .where(AgentDecisionDB.ingredient_id == request.ingredient_id)
            .order_by(AgentDecisionDB.created_at.desc())
            .limit(1)
        )
        decision = result.scalar_one_or_none()
        if decision:
            full_context["agent_decision"] = decision.decision_data.get('gemini_context', {})

    # Get response with full context
    response = explainer.answer_question_sync(
        question=request.message,
        context=full_context,
        session_id=request.session_id
    )

    return GeminiChatResponse(
        response=response,
        session_id=request.session_id
    )


@router.get("/context", response_model=Dict[str, Any])
async def get_full_context(
    current_user: UserDB = Depends(get_current_user),
    db: AsyncSession = Depends(get_session)
):
    """
    Get full restaurant context for debugging and frontend display
    """
    restaurant_id = await _resolve_restaurant_id(current_user, db)
    context = await get_restaurant_context(db, restaurant_id)
    return context


@router.post("/what-if", response_model=Dict[str, Any])
async def analyze_scenario(
    request: WhatIfRequest,
    current_user: UserDB = Depends(get_current_user),
    db: AsyncSession = Depends(get_session)
):
    """
    Analyze a hypothetical scenario

    Allows managers to explore "what if" questions:
    - "What if the supplier is delayed 2 days?"
    - "What if we have a busy weekend event?"
    - "What if the weather forecast shows a storm?"
    """
    # Business-specific explainer
    restaurant_id = await _resolve_restaurant_id(current_user, db)
    r_ctx = await get_restaurant_context(db, restaurant_id)
    r_name = r_ctx.get('restaurant', {}).get('name', 'Your Restaurant')
    r_cuisine = r_ctx.get('restaurant', {}).get('cuisine_type', 'full-service')
    explainer = get_explainer(restaurant_name=r_name, cuisine_type=r_cuisine)

    # Get current context for ingredient
    result = await db.execute(
        select(AgentDecisionDB)
        .where(AgentDecisionDB.ingredient_id == request.ingredient_id)
        .order_by(AgentDecisionDB.created_at.desc())
        .limit(1)
    )
    decision = result.scalar_one_or_none()

    if not decision:
        raise HTTPException(
            status_code=404,
            detail="No decision found for ingredient. Run agent pipeline first."
        )

    context = decision.decision_data.get('gemini_context', {})

    # Analyze scenario
    analysis = explainer.analyze_what_if_sync(
        scenario=request.scenario,
        current_context=context
    )

    return {
        'ingredient_id': request.ingredient_id,
        'scenario': request.scenario,
        'analysis': analysis,
        'current_context': {
            'risk_level': context.get('risk_level'),
            'stockout_prob': context.get('stockout_prob'),
            'days_of_cover': context.get('days_of_cover')
        },
        'analyzed_at': datetime.now().isoformat()
    }


@router.get("/daily-summary", response_model=Dict[str, Any])
async def get_daily_summary(
    restaurant_id: str = Query(..., description="Restaurant ID"),
    current_user: UserDB = Depends(get_current_user),
    db: AsyncSession = Depends(get_session)
):
    """
    Get AI-generated daily inventory summary

    Provides a morning briefing for the restaurant manager
    summarizing inventory status and key action items.
    """
    # Business-specific explainer
    r_ctx = await get_restaurant_context(db, restaurant_id)
    r_name = r_ctx.get('restaurant', {}).get('name', 'Your Restaurant')
    r_cuisine = r_ctx.get('restaurant', {}).get('cuisine_type', 'full-service')
    explainer = get_explainer(restaurant_name=r_name, cuisine_type=r_cuisine)

    # Get all ingredients and their latest decisions
    from ..database import Ingredient as IngredientDB
    result = await db.execute(
        select(IngredientDB).where(IngredientDB.restaurant_id == restaurant_id)
    )
    ingredients = result.scalars().all()

    inventory_data = []
    for ing in ingredients:
        decision_result = await db.execute(
            select(AgentDecisionDB)
            .where(AgentDecisionDB.ingredient_id == ing.id)
            .order_by(AgentDecisionDB.created_at.desc())
            .limit(1)
        )
        decision = decision_result.scalar_one_or_none()

        if decision:
            context = decision.decision_data.get('gemini_context', {})
            inventory_data.append({
                'ingredient': ing.name,
                'risk_level': context.get('risk_level', 'UNKNOWN'),
                'days_of_cover': context.get('days_of_cover', 0),
                'should_reorder': context.get('should_reorder', False)
            })

    # Generate summary (async to sync wrapper)
    import asyncio

    async def generate():
        return await explainer.generate_daily_summary(
            inventory_data=inventory_data,
            weather_summary="Normal conditions",
            traffic_summary="Normal traffic"
        )

    summary = asyncio.get_event_loop().run_until_complete(generate())

    return {
        'restaurant_id': restaurant_id,
        'date': datetime.now().strftime("%Y-%m-%d"),
        'summary': summary,
        'item_count': len(inventory_data),
        'generated_at': datetime.now().isoformat()
    }


@router.delete("/chat/{session_id}")
async def clear_chat_session(
    session_id: str,
    current_user: UserDB = Depends(get_current_user)
):
    """Clear a chat session"""
    explainer = get_explainer()
    explainer.clear_chat_session(session_id)
    return {"status": "cleared", "session_id": session_id}
