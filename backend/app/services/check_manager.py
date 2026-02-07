"""
Check Management Service

Handles check creation, updating, and management for POS system.
Implements 26.md specification for check-based ordering workflow.
"""

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from datetime import datetime
from typing import List, Optional, Dict, Any
import logging

from ..database import Check, CheckItem, generate_uuid

logger = logging.getLogger(__name__)


class CheckManagementService:
    """Service for managing POS checks"""
    
    def __init__(self, db: AsyncSession):
        self.db = db
    
    async def create_check(
        self,
        restaurant_id: str,
        order_type: str,
        check_name: str,
        created_by: str,
        table_id: Optional[str] = None,
        customer_name: Optional[str] = None,
        customer_phone: Optional[str] = None
    ) -> Check:
        """
        Create a new check with auto-generated check number
        
        Args:
            restaurant_id: Restaurant ID
            order_type: "dine_in", "takeout", or "delivery"
            check_name: User-provided name (e.g., "Table 5", "John Doe")
            created_by: User ID of POS user
            table_id: Optional table ID for dine-in
            customer_name: Optional customer name for takeout/delivery
            customer_phone: Optional phone for takeout/delivery
        
        Returns:
            Created Check object
        """
        logger.info(f"Creating check: {check_name} ({order_type}) for restaurant {restaurant_id}")
        
        # Validate order type
        if order_type not in ["dine_in", "takeout", "delivery"]:
            raise ValueError(f"Invalid order type: {order_type}")
        
        # Generate check number
        check_number = await self._generate_check_number(restaurant_id, order_type)
        
        # Create check
        check = Check(
            id=generate_uuid(),
            restaurant_id=restaurant_id,
            order_type=order_type,
            check_name=check_name,
            check_number=check_number,
            created_by=created_by,
            status="active",
            table_id=table_id,
            customer_name=customer_name,
            customer_phone=customer_phone,
            subtotal=0.0,
            tax=0.0,
            total=0.0,
            created_at=datetime.utcnow()
        )
        
        self.db.add(check)
        await self.db.commit()
        await self.db.refresh(check)
        
        logger.info(f"Check created: {check.check_number} (ID: {check.id})")
        return check
    
    async def get_check(self, check_id: str) -> Optional[Check]:
        """Get check by ID"""
        result = await self.db.execute(
            select(Check).where(Check.id == check_id)
        )
        return result.scalar_one_or_none()
    
    async def get_check_list(
        self,
        restaurant_id: str,
        order_type: str,
        status: str = "active"
    ) -> List[Check]:
        """
        Get list of checks for a specific order type
        
        Args:
            restaurant_id: Restaurant ID
            order_type: "dine_in", "takeout", or "delivery"
            status: Check status filter (default: "active")
        
        Returns:
            List of Check objects
        """
        result = await self.db.execute(
            select(Check).where(
                and_(
                    Check.restaurant_id == restaurant_id,
                    Check.order_type == order_type,
                    Check.status == status
                )
            ).order_by(Check.created_at.desc())
        )
        return list(result.scalars().all())
    
    async def add_item_to_check(
        self,
        check_id: str,
        name: str,
        quantity: int,
        price: float,
        menu_item_id: Optional[str] = None,
        modifiers: Optional[List[str]] = None,
        special_instructions: Optional[str] = None
    ) -> CheckItem:
        """Add an item to a check"""
        logger.info(f"Adding item to check {check_id}: {name} x{quantity}")
        
        # Create check item
        item = CheckItem(
            id=generate_uuid(),
            check_id=check_id,
            menu_item_id=menu_item_id,
            name=name,
            quantity=quantity,
            price=price,
            modifiers=modifiers or [],
            special_instructions=special_instructions,
            sent_to_bohpos=False,
            created_at=datetime.utcnow()
        )
        
        self.db.add(item)
        
        # Update check totals
        await self._recalculate_check_totals(check_id)
        
        await self.db.commit()
        await self.db.refresh(item)
        
        return item
    
    async def update_check_status(self, check_id: str, status: str) -> Check:
        """Update check status"""
        check = await self.get_check(check_id)
        if not check:
            raise ValueError(f"Check {check_id} not found")
        
        check.status = status
        if status == "finalized":
            check.finalized_at = datetime.utcnow()
        
        await self.db.commit()
        await self.db.refresh(check)
        
        return check
    
    async def finalize_check(
        self,
        check_id: str,
        tip_amount: float
    ) -> Check:
        """
        Finalize check with tip
        
        Args:
            check_id: Check ID
            tip_amount: Tip amount
        
        Returns:
            Finalized Check object
        """
        logger.info(f"Finalizing check {check_id} with tip ${tip_amount}")
        
        check = await self.get_check(check_id)
        if not check:
            raise ValueError(f"Check {check_id} not found")
        
        # Add tip
        check.tip = tip_amount
        check.final_total = check.total + tip_amount
        check.status = "finalized"
        check.finalized_at = datetime.utcnow()
        
        await self.db.commit()
        await self.db.refresh(check)
        
        logger.info(f"Check finalized: {check.check_number} - Final total: ${check.final_total}")
        return check
    
    async def void_check(self, check_id: str) -> Check:
        """Void a check"""
        check = await self.get_check(check_id)
        if not check:
            raise ValueError(f"Check {check_id} not found")
        
        check.status = "voided"
        await self.db.commit()
        await self.db.refresh(check)
        
        return check
    
    async def get_check_items(self, check_id: str) -> List[CheckItem]:
        """Get all items for a check"""
        result = await self.db.execute(
            select(CheckItem).where(CheckItem.check_id == check_id)
        )
        return list(result.scalars().all())
    
    async def _generate_check_number(self, restaurant_id: str, order_type: str) -> str:
        """
        Generate unique check number
        
        Format:
        - Dine-in: DIN-001, DIN-002, etc.
        - Takeout: TO-001, TO-002, etc.
        - Delivery: DEL-001, DEL-002, etc.
        """
        # Get prefix based on order type
        prefix_map = {
            "dine_in": "DIN",
            "takeout": "TO",
            "delivery": "DEL"
        }
        prefix = prefix_map.get(order_type, "CHK")
        
        # Get count of checks for this restaurant and order type today
        today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
        result = await self.db.execute(
            select(Check).where(
                and_(
                    Check.restaurant_id == restaurant_id,
                    Check.order_type == order_type,
                    Check.created_at >= today_start
                )
            )
        )
        count = len(list(result.scalars().all()))
        
        # Generate number
        number = f"{prefix}-{count + 1:03d}"
        return number
    
    async def _recalculate_check_totals(self, check_id: str, tax_rate: float = 0.08):
        """Recalculate check subtotal, tax, and total"""
        check = await self.get_check(check_id)
        if not check:
            return
        
        # Get all items
        items = await self.get_check_items(check_id)
        
        # Calculate subtotal
        subtotal = sum(item.price * item.quantity for item in items)
        
        # Calculate tax
        tax = subtotal * tax_rate
        
        # Calculate total
        total = subtotal + tax
        
        # Update check
        check.subtotal = round(subtotal, 2)
        check.tax = round(tax, 2)
        check.total = round(total, 2)
        
        await self.db.commit()
