"""
Disruption Router — Automated Only

Users NEVER trigger disruptions manually.
All disruption data is auto-generated per restaurant/day using
deterministic seeding. The engine runs on read — nothing is "simulated."
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import date, datetime, timedelta
from typing import Optional, List

from ..database import (
    get_session, DisruptionLog, Restaurant, Ingredient, Dish, Recipe
)
from ..services.disruption_engine import AutomatedDisruptionEngine

router = APIRouter(prefix="/disruptions", tags=["disruptions"])


async def _get_restaurant(db: AsyncSession, restaurant_id: str) -> dict:
    result = await db.execute(
        select(Restaurant).where(Restaurant.id == restaurant_id)
    )
    r = result.scalar_one_or_none()
    if not r:
        raise HTTPException(404, "Restaurant not found")
    return r


@router.get("/{restaurant_id}/today")
async def get_todays_disruptions(
    restaurant_id: str,
    db: AsyncSession = Depends(get_session),
):
    """
    Get automatically generated disruptions for today.
    These are deterministic per restaurant per day — never user-controlled.
    """
    restaurant = await _get_restaurant(db, restaurant_id)

    engine = AutomatedDisruptionEngine(
        restaurant_id=restaurant_id,
        location=restaurant.location or "Unknown",
        region=_infer_region(restaurant.location),
    )

    today = date.today()
    disruptions = engine.generate_disruptions(today)
    impact = engine.compute_aggregate_impact(disruptions)

    # Persist new disruptions if not already saved today
    existing = await db.execute(
        select(DisruptionLog).where(
            DisruptionLog.restaurant_id == restaurant_id,
            DisruptionLog.date == today.isoformat(),
        )
    )
    if not existing.scalars().first():
        for d in disruptions:
            log = DisruptionLog(
                restaurant_id=restaurant_id,
                date=today.isoformat(),
                disruption_type=d["type"],
                category=d["category"],
                severity=d["severity"],
                description=d["description"],
                affected_ingredients=str(d.get("affected_ingredients", [])),
                impact_score=d["impact_score"],
                auto_generated=True,
            )
            db.add(log)
        await db.commit()

    return {
        "date": today.isoformat(),
        "restaurant_id": restaurant_id,
        "disruptions": disruptions,
        "aggregate_impact": impact,
        "auto_generated": True,
        "note": "Disruptions are automatically generated based on regional patterns, supply chain data, and seasonal factors."
    }


@router.get("/{restaurant_id}/range")
async def get_disruptions_range(
    restaurant_id: str,
    start_date: str = Query(..., description="Start date (YYYY-MM-DD)"),
    end_date: str = Query(..., description="End date (YYYY-MM-DD)"),
    db: AsyncSession = Depends(get_session),
):
    """Get auto-generated disruptions for a date range (max 30 days)."""
    restaurant = await _get_restaurant(db, restaurant_id)

    try:
        start = date.fromisoformat(start_date)
        end = date.fromisoformat(end_date)
    except ValueError:
        raise HTTPException(400, "Invalid date format. Use YYYY-MM-DD.")

    if (end - start).days > 30:
        raise HTTPException(400, "Maximum range is 30 days.")
    if end < start:
        raise HTTPException(400, "end_date must be >= start_date.")

    engine = AutomatedDisruptionEngine(
        restaurant_id=restaurant_id,
        location=restaurant.location or "Unknown",
        region=_infer_region(restaurant.location),
    )

    all_disruptions = []
    current = start
    while current <= end:
        daily = engine.generate_disruptions(current)
        if daily:
            all_disruptions.append({
                "date": current.isoformat(),
                "disruptions": daily,
                "impact": engine.compute_aggregate_impact(daily),
            })
        current += timedelta(days=1)

    return {
        "restaurant_id": restaurant_id,
        "start_date": start_date,
        "end_date": end_date,
        "days_with_disruptions": len(all_disruptions),
        "total_days": (end - start).days + 1,
        "data": all_disruptions,
    }


@router.get("/{restaurant_id}/ingredient-risk")
async def get_ingredient_risk(
    restaurant_id: str,
    db: AsyncSession = Depends(get_session),
):
    """
    Assess risk for all ingredients in this restaurant's inventory.
    Risk is based on today's automated disruptions — never user-set.
    """
    restaurant = await _get_restaurant(db, restaurant_id)

    engine = AutomatedDisruptionEngine(
        restaurant_id=restaurant_id,
        location=restaurant.location or "Unknown",
        region=_infer_region(restaurant.location),
    )

    # Get restaurant's ingredients
    result = await db.execute(
        select(Ingredient).where(Ingredient.restaurant_id == restaurant_id)
    )
    ingredients = result.scalars().all()

    ingredient_list = [
        {"id": i.id, "name": i.name, "category": i.category}
        for i in ingredients
    ]

    disruptions = engine.generate_disruptions(date.today())
    risk_assessment = engine.get_ingredient_risk_assessment(ingredient_list, disruptions)

    return {
        "restaurant_id": restaurant_id,
        "date": date.today().isoformat(),
        "total_ingredients": len(ingredient_list),
        "risks": risk_assessment,
        "auto_generated": True,
    }


@router.get("/{restaurant_id}/menu-impact")
async def get_menu_impact(
    restaurant_id: str,
    db: AsyncSession = Depends(get_session),
):
    """
    Analyze how today's disruptions affect the menu.
    Identifies dishes at risk due to ingredient supply issues.
    """
    restaurant = await _get_restaurant(db, restaurant_id)

    engine = AutomatedDisruptionEngine(
        restaurant_id=restaurant_id,
        location=restaurant.location or "Unknown",
        region=_infer_region(restaurant.location),
    )

    # Get ingredients
    result = await db.execute(
        select(Ingredient).where(Ingredient.restaurant_id == restaurant_id)
    )
    ingredients = result.scalars().all()
    ingredient_list = [
        {"id": i.id, "name": i.name, "category": i.category}
        for i in ingredients
    ]

    # Get dishes with recipes
    result = await db.execute(
        select(Dish).where(Dish.restaurant_id == restaurant_id)
    )
    dishes = result.scalars().all()

    dish_list = []
    for dish in dishes:
        recipe_result = await db.execute(
            select(Recipe).where(Recipe.dish_id == dish.id)
        )
        recipes = recipe_result.scalars().all()
        dish_list.append({
            "id": dish.id,
            "name": dish.name,
            "category": dish.category,
            "ingredient_ids": [r.ingredient_id for r in recipes],
        })

    disruptions = engine.generate_disruptions(date.today())
    risk_assessment = engine.get_ingredient_risk_assessment(ingredient_list, disruptions)
    menu_impact = engine.get_menu_impact_analysis(dish_list, risk_assessment)

    return {
        "restaurant_id": restaurant_id,
        "date": date.today().isoformat(),
        "total_dishes": len(dish_list),
        "menu_impact": menu_impact,
        "auto_generated": True,
    }


@router.get("/{restaurant_id}/history")
async def get_disruption_history(
    restaurant_id: str,
    days: int = Query(7, ge=1, le=90),
    db: AsyncSession = Depends(get_session),
):
    """Get stored disruption history from the log."""
    cutoff = (date.today() - timedelta(days=days)).isoformat()
    result = await db.execute(
        select(DisruptionLog).where(
            DisruptionLog.restaurant_id == restaurant_id,
            DisruptionLog.date >= cutoff,
        ).order_by(DisruptionLog.date.desc())
    )
    logs = result.scalars().all()

    return {
        "restaurant_id": restaurant_id,
        "days": days,
        "total_events": len(logs),
        "history": [
            {
                "id": log.id,
                "date": log.date,
                "type": log.disruption_type,
                "category": log.category,
                "severity": log.severity,
                "description": log.description,
                "impact_score": log.impact_score,
                "auto_generated": log.auto_generated,
            }
            for log in logs
        ],
    }


def _infer_region(location: str) -> str:
    """Infer US region from location string for disruption patterns."""
    if not location:
        return "southeast"
    loc = location.lower()
    northeast = ["new york", "boston", "philadelphia", "dc", "baltimore", "connecticut", "new jersey", "maine", "vermont"]
    midwest = ["chicago", "detroit", "cleveland", "minneapolis", "st louis", "kansas city", "columbus", "indianapolis", "milwaukee"]
    west = ["los angeles", "san francisco", "seattle", "portland", "denver", "phoenix", "las vegas", "san diego", "sacramento"]
    for term in northeast:
        if term in loc:
            return "northeast"
    for term in midwest:
        if term in loc:
            return "midwest"
    for term in west:
        if term in loc:
            return "west_coast"
    return "southeast"
