"""
Solana Pay Router

API endpoints for cryptocurrency payments via Solana Pay.
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional

from ..services.solana_pay import get_solana_pay_service

router = APIRouter(prefix="/solana-pay", tags=["Solana Pay"])


class CreatePaymentRequest(BaseModel):
    """Request body for creating a payment"""
    amount_usd: float
    label: str
    message: str
    memo: Optional[str] = None
    expires_in_minutes: int = 30


class VerifyPaymentRequest(BaseModel):
    """Request body for verifying a payment"""
    signature: str


@router.get("/price")
async def get_sol_price():
    """
    Get current SOL/USD exchange rate.

    Returns the current price of SOL in USD.
    """
    service = get_solana_pay_service()

    return {
        "sol_usd": service.get_sol_price(),
        "network": service.network
    }


@router.post("/create")
async def create_payment(request: CreatePaymentRequest):
    """
    Create a new Solana Pay payment request.

    Returns a payment URL that can be encoded as a QR code for mobile wallets.
    """
    if request.amount_usd <= 0:
        raise HTTPException(status_code=400, detail="Amount must be greater than 0")

    service = get_solana_pay_service()

    payment = service.create_payment_request(
        amount_usd=request.amount_usd,
        label=request.label,
        message=request.message,
        memo=request.memo,
        expires_in_minutes=request.expires_in_minutes
    )

    return payment


@router.get("/status/{payment_id}")
async def get_payment_status(payment_id: str):
    """
    Get the status of a payment request.

    Returns current status and payment details.
    """
    service = get_solana_pay_service()

    status = service.get_payment_status(payment_id)

    if not status:
        raise HTTPException(status_code=404, detail="Payment not found")

    return status


@router.post("/verify/{payment_id}")
async def verify_payment(payment_id: str, request: VerifyPaymentRequest):
    """
    Verify a Solana transaction for a payment.

    Checks the blockchain to confirm the payment was made correctly.
    """
    service = get_solana_pay_service()

    result = service.verify_payment(payment_id, request.signature)

    if not result["success"]:
        raise HTTPException(status_code=400, detail=result.get("error"))

    return result


@router.post("/cancel/{payment_id}")
async def cancel_payment(payment_id: str):
    """
    Cancel a pending payment request.

    Only pending payments can be cancelled.
    """
    service = get_solana_pay_service()

    result = service.cancel_payment(payment_id)

    if not result["success"]:
        raise HTTPException(status_code=400, detail=result.get("error"))

    return result


@router.get("/payments")
async def list_payments(status: Optional[str] = None, limit: int = 50):
    """
    List payment requests.

    Optionally filter by status: pending, completed, expired, cancelled
    """
    service = get_solana_pay_service()

    return {
        "payments": service.list_payments(status=status, limit=limit)
    }


@router.post("/convert")
async def convert_currency(amount: float, direction: str = "usd_to_sol"):
    """
    Convert between USD and SOL.

    Direction options: "usd_to_sol" or "sol_to_usd"
    """
    service = get_solana_pay_service()

    if direction == "usd_to_sol":
        result = service.usd_to_sol(amount)
        return {
            "input": {"amount": amount, "currency": "USD"},
            "output": {"amount": result, "currency": "SOL"},
            "rate": service.get_sol_price()
        }
    elif direction == "sol_to_usd":
        result = service.sol_to_usd(amount)
        return {
            "input": {"amount": amount, "currency": "SOL"},
            "output": {"amount": result, "currency": "USD"},
            "rate": service.get_sol_price()
        }
    else:
        raise HTTPException(status_code=400, detail="Invalid direction. Use 'usd_to_sol' or 'sol_to_usd'")
