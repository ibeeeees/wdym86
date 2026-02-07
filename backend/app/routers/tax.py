"""
Tax Calculation Router

Provides sales tax calculation endpoints using TaxJar API.
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel
from typing import Optional, Dict, Any, List
from datetime import datetime

from ..database import get_session, Restaurant
from ..services.taxjar_service import taxjar_service
from .auth import get_current_user
from ..database import User as UserDB

router = APIRouter(prefix="/tax", tags=["Tax Calculation"])


class TaxCalculationRequest(BaseModel):
    amount: float
    restaurant_id: str
    customer_address: Optional[Dict[str, str]] = None  # For delivery orders
    line_items: Optional[List[Dict[str, Any]]] = None
    shipping: float = 0.0


class TaxCalculationResponse(BaseModel):
    tax_amount: float
    tax_rate: float
    taxable_amount: float
    breakdown: Dict[str, Any]
    source: str  # "taxjar" or "default"
    error: Optional[str] = None


@router.post("/calculate", response_model=TaxCalculationResponse)
async def calculate_tax(
    request: TaxCalculationRequest,
    db: AsyncSession = Depends(get_session),
    current_user: UserDB = Depends(get_current_user),
):
    """
    Calculate sales tax for an order.
    
    Uses TaxJar API when configured, falls back to restaurant's default rate.
    """
    # Get restaurant address
    result = await db.execute(
        select(Restaurant).where(Restaurant.id == request.restaurant_id)
    )
    restaurant = result.scalar_one_or_none()
    
    if not restaurant:
        raise HTTPException(status_code=404, detail="Restaurant not found")
    
    # Build from address (restaurant nexus)
    from_address = {
        "street": restaurant.address_street or "",
        "city": restaurant.address_city or "",
        "state": restaurant.address_state or "",
        "zip": restaurant.address_zip or "",
        "country": restaurant.address_country or "US",
    }
    
    # Use customer address if provided (for delivery), otherwise same as restaurant
    to_address = request.customer_address or from_address
    
    # Calculate tax
    tax_result = await taxjar_service.calculate_tax(
        amount=request.amount,
        from_address=from_address,
        to_address=to_address,
        line_items=request.line_items,
        shipping=request.shipping,
    )
    
    # If TaxJar failed and we have a custom default rate, use it
    if tax_result["source"] == "default" and restaurant.default_tax_rate:
        tax_amount = request.amount * restaurant.default_tax_rate
        tax_result.update({
            "tax_amount": round(tax_amount, 2),
            "tax_rate": restaurant.default_tax_rate,
            "taxable_amount": request.amount,
        })
    
    return TaxCalculationResponse(**tax_result)


@router.get("/rates/{state}")
async def get_tax_rate(
    state: str,
    zip_code: Optional[str] = None,
    current_user: UserDB = Depends(get_current_user),
):
    """Get tax rate for a specific state/zip code"""
    if not taxjar_service.enabled:
        # Return default rate from service
        rate = taxjar_service._get_default_rate(state)
        return {
            "rate": rate,
            "state": state,
            "source": "default",
        }
    
    try:
        # Use TaxJar API
        address = {"state": state, "country": "US"}
        if zip_code:
            address["zip"] = zip_code
        
        result = await taxjar_service.calculate_tax(
            amount=100.0,  # Sample amount
            from_address=address,
            to_address=address,
        )
        
        return {
            "rate": result["tax_rate"],
            "state": state,
            "zip_code": zip_code,
            "breakdown": result.get("breakdown", {}),
            "source": result["source"],
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get tax rate: {str(e)}")


@router.put("/restaurants/{restaurant_id}/default-rate")
async def update_default_tax_rate(
    restaurant_id: str,
    rate: float,
    db: AsyncSession = Depends(get_session),
    current_user: UserDB = Depends(get_current_user),
):
    """Update restaurant's default tax rate (fallback when TaxJar unavailable)"""
    if rate < 0 or rate > 0.25:
        raise HTTPException(status_code=400, detail="Tax rate must be between 0 and 0.25 (25%)")
    
    result = await db.execute(
        select(Restaurant).where(Restaurant.id == restaurant_id)
    )
    restaurant = result.scalar_one_or_none()
    
    if not restaurant:
        raise HTTPException(status_code=404, detail="Restaurant not found")
    
    restaurant.default_tax_rate = rate
    await db.commit()
    
    return {
        "restaurant_id": restaurant_id,
        "default_tax_rate": rate,
        "updated": True,
    }


@router.put("/restaurants/{restaurant_id}/address")
async def update_restaurant_address(
    restaurant_id: str,
    street: str,
    city: str,
    state: str,
    zip_code: str,
    country: str = "US",
    db: AsyncSession = Depends(get_session),
    current_user: UserDB = Depends(get_current_user),
):
    """Update restaurant address for tax calculation"""
    result = await db.execute(
        select(Restaurant).where(Restaurant.id == restaurant_id)
    )
    restaurant = result.scalar_one_or_none()
    
    if not restaurant:
        raise HTTPException(status_code=404, detail="Restaurant not found")
    
    restaurant.address_street = street
    restaurant.address_city = city
    restaurant.address_state = state
    restaurant.address_zip = zip_code
    restaurant.address_country = country
    await db.commit()
    
    return {
        "restaurant_id": restaurant_id,
        "address": {
            "street": street,
            "city": city,
            "state": state,
            "zip": zip_code,
            "country": country,
        },
        "updated": True,
    }
