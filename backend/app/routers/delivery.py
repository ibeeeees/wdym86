"""
Delivery Services API Router

Endpoints for managing orders from delivery platforms:
- DoorDash, Uber Eats, Grubhub, Postmates, Seamless
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime
from enum import Enum

from ..services.delivery import (
    delivery_service,
    DeliveryPlatform,
    DeliveryOrderStatus,
    DeliveryOrder,
    DeliveryStats
)

router = APIRouter(prefix="/delivery", tags=["delivery"])


class OrderResponse(BaseModel):
    """Response model for delivery orders"""
    id: str
    platform: str
    external_id: str
    customer_name: str
    customer_phone: str
    customer_address: str
    items: List[Dict[str, Any]]
    subtotal: float
    delivery_fee: float
    tax: float
    tip: float
    total: float
    status: str
    estimated_delivery_time: Optional[datetime]
    driver_name: Optional[str]
    driver_phone: Optional[str]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class StatsResponse(BaseModel):
    """Response model for delivery statistics"""
    total_orders: int
    total_revenue: float
    avg_order_value: float
    by_platform: Dict[str, int]
    by_status: Dict[str, int]


class PlatformInfo(BaseModel):
    """Response model for platform information"""
    id: str
    name: str
    connected: bool
    icon: str
    color: str
    commission: str


class UpdateStatusRequest(BaseModel):
    """Request model for updating order status"""
    status: str


class CancelOrderRequest(BaseModel):
    """Request model for canceling an order"""
    reason: str


def order_to_response(order: DeliveryOrder) -> OrderResponse:
    """Convert DeliveryOrder dataclass to response model"""
    return OrderResponse(
        id=order.id,
        platform=order.platform.value,
        external_id=order.external_id,
        customer_name=order.customer_name,
        customer_phone=order.customer_phone,
        customer_address=order.customer_address,
        items=order.items,
        subtotal=order.subtotal,
        delivery_fee=order.delivery_fee,
        tax=order.tax,
        tip=order.tip,
        total=order.total,
        status=order.status.value,
        estimated_delivery_time=order.estimated_delivery_time,
        driver_name=order.driver_name,
        driver_phone=order.driver_phone,
        created_at=order.created_at,
        updated_at=order.updated_at
    )


@router.get("/orders", response_model=List[OrderResponse])
async def get_all_orders(status: Optional[str] = None):
    """Get all orders from all connected delivery platforms"""
    status_filter = None
    if status:
        try:
            status_filter = DeliveryOrderStatus(status)
        except ValueError:
            raise HTTPException(status_code=400, detail=f"Invalid status: {status}")

    orders = await delivery_service.get_all_orders(status_filter)
    return [order_to_response(order) for order in orders]


@router.get("/orders/{platform}", response_model=List[OrderResponse])
async def get_orders_by_platform(platform: str, status: Optional[str] = None):
    """Get orders from a specific delivery platform"""
    try:
        platform_enum = DeliveryPlatform(platform)
    except ValueError:
        raise HTTPException(status_code=400, detail=f"Invalid platform: {platform}")

    status_filter = None
    if status:
        try:
            status_filter = DeliveryOrderStatus(status)
        except ValueError:
            raise HTTPException(status_code=400, detail=f"Invalid status: {status}")

    orders = await delivery_service.get_orders_by_platform(platform_enum, status_filter)
    return [order_to_response(order) for order in orders]


@router.post("/orders/{platform}/{external_id}/accept")
async def accept_order(platform: str, external_id: str):
    """Accept an incoming order"""
    try:
        platform_enum = DeliveryPlatform(platform)
    except ValueError:
        raise HTTPException(status_code=400, detail=f"Invalid platform: {platform}")

    success = await delivery_service.accept_order(platform_enum, external_id)
    if not success:
        raise HTTPException(status_code=400, detail="Failed to accept order")

    return {"status": "accepted", "external_id": external_id}


@router.put("/orders/{platform}/{external_id}/status")
async def update_order_status(platform: str, external_id: str, request: UpdateStatusRequest):
    """Update order status"""
    try:
        platform_enum = DeliveryPlatform(platform)
    except ValueError:
        raise HTTPException(status_code=400, detail=f"Invalid platform: {platform}")

    try:
        status_enum = DeliveryOrderStatus(request.status)
    except ValueError:
        raise HTTPException(status_code=400, detail=f"Invalid status: {request.status}")

    success = await delivery_service.update_order_status(platform_enum, external_id, status_enum)
    if not success:
        raise HTTPException(status_code=400, detail="Failed to update order status")

    return {"status": request.status, "external_id": external_id}


@router.post("/orders/{platform}/{external_id}/cancel")
async def cancel_order(platform: str, external_id: str, request: CancelOrderRequest):
    """Cancel an order"""
    try:
        platform_enum = DeliveryPlatform(platform)
    except ValueError:
        raise HTTPException(status_code=400, detail=f"Invalid platform: {platform}")

    success = await delivery_service.cancel_order(platform_enum, external_id, request.reason)
    if not success:
        raise HTTPException(status_code=400, detail="Failed to cancel order")

    return {"status": "cancelled", "external_id": external_id, "reason": request.reason}


@router.get("/orders/{platform}/{external_id}/driver-location")
async def get_driver_location(platform: str, external_id: str):
    """Get driver's current location for an order"""
    try:
        platform_enum = DeliveryPlatform(platform)
    except ValueError:
        raise HTTPException(status_code=400, detail=f"Invalid platform: {platform}")

    location = await delivery_service.get_driver_location(platform_enum, external_id)
    if not location:
        raise HTTPException(status_code=404, detail="Driver location not available")

    return location


@router.get("/stats", response_model=StatsResponse)
async def get_delivery_stats():
    """Get aggregated statistics across all delivery platforms"""
    stats = await delivery_service.get_stats()
    return StatsResponse(
        total_orders=stats.total_orders,
        total_revenue=stats.total_revenue,
        avg_order_value=stats.avg_order_value,
        by_platform=stats.by_platform,
        by_status=stats.by_status
    )


@router.get("/platforms", response_model=List[PlatformInfo])
async def get_connected_platforms():
    """Get list of all delivery platforms with connection status"""
    platforms = delivery_service.get_connected_platforms()
    return [PlatformInfo(**p) for p in platforms]
