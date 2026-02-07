"""Dishes and recipes router"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from typing import List, Optional
from pydantic import BaseModel

from ..database import (
    get_session,
    Dish as DishDB,
    Recipe as RecipeDB,
    Ingredient as IngredientDB,
    Restaurant as RestaurantDB,
    User as UserDB
)
from .auth import get_current_user

router = APIRouter()


class RecipeIngredient(BaseModel):
    id: str
    ingredient_id: str
    ingredient_name: str
    quantity: float
    unit: str


class DishResponse(BaseModel):
    id: str
    name: str
    category: str
    price: float
    is_active: bool
    recipe: List[RecipeIngredient] = []

    class Config:
        from_attributes = True


class DishCreate(BaseModel):
    name: str
    category: str
    price: float


class RecipeCreate(BaseModel):
    ingredient_id: str
    quantity: float


@router.get("/", response_model=List[DishResponse])
async def list_dishes(
    restaurant_id: str = Query(..., description="Restaurant ID"),
    current_user: UserDB = Depends(get_current_user),
    db: AsyncSession = Depends(get_session)
):
    """List all dishes with their recipes for a restaurant"""
    result = await db.execute(
        select(DishDB).where(DishDB.restaurant_id == restaurant_id)
    )
    dishes = result.scalars().all()

    dish_responses = []
    for dish in dishes:
        # Get recipe for this dish
        recipe_result = await db.execute(
            select(RecipeDB, IngredientDB)
            .join(IngredientDB, RecipeDB.ingredient_id == IngredientDB.id)
            .where(RecipeDB.dish_id == dish.id)
        )
        recipe_items = recipe_result.all()

        recipe = [
            RecipeIngredient(
                id=r.Recipe.id,
                ingredient_id=r.Recipe.ingredient_id,
                ingredient_name=r.Ingredient.name,
                quantity=r.Recipe.quantity,
                unit=r.Ingredient.unit
            )
            for r in recipe_items
        ]

        dish_responses.append(DishResponse(
            id=dish.id,
            name=dish.name,
            category=dish.category or "Main",
            price=dish.price or 0,
            is_active=dish.is_active,
            recipe=recipe
        ))

    return dish_responses


@router.post("/", response_model=DishResponse)
async def create_dish(
    restaurant_id: str,
    dish_data: DishCreate,
    current_user: UserDB = Depends(get_current_user),
    db: AsyncSession = Depends(get_session)
):
    """Create a new dish"""
    dish = DishDB(
        restaurant_id=restaurant_id,
        name=dish_data.name,
        category=dish_data.category,
        price=dish_data.price,
        is_active=True
    )
    db.add(dish)
    await db.commit()
    await db.refresh(dish)

    return DishResponse(
        id=dish.id,
        name=dish.name,
        category=dish.category or "Main",
        price=dish.price or 0,
        is_active=dish.is_active,
        recipe=[]
    )


@router.get("/{dish_id}", response_model=DishResponse)
async def get_dish(
    dish_id: str,
    current_user: UserDB = Depends(get_current_user),
    db: AsyncSession = Depends(get_session)
):
    """Get a single dish with its recipe"""
    result = await db.execute(
        select(DishDB).where(DishDB.id == dish_id)
    )
    dish = result.scalar_one_or_none()
    if not dish:
        raise HTTPException(status_code=404, detail="Dish not found")

    # Get recipe
    recipe_result = await db.execute(
        select(RecipeDB, IngredientDB)
        .join(IngredientDB, RecipeDB.ingredient_id == IngredientDB.id)
        .where(RecipeDB.dish_id == dish.id)
    )
    recipe_items = recipe_result.all()

    recipe = [
        RecipeIngredient(
            id=r.Recipe.id,
            ingredient_id=r.Recipe.ingredient_id,
            ingredient_name=r.Ingredient.name,
            quantity=r.Recipe.quantity,
            unit=r.Ingredient.unit
        )
        for r in recipe_items
    ]

    return DishResponse(
        id=dish.id,
        name=dish.name,
        category=dish.category or "Main",
        price=dish.price or 0,
        is_active=dish.is_active,
        recipe=recipe
    )


@router.put("/{dish_id}")
async def update_dish(
    dish_id: str,
    dish_data: DishCreate,
    current_user: UserDB = Depends(get_current_user),
    db: AsyncSession = Depends(get_session)
):
    """Update a dish"""
    result = await db.execute(
        select(DishDB).where(DishDB.id == dish_id)
    )
    dish = result.scalar_one_or_none()
    if not dish:
        raise HTTPException(status_code=404, detail="Dish not found")

    dish.name = dish_data.name
    dish.category = dish_data.category
    dish.price = dish_data.price
    await db.commit()

    return {"status": "updated"}


@router.delete("/{dish_id}")
async def delete_dish(
    dish_id: str,
    current_user: UserDB = Depends(get_current_user),
    db: AsyncSession = Depends(get_session)
):
    """Delete a dish"""
    result = await db.execute(
        select(DishDB).where(DishDB.id == dish_id)
    )
    dish = result.scalar_one_or_none()
    if not dish:
        raise HTTPException(status_code=404, detail="Dish not found")

    # Delete associated recipes first
    await db.execute(
        select(RecipeDB).where(RecipeDB.dish_id == dish_id)
    )

    await db.delete(dish)
    await db.commit()

    return {"status": "deleted"}


@router.put("/{dish_id}/active")
async def toggle_dish_active(
    dish_id: str,
    is_active: bool,
    current_user: UserDB = Depends(get_current_user),
    db: AsyncSession = Depends(get_session)
):
    """Toggle dish active status"""
    result = await db.execute(
        select(DishDB).where(DishDB.id == dish_id)
    )
    dish = result.scalar_one_or_none()
    if not dish:
        raise HTTPException(status_code=404, detail="Dish not found")

    dish.is_active = is_active
    await db.commit()

    return {"status": "updated", "is_active": is_active}


@router.post("/{dish_id}/recipe")
async def add_recipe_item(
    dish_id: str,
    recipe_data: RecipeCreate,
    current_user: UserDB = Depends(get_current_user),
    db: AsyncSession = Depends(get_session)
):
    """Add an ingredient to a dish's recipe"""
    # Verify dish exists
    result = await db.execute(
        select(DishDB).where(DishDB.id == dish_id)
    )
    dish = result.scalar_one_or_none()
    if not dish:
        raise HTTPException(status_code=404, detail="Dish not found")

    # Verify ingredient exists
    result = await db.execute(
        select(IngredientDB).where(IngredientDB.id == recipe_data.ingredient_id)
    )
    ingredient = result.scalar_one_or_none()
    if not ingredient:
        raise HTTPException(status_code=404, detail="Ingredient not found")

    # Check if recipe item already exists
    result = await db.execute(
        select(RecipeDB).where(
            RecipeDB.dish_id == dish_id,
            RecipeDB.ingredient_id == recipe_data.ingredient_id
        )
    )
    existing = result.scalar_one_or_none()
    if existing:
        existing.quantity = recipe_data.quantity
        await db.commit()
        return {"status": "updated"}

    # Create new recipe item
    recipe = RecipeDB(
        dish_id=dish_id,
        ingredient_id=recipe_data.ingredient_id,
        quantity=recipe_data.quantity
    )
    db.add(recipe)
    await db.commit()

    return {"status": "created"}


@router.delete("/{dish_id}/recipe/{ingredient_id}")
async def remove_recipe_item(
    dish_id: str,
    ingredient_id: str,
    current_user: UserDB = Depends(get_current_user),
    db: AsyncSession = Depends(get_session)
):
    """Remove an ingredient from a dish's recipe"""
    result = await db.execute(
        select(RecipeDB).where(
            RecipeDB.dish_id == dish_id,
            RecipeDB.ingredient_id == ingredient_id
        )
    )
    recipe = result.scalar_one_or_none()
    if not recipe:
        raise HTTPException(status_code=404, detail="Recipe item not found")

    await db.delete(recipe)
    await db.commit()

    return {"status": "deleted"}
