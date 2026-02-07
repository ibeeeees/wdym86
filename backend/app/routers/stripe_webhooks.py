"""
Stripe Webhook Handler

Processes Stripe webhook events for subscriptions and payments.
"""

from fastapi import APIRouter, Request, HTTPException, Depends
from sqlalchemy.ext.asyncio import AsyncSession
import logging

from ..database import get_session
from ..services.stripe_service import stripe_service
from ..config import settings

router = APIRouter(prefix="/webhooks", tags=["Webhooks"])
logger = logging.getLogger(__name__)


@router.post("/stripe")
async def stripe_webhook(
    request: Request,
    db: AsyncSession = Depends(get_session)
):
    """
    Handle Stripe webhook events
    
    This endpoint receives and processes webhooks from Stripe for:
    - Subscription lifecycle events
    - Payment success/failure
    - Refunds
    - Customer updates
    
    Stripe will send events to this endpoint which must be publicly accessible.
    """
    # Get raw body for signature verification
    payload = await request.body()
    sig_header = request.headers.get('stripe-signature')
    
    if not sig_header:
        logger.error("Missing Stripe signature header")
        raise HTTPException(status_code=400, detail="Missing signature header")
    
    webhook_secret = settings.stripe_webhook_secret
    if not webhook_secret or webhook_secret == "your-stripe-webhook-secret-here":
        logger.warning("Stripe webhook secret not configured - accepting all webhooks")
        # In demo mode, just parse the JSON
        import json
        event = json.loads(payload)
    else:
        # Verify webhook signature
        try:
            event = stripe_service.construct_webhook_event(
                payload,
                sig_header,
                webhook_secret
            )
        except ValueError as e:
            logger.error(f"Invalid webhook: {e}")
            raise HTTPException(status_code=400, detail=str(e))
    
    # Process the event
    logger.info(f"Received Stripe webhook: {event.get('type')}")
    
    try:
        result = await stripe_service.handle_webhook_event(event, db)
        return result
    except Exception as e:
        logger.error(f"Error processing webhook: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Webhook processing failed")


@router.get("/stripe/test")
async def test_stripe_webhook():
    """
    Test endpoint to verify webhook configuration
    
    This can be used to check if the webhook endpoint is accessible.
    """
    return {
        "status": "ok",
        "message": "Stripe webhook endpoint is accessible",
        "webhook_configured": bool(settings.stripe_webhook_secret)
    }
