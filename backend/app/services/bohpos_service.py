"""
BOHPOS Service (Back of House POS)

Handles order sending to kitchen, order bumping, and kitchen display management.
Implements 26.md specification for BOHPOS integration.
"""

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from datetime import datetime
from typing import List, Optional, Dict, Any
import logging
import json

from ..database import SentOrder, Check, CheckItem, generate_uuid

logger = logging.getLogger(__name__)


class BOHPOSService:
    """Service for BOHPOS (Back of House POS) operations"""
    
    def __init__(self, db: AsyncSession):
        self.db = db
    
    async def send_order_to_bohpos(
        self,
        check_id: str,
        item_ids: Optional[List[str]] = None
    ) -> SentOrder:
        """
        Send order items to BOHPOS (kitchen display)
        
        Args:
            check_id: Check ID
            item_ids: Optional list of specific item IDs to send.
                     If None, sends all unsent items.
        
        Returns:
            SentOrder object with unique ID
        """
        logger.info(f"Sending order to BOHPOS for check {check_id}")
        
        # Get check
        result = await self.db.execute(
            select(Check).where(Check.id == check_id)
        )
        check = result.scalar_one_or_none()
        if not check:
            raise ValueError(f"Check {check_id} not found")
        
        # Get items to send
        if item_ids:
            # Send specific items
            result = await self.db.execute(
                select(CheckItem).where(
                    and_(
                        CheckItem.check_id == check_id,
                        CheckItem.id.in_(item_ids)
                    )
                )
            )
            items = list(result.scalars().all())
        else:
            # Send all unsent items
            result = await self.db.execute(
                select(CheckItem).where(
                    and_(
                        CheckItem.check_id == check_id,
                        CheckItem.sent_to_bohpos == False
                    )
                )
            )
            items = list(result.scalars().all())
        
        if not items:
            raise ValueError("No items to send to BOHPOS")
        
        # Create snapshot of items
        items_data = [
            {
                "id": item.id,
                "name": item.name,
                "quantity": item.quantity,
                "price": item.price,
                "modifiers": item.modifiers or [],
                "special_instructions": item.special_instructions
            }
            for item in items
        ]
        
        # Create sent order with unique ID
        sent_order = SentOrder(
            id=generate_uuid(),  # Unique sent_order_id
            check_id=check_id,
            check_name=check.check_name,
            check_number=check.check_number,
            restaurant_id=check.restaurant_id,
            order_type=check.order_type,
            items_data=items_data,
            item_count=len(items),
            sent_at=datetime.utcnow(),
            status="pending"
        )
        
        self.db.add(sent_order)
        
        # Mark items as sent
        for item in items:
            item.sent_to_bohpos = True
        
        # Update check status
        check.status = "sent"
        
        await self.db.commit()
        await self.db.refresh(sent_order)
        
        logger.info(f"Order sent to BOHPOS: {sent_order.id} ({len(items)} items)")
        return sent_order
    
    async def get_active_orders(self, restaurant_id: str) -> List[SentOrder]:
        """
        Get all active orders for BOHPOS display
        
        Args:
            restaurant_id: Restaurant ID
        
        Returns:
            List of active SentOrder objects
        """
        result = await self.db.execute(
            select(SentOrder).where(
                and_(
                    SentOrder.restaurant_id == restaurant_id,
                    SentOrder.status.in_(["pending", "in_progress"])
                )
            ).order_by(SentOrder.sent_at.asc())  # Oldest first
        )
        return list(result.scalars().all())
    
    async def get_recent_orders(
        self,
        restaurant_id: str,
        limit: int = 50
    ) -> List[SentOrder]:
        """
        Get recent completed orders
        
        Args:
            restaurant_id: Restaurant ID
            limit: Maximum number of orders to return
        
        Returns:
            List of completed SentOrder objects
        """
        result = await self.db.execute(
            select(SentOrder).where(
                and_(
                    SentOrder.restaurant_id == restaurant_id,
                    SentOrder.status == "completed"
                )
            ).order_by(SentOrder.completed_at.desc()).limit(limit)
        )
        return list(result.scalars().all())
    
    async def update_order_status(
        self,
        sent_order_id: str,
        status: str
    ) -> SentOrder:
        """
        Update order status (e.g., from "pending" to "in_progress")
        
        Args:
            sent_order_id: Sent order ID
            status: New status
        
        Returns:
            Updated SentOrder
        """
        result = await self.db.execute(
            select(SentOrder).where(SentOrder.id == sent_order_id)
        )
        sent_order = result.scalar_one_or_none()
        if not sent_order:
            raise ValueError(f"Sent order {sent_order_id} not found")
        
        sent_order.status = status
        await self.db.commit()
        await self.db.refresh(sent_order)
        
        return sent_order
    
    async def bump_order(
        self,
        sent_order_id: str,
        completed_by: str
    ) -> SentOrder:
        """
        Mark order as complete (bump order)
        
        Args:
            sent_order_id: Sent order ID
            completed_by: User ID of kitchen staff who bumped it
        
        Returns:
            Completed SentOrder
        """
        logger.info(f"Bumping order {sent_order_id}")
        
        result = await self.db.execute(
            select(SentOrder).where(SentOrder.id == sent_order_id)
        )
        sent_order = result.scalar_one_or_none()
        if not sent_order:
            raise ValueError(f"Sent order {sent_order_id} not found")
        
        # Update order status
        sent_order.status = "completed"
        sent_order.completed_at = datetime.utcnow()
        sent_order.completed_by = completed_by
        
        await self.db.commit()
        await self.db.refresh(sent_order)
        
        logger.info(f"Order bumped: {sent_order.id} - {sent_order.check_name}")
        return sent_order
    
    async def get_sent_order(self, sent_order_id: str) -> Optional[SentOrder]:
        """Get sent order by ID"""
        result = await self.db.execute(
            select(SentOrder).where(SentOrder.id == sent_order_id)
        )
        return result.scalar_one_or_none()
    
    async def get_orders_for_check(self, check_id: str) -> List[SentOrder]:
        """Get all orders sent for a specific check"""
        result = await self.db.execute(
            select(SentOrder).where(SentOrder.check_id == check_id).order_by(SentOrder.sent_at.asc())
        )
        return list(result.scalars().all())
