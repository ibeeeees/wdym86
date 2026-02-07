"""
Delivery Services Integration Module

Supports integration with major delivery platforms:
- DoorDash
- Uber Eats
- Grubhub
- Postmates
- Seamless
"""

from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import Dict, List, Optional, Any
from enum import Enum
from datetime import datetime
import asyncio
import uuid


class DeliveryPlatform(str, Enum):
    """Supported delivery platforms"""
    DOORDASH = "doordash"
    UBER_EATS = "uber_eats"
    GRUBHUB = "grubhub"
    POSTMATES = "postmates"
    SEAMLESS = "seamless"


class DeliveryOrderStatus(str, Enum):
    """Order status states"""
    PENDING = "pending"
    CONFIRMED = "confirmed"
    PREPARING = "preparing"
    READY_FOR_PICKUP = "ready_for_pickup"
    OUT_FOR_DELIVERY = "out_for_delivery"
    DELIVERED = "delivered"
    CANCELLED = "cancelled"


@dataclass
class DeliveryOrder:
    """Represents a delivery order from any platform"""
    id: str
    platform: DeliveryPlatform
    external_id: str
    customer_name: str
    customer_phone: str
    customer_address: str
    items: List[Dict[str, Any]]
    subtotal: float
    delivery_fee: float
    tax: float
    tip: float
    total: float
    status: DeliveryOrderStatus
    estimated_delivery_time: Optional[datetime]
    driver_name: Optional[str]
    driver_phone: Optional[str]
    created_at: datetime
    updated_at: datetime


@dataclass
class DeliveryStats:
    """Aggregated delivery statistics"""
    total_orders: int
    total_revenue: float
    avg_order_value: float
    by_platform: Dict[str, int]
    by_status: Dict[str, int]


class DeliveryProviderAdapter(ABC):
    """Abstract base class for delivery provider integrations"""

    @abstractmethod
    async def get_orders(self, status: Optional[DeliveryOrderStatus] = None) -> List[DeliveryOrder]:
        """Fetch orders from the platform"""
        pass

    @abstractmethod
    async def accept_order(self, external_id: str) -> bool:
        """Accept an incoming order"""
        pass

    @abstractmethod
    async def update_status(self, external_id: str, status: DeliveryOrderStatus) -> bool:
        """Update order status"""
        pass

    @abstractmethod
    async def cancel_order(self, external_id: str, reason: str) -> bool:
        """Cancel an order"""
        pass

    @abstractmethod
    async def get_driver_location(self, external_id: str) -> Optional[Dict[str, float]]:
        """Get driver's current location"""
        pass


class DoorDashAdapter(DeliveryProviderAdapter):
    """DoorDash API integration"""

    def __init__(self, api_key: str, store_id: str):
        self.api_key = api_key
        self.store_id = store_id
        self.base_url = "https://api.doordash.com/v1"

    async def get_orders(self, status: Optional[DeliveryOrderStatus] = None) -> List[DeliveryOrder]:
        # In production, call DoorDash API
        # For demo, return mock data
        return self._generate_mock_orders(DeliveryPlatform.DOORDASH)

    async def accept_order(self, external_id: str) -> bool:
        # API call to accept order
        return True

    async def update_status(self, external_id: str, status: DeliveryOrderStatus) -> bool:
        # API call to update status
        return True

    async def cancel_order(self, external_id: str, reason: str) -> bool:
        # API call to cancel
        return True

    async def get_driver_location(self, external_id: str) -> Optional[Dict[str, float]]:
        # Return mock location
        return {"lat": 37.7749, "lng": -122.4194}

    def _generate_mock_orders(self, platform: DeliveryPlatform) -> List[DeliveryOrder]:
        return [
            DeliveryOrder(
                id=str(uuid.uuid4()),
                platform=platform,
                external_id=f"DD-{uuid.uuid4().hex[:8].upper()}",
                customer_name="John D.",
                customer_phone="(555) 123-4567",
                customer_address="123 Main St, San Francisco, CA 94105",
                items=[
                    {"name": "Grilled Salmon", "quantity": 1, "price": 28.99},
                    {"name": "Caesar Salad", "quantity": 1, "price": 12.99},
                ],
                subtotal=41.98,
                delivery_fee=4.99,
                tax=3.78,
                tip=8.00,
                total=58.75,
                status=DeliveryOrderStatus.PREPARING,
                estimated_delivery_time=datetime.now(),
                driver_name="Mike T.",
                driver_phone="(555) 987-6543",
                created_at=datetime.now(),
                updated_at=datetime.now()
            )
        ]


class UberEatsAdapter(DeliveryProviderAdapter):
    """Uber Eats API integration"""

    def __init__(self, client_id: str, client_secret: str, store_id: str):
        self.client_id = client_id
        self.client_secret = client_secret
        self.store_id = store_id
        self.base_url = "https://api.uber.com/v1/eats"

    async def get_orders(self, status: Optional[DeliveryOrderStatus] = None) -> List[DeliveryOrder]:
        return self._generate_mock_orders(DeliveryPlatform.UBER_EATS)

    async def accept_order(self, external_id: str) -> bool:
        return True

    async def update_status(self, external_id: str, status: DeliveryOrderStatus) -> bool:
        return True

    async def cancel_order(self, external_id: str, reason: str) -> bool:
        return True

    async def get_driver_location(self, external_id: str) -> Optional[Dict[str, float]]:
        return {"lat": 37.7749, "lng": -122.4194}

    def _generate_mock_orders(self, platform: DeliveryPlatform) -> List[DeliveryOrder]:
        return [
            DeliveryOrder(
                id=str(uuid.uuid4()),
                platform=platform,
                external_id=f"UE-{uuid.uuid4().hex[:8].upper()}",
                customer_name="Sarah M.",
                customer_phone="(555) 234-5678",
                customer_address="456 Oak Ave, San Francisco, CA 94102",
                items=[
                    {"name": "Ribeye Steak", "quantity": 1, "price": 34.99},
                    {"name": "Soft Drink", "quantity": 2, "price": 6.98},
                ],
                subtotal=41.97,
                delivery_fee=3.99,
                tax=3.78,
                tip=7.00,
                total=56.74,
                status=DeliveryOrderStatus.CONFIRMED,
                estimated_delivery_time=datetime.now(),
                driver_name=None,
                driver_phone=None,
                created_at=datetime.now(),
                updated_at=datetime.now()
            )
        ]


class GrubhubAdapter(DeliveryProviderAdapter):
    """Grubhub API integration"""

    def __init__(self, api_key: str, restaurant_id: str):
        self.api_key = api_key
        self.restaurant_id = restaurant_id
        self.base_url = "https://api.grubhub.com/v1"

    async def get_orders(self, status: Optional[DeliveryOrderStatus] = None) -> List[DeliveryOrder]:
        return self._generate_mock_orders(DeliveryPlatform.GRUBHUB)

    async def accept_order(self, external_id: str) -> bool:
        return True

    async def update_status(self, external_id: str, status: DeliveryOrderStatus) -> bool:
        return True

    async def cancel_order(self, external_id: str, reason: str) -> bool:
        return True

    async def get_driver_location(self, external_id: str) -> Optional[Dict[str, float]]:
        return {"lat": 37.7749, "lng": -122.4194}

    def _generate_mock_orders(self, platform: DeliveryPlatform) -> List[DeliveryOrder]:
        return [
            DeliveryOrder(
                id=str(uuid.uuid4()),
                platform=platform,
                external_id=f"GH-{uuid.uuid4().hex[:8].upper()}",
                customer_name="Alex K.",
                customer_phone="(555) 345-6789",
                customer_address="789 Pine St, San Francisco, CA 94108",
                items=[
                    {"name": "Chicken Parmesan", "quantity": 2, "price": 45.98},
                    {"name": "Cheesecake", "quantity": 1, "price": 8.99},
                ],
                subtotal=54.97,
                delivery_fee=2.99,
                tax=4.95,
                tip=10.00,
                total=72.91,
                status=DeliveryOrderStatus.OUT_FOR_DELIVERY,
                estimated_delivery_time=datetime.now(),
                driver_name="Lisa R.",
                driver_phone="(555) 876-5432",
                created_at=datetime.now(),
                updated_at=datetime.now()
            )
        ]


class UnifiedDeliveryService:
    """Unified service to manage all delivery platform integrations"""

    def __init__(self):
        self.adapters: Dict[DeliveryPlatform, DeliveryProviderAdapter] = {}
        self._init_demo_adapters()

    def _init_demo_adapters(self):
        """Initialize demo adapters for all platforms"""
        self.adapters[DeliveryPlatform.DOORDASH] = DoorDashAdapter(
            api_key="demo_key",
            store_id="demo_store"
        )
        self.adapters[DeliveryPlatform.UBER_EATS] = UberEatsAdapter(
            client_id="demo_client",
            client_secret="demo_secret",
            store_id="demo_store"
        )
        self.adapters[DeliveryPlatform.GRUBHUB] = GrubhubAdapter(
            api_key="demo_key",
            restaurant_id="demo_restaurant"
        )

    def register_adapter(self, platform: DeliveryPlatform, adapter: DeliveryProviderAdapter):
        """Register a delivery platform adapter"""
        self.adapters[platform] = adapter

    async def get_all_orders(self, status: Optional[DeliveryOrderStatus] = None) -> List[DeliveryOrder]:
        """Fetch orders from all connected platforms"""
        all_orders = []

        tasks = [
            adapter.get_orders(status)
            for adapter in self.adapters.values()
        ]

        results = await asyncio.gather(*tasks, return_exceptions=True)

        for result in results:
            if isinstance(result, list):
                all_orders.extend(result)

        # Sort by created_at descending
        all_orders.sort(key=lambda x: x.created_at, reverse=True)
        return all_orders

    async def get_orders_by_platform(self, platform: DeliveryPlatform, status: Optional[DeliveryOrderStatus] = None) -> List[DeliveryOrder]:
        """Fetch orders from a specific platform"""
        if platform not in self.adapters:
            return []
        return await self.adapters[platform].get_orders(status)

    async def accept_order(self, platform: DeliveryPlatform, external_id: str) -> bool:
        """Accept an order on a specific platform"""
        if platform not in self.adapters:
            return False
        return await self.adapters[platform].accept_order(external_id)

    async def update_order_status(self, platform: DeliveryPlatform, external_id: str, status: DeliveryOrderStatus) -> bool:
        """Update order status on a platform"""
        if platform not in self.adapters:
            return False
        return await self.adapters[platform].update_status(external_id, status)

    async def cancel_order(self, platform: DeliveryPlatform, external_id: str, reason: str) -> bool:
        """Cancel an order on a platform"""
        if platform not in self.adapters:
            return False
        return await self.adapters[platform].cancel_order(external_id, reason)

    async def get_driver_location(self, platform: DeliveryPlatform, external_id: str) -> Optional[Dict[str, float]]:
        """Get driver location for an order"""
        if platform not in self.adapters:
            return None
        return await self.adapters[platform].get_driver_location(external_id)

    async def get_stats(self) -> DeliveryStats:
        """Get aggregated statistics across all platforms"""
        orders = await self.get_all_orders()

        by_platform = {}
        by_status = {}
        total_revenue = 0.0

        for order in orders:
            # Count by platform
            platform_key = order.platform.value
            by_platform[platform_key] = by_platform.get(platform_key, 0) + 1

            # Count by status
            status_key = order.status.value
            by_status[status_key] = by_status.get(status_key, 0) + 1

            # Sum revenue
            total_revenue += order.total

        total_orders = len(orders)
        avg_order_value = total_revenue / total_orders if total_orders > 0 else 0

        return DeliveryStats(
            total_orders=total_orders,
            total_revenue=total_revenue,
            avg_order_value=avg_order_value,
            by_platform=by_platform,
            by_status=by_status
        )

    def get_connected_platforms(self) -> List[Dict[str, Any]]:
        """Get list of connected delivery platforms with status"""
        platforms = []

        platform_info = {
            DeliveryPlatform.DOORDASH: {
                "name": "DoorDash",
                "icon": "doordash",
                "color": "#FF3008",
                "commission": "15-30%"
            },
            DeliveryPlatform.UBER_EATS: {
                "name": "Uber Eats",
                "icon": "uber_eats",
                "color": "#06C167",
                "commission": "15-30%"
            },
            DeliveryPlatform.GRUBHUB: {
                "name": "Grubhub",
                "icon": "grubhub",
                "color": "#F63440",
                "commission": "20-30%"
            },
            DeliveryPlatform.POSTMATES: {
                "name": "Postmates",
                "icon": "postmates",
                "color": "#000000",
                "commission": "15-30%"
            },
            DeliveryPlatform.SEAMLESS: {
                "name": "Seamless",
                "icon": "seamless",
                "color": "#F63440",
                "commission": "20-30%"
            }
        }

        for platform, adapter in self.adapters.items():
            info = platform_info.get(platform, {"name": platform.value, "color": "#000"})
            platforms.append({
                "id": platform.value,
                "connected": True,
                **info
            })

        # Add unconnected platforms
        for platform, info in platform_info.items():
            if platform not in self.adapters:
                platforms.append({
                    "id": platform.value,
                    "connected": False,
                    **info
                })

        return platforms


# Global instance
delivery_service = UnifiedDeliveryService()
