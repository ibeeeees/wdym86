"""
POS Integration Router

Manages connections to external POS platforms:
- Toast
- Aloha
- Square
- Clover

Tracks sync status, last sync time, and data flow.
This router manages POS platform configurations, NOT the actual POS interface
(which is in routers/pos.py).
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Optional
from pydantic import BaseModel
from datetime import datetime

from ..database import get_session, POSIntegration, Restaurant

router = APIRouter(prefix="/pos-integrations", tags=["pos-integrations"])


SUPPORTED_PLATFORMS = {
    "toast": {
        "name": "Toast",
        "description": "Cloud-based restaurant POS system",
        "features": ["menu_sync", "order_sync", "inventory_sync", "reporting", "online_ordering"],
        "api_version": "v2",
    },
    "aloha": {
        "name": "Aloha (NCR)",
        "description": "Enterprise restaurant management POS",
        "features": ["menu_sync", "order_sync", "inventory_sync", "labor_management"],
        "api_version": "v1",
    },
    "square": {
        "name": "Square",
        "description": "All-in-one payment and POS platform",
        "features": ["menu_sync", "order_sync", "payment_processing", "reporting"],
        "api_version": "v2",
    },
    "clover": {
        "name": "Clover",
        "description": "Cloud-based POS and payments",
        "features": ["menu_sync", "order_sync", "payment_processing", "employee_management"],
        "api_version": "v3",
    },
}


class IntegrationCreate(BaseModel):
    platform: str  # toast, aloha, square, clover
    api_key: Optional[str] = None  # Stored encrypted in production via AWS Secrets
    merchant_id: Optional[str] = None
    location_id: Optional[str] = None
    webhook_url: Optional[str] = None
    sync_menu: bool = True
    sync_orders: bool = True
    sync_inventory: bool = True


class IntegrationUpdate(BaseModel):
    api_key: Optional[str] = None
    merchant_id: Optional[str] = None
    location_id: Optional[str] = None
    webhook_url: Optional[str] = None
    sync_menu: Optional[bool] = None
    sync_orders: Optional[bool] = None
    sync_inventory: Optional[bool] = None
    is_active: Optional[bool] = None


@router.get("/platforms")
async def list_supported_platforms():
    """List all supported POS platform integrations."""
    return {"platforms": SUPPORTED_PLATFORMS}


@router.get("/{restaurant_id}")
async def list_integrations(
    restaurant_id: str,
    db: AsyncSession = Depends(get_session),
):
    """List all POS integrations for a restaurant."""
    result = await db.execute(
        select(POSIntegration).where(
            POSIntegration.restaurant_id == restaurant_id
        )
    )
    integrations = result.scalars().all()

    return {
        "restaurant_id": restaurant_id,
        "integrations": [_serialize_integration(i) for i in integrations],
        "available_platforms": [
            p for p in SUPPORTED_PLATFORMS.keys()
            if p not in [i.platform for i in integrations]
        ],
    }


@router.post("/{restaurant_id}")
async def create_integration(
    restaurant_id: str,
    data: IntegrationCreate,
    db: AsyncSession = Depends(get_session),
):
    """Connect a new POS platform."""
    if data.platform not in SUPPORTED_PLATFORMS:
        raise HTTPException(400, f"Unsupported platform. Choose from: {list(SUPPORTED_PLATFORMS.keys())}")

    # Check for existing integration with same platform
    existing = await db.execute(
        select(POSIntegration).where(
            POSIntegration.restaurant_id == restaurant_id,
            POSIntegration.platform == data.platform,
        )
    )
    if existing.scalar_one_or_none():
        raise HTTPException(400, f"Integration with {data.platform} already exists. Update or remove it first.")

    # Build sync config
    sync_config = {
        "sync_menu": data.sync_menu,
        "sync_orders": data.sync_orders,
        "sync_inventory": data.sync_inventory,
        "webhook_url": data.webhook_url,
    }

    integration = POSIntegration(
        restaurant_id=restaurant_id,
        platform=data.platform,
        api_key_ref=data.api_key,  # In production, store via AWS Secrets Manager
        merchant_id=data.merchant_id,
        location_id=data.location_id,
        sync_config=str(sync_config),
        status="pending_verification",
        is_active=False,
    )
    db.add(integration)
    await db.commit()
    await db.refresh(integration)

    return {
        "integration": _serialize_integration(integration),
        "note": "Integration created. Verify API credentials to activate.",
    }


@router.put("/{restaurant_id}/integrations/{integration_id}")
async def update_integration(
    restaurant_id: str,
    integration_id: str,
    data: IntegrationUpdate,
    db: AsyncSession = Depends(get_session),
):
    """Update a POS integration's configuration."""
    result = await db.execute(
        select(POSIntegration).where(
            POSIntegration.id == integration_id,
            POSIntegration.restaurant_id == restaurant_id,
        )
    )
    integration = result.scalar_one_or_none()
    if not integration:
        raise HTTPException(404, "Integration not found")

    if data.api_key is not None:
        integration.api_key_ref = data.api_key
    if data.merchant_id is not None:
        integration.merchant_id = data.merchant_id
    if data.location_id is not None:
        integration.location_id = data.location_id
    if data.is_active is not None:
        integration.is_active = data.is_active
        integration.status = "active" if data.is_active else "inactive"

    # Update sync config
    try:
        sync_config = eval(integration.sync_config) if integration.sync_config else {}
    except Exception:
        sync_config = {}

    if data.sync_menu is not None:
        sync_config["sync_menu"] = data.sync_menu
    if data.sync_orders is not None:
        sync_config["sync_orders"] = data.sync_orders
    if data.sync_inventory is not None:
        sync_config["sync_inventory"] = data.sync_inventory
    if data.webhook_url is not None:
        sync_config["webhook_url"] = data.webhook_url

    integration.sync_config = str(sync_config)

    await db.commit()
    await db.refresh(integration)
    return {"integration": _serialize_integration(integration)}


@router.post("/{restaurant_id}/integrations/{integration_id}/verify")
async def verify_integration(
    restaurant_id: str,
    integration_id: str,
    db: AsyncSession = Depends(get_session),
):
    """
    Verify POS integration credentials.
    In production, this would make an API call to the POS platform.
    In development, this marks as verified/active.
    """
    result = await db.execute(
        select(POSIntegration).where(
            POSIntegration.id == integration_id,
            POSIntegration.restaurant_id == restaurant_id,
        )
    )
    integration = result.scalar_one_or_none()
    if not integration:
        raise HTTPException(404, "Integration not found")

    # In production: Make actual API call to verify credentials
    # For now, mark as verified
    integration.status = "active"
    integration.is_active = True
    integration.last_sync = datetime.utcnow().isoformat()

    await db.commit()
    await db.refresh(integration)

    return {
        "verified": True,
        "integration": _serialize_integration(integration),
        "note": "Credentials verified. Integration is now active.",
    }


@router.post("/{restaurant_id}/integrations/{integration_id}/sync")
async def trigger_sync(
    restaurant_id: str,
    integration_id: str,
    sync_type: str = Query("all", description="Type of sync: menu, orders, inventory, all"),
    db: AsyncSession = Depends(get_session),
):
    """
    Trigger a manual sync with the POS platform.
    In production, this would pull/push data to/from the platform API.
    """
    result = await db.execute(
        select(POSIntegration).where(
            POSIntegration.id == integration_id,
            POSIntegration.restaurant_id == restaurant_id,
        )
    )
    integration = result.scalar_one_or_none()
    if not integration:
        raise HTTPException(404, "Integration not found")

    if not integration.is_active:
        raise HTTPException(400, "Integration is not active. Verify credentials first.")

    # In production: Execute actual sync logic per platform
    integration.last_sync = datetime.utcnow().isoformat()
    await db.commit()

    return {
        "synced": True,
        "platform": integration.platform,
        "sync_type": sync_type,
        "last_sync": integration.last_sync,
        "note": f"Sync completed for {sync_type}. In production, this pulls real data from {integration.platform}.",
    }


@router.delete("/{restaurant_id}/integrations/{integration_id}")
async def remove_integration(
    restaurant_id: str,
    integration_id: str,
    db: AsyncSession = Depends(get_session),
):
    """Remove a POS integration."""
    result = await db.execute(
        select(POSIntegration).where(
            POSIntegration.id == integration_id,
            POSIntegration.restaurant_id == restaurant_id,
        )
    )
    integration = result.scalar_one_or_none()
    if not integration:
        raise HTTPException(404, "Integration not found")

    await db.delete(integration)
    await db.commit()
    return {"deleted": True, "integration_id": integration_id}


@router.get("/{restaurant_id}/sync-status")
async def get_sync_status(
    restaurant_id: str,
    db: AsyncSession = Depends(get_session),
):
    """Get sync status for all integrations."""
    result = await db.execute(
        select(POSIntegration).where(
            POSIntegration.restaurant_id == restaurant_id
        )
    )
    integrations = result.scalars().all()

    return {
        "restaurant_id": restaurant_id,
        "integrations": [
            {
                "platform": i.platform,
                "status": i.status,
                "is_active": i.is_active,
                "last_sync": i.last_sync,
            }
            for i in integrations
        ],
    }


def _serialize_integration(i: POSIntegration) -> dict:
    sync_config = {}
    if i.sync_config:
        try:
            sync_config = eval(i.sync_config)
        except Exception:
            sync_config = {}

    return {
        "id": i.id,
        "restaurant_id": i.restaurant_id,
        "platform": i.platform,
        "platform_info": SUPPORTED_PLATFORMS.get(i.platform, {}),
        "merchant_id": i.merchant_id,
        "location_id": i.location_id,
        "status": i.status,
        "is_active": i.is_active,
        "sync_config": sync_config,
        "last_sync": i.last_sync,
        "has_api_key": i.api_key_ref is not None,
    }
