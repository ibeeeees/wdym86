"""
POS Payment Router

Handles payment processing for Point of Sale orders using Stripe.
Supports both card payments (via Stripe) and cash payments (local recording).
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel
from typing import Optional, Literal
from datetime import datetime

from ..database import get_session, Order, PaymentTransaction, AuditLog, User as UserDB
from ..services.stripe_service import stripe_service
from .auth import get_current_user

router = APIRouter(prefix="/pos-payments", tags=["POS Payments"])


class CreatePaymentRequest(BaseModel):
    """Request to create a payment intent"""
    order_id: str
    amount: float
    payment_method: Literal["card", "cash"]
    customer_email: Optional[str] = None
    description: Optional[str] = None


class ConfirmPaymentRequest(BaseModel):
    """Request to confirm a card payment"""
    payment_intent_id: str
    payment_method_id: Optional[str] = None


class ProcessCashPaymentRequest(BaseModel):
    """Request to process a cash payment"""
    order_id: str
    amount_received: float
    change_given: float


class RefundRequest(BaseModel):
    """Request to refund a payment"""
    payment_transaction_id: str
    amount: Optional[float] = None  # None = full refund
    reason: Optional[str] = None


@router.post("/create-payment")
async def create_payment(
    request: CreatePaymentRequest,
    current_user: UserDB = Depends(get_current_user),
    db: AsyncSession = Depends(get_session)
):
    """
    Create a payment for a POS order
    
    For card payments: Creates a Stripe Payment Intent
    For cash payments: Records the payment locally
    """
    # Verify order exists
    result = await db.execute(
        select(Order).where(Order.order_id == request.order_id)
    )
    order = result.scalar_one_or_none()
    
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    if order.payment_status == "paid":
        raise HTTPException(status_code=400, detail="Order already paid")
    
    if request.payment_method == "card":
        # Create Stripe Payment Intent
        try:
            payment_intent = await stripe_service.create_payment_intent(
                amount=request.amount,
                currency="usd",
                metadata={
                    "order_id": request.order_id,
                    "restaurant_id": order.restaurant_id,
                    "user_id": current_user.id
                },
                description=request.description or f"Order {order.order_id}"
            )
            
            return {
                "success": True,
                "payment_method": "card",
                "payment_intent_id": payment_intent.get("id"),
                "client_secret": payment_intent.get("client_secret"),
                "amount": request.amount,
                "message": "Payment intent created - complete payment on client"
            }
        except Exception as e:
            raise HTTPException(
                status_code=500,
                detail=f"Failed to create payment intent: {str(e)}"
            )
    
    elif request.payment_method == "cash":
        # Process cash payment immediately
        transaction = PaymentTransaction(
            order_id=request.order_id,
            payment_provider="cash",
            transaction_id=f"cash_{request.order_id}_{int(datetime.utcnow().timestamp())}",
            amount=request.amount,
            status="completed",
            payment_method_type="cash",
            transaction_data={
                "processed_by": current_user.id,
                "processed_at": datetime.utcnow().isoformat()
            }
        )
        db.add(transaction)
        
        # Update order
        order.payment_status = "paid"
        order.payment_method = "cash"
        order.updated_at = datetime.utcnow()
        
        # Create audit log
        audit = AuditLog(
            restaurant_id=order.restaurant_id,
            user_id=current_user.id,
            action="payment_completed",
            resource_type="order",
            resource_id=request.order_id,
            details={
                "payment_method": "cash",
                "amount": request.amount,
                "transaction_id": transaction.id
            }
        )
        db.add(audit)
        
        await db.commit()
        await db.refresh(transaction)
        
        return {
            "success": True,
            "payment_method": "cash",
            "transaction_id": transaction.id,
            "amount": request.amount,
            "message": "Cash payment recorded successfully"
        }
    
    else:
        raise HTTPException(status_code=400, detail="Invalid payment method")


@router.post("/confirm-card-payment")
async def confirm_card_payment(
    request: ConfirmPaymentRequest,
    current_user: UserDB = Depends(get_current_user),
    db: AsyncSession = Depends(get_session)
):
    """
    Confirm a card payment (called after customer completes Stripe payment on frontend)
    
    This endpoint checks the payment status and updates the order accordingly.
    Note: The webhook will also handle this, but this provides immediate feedback.
    """
    try:
        # Retrieve payment intent from Stripe
        payment_intent = await stripe_service.get_payment_intent(request.payment_intent_id)
        
        if not payment_intent:
            raise HTTPException(status_code=404, detail="Payment intent not found")
        
        order_id = payment_intent.get("metadata", {}).get("order_id")
        if not order_id:
            raise HTTPException(status_code=400, detail="Order ID not found in payment intent")
        
        # Get order
        result = await db.execute(
            select(Order).where(Order.order_id == order_id)
        )
        order = result.scalar_one_or_none()
        
        if not order:
            raise HTTPException(status_code=404, detail="Order not found")
        
        status = payment_intent.get("status")
        
        if status == "succeeded":
            # Check if transaction already exists
            result = await db.execute(
                select(PaymentTransaction).where(
                    PaymentTransaction.transaction_id == request.payment_intent_id
                )
            )
            existing_transaction = result.scalar_one_or_none()
            
            if not existing_transaction:
                # Create transaction record
                transaction = PaymentTransaction(
                    order_id=order_id,
                    payment_provider="stripe",
                    transaction_id=request.payment_intent_id,
                    amount=payment_intent.get("amount", 0) / 100,  # Convert from cents
                    status="completed",
                    payment_method_type=payment_intent.get("payment_method_types", [None])[0],
                    transaction_data=payment_intent
                )
                db.add(transaction)
                
                # Update order
                order.payment_status = "paid"
                order.payment_method = "card"
                order.updated_at = datetime.utcnow()
                
                # Create audit log
                audit = AuditLog(
                    restaurant_id=order.restaurant_id,
                    user_id=current_user.id,
                    action="payment_completed",
                    resource_type="order",
                    resource_id=order_id,
                    details={
                        "payment_method": "card",
                        "amount": transaction.amount,
                        "transaction_id": transaction.id,
                        "stripe_payment_intent": request.payment_intent_id
                    }
                )
                db.add(audit)
                
                await db.commit()
            
            return {
                "success": True,
                "status": "succeeded",
                "message": "Payment confirmed successfully"
            }
        
        elif status == "requires_payment_method":
            return {
                "success": False,
                "status": status,
                "message": "Payment requires payment method"
            }
        
        elif status == "requires_action":
            return {
                "success": False,
                "status": status,
                "message": "Payment requires additional action",
                "client_secret": payment_intent.get("client_secret")
            }
        
        else:
            return {
                "success": False,
                "status": status,
                "message": f"Payment status: {status}"
            }
    
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to confirm payment: {str(e)}"
        )


@router.post("/process-cash")
async def process_cash_payment(
    request: ProcessCashPaymentRequest,
    current_user: UserDB = Depends(get_current_user),
    db: AsyncSession = Depends(get_session)
):
    """
    Process a cash payment with amount received and change given
    
    This is a convenience endpoint for cash transactions.
    """
    # Verify order
    result = await db.execute(
        select(Order).where(Order.order_id == request.order_id)
    )
    order = result.scalar_one_or_none()
    
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    if order.payment_status == "paid":
        raise HTTPException(status_code=400, detail="Order already paid")
    
    # Verify amounts
    expected_amount = order.total
    if request.amount_received < expected_amount:
        raise HTTPException(
            status_code=400,
            detail=f"Insufficient payment: received ${request.amount_received:.2f}, expected ${expected_amount:.2f}"
        )
    
    expected_change = request.amount_received - expected_amount
    if abs(request.change_given - expected_change) > 0.01:  # Allow 1 cent tolerance
        raise HTTPException(
            status_code=400,
            detail=f"Change mismatch: given ${request.change_given:.2f}, expected ${expected_change:.2f}"
        )
    
    # Create transaction
    transaction = PaymentTransaction(
        order_id=request.order_id,
        payment_provider="cash",
        transaction_id=f"cash_{request.order_id}_{int(datetime.utcnow().timestamp())}",
        amount=expected_amount,
        status="completed",
        payment_method_type="cash",
        transaction_data={
            "amount_received": request.amount_received,
            "change_given": request.change_given,
            "processed_by": current_user.id,
            "processed_at": datetime.utcnow().isoformat()
        }
    )
    db.add(transaction)
    
    # Update order
    order.payment_status = "paid"
    order.payment_method = "cash"
    order.updated_at = datetime.utcnow()
    
    # Create audit log
    audit = AuditLog(
        restaurant_id=order.restaurant_id,
        user_id=current_user.id,
        action="payment_completed",
        resource_type="order",
        resource_id=request.order_id,
        details={
            "payment_method": "cash",
            "amount": expected_amount,
            "amount_received": request.amount_received,
            "change_given": request.change_given,
            "transaction_id": transaction.id
        }
    )
    db.add(audit)
    
    await db.commit()
    await db.refresh(transaction)
    
    return {
        "success": True,
        "transaction_id": transaction.id,
        "amount_paid": expected_amount,
        "amount_received": request.amount_received,
        "change_given": request.change_given,
        "message": "Cash payment processed successfully"
    }


@router.post("/refund")
async def refund_payment(
    request: RefundRequest,
    current_user: UserDB = Depends(get_current_user),
    db: AsyncSession = Depends(get_session)
):
    """
    Refund a payment
    
    For Stripe payments: Creates a refund via Stripe API
    For cash payments: Records the refund locally
    """
    # Get transaction
    result = await db.execute(
        select(PaymentTransaction).where(
            PaymentTransaction.id == request.payment_transaction_id
        )
    )
    transaction = result.scalar_one_or_none()
    
    if not transaction:
        raise HTTPException(status_code=404, detail="Payment transaction not found")
    
    if transaction.status == "refunded":
        raise HTTPException(status_code=400, detail="Payment already refunded")
    
    if transaction.status != "completed":
        raise HTTPException(status_code=400, detail="Can only refund completed payments")
    
    # Get order
    result = await db.execute(
        select(Order).where(Order.order_id == transaction.order_id)
    )
    order = result.scalar_one_or_none()
    
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    refund_amount = request.amount if request.amount is not None else transaction.amount
    
    if transaction.payment_provider == "stripe":
        # Process Stripe refund
        try:
            refund = await stripe_service.create_refund(
                payment_intent_id=transaction.transaction_id,
                amount=refund_amount,
                reason=request.reason,
                metadata={
                    "order_id": transaction.order_id,
                    "refunded_by": current_user.id
                }
            )
            
            # Update transaction
            transaction.status = "refunded"
            transaction.transaction_data = transaction.transaction_data or {}
            transaction.transaction_data["refund"] = refund
            
            # Update order
            if refund_amount >= order.total:
                order.payment_status = "refunded"
            else:
                order.payment_status = "partial_refund"
            
            # Create audit log
            audit = AuditLog(
                restaurant_id=order.restaurant_id,
                user_id=current_user.id,
                action="payment_refunded",
                resource_type="order",
                resource_id=transaction.order_id,
                details={
                    "payment_method": "card",
                    "refund_amount": refund_amount,
                    "reason": request.reason,
                    "transaction_id": transaction.id,
                    "stripe_refund_id": refund.get("id")
                }
            )
            db.add(audit)
            
            await db.commit()
            
            return {
                "success": True,
                "refund_id": refund.get("id"),
                "amount": refund_amount,
                "status": refund.get("status"),
                "message": "Refund processed successfully"
            }
        
        except Exception as e:
            raise HTTPException(
                status_code=500,
                detail=f"Failed to process refund: {str(e)}"
            )
    
    elif transaction.payment_provider == "cash":
        # Record cash refund locally
        transaction.status = "refunded"
        transaction.transaction_data = transaction.transaction_data or {}
        transaction.transaction_data["refund"] = {
            "amount": refund_amount,
            "reason": request.reason,
            "refunded_by": current_user.id,
            "refunded_at": datetime.utcnow().isoformat()
        }
        
        # Update order
        if refund_amount >= order.total:
            order.payment_status = "refunded"
        else:
            order.payment_status = "partial_refund"
        
        # Create audit log
        audit = AuditLog(
            restaurant_id=order.restaurant_id,
            user_id=current_user.id,
            action="payment_refunded",
            resource_type="order",
            resource_id=transaction.order_id,
            details={
                "payment_method": "cash",
                "refund_amount": refund_amount,
                "reason": request.reason,
                "transaction_id": transaction.id
            }
        )
        db.add(audit)
        
        await db.commit()
        
        return {
            "success": True,
            "amount": refund_amount,
            "message": "Cash refund recorded successfully"
        }
    
    else:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported payment provider: {transaction.payment_provider}"
        )


@router.get("/transaction/{transaction_id}")
async def get_transaction(
    transaction_id: str,
    current_user: UserDB = Depends(get_current_user),
    db: AsyncSession = Depends(get_session)
):
    """Get payment transaction details"""
    result = await db.execute(
        select(PaymentTransaction).where(PaymentTransaction.id == transaction_id)
    )
    transaction = result.scalar_one_or_none()
    
    if not transaction:
        raise HTTPException(status_code=404, detail="Transaction not found")
    
    return {
        "id": transaction.id,
        "order_id": transaction.order_id,
        "payment_provider": transaction.payment_provider,
        "transaction_id": transaction.transaction_id,
        "amount": transaction.amount,
        "status": transaction.status,
        "payment_method_type": transaction.payment_method_type,
        "created_at": transaction.created_at.isoformat() if transaction.created_at else None,
        "transaction_data": transaction.transaction_data
    }
