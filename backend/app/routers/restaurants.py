"""Restaurants router"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List

from ..database import get_session, Restaurant as RestaurantDB, User as UserDB
from ..models.restaurant import Restaurant, RestaurantCreate
from .auth import get_current_user

router = APIRouter()


@router.get("/", response_model=List[Restaurant])
async def list_restaurants(
    current_user: UserDB = Depends(get_current_user),
    db: AsyncSession = Depends(get_session)
):
    """List all restaurants for current user"""
    result = await db.execute(
        select(RestaurantDB).where(RestaurantDB.user_id == current_user.id)
    )
    return result.scalars().all()


@router.post("/", response_model=Restaurant)
async def create_restaurant(
    restaurant_data: RestaurantCreate,
    current_user: UserDB = Depends(get_current_user),
    db: AsyncSession = Depends(get_session)
):
    """Create a new restaurant"""
    restaurant = RestaurantDB(
        user_id=current_user.id,
        name=restaurant_data.name,
        location=restaurant_data.location
    )
    db.add(restaurant)
    await db.commit()
    await db.refresh(restaurant)
    return restaurant


@router.get("/{restaurant_id}", response_model=Restaurant)
async def get_restaurant(
    restaurant_id: str,
    current_user: UserDB = Depends(get_current_user),
    db: AsyncSession = Depends(get_session)
):
    """Get restaurant by ID"""
    result = await db.execute(
        select(RestaurantDB).where(
            RestaurantDB.id == restaurant_id,
            RestaurantDB.user_id == current_user.id
        )
    )
    restaurant = result.scalar_one_or_none()
    if not restaurant:
        raise HTTPException(status_code=404, detail="Restaurant not found")
    return restaurant
