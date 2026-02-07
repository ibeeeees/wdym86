"""
Stripe Payment Service

Handles Stripe integration for:
- Subscription management (create, update, cancel)
- POS payment processing (payment intents)
- Customer management
- Webhook event handling
- Refund processing
"""

import stripe
from typing import Optional, Dict, Any, List
from datetime import datetime, timedelta
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import os
import logging

from ..config import settings
from ..database import (
    Restaurant, Subscription, PaymentTransaction, Order, Customer
)

logger = logging.getLogger(__name__)

# Initialize Stripe
stripe.api_key = settings.stripe_secret_key


class StripeService:
    """Service for all Stripe-related operations"""
    
    def __init__(self):
        self.api_key = settings.stripe_secret_key
        if not self.api_key or self.api_key == "your-stripe-secret-key-here":
            logger.warning("Stripe API key not configured - running in demo mode")
            self.demo_mode = True
        else:
            self.demo_mode = False
            stripe.api_key = self.api_key
    
    # ==========================================
    # Customer Management
    # ==========================================
    
    async def create_customer(
        self,
        email: str,
        name: Optional[str] = None,
        metadata: Optional[Dict[str, str]] = None
    ) -> Dict[str, Any]:
        """
        Create a Stripe customer
        
        Args:
            email: Customer email
            name: Customer name
            metadata: Additional metadata (e.g., restaurant_id)
        
        Returns:
            Stripe customer object
        """
        if self.demo_mode:
            return {
                "id": f"cus_demo_{email.split('@')[0]}",
                "email": email,
                "name": name,
                "metadata": metadata or {}
            }
        
        try:
            customer = stripe.Customer.create(
                email=email,
                name=name,
                metadata=metadata or {}
            )
            return customer
        except stripe.error.StripeError as e:
            logger.error(f"Stripe customer creation failed: {e}")
            raise Exception(f"Failed to create Stripe customer: {str(e)}")
    
    async def get_customer(self, customer_id: str) -> Optional[Dict[str, Any]]:
        """Retrieve a Stripe customer by ID"""
        if self.demo_mode:
            return {"id": customer_id, "email": "demo@example.com"}
        
        try:
            customer = stripe.Customer.retrieve(customer_id)
            return customer
        except stripe.error.StripeError as e:
            logger.error(f"Failed to retrieve customer {customer_id}: {e}")
            return None
    
    async def update_customer(
        self,
        customer_id: str,
        **kwargs
    ) -> Dict[str, Any]:
        """Update a Stripe customer"""
        if self.demo_mode:
            return {"id": customer_id, **kwargs}
        
        try:
            customer = stripe.Customer.modify(customer_id, **kwargs)
            return customer
        except stripe.error.StripeError as e:
            logger.error(f"Failed to update customer {customer_id}: {e}")
            raise Exception(f"Failed to update Stripe customer: {str(e)}")
    
    # ==========================================
    # Subscription Management
    # ==========================================
    
    async def create_checkout_session(
        self,
        customer_id: str,
        price_id: str,
        success_url: str,
        cancel_url: str,
        metadata: Optional[Dict[str, str]] = None
    ) -> Dict[str, Any]:
        """
        Create a Stripe Checkout Session for subscription
        
        Args:
            customer_id: Stripe customer ID
            price_id: Stripe price ID for the subscription tier
            success_url: URL to redirect after successful payment
            cancel_url: URL to redirect if user cancels
            metadata: Additional metadata (e.g., restaurant_id, tier)
        
        Returns:
            Checkout session object with URL
        """
        if self.demo_mode:
            return {
                "id": "cs_demo_123",
                "url": f"{success_url}?session_id=demo_session",
                "customer": customer_id,
                "metadata": metadata or {}
            }
        
        try:
            session = stripe.checkout.Session.create(
                customer=customer_id,
                mode='subscription',
                line_items=[{
                    'price': price_id,
                    'quantity': 1,
                }],
                success_url=success_url,
                cancel_url=cancel_url,
                metadata=metadata or {},
                allow_promotion_codes=True,
                billing_address_collection='auto',
            )
            return session
        except stripe.error.StripeError as e:
            logger.error(f"Failed to create checkout session: {e}")
            raise Exception(f"Failed to create checkout session: {str(e)}")
    
    async def create_subscription(
        self,
        customer_id: str,
        price_id: str,
        metadata: Optional[Dict[str, str]] = None
    ) -> Dict[str, Any]:
        """
        Create a subscription directly (without checkout)
        
        Args:
            customer_id: Stripe customer ID
            price_id: Stripe price ID
            metadata: Additional metadata
        
        Returns:
            Subscription object
        """
        if self.demo_mode:
            now = datetime.utcnow()
            return {
                "id": "sub_demo_123",
                "customer": customer_id,
                "status": "active",
                "current_period_start": int(now.timestamp()),
                "current_period_end": int((now + timedelta(days=30)).timestamp()),
                "metadata": metadata or {}
            }
        
        try:
            subscription = stripe.Subscription.create(
                customer=customer_id,
                items=[{'price': price_id}],
                metadata=metadata or {},
                expand=['latest_invoice.payment_intent']
            )
            return subscription
        except stripe.error.StripeError as e:
            logger.error(f"Failed to create subscription: {e}")
            raise Exception(f"Failed to create subscription: {str(e)}")
    
    async def update_subscription(
        self,
        subscription_id: str,
        **kwargs
    ) -> Dict[str, Any]:
        """Update a subscription (e.g., change tier)"""
        if self.demo_mode:
            return {"id": subscription_id, **kwargs}
        
        try:
            subscription = stripe.Subscription.modify(
                subscription_id,
                **kwargs
            )
            return subscription
        except stripe.error.StripeError as e:
            logger.error(f"Failed to update subscription {subscription_id}: {e}")
            raise Exception(f"Failed to update subscription: {str(e)}")
    
    async def cancel_subscription(
        self,
        subscription_id: str,
        at_period_end: bool = True
    ) -> Dict[str, Any]:
        """
        Cancel a subscription
        
        Args:
            subscription_id: Stripe subscription ID
            at_period_end: If True, cancel at end of billing period
        
        Returns:
            Updated subscription object
        """
        if self.demo_mode:
            return {
                "id": subscription_id,
                "status": "canceled" if not at_period_end else "active",
                "cancel_at_period_end": at_period_end
            }
        
        try:
            if at_period_end:
                subscription = stripe.Subscription.modify(
                    subscription_id,
                    cancel_at_period_end=True
                )
            else:
                subscription = stripe.Subscription.delete(subscription_id)
            return subscription
        except stripe.error.StripeError as e:
            logger.error(f"Failed to cancel subscription {subscription_id}: {e}")
            raise Exception(f"Failed to cancel subscription: {str(e)}")
    
    async def get_subscription(self, subscription_id: str) -> Optional[Dict[str, Any]]:
        """Retrieve a subscription by ID"""
        if self.demo_mode:
            return {"id": subscription_id, "status": "active"}
        
        try:
            subscription = stripe.Subscription.retrieve(subscription_id)
            return subscription
        except stripe.error.StripeError as e:
            logger.error(f"Failed to retrieve subscription {subscription_id}: {e}")
            return None
    
    # ==========================================
    # Payment Intent (POS Payments)
    # ==========================================
    
    async def create_payment_intent(
        self,
        amount: float,
        currency: str = "usd",
        customer_id: Optional[str] = None,
        metadata: Optional[Dict[str, str]] = None,
        description: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Create a payment intent for POS transactions
        
        Args:
            amount: Amount in dollars (will be converted to cents)
            currency: Currency code (default: usd)
            customer_id: Optional Stripe customer ID
            metadata: Additional metadata (e.g., order_id, restaurant_id)
            description: Payment description
        
        Returns:
            Payment intent object with client_secret
        """
        if self.demo_mode:
            return {
                "id": "pi_demo_123",
                "client_secret": "pi_demo_123_secret_456",
                "amount": int(amount * 100),
                "currency": currency,
                "status": "requires_payment_method",
                "metadata": metadata or {}
            }
        
        try:
            # Convert dollars to cents
            amount_cents = int(amount * 100)
            
            params = {
                "amount": amount_cents,
                "currency": currency,
                "metadata": metadata or {},
                "automatic_payment_methods": {
                    "enabled": True,
                },
            }
            
            if customer_id:
                params["customer"] = customer_id
            if description:
                params["description"] = description
            
            intent = stripe.PaymentIntent.create(**params)
            return intent
        except stripe.error.StripeError as e:
            logger.error(f"Failed to create payment intent: {e}")
            raise Exception(f"Failed to create payment intent: {str(e)}")
    
    async def confirm_payment_intent(
        self,
        payment_intent_id: str,
        payment_method: Optional[str] = None
    ) -> Dict[str, Any]:
        """Confirm a payment intent"""
        if self.demo_mode:
            return {
                "id": payment_intent_id,
                "status": "succeeded",
                "amount": 5000,
                "currency": "usd"
            }
        
        try:
            params = {}
            if payment_method:
                params["payment_method"] = payment_method
            
            intent = stripe.PaymentIntent.confirm(payment_intent_id, **params)
            return intent
        except stripe.error.StripeError as e:
            logger.error(f"Failed to confirm payment intent {payment_intent_id}: {e}")
            raise Exception(f"Failed to confirm payment: {str(e)}")
    
    async def get_payment_intent(self, payment_intent_id: str) -> Optional[Dict[str, Any]]:
        """Retrieve a payment intent by ID"""
        if self.demo_mode:
            return {"id": payment_intent_id, "status": "succeeded"}
        
        try:
            intent = stripe.PaymentIntent.retrieve(payment_intent_id)
            return intent
        except stripe.error.StripeError as e:
            logger.error(f"Failed to retrieve payment intent {payment_intent_id}: {e}")
            return None
    
    # ==========================================
    # Refunds
    # ==========================================
    
    async def create_refund(
        self,
        payment_intent_id: str,
        amount: Optional[float] = None,
        reason: Optional[str] = None,
        metadata: Optional[Dict[str, str]] = None
    ) -> Dict[str, Any]:
        """
        Create a refund for a payment
        
        Args:
            payment_intent_id: Stripe payment intent ID
            amount: Amount to refund in dollars (None = full refund)
            reason: Refund reason
            metadata: Additional metadata
        
        Returns:
            Refund object
        """
        if self.demo_mode:
            return {
                "id": "re_demo_123",
                "payment_intent": payment_intent_id,
                "amount": int(amount * 100) if amount else None,
                "status": "succeeded",
                "metadata": metadata or {}
            }
        
        try:
            params = {
                "payment_intent": payment_intent_id,
                "metadata": metadata or {}
            }
            
            if amount is not None:
                params["amount"] = int(amount * 100)  # Convert to cents
            if reason:
                params["reason"] = reason
            
            refund = stripe.Refund.create(**params)
            return refund
        except stripe.error.StripeError as e:
            logger.error(f"Failed to create refund for {payment_intent_id}: {e}")
            raise Exception(f"Failed to create refund: {str(e)}")
    
    # ==========================================
    # Webhook Handling
    # ==========================================
    
    def construct_webhook_event(
        self,
        payload: bytes,
        sig_header: str,
        webhook_secret: str
    ) -> Dict[str, Any]:
        """
        Verify and construct webhook event from Stripe
        
        Args:
            payload: Raw request body
            sig_header: Stripe-Signature header
            webhook_secret: Webhook signing secret
        
        Returns:
            Verified event object
        
        Raises:
            ValueError: If signature verification fails
        """
        if self.demo_mode:
            import json
            return json.loads(payload)
        
        try:
            event = stripe.Webhook.construct_event(
                payload, sig_header, webhook_secret
            )
            return event
        except ValueError as e:
            logger.error(f"Invalid webhook payload: {e}")
            raise ValueError("Invalid payload")
        except stripe.error.SignatureVerificationError as e:
            logger.error(f"Invalid webhook signature: {e}")
            raise ValueError("Invalid signature")
    
    async def handle_webhook_event(
        self,
        event: Dict[str, Any],
        db: AsyncSession
    ) -> Dict[str, Any]:
        """
        Process Stripe webhook events
        
        Args:
            event: Stripe event object
            db: Database session
        
        Returns:
            Processing result
        """
        event_type = event.get('type')
        data = event.get('data', {}).get('object', {})
        
        logger.info(f"Processing Stripe webhook: {event_type}")
        
        try:
            if event_type == 'checkout.session.completed':
                return await self._handle_checkout_completed(data, db)
            
            elif event_type == 'customer.subscription.created':
                return await self._handle_subscription_created(data, db)
            
            elif event_type == 'customer.subscription.updated':
                return await self._handle_subscription_updated(data, db)
            
            elif event_type == 'customer.subscription.deleted':
                return await self._handle_subscription_deleted(data, db)
            
            elif event_type == 'payment_intent.succeeded':
                return await self._handle_payment_succeeded(data, db)
            
            elif event_type == 'payment_intent.payment_failed':
                return await self._handle_payment_failed(data, db)
            
            elif event_type == 'charge.refunded':
                return await self._handle_refund(data, db)
            
            else:
                logger.info(f"Unhandled event type: {event_type}")
                return {"status": "ignored", "event_type": event_type}
        
        except Exception as e:
            logger.error(f"Error processing webhook {event_type}: {e}")
            return {"status": "error", "message": str(e)}
    
    async def _handle_checkout_completed(
        self,
        session: Dict[str, Any],
        db: AsyncSession
    ) -> Dict[str, Any]:
        """Handle successful checkout session"""
        customer_id = session.get('customer')
        subscription_id = session.get('subscription')
        metadata = session.get('metadata', {})
        restaurant_id = metadata.get('restaurant_id')
        
        if not restaurant_id:
            logger.warning("No restaurant_id in checkout session metadata")
            return {"status": "warning", "message": "Missing restaurant_id"}
        
        # Update subscription in database
        result = await db.execute(
            select(Subscription).where(Subscription.restaurant_id == restaurant_id)
        )
        subscription = result.scalar_one_or_none()
        
        if subscription:
            subscription.stripe_customer_id = customer_id
            subscription.stripe_subscription_id = subscription_id
            subscription.status = "active"
            await db.commit()
        
        return {"status": "success", "subscription_id": subscription_id}
    
    async def _handle_subscription_created(
        self,
        subscription: Dict[str, Any],
        db: AsyncSession
    ) -> Dict[str, Any]:
        """Handle subscription creation"""
        # Similar to checkout completed
        return {"status": "success"}
    
    async def _handle_subscription_updated(
        self,
        subscription: Dict[str, Any],
        db: AsyncSession
    ) -> Dict[str, Any]:
        """Handle subscription updates"""
        subscription_id = subscription.get('id')
        status = subscription.get('status')
        
        # Update subscription in database
        result = await db.execute(
            select(Subscription).where(
                Subscription.stripe_subscription_id == subscription_id
            )
        )
        db_subscription = result.scalar_one_or_none()
        
        if db_subscription:
            db_subscription.status = status
            db_subscription.cancel_at_period_end = subscription.get('cancel_at_period_end', False)
            await db.commit()
        
        return {"status": "success"}
    
    async def _handle_subscription_deleted(
        self,
        subscription: Dict[str, Any],
        db: AsyncSession
    ) -> Dict[str, Any]:
        """Handle subscription cancellation"""
        subscription_id = subscription.get('id')
        
        result = await db.execute(
            select(Subscription).where(
                Subscription.stripe_subscription_id == subscription_id
            )
        )
        db_subscription = result.scalar_one_or_none()
        
        if db_subscription:
            db_subscription.status = "canceled"
            # Optionally downgrade to free tier
            db_subscription.tier = "free"
            
            # Update restaurant tier
            result = await db.execute(
                select(Restaurant).where(Restaurant.id == db_subscription.restaurant_id)
            )
            restaurant = result.scalar_one_or_none()
            if restaurant:
                restaurant.subscription_tier = "free"
            
            await db.commit()
        
        return {"status": "success"}
    
    async def _handle_payment_succeeded(
        self,
        payment_intent: Dict[str, Any],
        db: AsyncSession
    ) -> Dict[str, Any]:
        """Handle successful payment"""
        payment_intent_id = payment_intent.get('id')
        metadata = payment_intent.get('metadata', {})
        order_id = metadata.get('order_id')
        
        if not order_id:
            return {"status": "success", "message": "No order_id in metadata"}
        
        # Update order payment status
        result = await db.execute(
            select(Order).where(Order.order_id == order_id)
        )
        order = result.scalar_one_or_none()
        
        if order:
            order.payment_status = "paid"
            
            # Create payment transaction record
            transaction = PaymentTransaction(
                order_id=order_id,
                payment_provider="stripe",
                transaction_id=payment_intent_id,
                amount=payment_intent.get('amount', 0) / 100,  # Convert from cents
                status="completed",
                payment_method_type=payment_intent.get('payment_method_types', [None])[0],
                transaction_data=payment_intent
            )
            db.add(transaction)
            await db.commit()
        
        return {"status": "success", "order_id": order_id}
    
    async def _handle_payment_failed(
        self,
        payment_intent: Dict[str, Any],
        db: AsyncSession
    ) -> Dict[str, Any]:
        """Handle failed payment"""
        payment_intent_id = payment_intent.get('id')
        metadata = payment_intent.get('metadata', {})
        order_id = metadata.get('order_id')
        
        if order_id:
            # Update order payment status
            result = await db.execute(
                select(Order).where(Order.order_id == order_id)
            )
            order = result.scalar_one_or_none()
            
            if order:
                # Create failed transaction record
                transaction = PaymentTransaction(
                    order_id=order_id,
                    payment_provider="stripe",
                    transaction_id=payment_intent_id,
                    amount=payment_intent.get('amount', 0) / 100,
                    status="failed",
                    transaction_data=payment_intent
                )
                db.add(transaction)
                await db.commit()
        
        return {"status": "success", "message": "Payment failed recorded"}
    
    async def _handle_refund(
        self,
        charge: Dict[str, Any],
        db: AsyncSession
    ) -> Dict[str, Any]:
        """Handle refund"""
        charge_id = charge.get('id')
        payment_intent_id = charge.get('payment_intent')
        
        # Find the payment transaction
        result = await db.execute(
            select(PaymentTransaction).where(
                PaymentTransaction.transaction_id == payment_intent_id
            )
        )
        transaction = result.scalar_one_or_none()
        
        if transaction:
            transaction.status = "refunded"
            
            # Update order status
            result = await db.execute(
                select(Order).where(Order.order_id == transaction.order_id)
            )
            order = result.scalar_one_or_none()
            if order:
                order.payment_status = "refunded"
            
            await db.commit()
        
        return {"status": "success", "charge_id": charge_id}
    
    # ==========================================
    # Price Management
    # ==========================================
    
    def get_price_id_for_tier(
        self,
        tier: str,
        billing_cycle: str = "monthly"
    ) -> str:
        """
        Get Stripe price ID for subscription tier
        
        Note: These should be set in environment variables or database
        """
        price_ids = {
            "starter": {
                "monthly": os.getenv("STRIPE_PRICE_STARTER_MONTHLY", "price_starter_monthly"),
                "yearly": os.getenv("STRIPE_PRICE_STARTER_YEARLY", "price_starter_yearly"),
            },
            "pro": {
                "monthly": os.getenv("STRIPE_PRICE_PRO_MONTHLY", "price_pro_monthly"),
                "yearly": os.getenv("STRIPE_PRICE_PRO_YEARLY", "price_pro_yearly"),
            },
            "enterprise": {
                "monthly": os.getenv("STRIPE_PRICE_ENTERPRISE_MONTHLY", "price_enterprise_monthly"),
                "yearly": os.getenv("STRIPE_PRICE_ENTERPRISE_YEARLY", "price_enterprise_yearly"),
            }
        }
        
        return price_ids.get(tier, {}).get(billing_cycle, "")


# Global instance
stripe_service = StripeService()
