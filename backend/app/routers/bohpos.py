"""
BOHPOS API Router

Endpoints for Back of House POS (kitchen display) system.
Implements 26.md specification for BOHPOS integration.
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime

from ..database import get_session
from ..services.bohpos_service import BOHPOSService

router = APIRouter(prefix="/bohpos", tags=["bohpos"])


# ==========================================
# Response Models
# ==========================================

class SentOrderResponse(BaseModel):
    sent_order_id: str
    check_id: str
    check_name: str
    check_number: str
    order_type: str
    items: List[Dict[str, Any]]
    item_count: int
    sent_at: datetime
    status: str
    completed_at: Optional[datetime]

    class Config:
        from_attributes = True


class BumpOrderRequest(BaseModel):
    user_id: str  # Kitchen staff who is bumping


# ==========================================
# API Endpoints
# ==========================================

@router.get("/orders/active", response_model=List[SentOrderResponse])
async def get_active_orders(
    restaurant_id: str,
    db: AsyncSession = Depends(get_session)
):
    """
    Get all active orders for BOHPOS display
    
    Returns orders with status "pending" or "in_progress",
    sorted by send time (oldest first).
    """
    try:
        service = BOHPOSService(db)
        orders = await service.get_active_orders(restaurant_id)
        
        return [
            SentOrderResponse(
                sent_order_id=order.id,
                check_id=order.check_id,
                check_name=order.check_name,
                check_number=order.check_number,
                order_type=order.order_type,
                items=order.items_data,
                item_count=order.item_count,
                sent_at=order.sent_at,
                status=order.status,
                completed_at=order.completed_at
            )
            for order in orders
        ]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get active orders: {str(e)}")


@router.get("/orders/recent", response_model=List[SentOrderResponse])
async def get_recent_orders(
    restaurant_id: str,
    limit: int = 50,
    db: AsyncSession = Depends(get_session)
):
    """
    Get recent completed orders
    
    Returns recently completed orders for reference,
    sorted by completion time (newest first).
    """
    try:
        service = BOHPOSService(db)
        orders = await service.get_recent_orders(restaurant_id, limit)
        
        return [
            SentOrderResponse(
                sent_order_id=order.id,
                check_id=order.check_id,
                check_name=order.check_name,
                check_number=order.check_number,
                order_type=order.order_type,
                items=order.items_data,
                item_count=order.item_count,
                sent_at=order.sent_at,
                status=order.status,
                completed_at=order.completed_at
            )
            for order in orders
        ]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get recent orders: {str(e)}")


@router.get("/orders/{sent_order_id}", response_model=SentOrderResponse)
async def get_sent_order(
    sent_order_id: str,
    db: AsyncSession = Depends(get_session)
):
    """Get details of a specific sent order"""
    try:
        service = BOHPOSService(db)
        order = await service.get_sent_order(sent_order_id)
        
        if not order:
            raise HTTPException(status_code=404, detail="Order not found")
        
        return SentOrderResponse(
            sent_order_id=order.id,
            check_id=order.check_id,
            check_name=order.check_name,
            check_number=order.check_number,
            order_type=order.order_type,
            items=order.items_data,
            item_count=order.item_count,
            sent_at=order.sent_at,
            status=order.status,
            completed_at=order.completed_at
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get order: {str(e)}")


@router.post("/orders/{sent_order_id}/bump")
async def bump_order(
    sent_order_id: str,
    request: BumpOrderRequest,
    db: AsyncSession = Depends(get_session)
):
    """
    Mark order as complete (bump order)
    
    Called when kitchen staff completes an order.
    Moves order from active to completed.
    """
    try:
        service = BOHPOSService(db)
        
        order = await service.bump_order(
            sent_order_id=sent_order_id,
            completed_by=request.user_id
        )
        
        return {
            "success": True,
            "sent_order_id": order.id,
            "check_name": order.check_name,
            "status": order.status,
            "completed_at": order.completed_at,
            "message": "Order marked as complete"
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to bump order: {str(e)}")


@router.post("/orders/{sent_order_id}/status")
async def update_order_status(
    sent_order_id: str,
    status: str,
    db: AsyncSession = Depends(get_session)
):
    """
    Update order status
    
    Allows changing status between "pending", "in_progress", "completed".
    Typically used to mark order as "in_progress" when kitchen starts working on it.
    """
    try:
        # Validate status
        valid_statuses = ["pending", "in_progress", "completed"]
        if status not in valid_statuses:
            raise ValueError(f"Invalid status. Must be one of: {', '.join(valid_statuses)}")
        
        service = BOHPOSService(db)
        order = await service.update_order_status(sent_order_id, status)
        
        return {
            "success": True,
            "sent_order_id": order.id,
            "status": order.status,
            "message": f"Order status updated to {status}"
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update status: {str(e)}")
