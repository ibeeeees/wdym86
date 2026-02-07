"""
Solana Pay Integration Service

Enables cryptocurrency payments for restaurant purchases using Solana Pay.
"""

import os
import json
import uuid
from datetime import datetime, timedelta
from typing import Optional, Dict, Any
from dataclasses import dataclass
from enum import Enum


class SolanaNetwork(Enum):
    """Solana network environments"""
    MAINNET = "mainnet-beta"
    DEVNET = "devnet"
    TESTNET = "testnet"


@dataclass
class PaymentRequest:
    """Solana Pay payment request"""
    id: str
    recipient: str
    amount: float
    label: str
    message: str
    memo: str
    reference: str
    created_at: datetime
    expires_at: datetime
    status: str  # pending, completed, expired, cancelled


class SolanaPayService:
    """
    Solana Pay integration for restaurant payments.

    Supports:
    - QR code payment links
    - Transaction verification
    - Payment status tracking
    - USD to SOL conversion
    """

    def __init__(self):
        self.network = os.getenv("SOLANA_NETWORK", "devnet")
        self.wallet_address = os.getenv("SOLANA_WALLET_ADDRESS", "")
        self.rpc_url = os.getenv("SOLANA_RPC_URL", "https://api.devnet.solana.com")

        # In-memory storage for demo (use database in production)
        self.payment_requests: Dict[str, PaymentRequest] = {}

        # Mock SOL/USD rate (in production, fetch from oracle)
        self._sol_usd_rate = 95.50  # Example rate

    def get_sol_price(self) -> float:
        """
        Get current SOL/USD exchange rate.

        In production, this would fetch from a price oracle like Pyth.
        """
        return self._sol_usd_rate

    def usd_to_sol(self, usd_amount: float) -> float:
        """Convert USD amount to SOL"""
        return round(usd_amount / self._sol_usd_rate, 6)

    def sol_to_usd(self, sol_amount: float) -> float:
        """Convert SOL amount to USD"""
        return round(sol_amount * self._sol_usd_rate, 2)

    def create_payment_request(
        self,
        amount_usd: float,
        label: str,
        message: str,
        memo: Optional[str] = None,
        expires_in_minutes: int = 30
    ) -> Dict[str, Any]:
        """
        Create a Solana Pay payment request.

        Returns a payment URL that can be encoded as a QR code.
        """
        payment_id = str(uuid.uuid4())
        reference = str(uuid.uuid4())  # Unique reference for tracking

        sol_amount = self.usd_to_sol(amount_usd)

        now = datetime.now()
        expires_at = now + timedelta(minutes=expires_in_minutes)

        payment = PaymentRequest(
            id=payment_id,
            recipient=self.wallet_address,
            amount=sol_amount,
            label=label,
            message=message,
            memo=memo or f"WDYM86-{payment_id[:8]}",
            reference=reference,
            created_at=now,
            expires_at=expires_at,
            status="pending"
        )

        self.payment_requests[payment_id] = payment

        # Build Solana Pay URL
        # Format: solana:<recipient>?amount=<amount>&spl-token=<token>&reference=<reference>&label=<label>&message=<message>&memo=<memo>
        payment_url = self._build_payment_url(payment)

        return {
            "payment_id": payment_id,
            "reference": reference,
            "amount_usd": amount_usd,
            "amount_sol": sol_amount,
            "sol_price": self._sol_usd_rate,
            "recipient": self.wallet_address,
            "label": label,
            "message": message,
            "memo": payment.memo,
            "payment_url": payment_url,
            "qr_data": payment_url,  # Use for QR code generation
            "expires_at": expires_at.isoformat(),
            "network": self.network
        }

    def _build_payment_url(self, payment: PaymentRequest) -> str:
        """Build Solana Pay URL"""
        import urllib.parse

        base_url = f"solana:{payment.recipient}"

        params = {
            "amount": str(payment.amount),
            "reference": payment.reference,
            "label": payment.label,
            "message": payment.message,
            "memo": payment.memo
        }

        query_string = urllib.parse.urlencode(params)
        return f"{base_url}?{query_string}"

    def get_payment_status(self, payment_id: str) -> Optional[Dict[str, Any]]:
        """Get status of a payment request"""
        payment = self.payment_requests.get(payment_id)

        if not payment:
            return None

        # Check if expired
        if payment.status == "pending" and datetime.now() > payment.expires_at:
            payment.status = "expired"

        return {
            "payment_id": payment.id,
            "status": payment.status,
            "amount_sol": payment.amount,
            "amount_usd": self.sol_to_usd(payment.amount),
            "recipient": payment.recipient,
            "reference": payment.reference,
            "created_at": payment.created_at.isoformat(),
            "expires_at": payment.expires_at.isoformat(),
            "network": self.network
        }

    def verify_payment(self, payment_id: str, signature: str) -> Dict[str, Any]:
        """
        Verify a Solana transaction for a payment.

        In production, this would:
        1. Fetch transaction from Solana RPC
        2. Verify recipient, amount, and reference
        3. Update payment status
        """
        payment = self.payment_requests.get(payment_id)

        if not payment:
            return {
                "success": False,
                "error": "Payment request not found"
            }

        if payment.status == "completed":
            return {
                "success": True,
                "message": "Payment already verified",
                "payment_id": payment_id
            }

        if payment.status == "expired":
            return {
                "success": False,
                "error": "Payment request has expired"
            }

        # In production, verify the transaction on-chain here
        # For demo, we'll mark as completed
        payment.status = "completed"

        return {
            "success": True,
            "message": "Payment verified successfully",
            "payment_id": payment_id,
            "signature": signature,
            "amount_sol": payment.amount,
            "amount_usd": self.sol_to_usd(payment.amount)
        }

    def cancel_payment(self, payment_id: str) -> Dict[str, Any]:
        """Cancel a pending payment request"""
        payment = self.payment_requests.get(payment_id)

        if not payment:
            return {
                "success": False,
                "error": "Payment request not found"
            }

        if payment.status != "pending":
            return {
                "success": False,
                "error": f"Cannot cancel payment with status: {payment.status}"
            }

        payment.status = "cancelled"

        return {
            "success": True,
            "message": "Payment request cancelled",
            "payment_id": payment_id
        }

    def list_payments(
        self,
        status: Optional[str] = None,
        limit: int = 50
    ) -> list:
        """List payment requests"""
        payments = list(self.payment_requests.values())

        if status:
            payments = [p for p in payments if p.status == status]

        # Sort by created_at descending
        payments.sort(key=lambda p: p.created_at, reverse=True)

        return [
            {
                "payment_id": p.id,
                "status": p.status,
                "amount_sol": p.amount,
                "amount_usd": self.sol_to_usd(p.amount),
                "label": p.label,
                "created_at": p.created_at.isoformat(),
                "expires_at": p.expires_at.isoformat()
            }
            for p in payments[:limit]
        ]


# Singleton instance
solana_pay_service = SolanaPayService()


def get_solana_pay_service() -> SolanaPayService:
    """Get Solana Pay service instance"""
    return solana_pay_service
