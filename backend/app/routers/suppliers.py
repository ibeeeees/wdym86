"""Suppliers router"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List

from ..database import (
    get_session,
    Supplier as SupplierDB,
    Restaurant as RestaurantDB,
    User as UserDB
)
from ..models.supplier import Supplier, SupplierCreate
from .auth import get_current_user

router = APIRouter()


@router.get("/", response_model=List[Supplier])
async def list_suppliers(
    restaurant_id: str = Query(..., description="Restaurant ID"),
    current_user: UserDB = Depends(get_current_user),
    db: AsyncSession = Depends(get_session)
):
    """List all suppliers for a restaurant"""
    result = await db.execute(
        select(SupplierDB).where(SupplierDB.restaurant_id == restaurant_id)
    )
    return result.scalars().all()


@router.post("/", response_model=Supplier)
async def create_supplier(
    restaurant_id: str,
    supplier_data: SupplierCreate,
    current_user: UserDB = Depends(get_current_user),
    db: AsyncSession = Depends(get_session)
):
    """Create a new supplier"""
    supplier = SupplierDB(
        restaurant_id=restaurant_id,
        name=supplier_data.name,
        lead_time_days=supplier_data.lead_time_days,
        min_order_quantity=supplier_data.min_order_quantity,
        reliability_score=supplier_data.reliability_score,
        shipping_cost=supplier_data.shipping_cost
    )
    db.add(supplier)
    await db.commit()
    await db.refresh(supplier)
    return supplier


@router.get("/{supplier_id}", response_model=Supplier)
async def get_supplier(
    supplier_id: str,
    current_user: UserDB = Depends(get_current_user),
    db: AsyncSession = Depends(get_session)
):
    """Get supplier by ID"""
    result = await db.execute(
        select(SupplierDB).where(SupplierDB.id == supplier_id)
    )
    supplier = result.scalar_one_or_none()
    if not supplier:
        raise HTTPException(status_code=404, detail="Supplier not found")
    return supplier
