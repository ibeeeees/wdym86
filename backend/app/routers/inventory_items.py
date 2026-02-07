"""
Full Inventory Items Router — Beyond Food

Tracks ALL restaurant inventory:
- Kitchen Equipment
- Serviceware & Disposables
- Cleaning & Facility
- Beverages (Bar)
- Staff Supplies

Low-stock alerts automatically feed into AI agent pipeline.
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from typing import Optional, List
from pydantic import BaseModel
from datetime import datetime

from ..database import get_session, InventoryItem, Restaurant
from ..services.full_inventory import (
    get_default_inventory_items, get_low_stock_alerts,
    get_inventory_value_summary, ALL_CATEGORIES, CATEGORY_LABELS,
)

router = APIRouter(prefix="/inventory-items", tags=["inventory-items"])


class InventoryItemCreate(BaseModel):
    name: str
    category: str  # kitchen_equipment, serviceware, cleaning, beverages, staff_supplies
    subcategory: str
    unit: str = "units"
    current_quantity: float = 0
    min_quantity: float = 0
    unit_cost: float = 0
    storage_location: str = ""
    supplier_id: Optional[str] = None
    notes: Optional[str] = None


class InventoryItemUpdate(BaseModel):
    current_quantity: Optional[float] = None
    min_quantity: Optional[float] = None
    unit_cost: Optional[float] = None
    storage_location: Optional[str] = None
    supplier_id: Optional[str] = None
    notes: Optional[str] = None
    status: Optional[str] = None


class InventoryAdjustment(BaseModel):
    item_id: str
    adjustment: float  # positive = add, negative = remove
    reason: str  # received, used, damaged, returned, counted


@router.get("/{restaurant_id}")
async def list_inventory_items(
    restaurant_id: str,
    category: Optional[str] = None,
    low_stock_only: bool = False,
    db: AsyncSession = Depends(get_session),
):
    """List all non-food inventory items with optional filtering."""
    query = select(InventoryItem).where(InventoryItem.restaurant_id == restaurant_id)
    if category:
        query = query.where(InventoryItem.category == category)

    result = await db.execute(query.order_by(InventoryItem.category, InventoryItem.name))
    items = result.scalars().all()

    item_dicts = [
        {
            "id": item.id,
            "name": item.name,
            "category": item.category,
            "subcategory": item.subcategory,
            "unit": item.unit,
            "current_quantity": item.current_quantity,
            "min_quantity": item.min_quantity,
            "unit_cost": item.unit_cost,
            "storage_location": item.storage_location,
            "supplier_id": item.supplier_id,
            "status": item.status,
            "last_restocked": item.last_restocked,
            "notes": item.notes,
        }
        for item in items
    ]

    if low_stock_only:
        item_dicts = [i for i in item_dicts if i["current_quantity"] <= i["min_quantity"]]

    return {
        "restaurant_id": restaurant_id,
        "total_items": len(item_dicts),
        "categories": CATEGORY_LABELS,
        "items": item_dicts,
    }


@router.post("/{restaurant_id}")
async def create_inventory_item(
    restaurant_id: str,
    data: InventoryItemCreate,
    db: AsyncSession = Depends(get_session),
):
    """Add a new non-food inventory item."""
    if data.category not in ALL_CATEGORIES:
        raise HTTPException(400, f"Invalid category. Must be one of: {list(ALL_CATEGORIES.keys())}")

    item = InventoryItem(
        restaurant_id=restaurant_id,
        name=data.name,
        category=data.category,
        subcategory=data.subcategory,
        unit=data.unit,
        current_quantity=data.current_quantity,
        min_quantity=data.min_quantity,
        unit_cost=data.unit_cost,
        storage_location=data.storage_location,
        supplier_id=data.supplier_id,
        status="in_stock" if data.current_quantity > data.min_quantity else "low" if data.current_quantity > 0 else "out_of_stock",
        notes=data.notes,
    )
    db.add(item)
    await db.commit()
    await db.refresh(item)

    return {"item": _serialize_item(item)}


@router.post("/{restaurant_id}/seed-defaults")
async def seed_default_inventory(
    restaurant_id: str,
    categories: Optional[List[str]] = Query(None),
    db: AsyncSession = Depends(get_session),
):
    """Seed inventory with default items for all or specific categories."""
    # Check if already seeded
    existing = await db.execute(
        select(func.count(InventoryItem.id)).where(
            InventoryItem.restaurant_id == restaurant_id
        )
    )
    existing_count = existing.scalar()
    if existing_count and existing_count > 0:
        raise HTTPException(400, "Inventory already seeded. Use individual create/update endpoints.")

    defaults = get_default_inventory_items(categories)
    created = []
    for d in defaults:
        item = InventoryItem(
            restaurant_id=restaurant_id,
            name=d["name"],
            category=d["category"],
            subcategory=d["subcategory"],
            unit=d["unit"],
            current_quantity=d["min_qty"] * 2,  # Start with 2x minimum
            min_quantity=d["min_qty"],
            unit_cost=d["cost"],
            storage_location=d.get("storage", ""),
            status="in_stock",
        )
        db.add(item)
        created.append(d["name"])

    await db.commit()
    return {
        "restaurant_id": restaurant_id,
        "items_created": len(created),
        "categories_seeded": categories or list(ALL_CATEGORIES.keys()),
        "items": created,
    }


@router.put("/{restaurant_id}/items/{item_id}")
async def update_inventory_item(
    restaurant_id: str,
    item_id: str,
    data: InventoryItemUpdate,
    db: AsyncSession = Depends(get_session),
):
    """Update an inventory item's details."""
    result = await db.execute(
        select(InventoryItem).where(
            InventoryItem.id == item_id,
            InventoryItem.restaurant_id == restaurant_id,
        )
    )
    item = result.scalar_one_or_none()
    if not item:
        raise HTTPException(404, "Inventory item not found")

    for field, value in data.dict(exclude_unset=True).items():
        if value is not None:
            setattr(item, field, value)

    # Auto-update status
    if item.current_quantity <= 0:
        item.status = "out_of_stock"
    elif item.current_quantity <= item.min_quantity:
        item.status = "low"
    else:
        item.status = "in_stock"

    await db.commit()
    await db.refresh(item)
    return {"item": _serialize_item(item)}


@router.post("/{restaurant_id}/adjust")
async def adjust_inventory(
    restaurant_id: str,
    data: InventoryAdjustment,
    db: AsyncSession = Depends(get_session),
):
    """
    Adjust inventory quantity with reason tracking.
    Positive adjustment = received/counted-up.
    Negative adjustment = used/damaged/returned.
    """
    result = await db.execute(
        select(InventoryItem).where(
            InventoryItem.id == data.item_id,
            InventoryItem.restaurant_id == restaurant_id,
        )
    )
    item = result.scalar_one_or_none()
    if not item:
        raise HTTPException(404, "Inventory item not found")

    old_qty = item.current_quantity
    item.current_quantity = max(0, item.current_quantity + data.adjustment)

    if data.adjustment > 0:
        item.last_restocked = datetime.utcnow().isoformat()

    # Auto-update status
    if item.current_quantity <= 0:
        item.status = "out_of_stock"
    elif item.current_quantity <= item.min_quantity:
        item.status = "low"
    else:
        item.status = "in_stock"

    await db.commit()
    await db.refresh(item)

    return {
        "item": _serialize_item(item),
        "adjustment": {
            "previous_quantity": old_qty,
            "adjustment_amount": data.adjustment,
            "new_quantity": item.current_quantity,
            "reason": data.reason,
        },
    }


@router.delete("/{restaurant_id}/items/{item_id}")
async def delete_inventory_item(
    restaurant_id: str,
    item_id: str,
    db: AsyncSession = Depends(get_session),
):
    """Remove an inventory item."""
    result = await db.execute(
        select(InventoryItem).where(
            InventoryItem.id == item_id,
            InventoryItem.restaurant_id == restaurant_id,
        )
    )
    item = result.scalar_one_or_none()
    if not item:
        raise HTTPException(404, "Inventory item not found")

    await db.delete(item)
    await db.commit()
    return {"deleted": True, "item_id": item_id}


@router.get("/{restaurant_id}/alerts")
async def get_inventory_alerts(
    restaurant_id: str,
    db: AsyncSession = Depends(get_session),
):
    """Get all low-stock and out-of-stock alerts for non-food inventory."""
    result = await db.execute(
        select(InventoryItem).where(
            InventoryItem.restaurant_id == restaurant_id,
        )
    )
    items = result.scalars().all()

    item_dicts = [
        {
            "name": item.name,
            "category": item.category,
            "current_quantity": item.current_quantity,
            "min_quantity": item.min_quantity,
            "unit": item.unit,
        }
        for item in items
    ]

    alerts = get_low_stock_alerts(item_dicts)
    return {
        "restaurant_id": restaurant_id,
        "total_alerts": len(alerts),
        "critical_count": len([a for a in alerts if a["urgency"] == "critical"]),
        "low_count": len([a for a in alerts if a["urgency"] == "low"]),
        "alerts": alerts,
    }


@router.get("/{restaurant_id}/value-summary")
async def get_value_summary(
    restaurant_id: str,
    db: AsyncSession = Depends(get_session),
):
    """Get total inventory value broken down by category."""
    result = await db.execute(
        select(InventoryItem).where(
            InventoryItem.restaurant_id == restaurant_id,
        )
    )
    items = result.scalars().all()

    item_dicts = [
        {
            "category": item.category,
            "current_quantity": item.current_quantity,
            "unit_cost": item.unit_cost,
        }
        for item in items
    ]

    summary = get_inventory_value_summary(item_dicts)
    return {
        "restaurant_id": restaurant_id,
        **summary,
    }


@router.get("/categories/list")
async def list_categories():
    """Get all inventory categories and their item templates."""
    return {
        "categories": CATEGORY_LABELS,
        "templates": {
            k: [{"name": i["name"], "subcategory": i["subcategory"], "unit": i["unit"]}
                for i in v]
            for k, v in ALL_CATEGORIES.items()
        },
    }


def _serialize_item(item: InventoryItem) -> dict:
    return {
        "id": item.id,
        "restaurant_id": item.restaurant_id,
        "name": item.name,
        "category": item.category,
        "subcategory": item.subcategory,
        "unit": item.unit,
        "current_quantity": item.current_quantity,
        "min_quantity": item.min_quantity,
        "unit_cost": item.unit_cost,
        "storage_location": item.storage_location,
        "supplier_id": item.supplier_id,
        "status": item.status,
        "last_restocked": item.last_restocked,
        "notes": item.notes,
    }
