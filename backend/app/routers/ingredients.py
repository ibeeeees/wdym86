"""Ingredients router"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List, Optional

from ..database import (
    get_session,
    Ingredient as IngredientDB,
    Restaurant as RestaurantDB,
    InventoryState as InventoryDB,
    User as UserDB
)
from ..models.ingredient import Ingredient, IngredientCreate, IngredientWithInventory
from .auth import get_current_user

router = APIRouter()


@router.get("/", response_model=List[IngredientWithInventory])
async def list_ingredients(
    restaurant_id: str = Query(..., description="Restaurant ID"),
    current_user: UserDB = Depends(get_current_user),
    db: AsyncSession = Depends(get_session)
):
    """List all ingredients for a restaurant"""
    # Verify restaurant ownership
    result = await db.execute(
        select(RestaurantDB).where(
            RestaurantDB.id == restaurant_id,
            RestaurantDB.user_id == current_user.id
        )
    )
    if not result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Restaurant not found")

    # Get ingredients
    result = await db.execute(
        select(IngredientDB).where(IngredientDB.restaurant_id == restaurant_id)
    )
    ingredients = result.scalars().all()

    # Enrich with inventory data
    enriched = []
    for ing in ingredients:
        # Get latest inventory
        inv_result = await db.execute(
            select(InventoryDB)
            .where(InventoryDB.ingredient_id == ing.id)
            .order_by(InventoryDB.recorded_at.desc())
            .limit(1)
        )
        inv = inv_result.scalar_one_or_none()

        enriched.append(IngredientWithInventory(
            id=ing.id,
            restaurant_id=ing.restaurant_id,
            name=ing.name,
            unit=ing.unit,
            category=ing.category,
            shelf_life_days=ing.shelf_life_days,
            is_perishable=ing.is_perishable,
            unit_cost=ing.unit_cost,
            created_at=ing.created_at,
            current_inventory=inv.quantity if inv else 0
        ))

    return enriched


@router.post("/", response_model=Ingredient)
async def create_ingredient(
    restaurant_id: str,
    ingredient_data: IngredientCreate,
    current_user: UserDB = Depends(get_current_user),
    db: AsyncSession = Depends(get_session)
):
    """Create a new ingredient"""
    # Verify restaurant ownership
    result = await db.execute(
        select(RestaurantDB).where(
            RestaurantDB.id == restaurant_id,
            RestaurantDB.user_id == current_user.id
        )
    )
    if not result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Restaurant not found")

    ingredient = IngredientDB(
        restaurant_id=restaurant_id,
        name=ingredient_data.name,
        unit=ingredient_data.unit,
        category=ingredient_data.category,
        shelf_life_days=ingredient_data.shelf_life_days,
        is_perishable=ingredient_data.is_perishable,
        unit_cost=ingredient_data.unit_cost
    )
    db.add(ingredient)
    await db.commit()
    await db.refresh(ingredient)
    return ingredient


@router.get("/{ingredient_id}", response_model=IngredientWithInventory)
async def get_ingredient(
    ingredient_id: str,
    current_user: UserDB = Depends(get_current_user),
    db: AsyncSession = Depends(get_session)
):
    """Get ingredient by ID with current inventory"""
    result = await db.execute(
        select(IngredientDB).where(IngredientDB.id == ingredient_id)
    )
    ingredient = result.scalar_one_or_none()
    if not ingredient:
        raise HTTPException(status_code=404, detail="Ingredient not found")

    # Get latest inventory
    inv_result = await db.execute(
        select(InventoryDB)
        .where(InventoryDB.ingredient_id == ingredient_id)
        .order_by(InventoryDB.recorded_at.desc())
        .limit(1)
    )
    inv = inv_result.scalar_one_or_none()

    return IngredientWithInventory(
        id=ingredient.id,
        restaurant_id=ingredient.restaurant_id,
        name=ingredient.name,
        unit=ingredient.unit,
        category=ingredient.category,
        shelf_life_days=ingredient.shelf_life_days,
        is_perishable=ingredient.is_perishable,
        unit_cost=ingredient.unit_cost,
        created_at=ingredient.created_at,
        current_inventory=inv.quantity if inv else 0
    )
