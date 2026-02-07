"""
Receipt Generation Service

Handles receipt creation and formatting for completed orders.
Implements 26.md specification for receipt generation.
"""

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import datetime
from typing import Optional, Dict, Any
import logging

from ..database import Receipt, Check, CheckItem, generate_uuid

logger = logging.getLogger(__name__)


class ReceiptService:
    """Service for generating receipts"""
    
    def __init__(self, db: AsyncSession):
        self.db = db
    
    async def generate_receipt(
        self,
        check_id: str,
        payment_method: str,
        payment_id: Optional[str] = None,
        restaurant_customization: Optional[Dict[str, Any]] = None
    ) -> Receipt:
        """
        Generate receipt for a check
        
        Args:
            check_id: Check ID
            payment_method: Payment method used
            payment_id: Optional payment transaction ID
            restaurant_customization: Optional custom receipt data
        
        Returns:
            Generated Receipt object
        """
        logger.info(f"Generating receipt for check {check_id}")
        
        # Get check
        result = await self.db.execute(
            select(Check).where(Check.id == check_id)
        )
        check = result.scalar_one_or_none()
        if not check:
            raise ValueError(f"Check {check_id} not found")
        
        # Get check items
        result = await self.db.execute(
            select(CheckItem).where(CheckItem.check_id == check_id)
        )
        items = list(result.scalars().all())
        
        # Create items snapshot
        items_data = [
            {
                "name": item.name,
                "quantity": item.quantity,
                "price": item.price,
                "modifiers": item.modifiers or [],
                "special_instructions": item.special_instructions,
                "total": item.price * item.quantity
            }
            for item in items
        ]
        
        # Generate receipt number
        receipt_number = await self._generate_receipt_number(check.restaurant_id)
        
        # Calculate final total (subtotal + tax + tip)
        final_total = check.total + (check.tip or 0.0)
        
        # Create receipt
        receipt = Receipt(
            id=generate_uuid(),
            receipt_number=receipt_number,
            check_id=check_id,
            check_name=check.check_name,
            check_number=check.check_number,
            restaurant_id=check.restaurant_id,
            order_type=check.order_type,
            items_data=items_data,
            subtotal=check.subtotal,
            tax=check.tax,
            tip=check.tip,
            total=check.total,
            final_total=final_total,
            payment_method=payment_method,
            payment_id=payment_id,
            restaurant_customization=restaurant_customization or {},
            generated_at=datetime.utcnow()
        )
        
        self.db.add(receipt)
        await self.db.commit()
        await self.db.refresh(receipt)
        
        logger.info(f"Receipt generated: {receipt.receipt_number} - ${final_total}")
        return receipt
    
    async def get_receipt(self, receipt_id: str) -> Optional[Receipt]:
        """Get receipt by ID"""
        result = await self.db.execute(
            select(Receipt).where(Receipt.id == receipt_id)
        )
        return result.scalar_one_or_none()
    
    async def get_receipt_by_number(self, receipt_number: str) -> Optional[Receipt]:
        """Get receipt by receipt number"""
        result = await self.db.execute(
            select(Receipt).where(Receipt.receipt_number == receipt_number)
        )
        return result.scalar_one_or_none()
    
    async def get_receipt_by_check(self, check_id: str) -> Optional[Receipt]:
        """Get receipt for a check"""
        result = await self.db.execute(
            select(Receipt).where(Receipt.check_id == check_id)
        )
        return result.scalar_one_or_none()
    
    async def format_receipt_for_display(self, receipt_id: str) -> Dict[str, Any]:
        """
        Format receipt for display/printing
        
        Returns:
            Formatted receipt data
        """
        receipt = await self.get_receipt(receipt_id)
        if not receipt:
            raise ValueError(f"Receipt {receipt_id} not found")
        
        return {
            "receipt_number": receipt.receipt_number,
            "check_name": receipt.check_name,
            "check_number": receipt.check_number,
            "order_type": receipt.order_type,
            "items": receipt.items_data,
            "subtotal": f"${receipt.subtotal:.2f}",
            "tax": f"${receipt.tax:.2f}",
            "tip": f"${receipt.tip:.2f}" if receipt.tip else "$0.00",
            "total": f"${receipt.total:.2f}",
            "final_total": f"${receipt.final_total:.2f}",
            "payment_method": receipt.payment_method,
            "date": receipt.generated_at.strftime("%Y-%m-%d %H:%M:%S"),
            "customization": receipt.restaurant_customization
        }
    
    async def _generate_receipt_number(self, restaurant_id: str) -> str:
        """
        Generate unique receipt number
        
        Format: RCP-001, RCP-002, etc.
        """
        # Get count of receipts for this restaurant today
        today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
        result = await self.db.execute(
            select(Receipt).where(
                Receipt.restaurant_id == restaurant_id,
                Receipt.generated_at >= today_start
            )
        )
        count = len(list(result.scalars().all()))
        
        # Generate number
        number = f"RCP-{count + 1:03d}"
        return number
