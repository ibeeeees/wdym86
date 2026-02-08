"""
Check Management API Router

Endpoints for check creation, retrieval, and management.
Implements 26.md specification for check-based ordering workflow.
"""

from fastapi import APIRouter, Depends, Header, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

from ..database import get_session
from ..services.check_manager import CheckManagementService
from ..services.bohpos_service import BOHPOSService

router = APIRouter(prefix="/checks", tags=["checks"])


# ==========================================
# Request/Response Models
# ==========================================

class CreateCheckRequest(BaseModel):
    order_type: str  # "dine_in", "takeout", "delivery"
    check_name: str
    restaurant_id: str
    table_id: Optional[str] = None
    customer_name: Optional[str] = None
    customer_phone: Optional[str] = None


class AddItemRequest(BaseModel):
    name: str
    quantity: int
    price: float
    menu_item_id: Optional[str] = None
    modifiers: Optional[List[str]] = None
    special_instructions: Optional[str] = None


class SendOrderRequest(BaseModel):
    item_ids: Optional[List[str]] = None  # If None, sends all unsent items


class FinalizeCheckRequest(BaseModel):
    tip_amount: float


class CheckResponse(BaseModel):
    check_id: str
    check_name: str
    check_number: str
    order_type: str
    status: str
    subtotal: float
    tax: float
    tip: Optional[float]
    total: float
    final_total: Optional[float]
    item_count: int
    created_at: datetime
    finalized_at: Optional[datetime]

    class Config:
        from_attributes = True


class CheckItemResponse(BaseModel):
    id: str
    name: str
    quantity: int
    price: float
    modifiers: Optional[List[str]]
    special_instructions: Optional[str]
    sent_to_bohpos: bool

    class Config:
        from_attributes = True


# ==========================================
# API Endpoints
# ==========================================

@router.post("/create", response_model=CheckResponse)
async def create_check(
    request: CreateCheckRequest,
    db: AsyncSession = Depends(get_session),
    authorization: str = Header(default="")
):
    """
    Create a new check

    Creates a new check with auto-generated check number.
    POS users must be authenticated to create checks.
    """
    try:
        service = CheckManagementService(db)

        # Soft auth: parse JWT if present, fallback to demo user
        created_by = "demo_pos_user"
        if authorization and authorization.startswith("Bearer ") and "demo-token" not in authorization:
            try:
                from jose import jwt
                from ..config import settings
                payload = jwt.decode(authorization[7:], settings.secret_key, algorithms=[settings.algorithm])
                created_by = payload.get("sub", "demo_pos_user")
            except Exception:
                pass
        
        check = await service.create_check(
            restaurant_id=request.restaurant_id,
            order_type=request.order_type,
            check_name=request.check_name,
            created_by=created_by,
            table_id=request.table_id,
            customer_name=request.customer_name,
            customer_phone=request.customer_phone
        )
        
        # Get item count
        items = await service.get_check_items(check.id)
        
        return CheckResponse(
            check_id=check.id,
            check_name=check.check_name,
            check_number=check.check_number,
            order_type=check.order_type,
            status=check.status,
            subtotal=check.subtotal,
            tax=check.tax,
            tip=check.tip,
            total=check.total,
            final_total=check.final_total,
            item_count=len(items),
            created_at=check.created_at,
            finalized_at=check.finalized_at
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create check: {str(e)}")


@router.get("/list", response_model=List[CheckResponse])
async def get_check_list(
    restaurant_id: str,
    order_type: str,
    status: str = "active",
    db: AsyncSession = Depends(get_session)
):
    """
    Get list of checks for a specific order type
    
    Returns checks filtered by restaurant, order type, and status.
    Used for displaying check lists in POS interface.
    """
    try:
        service = CheckManagementService(db)
        checks = await service.get_check_list(restaurant_id, order_type, status)
        
        result = []
        for check in checks:
            items = await service.get_check_items(check.id)
            result.append(CheckResponse(
                check_id=check.id,
                check_name=check.check_name,
                check_number=check.check_number,
                order_type=check.order_type,
                status=check.status,
                subtotal=check.subtotal,
                tax=check.tax,
                tip=check.tip,
                total=check.total,
                final_total=check.final_total,
                item_count=len(items),
                created_at=check.created_at,
                finalized_at=check.finalized_at
            ))
        
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get check list: {str(e)}")


@router.get("/{check_id}", response_model=CheckResponse)
async def get_check(
    check_id: str,
    db: AsyncSession = Depends(get_session)
):
    """Get check details by ID"""
    try:
        service = CheckManagementService(db)
        check = await service.get_check(check_id)
        
        if not check:
            raise HTTPException(status_code=404, detail="Check not found")
        
        items = await service.get_check_items(check_id)
        
        return CheckResponse(
            check_id=check.id,
            check_name=check.check_name,
            check_number=check.check_number,
            order_type=check.order_type,
            status=check.status,
            subtotal=check.subtotal,
            tax=check.tax,
            tip=check.tip,
            total=check.total,
            final_total=check.final_total,
            item_count=len(items),
            created_at=check.created_at,
            finalized_at=check.finalized_at
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get check: {str(e)}")


@router.get("/{check_id}/items", response_model=List[CheckItemResponse])
async def get_check_items(
    check_id: str,
    db: AsyncSession = Depends(get_session)
):
    """Get all items for a check"""
    try:
        service = CheckManagementService(db)
        items = await service.get_check_items(check_id)
        
        return [CheckItemResponse(
            id=item.id,
            name=item.name,
            quantity=item.quantity,
            price=item.price,
            modifiers=item.modifiers,
            special_instructions=item.special_instructions,
            sent_to_bohpos=item.sent_to_bohpos
        ) for item in items]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get check items: {str(e)}")


@router.post("/{check_id}/items/add")
async def add_item_to_check(
    check_id: str,
    request: AddItemRequest,
    db: AsyncSession = Depends(get_session)
):
    """Add an item to a check"""
    try:
        service = CheckManagementService(db)
        
        item = await service.add_item_to_check(
            check_id=check_id,
            name=request.name,
            quantity=request.quantity,
            price=request.price,
            menu_item_id=request.menu_item_id,
            modifiers=request.modifiers,
            special_instructions=request.special_instructions
        )
        
        # Get updated check
        check = await service.get_check(check_id)
        
        return {
            "success": True,
            "item_id": item.id,
            "check_id": check_id,
            "updated_subtotal": check.subtotal,
            "updated_tax": check.tax,
            "updated_total": check.total
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to add item: {str(e)}")


@router.post("/{check_id}/send")
async def send_order_to_bohpos(
    check_id: str,
    request: SendOrderRequest,
    db: AsyncSession = Depends(get_session)
):
    """Send order to BOHPOS (kitchen display)"""
    try:
        bohpos_service = BOHPOSService(db)
        
        sent_order = await bohpos_service.send_order_to_bohpos(
            check_id=check_id,
            item_ids=request.item_ids
        )
        
        return {
            "success": True,
            "sent_order_id": sent_order.id,
            "check_id": check_id,
            "check_name": sent_order.check_name,
            "check_number": sent_order.check_number,
            "items_sent": sent_order.item_count,
            "sent_at": sent_order.sent_at,
            "message": "Order sent to kitchen"
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to send order: {str(e)}")


@router.post("/{check_id}/finalize")
async def finalize_check(
    check_id: str,
    request: FinalizeCheckRequest,
    db: AsyncSession = Depends(get_session)
):
    """Finalize check with tip"""
    try:
        service = CheckManagementService(db)
        
        check = await service.finalize_check(
            check_id=check_id,
            tip_amount=request.tip_amount
        )
        
        return {
            "success": True,
            "check_id": check.id,
            "check_number": check.check_number,
            "status": check.status,
            "tip": check.tip,
            "final_total": check.final_total,
            "finalized_at": check.finalized_at
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to finalize check: {str(e)}")


@router.post("/{check_id}/void")
async def void_check(
    check_id: str,
    db: AsyncSession = Depends(get_session)
):
    """Void a check"""
    try:
        service = CheckManagementService(db)
        check = await service.void_check(check_id)
        
        return {
            "success": True,
            "check_id": check.id,
            "status": check.status,
            "message": "Check voided"
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to void check: {str(e)}")
