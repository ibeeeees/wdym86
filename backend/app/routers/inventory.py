"""Inventory router"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List
from datetime import datetime

from ..database import (
    get_session,
    InventoryState as InventoryDB,
    UsageHistory as UsageDB,
    Ingredient as IngredientDB,
    User as UserDB
)
from ..models.inventory import InventoryState, InventoryUpdate, UsageHistory, UsageHistoryCreate
from .auth import get_current_user

router = APIRouter()


@router.get("/{ingredient_id}", response_model=InventoryState)
async def get_inventory(
    ingredient_id: str,
    current_user: UserDB = Depends(get_current_user),
    db: AsyncSession = Depends(get_session)
):
    """Get current inventory for an ingredient"""
    result = await db.execute(
        select(InventoryDB)
        .where(InventoryDB.ingredient_id == ingredient_id)
        .order_by(InventoryDB.recorded_at.desc())
        .limit(1)
    )
    inventory = result.scalar_one_or_none()
    if not inventory:
        raise HTTPException(status_code=404, detail="No inventory record found")
    return inventory


@router.post("/{ingredient_id}", response_model=InventoryState)
async def update_inventory(
    ingredient_id: str,
    inventory_data: InventoryUpdate,
    current_user: UserDB = Depends(get_current_user),
    db: AsyncSession = Depends(get_session)
):
    """Update inventory level for an ingredient"""
    # Verify ingredient exists
    result = await db.execute(
        select(IngredientDB).where(IngredientDB.id == ingredient_id)
    )
    if not result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Ingredient not found")

    inventory = InventoryDB(
        ingredient_id=ingredient_id,
        quantity=inventory_data.quantity
    )
    db.add(inventory)
    await db.commit()
    await db.refresh(inventory)
    return inventory


@router.get("/{ingredient_id}/history", response_model=List[InventoryState])
async def get_inventory_history(
    ingredient_id: str,
    limit: int = 30,
    current_user: UserDB = Depends(get_current_user),
    db: AsyncSession = Depends(get_session)
):
    """Get inventory history for an ingredient"""
    result = await db.execute(
        select(InventoryDB)
        .where(InventoryDB.ingredient_id == ingredient_id)
        .order_by(InventoryDB.recorded_at.desc())
        .limit(limit)
    )
    return result.scalars().all()


@router.get("/{ingredient_id}/usage", response_model=List[UsageHistory])
async def get_usage_history(
    ingredient_id: str,
    limit: int = 90,
    current_user: UserDB = Depends(get_current_user),
    db: AsyncSession = Depends(get_session)
):
    """Get usage history for an ingredient (for training)"""
    result = await db.execute(
        select(UsageDB)
        .where(UsageDB.ingredient_id == ingredient_id)
        .order_by(UsageDB.date.desc())
        .limit(limit)
    )
    return result.scalars().all()


@router.post("/{ingredient_id}/usage", response_model=UsageHistory)
async def record_usage(
    ingredient_id: str,
    usage_data: UsageHistoryCreate,
    current_user: UserDB = Depends(get_current_user),
    db: AsyncSession = Depends(get_session)
):
    """Record usage data for an ingredient"""
    usage = UsageDB(
        ingredient_id=ingredient_id,
        date=usage_data.date,
        quantity_used=usage_data.quantity_used,
        event_flag=usage_data.event_flag,
        weather_severity=usage_data.weather_severity,
        traffic_index=usage_data.traffic_index,
        hazard_flag=usage_data.hazard_flag
    )
    db.add(usage)
    await db.commit()
    await db.refresh(usage)
    return usage
