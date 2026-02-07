"""
Payment Service - Unified Payment Processing

Supports multiple payment providers:
- Stripe (cards, Apple Pay, Google Pay)
- PayPal
- Klarna (Buy Now Pay Later)
- Cash App
- Venmo
- Cash (manual)

Uses adapter pattern for provider abstraction.
"""

from abc import ABC, abstractmethod
from typing import Dict, Any, Optional, List
from dataclasses import dataclass
from enum import Enum
from datetime import datetime
import uuid
import os


class PaymentProvider(str, Enum):
    STRIPE = "stripe"
    PAYPAL = "paypal"
    KLARNA = "klarna"
    CASH_APP = "cash_app"
    VENMO = "venmo"
    APPLE_PAY = "apple_pay"
    GOOGLE_PAY = "google_pay"
    CASH = "cash"


class PaymentStatus(str, Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"
    REFUNDED = "refunded"
    PARTIALLY_REFUNDED = "partially_refunded"


class PaymentMethodType(str, Enum):
    CREDIT_CARD = "credit_card"
    DEBIT_CARD = "debit_card"
    BANK_ACCOUNT = "bank_account"
    DIGITAL_WALLET = "digital_wallet"
    BNPL = "buy_now_pay_later"  # Klarna
    P2P = "peer_to_peer"  # Venmo, Cash App
    CASH = "cash"


@dataclass
class PaymentResult:
    """Standardized payment result across all providers"""
    success: bool
    transaction_id: str
    provider: PaymentProvider
    status: PaymentStatus
    amount: float
    currency: str = "USD"
    error_message: Optional[str] = None
    provider_response: Optional[Dict[str, Any]] = None
    refundable: bool = True
    metadata: Optional[Dict[str, Any]] = None


@dataclass
class RefundResult:
    """Standardized refund result"""
    success: bool
    refund_id: str
    original_transaction_id: str
    amount: float
    status: PaymentStatus
    error_message: Optional[str] = None


@dataclass
class PaymentMethod:
    """Customer saved payment method"""
    id: str
    provider: PaymentProvider
    type: PaymentMethodType
    last_four: Optional[str] = None
    brand: Optional[str] = None  # visa, mastercard, amex
    expiry: Optional[str] = None
    is_default: bool = False
    metadata: Optional[Dict[str, Any]] = None


class PaymentProviderAdapter(ABC):
    """Abstract base class for payment provider adapters"""

    @abstractmethod
    async def process_payment(
        self,
        amount: float,
        currency: str,
        payment_method_token: Optional[str] = None,
        customer_id: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None
    ) -> PaymentResult:
        """Process a payment"""
        pass

    @abstractmethod
    async def refund(
        self,
        transaction_id: str,
        amount: Optional[float] = None,  # None = full refund
        reason: Optional[str] = None
    ) -> RefundResult:
        """Process a refund"""
        pass

    @abstractmethod
    async def create_payment_intent(
        self,
        amount: float,
        currency: str = "USD",
        metadata: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """Create a payment intent for client-side processing"""
        pass

    @abstractmethod
    async def save_payment_method(
        self,
        customer_id: str,
        payment_token: str
    ) -> PaymentMethod:
        """Save a payment method for future use"""
        pass


class StripeAdapter(PaymentProviderAdapter):
    """Stripe payment adapter - handles cards, Apple Pay, Google Pay"""

    def __init__(self):
        self.api_key = os.getenv("STRIPE_SECRET_KEY", "sk_test_demo")
        self.provider = PaymentProvider.STRIPE

    async def process_payment(
        self,
        amount: float,
        currency: str = "USD",
        payment_method_token: Optional[str] = None,
        customer_id: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None
    ) -> PaymentResult:
        """Process payment via Stripe"""
        try:
            # In production, use stripe library:
            # import stripe
            # stripe.api_key = self.api_key
            # intent = stripe.PaymentIntent.create(...)

            # Demo implementation
            transaction_id = f"pi_{uuid.uuid4().hex[:24]}"

            return PaymentResult(
                success=True,
                transaction_id=transaction_id,
                provider=self.provider,
                status=PaymentStatus.COMPLETED,
                amount=amount,
                currency=currency,
                provider_response={
                    "id": transaction_id,
                    "status": "succeeded",
                    "amount": int(amount * 100),  # Stripe uses cents
                    "currency": currency.lower()
                },
                metadata=metadata
            )
        except Exception as e:
            return PaymentResult(
                success=False,
                transaction_id="",
                provider=self.provider,
                status=PaymentStatus.FAILED,
                amount=amount,
                error_message=str(e)
            )

    async def refund(
        self,
        transaction_id: str,
        amount: Optional[float] = None,
        reason: Optional[str] = None
    ) -> RefundResult:
        """Process refund via Stripe"""
        refund_id = f"re_{uuid.uuid4().hex[:24]}"
        return RefundResult(
            success=True,
            refund_id=refund_id,
            original_transaction_id=transaction_id,
            amount=amount or 0,
            status=PaymentStatus.REFUNDED
        )

    async def create_payment_intent(
        self,
        amount: float,
        currency: str = "USD",
        metadata: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """Create Stripe PaymentIntent"""
        return {
            "client_secret": f"pi_{uuid.uuid4().hex[:24]}_secret_{uuid.uuid4().hex[:12]}",
            "amount": int(amount * 100),
            "currency": currency.lower()
        }

    async def save_payment_method(
        self,
        customer_id: str,
        payment_token: str
    ) -> PaymentMethod:
        """Save payment method to Stripe customer"""
        return PaymentMethod(
            id=f"pm_{uuid.uuid4().hex[:24]}",
            provider=self.provider,
            type=PaymentMethodType.CREDIT_CARD,
            last_four="4242",
            brand="visa",
            expiry="12/25"
        )


class PayPalAdapter(PaymentProviderAdapter):
    """PayPal payment adapter"""

    def __init__(self):
        self.client_id = os.getenv("PAYPAL_CLIENT_ID", "demo")
        self.client_secret = os.getenv("PAYPAL_CLIENT_SECRET", "demo")
        self.provider = PaymentProvider.PAYPAL

    async def process_payment(
        self,
        amount: float,
        currency: str = "USD",
        payment_method_token: Optional[str] = None,
        customer_id: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None
    ) -> PaymentResult:
        transaction_id = f"PAYPAL-{uuid.uuid4().hex[:16].upper()}"
        return PaymentResult(
            success=True,
            transaction_id=transaction_id,
            provider=self.provider,
            status=PaymentStatus.COMPLETED,
            amount=amount,
            currency=currency,
            metadata=metadata
        )

    async def refund(
        self,
        transaction_id: str,
        amount: Optional[float] = None,
        reason: Optional[str] = None
    ) -> RefundResult:
        return RefundResult(
            success=True,
            refund_id=f"REFUND-{uuid.uuid4().hex[:16].upper()}",
            original_transaction_id=transaction_id,
            amount=amount or 0,
            status=PaymentStatus.REFUNDED
        )

    async def create_payment_intent(
        self,
        amount: float,
        currency: str = "USD",
        metadata: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        return {
            "order_id": f"PAYPAL-ORDER-{uuid.uuid4().hex[:12].upper()}",
            "approval_url": f"https://paypal.com/checkout/{uuid.uuid4().hex[:12]}",
            "amount": amount,
            "currency": currency
        }

    async def save_payment_method(
        self,
        customer_id: str,
        payment_token: str
    ) -> PaymentMethod:
        return PaymentMethod(
            id=f"paypal_{uuid.uuid4().hex[:16]}",
            provider=self.provider,
            type=PaymentMethodType.DIGITAL_WALLET
        )


class KlarnaAdapter(PaymentProviderAdapter):
    """Klarna Buy Now Pay Later adapter"""

    def __init__(self):
        self.api_key = os.getenv("KLARNA_API_KEY", "demo")
        self.provider = PaymentProvider.KLARNA

    async def process_payment(
        self,
        amount: float,
        currency: str = "USD",
        payment_method_token: Optional[str] = None,
        customer_id: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None
    ) -> PaymentResult:
        transaction_id = f"klarna_{uuid.uuid4().hex[:20]}"
        return PaymentResult(
            success=True,
            transaction_id=transaction_id,
            provider=self.provider,
            status=PaymentStatus.COMPLETED,
            amount=amount,
            currency=currency,
            metadata={
                **(metadata or {}),
                "payment_plan": "pay_in_4",  # 4 installments
                "installment_amount": amount / 4
            }
        )

    async def refund(
        self,
        transaction_id: str,
        amount: Optional[float] = None,
        reason: Optional[str] = None
    ) -> RefundResult:
        return RefundResult(
            success=True,
            refund_id=f"klarna_refund_{uuid.uuid4().hex[:16]}",
            original_transaction_id=transaction_id,
            amount=amount or 0,
            status=PaymentStatus.REFUNDED
        )

    async def create_payment_intent(
        self,
        amount: float,
        currency: str = "USD",
        metadata: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        return {
            "session_id": f"klarna_session_{uuid.uuid4().hex[:16]}",
            "client_token": f"eyJhbGciOiJIUzI1NiJ9.{uuid.uuid4().hex}",
            "payment_options": [
                {"type": "pay_in_4", "installments": 4, "per_installment": amount / 4},
                {"type": "pay_in_30", "due_date": "30 days"},
            ]
        }

    async def save_payment_method(
        self,
        customer_id: str,
        payment_token: str
    ) -> PaymentMethod:
        return PaymentMethod(
            id=f"klarna_{uuid.uuid4().hex[:16]}",
            provider=self.provider,
            type=PaymentMethodType.BNPL
        )


class CashAppAdapter(PaymentProviderAdapter):
    """Cash App payment adapter"""

    def __init__(self):
        self.provider = PaymentProvider.CASH_APP

    async def process_payment(
        self,
        amount: float,
        currency: str = "USD",
        payment_method_token: Optional[str] = None,
        customer_id: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None
    ) -> PaymentResult:
        transaction_id = f"cashapp_{uuid.uuid4().hex[:20]}"
        return PaymentResult(
            success=True,
            transaction_id=transaction_id,
            provider=self.provider,
            status=PaymentStatus.COMPLETED,
            amount=amount,
            currency=currency,
            metadata=metadata
        )

    async def refund(
        self,
        transaction_id: str,
        amount: Optional[float] = None,
        reason: Optional[str] = None
    ) -> RefundResult:
        return RefundResult(
            success=True,
            refund_id=f"cashapp_refund_{uuid.uuid4().hex[:16]}",
            original_transaction_id=transaction_id,
            amount=amount or 0,
            status=PaymentStatus.REFUNDED
        )

    async def create_payment_intent(
        self,
        amount: float,
        currency: str = "USD",
        metadata: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        return {
            "cashtag": "$restaurant",
            "amount": amount,
            "qr_code_url": f"https://cash.app/qr/{uuid.uuid4().hex[:12]}"
        }

    async def save_payment_method(
        self,
        customer_id: str,
        payment_token: str
    ) -> PaymentMethod:
        return PaymentMethod(
            id=f"cashapp_{uuid.uuid4().hex[:16]}",
            provider=self.provider,
            type=PaymentMethodType.P2P
        )


class VenmoAdapter(PaymentProviderAdapter):
    """Venmo payment adapter"""

    def __init__(self):
        self.provider = PaymentProvider.VENMO

    async def process_payment(
        self,
        amount: float,
        currency: str = "USD",
        payment_method_token: Optional[str] = None,
        customer_id: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None
    ) -> PaymentResult:
        transaction_id = f"venmo_{uuid.uuid4().hex[:20]}"
        return PaymentResult(
            success=True,
            transaction_id=transaction_id,
            provider=self.provider,
            status=PaymentStatus.COMPLETED,
            amount=amount,
            currency=currency,
            metadata=metadata
        )

    async def refund(
        self,
        transaction_id: str,
        amount: Optional[float] = None,
        reason: Optional[str] = None
    ) -> RefundResult:
        return RefundResult(
            success=True,
            refund_id=f"venmo_refund_{uuid.uuid4().hex[:16]}",
            original_transaction_id=transaction_id,
            amount=amount or 0,
            status=PaymentStatus.REFUNDED
        )

    async def create_payment_intent(
        self,
        amount: float,
        currency: str = "USD",
        metadata: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        return {
            "venmo_handle": "@restaurant",
            "amount": amount,
            "deep_link": f"venmo://paycharge?txn=pay&amount={amount}"
        }

    async def save_payment_method(
        self,
        customer_id: str,
        payment_token: str
    ) -> PaymentMethod:
        return PaymentMethod(
            id=f"venmo_{uuid.uuid4().hex[:16]}",
            provider=self.provider,
            type=PaymentMethodType.P2P
        )


class CashAdapter(PaymentProviderAdapter):
    """Cash payment adapter - for manual cash transactions"""

    def __init__(self):
        self.provider = PaymentProvider.CASH

    async def process_payment(
        self,
        amount: float,
        currency: str = "USD",
        payment_method_token: Optional[str] = None,
        customer_id: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None
    ) -> PaymentResult:
        transaction_id = f"cash_{uuid.uuid4().hex[:20]}"
        return PaymentResult(
            success=True,
            transaction_id=transaction_id,
            provider=self.provider,
            status=PaymentStatus.COMPLETED,
            amount=amount,
            currency=currency,
            refundable=False,  # Cash refunds handled manually
            metadata={
                **(metadata or {}),
                "cash_received": metadata.get("cash_received", amount) if metadata else amount,
                "change_due": (metadata.get("cash_received", amount) if metadata else amount) - amount
            }
        )

    async def refund(
        self,
        transaction_id: str,
        amount: Optional[float] = None,
        reason: Optional[str] = None
    ) -> RefundResult:
        # Cash refunds are manual
        return RefundResult(
            success=True,
            refund_id=f"cash_refund_{uuid.uuid4().hex[:16]}",
            original_transaction_id=transaction_id,
            amount=amount or 0,
            status=PaymentStatus.REFUNDED
        )

    async def create_payment_intent(
        self,
        amount: float,
        currency: str = "USD",
        metadata: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        return {
            "amount_due": amount,
            "currency": currency,
            "type": "cash"
        }

    async def save_payment_method(
        self,
        customer_id: str,
        payment_token: str
    ) -> PaymentMethod:
        raise NotImplementedError("Cash payment method cannot be saved")


class UnifiedPaymentService:
    """
    Unified payment service that routes to appropriate payment provider.

    Provides a single interface for all payment operations regardless of provider.
    """

    def __init__(self):
        self.adapters: Dict[PaymentProvider, PaymentProviderAdapter] = {
            PaymentProvider.STRIPE: StripeAdapter(),
            PaymentProvider.PAYPAL: PayPalAdapter(),
            PaymentProvider.KLARNA: KlarnaAdapter(),
            PaymentProvider.CASH_APP: CashAppAdapter(),
            PaymentProvider.VENMO: VenmoAdapter(),
            PaymentProvider.APPLE_PAY: StripeAdapter(),  # Apple Pay via Stripe
            PaymentProvider.GOOGLE_PAY: StripeAdapter(),  # Google Pay via Stripe
            PaymentProvider.CASH: CashAdapter(),
        }

    def get_adapter(self, provider: PaymentProvider) -> PaymentProviderAdapter:
        """Get the appropriate adapter for a provider"""
        if provider not in self.adapters:
            raise ValueError(f"Unsupported payment provider: {provider}")
        return self.adapters[provider]

    async def process_payment(
        self,
        provider: PaymentProvider,
        amount: float,
        currency: str = "USD",
        payment_method_token: Optional[str] = None,
        customer_id: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None
    ) -> PaymentResult:
        """Process a payment through the specified provider"""
        adapter = self.get_adapter(provider)
        return await adapter.process_payment(
            amount=amount,
            currency=currency,
            payment_method_token=payment_method_token,
            customer_id=customer_id,
            metadata=metadata
        )

    async def refund(
        self,
        provider: PaymentProvider,
        transaction_id: str,
        amount: Optional[float] = None,
        reason: Optional[str] = None
    ) -> RefundResult:
        """Process a refund through the specified provider"""
        adapter = self.get_adapter(provider)
        return await adapter.refund(
            transaction_id=transaction_id,
            amount=amount,
            reason=reason
        )

    async def create_payment_intent(
        self,
        provider: PaymentProvider,
        amount: float,
        currency: str = "USD",
        metadata: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """Create a payment intent for client-side processing"""
        adapter = self.get_adapter(provider)
        intent = await adapter.create_payment_intent(
            amount=amount,
            currency=currency,
            metadata=metadata
        )
        intent["provider"] = provider.value
        return intent

    async def get_available_providers(self) -> List[Dict[str, Any]]:
        """Get list of available payment providers"""
        return [
            {
                "id": PaymentProvider.STRIPE.value,
                "name": "Credit/Debit Card",
                "icon": "credit-card",
                "types": ["credit_card", "debit_card"]
            },
            {
                "id": PaymentProvider.APPLE_PAY.value,
                "name": "Apple Pay",
                "icon": "apple",
                "types": ["digital_wallet"]
            },
            {
                "id": PaymentProvider.GOOGLE_PAY.value,
                "name": "Google Pay",
                "icon": "google",
                "types": ["digital_wallet"]
            },
            {
                "id": PaymentProvider.PAYPAL.value,
                "name": "PayPal",
                "icon": "paypal",
                "types": ["digital_wallet"]
            },
            {
                "id": PaymentProvider.KLARNA.value,
                "name": "Klarna - Pay Later",
                "icon": "klarna",
                "types": ["buy_now_pay_later"]
            },
            {
                "id": PaymentProvider.VENMO.value,
                "name": "Venmo",
                "icon": "venmo",
                "types": ["p2p"]
            },
            {
                "id": PaymentProvider.CASH_APP.value,
                "name": "Cash App",
                "icon": "cash-app",
                "types": ["p2p"]
            },
            {
                "id": PaymentProvider.CASH.value,
                "name": "Cash",
                "icon": "banknotes",
                "types": ["cash"]
            }
        ]

    async def process_split_payment(
        self,
        splits: List[Dict[str, Any]]
    ) -> List[PaymentResult]:
        """
        Process a split payment across multiple providers.

        Args:
            splits: List of payment splits, each containing:
                - provider: PaymentProvider
                - amount: float
                - payment_method_token: Optional[str]

        Returns:
            List of PaymentResults for each split
        """
        results = []
        for split in splits:
            result = await self.process_payment(
                provider=PaymentProvider(split["provider"]),
                amount=split["amount"],
                payment_method_token=split.get("payment_method_token"),
                metadata=split.get("metadata")
            )
            results.append(result)
        return results


# Singleton instance
payment_service = UnifiedPaymentService()
