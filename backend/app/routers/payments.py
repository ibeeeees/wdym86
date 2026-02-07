"""
Payment Processing Router

Unified payment API for all payment providers.
"""

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from enum import Enum

from ..services.payments import (
    payment_service,
    PaymentProvider,
    PaymentResult,
    RefundResult
)
from ..database import get_session, User as UserDB
from .auth import get_current_user

router = APIRouter()


class PaymentProviderEnum(str, Enum):
    stripe = "stripe"
    paypal = "paypal"
    klarna = "klarna"
    cash_app = "cash_app"
    venmo = "venmo"
    apple_pay = "apple_pay"
    google_pay = "google_pay"
    cash = "cash"


class CreatePaymentIntentRequest(BaseModel):
    provider: PaymentProviderEnum
    amount: float
    currency: str = "USD"
    order_id: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None


class ProcessPaymentRequest(BaseModel):
    provider: PaymentProviderEnum
    amount: float
    currency: str = "USD"
    payment_method_token: Optional[str] = None
    customer_id: Optional[str] = None
    order_id: Optional[str] = None
    tip_amount: Optional[float] = 0
    metadata: Optional[Dict[str, Any]] = None


class RefundRequest(BaseModel):
    provider: PaymentProviderEnum
    transaction_id: str
    amount: Optional[float] = None  # None = full refund
    reason: Optional[str] = None


class SplitPaymentItem(BaseModel):
    provider: PaymentProviderEnum
    amount: float
    payment_method_token: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None


class SplitPaymentRequest(BaseModel):
    order_id: str
    splits: List[SplitPaymentItem]


class PaymentResultResponse(BaseModel):
    success: bool
    transaction_id: str
    provider: str
    status: str
    amount: float
    currency: str = "USD"
    error_message: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None


@router.get("/providers")
async def get_payment_providers(
    current_user: UserDB = Depends(get_current_user)
):
    """Get list of available payment providers"""
    providers = await payment_service.get_available_providers()
    return {"providers": providers}


@router.post("/intent", response_model=Dict[str, Any])
async def create_payment_intent(
    request: CreatePaymentIntentRequest,
    current_user: UserDB = Depends(get_current_user)
):
    """
    Create a payment intent for client-side payment processing.

    Returns provider-specific data needed to complete payment on frontend.
    """
    try:
        intent = await payment_service.create_payment_intent(
            provider=PaymentProvider(request.provider.value),
            amount=request.amount,
            currency=request.currency,
            metadata={
                **(request.metadata or {}),
                "order_id": request.order_id
            }
        )
        return intent
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/process", response_model=PaymentResultResponse)
async def process_payment(
    request: ProcessPaymentRequest,
    current_user: UserDB = Depends(get_current_user)
):
    """
    Process a payment through the specified provider.

    For digital wallets (Apple Pay, Google Pay), the payment_method_token
    should be obtained from the client-side SDK.
    """
    try:
        total_amount = request.amount + (request.tip_amount or 0)

        result = await payment_service.process_payment(
            provider=PaymentProvider(request.provider.value),
            amount=total_amount,
            currency=request.currency,
            payment_method_token=request.payment_method_token,
            customer_id=request.customer_id,
            metadata={
                **(request.metadata or {}),
                "order_id": request.order_id,
                "tip_amount": request.tip_amount,
                "subtotal": request.amount
            }
        )

        return PaymentResultResponse(
            success=result.success,
            transaction_id=result.transaction_id,
            provider=result.provider.value,
            status=result.status.value,
            amount=result.amount,
            currency=result.currency,
            error_message=result.error_message,
            metadata=result.metadata
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/refund")
async def process_refund(
    request: RefundRequest,
    current_user: UserDB = Depends(get_current_user)
):
    """Process a refund for a previous transaction"""
    try:
        result = await payment_service.refund(
            provider=PaymentProvider(request.provider.value),
            transaction_id=request.transaction_id,
            amount=request.amount,
            reason=request.reason
        )

        return {
            "success": result.success,
            "refund_id": result.refund_id,
            "original_transaction_id": result.original_transaction_id,
            "amount": result.amount,
            "status": result.status.value,
            "error_message": result.error_message
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/split", response_model=List[PaymentResultResponse])
async def process_split_payment(
    request: SplitPaymentRequest,
    current_user: UserDB = Depends(get_current_user)
):
    """
    Process a split payment across multiple providers.

    Useful for splitting bills between different payment methods.
    """
    try:
        splits = [
            {
                "provider": split.provider.value,
                "amount": split.amount,
                "payment_method_token": split.payment_method_token,
                "metadata": {
                    **(split.metadata or {}),
                    "order_id": request.order_id
                }
            }
            for split in request.splits
        ]

        results = await payment_service.process_split_payment(splits)

        return [
            PaymentResultResponse(
                success=r.success,
                transaction_id=r.transaction_id,
                provider=r.provider.value,
                status=r.status.value,
                amount=r.amount,
                currency=r.currency,
                error_message=r.error_message,
                metadata=r.metadata
            )
            for r in results
        ]
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/calculate-tip")
async def calculate_tip(
    subtotal: float,
    tip_percentage: Optional[float] = None,
    tip_amount: Optional[float] = None,
    current_user: UserDB = Depends(get_current_user)
):
    """Calculate tip amount based on percentage or fixed amount"""
    if tip_amount is not None:
        calculated_tip = tip_amount
    elif tip_percentage is not None:
        calculated_tip = subtotal * (tip_percentage / 100)
    else:
        calculated_tip = 0

    # Common tip suggestions
    suggestions = [
        {"percentage": 15, "amount": round(subtotal * 0.15, 2)},
        {"percentage": 18, "amount": round(subtotal * 0.18, 2)},
        {"percentage": 20, "amount": round(subtotal * 0.20, 2)},
        {"percentage": 25, "amount": round(subtotal * 0.25, 2)},
    ]

    return {
        "subtotal": subtotal,
        "tip_amount": round(calculated_tip, 2),
        "total": round(subtotal + calculated_tip, 2),
        "suggestions": suggestions
    }
