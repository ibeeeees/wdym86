"""
Floor Plan & Table Layout Router

Drag-and-drop restaurant floor layouts with:
- Configurable restaurant size (preset or custom)
- Zones: dining, bar, patio, kitchen, storage, bathrooms
- Table definitions with capacity, shape, section, server, accessibility
- Real-time POS state sync
"""

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field
from datetime import datetime

from ..database import (
    get_session,
    FloorPlan as FloorPlanDB,
    FloorTable as FloorTableDB,
    Restaurant as RestaurantDB,
    User as UserDB,
    generate_uuid,
)
from .auth import get_current_user

router = APIRouter()


# ==========================================
# Pydantic Models
# ==========================================

class ZoneCreate(BaseModel):
    id: Optional[str] = None
    name: str
    zone_type: str  # dining, bar, patio, kitchen, storage, bathrooms
    x: float = 0
    y: float = 0
    width: float = 200
    height: float = 200
    color: Optional[str] = "#e5e7eb"


class FloorPlanCreate(BaseModel):
    name: str = "Main Floor"
    width: int = Field(default=800, ge=400, le=2000)
    height: int = Field(default=600, ge=300, le=1500)
    preset: Optional[str] = None  # "small", "medium", "large", "custom"
    zones: List[ZoneCreate] = []


class FloorPlanUpdate(BaseModel):
    name: Optional[str] = None
    width: Optional[int] = None
    height: Optional[int] = None
    zones: Optional[List[ZoneCreate]] = None


class FloorTableCreate(BaseModel):
    table_number: int
    label: Optional[str] = None
    capacity: int = Field(default=4, ge=1, le=20)
    shape: str = "square"  # square, round, rectangle, bar_stool
    section: str = "dining"  # dining, bar, patio, private
    zone_id: Optional[str] = None
    x: float = 0
    y: float = 0
    width: float = 80
    height: float = 80
    rotation: float = 0
    is_accessible: bool = False
    server_id: Optional[str] = None


class FloorTableUpdate(BaseModel):
    label: Optional[str] = None
    capacity: Optional[int] = None
    shape: Optional[str] = None
    section: Optional[str] = None
    zone_id: Optional[str] = None
    x: Optional[float] = None
    y: Optional[float] = None
    width: Optional[float] = None
    height: Optional[float] = None
    rotation: Optional[float] = None
    is_accessible: Optional[bool] = None
    server_id: Optional[str] = None
    status: Optional[str] = None


class FloorTableBatchUpdate(BaseModel):
    """Batch update positions after drag-and-drop"""
    tables: List[Dict[str, Any]]  # [{ id, x, y, rotation? }]


class FloorPlanResponse(BaseModel):
    id: str
    restaurant_id: str
    name: str
    width: int
    height: int
    zones: List[dict]
    is_active: bool
    tables: List[dict] = []
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


PRESET_LAYOUTS = {
    "small": {
        "width": 600,
        "height": 400,
        "zones": [
            {"name": "Dining Room", "zone_type": "dining", "x": 0, "y": 0, "width": 400, "height": 300, "color": "#fef3c7"},
            {"name": "Kitchen", "zone_type": "kitchen", "x": 400, "y": 0, "width": 200, "height": 200, "color": "#fee2e2"},
            {"name": "Bar", "zone_type": "bar", "x": 0, "y": 300, "width": 300, "height": 100, "color": "#dbeafe"},
            {"name": "Restrooms", "zone_type": "bathrooms", "x": 400, "y": 200, "width": 200, "height": 200, "color": "#f3e8ff"},
        ],
    },
    "medium": {
        "width": 800,
        "height": 600,
        "zones": [
            {"name": "Main Dining", "zone_type": "dining", "x": 0, "y": 0, "width": 500, "height": 400, "color": "#fef3c7"},
            {"name": "Kitchen", "zone_type": "kitchen", "x": 500, "y": 0, "width": 300, "height": 250, "color": "#fee2e2"},
            {"name": "Bar Area", "zone_type": "bar", "x": 0, "y": 400, "width": 400, "height": 200, "color": "#dbeafe"},
            {"name": "Patio", "zone_type": "patio", "x": 500, "y": 250, "width": 300, "height": 200, "color": "#d1fae5"},
            {"name": "Storage", "zone_type": "storage", "x": 500, "y": 450, "width": 150, "height": 150, "color": "#e5e7eb"},
            {"name": "Restrooms", "zone_type": "bathrooms", "x": 650, "y": 450, "width": 150, "height": 150, "color": "#f3e8ff"},
        ],
    },
    "large": {
        "width": 1200,
        "height": 800,
        "zones": [
            {"name": "Main Dining", "zone_type": "dining", "x": 0, "y": 0, "width": 600, "height": 500, "color": "#fef3c7"},
            {"name": "Private Dining", "zone_type": "dining", "x": 600, "y": 0, "width": 300, "height": 300, "color": "#fde68a"},
            {"name": "Kitchen", "zone_type": "kitchen", "x": 900, "y": 0, "width": 300, "height": 350, "color": "#fee2e2"},
            {"name": "Bar & Lounge", "zone_type": "bar", "x": 0, "y": 500, "width": 500, "height": 300, "color": "#dbeafe"},
            {"name": "Patio", "zone_type": "patio", "x": 600, "y": 300, "width": 300, "height": 300, "color": "#d1fae5"},
            {"name": "Storage", "zone_type": "storage", "x": 900, "y": 350, "width": 300, "height": 200, "color": "#e5e7eb"},
            {"name": "Restrooms", "zone_type": "bathrooms", "x": 900, "y": 550, "width": 300, "height": 250, "color": "#f3e8ff"},
            {"name": "Host Stand", "zone_type": "dining", "x": 500, "y": 500, "width": 100, "height": 300, "color": "#fef9c3"},
        ],
    },
}


# ==========================================
# Endpoints
# ==========================================

@router.post("/", response_model=FloorPlanResponse, status_code=status.HTTP_201_CREATED)
async def create_floor_plan(
    data: FloorPlanCreate,
    restaurant_id: str = Query(...),
    current_user: UserDB = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    """Create a new floor plan for a restaurant"""
    # Verify restaurant ownership
    result = await db.execute(
        select(RestaurantDB).where(RestaurantDB.id == restaurant_id, RestaurantDB.user_id == current_user.id)
    )
    if not result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Restaurant not found")

    # Apply preset if specified
    preset_data = PRESET_LAYOUTS.get(data.preset, {})
    width = preset_data.get("width", data.width)
    height = preset_data.get("height", data.height)

    zones_raw = preset_data.get("zones", []) if data.preset else [z.dict() for z in data.zones]
    # Assign ids to zones
    zones = []
    for z in zones_raw:
        z_dict = z if isinstance(z, dict) else z.dict()
        if not z_dict.get("id"):
            z_dict["id"] = generate_uuid()
        zones.append(z_dict)

    floor_plan = FloorPlanDB(
        restaurant_id=restaurant_id,
        name=data.name,
        width=width,
        height=height,
        zones=zones,
    )
    db.add(floor_plan)
    await db.flush()
    await db.refresh(floor_plan)

    return FloorPlanResponse(
        id=floor_plan.id,
        restaurant_id=restaurant_id,
        name=floor_plan.name,
        width=floor_plan.width,
        height=floor_plan.height,
        zones=floor_plan.zones or [],
        is_active=floor_plan.is_active,
        tables=[],
        created_at=floor_plan.created_at,
    )


@router.get("/", response_model=List[FloorPlanResponse])
async def list_floor_plans(
    restaurant_id: str = Query(...),
    current_user: UserDB = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    """List all floor plans for a restaurant"""
    result = await db.execute(
        select(FloorPlanDB).where(FloorPlanDB.restaurant_id == restaurant_id)
    )
    plans = result.scalars().all()

    response = []
    for plan in plans:
        # Get tables for this plan
        t_result = await db.execute(
            select(FloorTableDB).where(FloorTableDB.floor_plan_id == plan.id)
        )
        tables = t_result.scalars().all()
        table_dicts = [
            {
                "id": t.id, "table_number": t.table_number, "label": t.label or f"T{t.table_number}",
                "capacity": t.capacity, "shape": t.shape, "section": t.section,
                "zone_id": t.zone_id, "x": t.x, "y": t.y, "width": t.width,
                "height": t.height, "rotation": t.rotation, "is_accessible": t.is_accessible,
                "server_id": t.server_id, "status": t.status, "current_order_id": t.current_order_id,
            }
            for t in tables
        ]

        response.append(FloorPlanResponse(
            id=plan.id, restaurant_id=plan.restaurant_id, name=plan.name,
            width=plan.width, height=plan.height, zones=plan.zones or [],
            is_active=plan.is_active, tables=table_dicts, created_at=plan.created_at,
        ))
    return response


@router.put("/{plan_id}", response_model=FloorPlanResponse)
async def update_floor_plan(
    plan_id: str,
    data: FloorPlanUpdate,
    current_user: UserDB = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    """Update floor plan dimensions or zones"""
    result = await db.execute(select(FloorPlanDB).where(FloorPlanDB.id == plan_id))
    plan = result.scalar_one_or_none()
    if not plan:
        raise HTTPException(status_code=404, detail="Floor plan not found")

    if data.name is not None:
        plan.name = data.name
    if data.width is not None:
        plan.width = data.width
    if data.height is not None:
        plan.height = data.height
    if data.zones is not None:
        zones = []
        for z in data.zones:
            zd = z.dict()
            if not zd.get("id"):
                zd["id"] = generate_uuid()
            zones.append(zd)
        plan.zones = zones

    await db.flush()
    await db.refresh(plan)

    t_result = await db.execute(select(FloorTableDB).where(FloorTableDB.floor_plan_id == plan.id))
    tables = t_result.scalars().all()
    table_dicts = [
        {"id": t.id, "table_number": t.table_number, "label": t.label, "capacity": t.capacity,
         "shape": t.shape, "section": t.section, "zone_id": t.zone_id, "x": t.x, "y": t.y,
         "width": t.width, "height": t.height, "rotation": t.rotation,
         "is_accessible": t.is_accessible, "server_id": t.server_id,
         "status": t.status, "current_order_id": t.current_order_id}
        for t in tables
    ]

    return FloorPlanResponse(
        id=plan.id, restaurant_id=plan.restaurant_id, name=plan.name,
        width=plan.width, height=plan.height, zones=plan.zones or [],
        is_active=plan.is_active, tables=table_dicts, created_at=plan.created_at,
    )


# ---- Table CRUD ----

@router.post("/{plan_id}/tables", status_code=status.HTTP_201_CREATED)
async def add_table(
    plan_id: str,
    data: FloorTableCreate,
    current_user: UserDB = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    """Add a table to a floor plan"""
    result = await db.execute(select(FloorPlanDB).where(FloorPlanDB.id == plan_id))
    plan = result.scalar_one_or_none()
    if not plan:
        raise HTTPException(status_code=404, detail="Floor plan not found")

    table = FloorTableDB(
        floor_plan_id=plan_id,
        restaurant_id=plan.restaurant_id,
        table_number=data.table_number,
        label=data.label or f"T{data.table_number}",
        capacity=data.capacity,
        shape=data.shape,
        section=data.section,
        zone_id=data.zone_id,
        x=data.x,
        y=data.y,
        width=data.width,
        height=data.height,
        rotation=data.rotation,
        is_accessible=data.is_accessible,
        server_id=data.server_id,
    )
    db.add(table)
    await db.flush()
    await db.refresh(table)

    return {
        "id": table.id, "table_number": table.table_number, "label": table.label,
        "capacity": table.capacity, "shape": table.shape, "section": table.section,
        "zone_id": table.zone_id, "x": table.x, "y": table.y,
        "width": table.width, "height": table.height, "rotation": table.rotation,
        "is_accessible": table.is_accessible, "server_id": table.server_id,
        "status": table.status,
    }


@router.put("/tables/{table_id}")
async def update_table(
    table_id: str,
    data: FloorTableUpdate,
    current_user: UserDB = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    """Update a table's properties or position"""
    result = await db.execute(select(FloorTableDB).where(FloorTableDB.id == table_id))
    table = result.scalar_one_or_none()
    if not table:
        raise HTTPException(status_code=404, detail="Table not found")

    for field, value in data.dict(exclude_unset=True).items():
        setattr(table, field, value)

    await db.flush()
    await db.refresh(table)

    return {
        "id": table.id, "table_number": table.table_number, "label": table.label,
        "capacity": table.capacity, "shape": table.shape, "section": table.section,
        "zone_id": table.zone_id, "x": table.x, "y": table.y,
        "width": table.width, "height": table.height, "rotation": table.rotation,
        "is_accessible": table.is_accessible, "server_id": table.server_id,
        "status": table.status, "current_order_id": table.current_order_id,
    }


@router.post("/tables/batch-update")
async def batch_update_tables(
    data: FloorTableBatchUpdate,
    current_user: UserDB = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    """Batch update table positions after drag-and-drop"""
    updated = []
    for item in data.tables:
        tid = item.get("id")
        if not tid:
            continue
        result = await db.execute(select(FloorTableDB).where(FloorTableDB.id == tid))
        table = result.scalar_one_or_none()
        if not table:
            continue
        if "x" in item:
            table.x = item["x"]
        if "y" in item:
            table.y = item["y"]
        if "rotation" in item:
            table.rotation = item["rotation"]
        updated.append(tid)

    await db.flush()
    return {"updated": len(updated), "table_ids": updated}


@router.delete("/tables/{table_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_table(
    table_id: str,
    current_user: UserDB = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    """Remove a table from the floor plan"""
    result = await db.execute(select(FloorTableDB).where(FloorTableDB.id == table_id))
    table = result.scalar_one_or_none()
    if not table:
        raise HTTPException(status_code=404, detail="Table not found")
    await db.execute(delete(FloorTableDB).where(FloorTableDB.id == table_id))


@router.get("/presets")
async def get_floor_plan_presets():
    """Get available floor plan presets"""
    return {
        "presets": {
            name: {
                "width": p["width"],
                "height": p["height"],
                "zone_count": len(p["zones"]),
                "zone_types": [z["zone_type"] for z in p["zones"]],
            }
            for name, p in PRESET_LAYOUTS.items()
        }
    }
