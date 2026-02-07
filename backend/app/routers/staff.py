"""
Staff & Roles Router

Manages staff members, roles, permissions, and business PINs.
Supports restaurant_admin, manager, pos_user roles with granular permissions.

Demo roles:
- Admin: Ibe Mohammed Ali
- Manager: Carter Tierney
- Manager: Shaw Tesafye
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from typing import Optional, List
from pydantic import BaseModel
from datetime import datetime
import secrets
import hashlib

from ..database import get_session, StaffMember, BusinessPIN, Restaurant

router = APIRouter(prefix="/staff", tags=["staff"])


# ==========================================
# Permission Presets by Role
# ==========================================

ROLE_PERMISSIONS = {
    "restaurant_admin": {
        "pos": True,
        "inventory": True,
        "ordering": True,
        "reports": True,
        "staff_management": True,
        "menu_editing": True,
        "financial": True,
        "settings": True,
        "ai_insights": True,
        "floor_plan": True,
        "suppliers": True,
    },
    "manager": {
        "pos": True,
        "inventory": True,
        "ordering": True,
        "reports": True,
        "staff_management": False,
        "menu_editing": True,
        "financial": False,
        "settings": False,
        "ai_insights": True,
        "floor_plan": True,
        "suppliers": True,
    },
    "pos_user": {
        "pos": True,
        "inventory": False,
        "ordering": False,
        "reports": False,
        "staff_management": False,
        "menu_editing": False,
        "financial": False,
        "settings": False,
        "ai_insights": False,
        "floor_plan": False,
        "suppliers": False,
    },
}


class StaffCreate(BaseModel):
    name: str
    email: Optional[str] = None
    role: str  # restaurant_admin, manager, pos_user
    pin_code: Optional[str] = None  # 4-6 digit PIN
    phone: Optional[str] = None
    permissions_override: Optional[dict] = None  # Custom permission overrides


class StaffUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    role: Optional[str] = None
    pin_code: Optional[str] = None
    phone: Optional[str] = None
    is_active: Optional[bool] = None
    permissions_override: Optional[dict] = None


class BusinessPINCreate(BaseModel):
    role: str  # manager or pos_user — admins can't join via PIN
    max_uses: int = 10
    expires_hours: int = 72


class PINJoin(BaseModel):
    pin: str
    name: str
    email: Optional[str] = None
    phone: Optional[str] = None


# ==========================================
# Staff CRUD
# ==========================================

@router.get("/{restaurant_id}")
async def list_staff(
    restaurant_id: str,
    role: Optional[str] = None,
    active_only: bool = True,
    db: AsyncSession = Depends(get_session),
):
    """List all staff members for a restaurant."""
    query = select(StaffMember).where(StaffMember.restaurant_id == restaurant_id)
    if role:
        query = query.where(StaffMember.role == role)
    if active_only:
        query = query.where(StaffMember.is_active == True)

    result = await db.execute(query.order_by(StaffMember.role, StaffMember.name))
    staff = result.scalars().all()

    return {
        "restaurant_id": restaurant_id,
        "total_staff": len(staff),
        "staff": [_serialize_staff(s) for s in staff],
    }


@router.post("/{restaurant_id}")
async def create_staff_member(
    restaurant_id: str,
    data: StaffCreate,
    db: AsyncSession = Depends(get_session),
):
    """Add a new staff member (admin only)."""
    if data.role not in ROLE_PERMISSIONS:
        raise HTTPException(400, f"Invalid role. Must be one of: {list(ROLE_PERMISSIONS.keys())}")

    # Build permissions
    permissions = {**ROLE_PERMISSIONS[data.role]}
    if data.permissions_override:
        permissions.update(data.permissions_override)

    # Hash PIN if provided
    pin_hash = None
    if data.pin_code:
        if not data.pin_code.isdigit() or len(data.pin_code) < 4 or len(data.pin_code) > 6:
            raise HTTPException(400, "PIN must be 4-6 digits")
        pin_hash = hashlib.sha256(data.pin_code.encode()).hexdigest()

    member = StaffMember(
        restaurant_id=restaurant_id,
        name=data.name,
        email=data.email,
        role=data.role,
        pin_code=pin_hash,
        phone=data.phone,
        permissions=str(permissions),
        is_active=True,
    )
    db.add(member)
    await db.commit()
    await db.refresh(member)

    return {"staff": _serialize_staff(member)}


@router.put("/{restaurant_id}/members/{staff_id}")
async def update_staff_member(
    restaurant_id: str,
    staff_id: str,
    data: StaffUpdate,
    db: AsyncSession = Depends(get_session),
):
    """Update a staff member's details."""
    result = await db.execute(
        select(StaffMember).where(
            StaffMember.id == staff_id,
            StaffMember.restaurant_id == restaurant_id,
        )
    )
    member = result.scalar_one_or_none()
    if not member:
        raise HTTPException(404, "Staff member not found")

    if data.name is not None:
        member.name = data.name
    if data.email is not None:
        member.email = data.email
    if data.phone is not None:
        member.phone = data.phone
    if data.is_active is not None:
        member.is_active = data.is_active
    if data.role is not None:
        if data.role not in ROLE_PERMISSIONS:
            raise HTTPException(400, f"Invalid role: {data.role}")
        member.role = data.role
        # Reset permissions to role default
        member.permissions = str(ROLE_PERMISSIONS[data.role])
    if data.permissions_override is not None:
        current = eval(member.permissions) if member.permissions else {}
        current.update(data.permissions_override)
        member.permissions = str(current)
    if data.pin_code is not None:
        if not data.pin_code.isdigit() or len(data.pin_code) < 4 or len(data.pin_code) > 6:
            raise HTTPException(400, "PIN must be 4-6 digits")
        member.pin_code = hashlib.sha256(data.pin_code.encode()).hexdigest()

    await db.commit()
    await db.refresh(member)
    return {"staff": _serialize_staff(member)}


@router.delete("/{restaurant_id}/members/{staff_id}")
async def remove_staff_member(
    restaurant_id: str,
    staff_id: str,
    db: AsyncSession = Depends(get_session),
):
    """Deactivate (soft-delete) a staff member."""
    result = await db.execute(
        select(StaffMember).where(
            StaffMember.id == staff_id,
            StaffMember.restaurant_id == restaurant_id,
        )
    )
    member = result.scalar_one_or_none()
    if not member:
        raise HTTPException(404, "Staff member not found")

    member.is_active = False
    await db.commit()
    return {"deactivated": True, "staff_id": staff_id}


@router.post("/{restaurant_id}/verify-pin")
async def verify_staff_pin(
    restaurant_id: str,
    pin: str = Query(..., min_length=4, max_length=6),
    db: AsyncSession = Depends(get_session),
):
    """Verify a staff member's POS PIN for clock-in or order authentication."""
    pin_hash = hashlib.sha256(pin.encode()).hexdigest()
    result = await db.execute(
        select(StaffMember).where(
            StaffMember.restaurant_id == restaurant_id,
            StaffMember.pin_code == pin_hash,
            StaffMember.is_active == True,
        )
    )
    member = result.scalar_one_or_none()
    if not member:
        raise HTTPException(401, "Invalid PIN")

    return {
        "authenticated": True,
        "staff": _serialize_staff(member),
    }


# ==========================================
# Business PIN (Join Code)
# ==========================================

@router.post("/{restaurant_id}/business-pin")
async def create_business_pin(
    restaurant_id: str,
    data: BusinessPINCreate,
    db: AsyncSession = Depends(get_session),
):
    """
    Generate a business PIN that workers/managers can use to join this restaurant.
    Admins cannot be added via PIN — must be added directly.
    """
    if data.role == "restaurant_admin":
        raise HTTPException(400, "Admin accounts cannot be created via business PIN.")
    if data.role not in ROLE_PERMISSIONS:
        raise HTTPException(400, f"Invalid role: {data.role}")

    pin_code = secrets.token_hex(3).upper()[:6]  # 6-character alphanumeric

    pin = BusinessPIN(
        restaurant_id=restaurant_id,
        pin_code=pin_code,
        role=data.role,
        max_uses=data.max_uses,
        current_uses=0,
        expires_at=datetime.utcnow().isoformat(),
        is_active=True,
    )
    db.add(pin)
    await db.commit()
    await db.refresh(pin)

    return {
        "pin": pin_code,
        "role": data.role,
        "max_uses": data.max_uses,
        "expires_hours": data.expires_hours,
        "id": pin.id,
    }


@router.post("/join")
async def join_with_business_pin(
    data: PINJoin,
    db: AsyncSession = Depends(get_session),
):
    """Join a restaurant using a business PIN."""
    result = await db.execute(
        select(BusinessPIN).where(
            BusinessPIN.pin_code == data.pin.upper(),
            BusinessPIN.is_active == True,
        )
    )
    pin = result.scalar_one_or_none()
    if not pin:
        raise HTTPException(404, "Invalid or expired PIN")

    if pin.current_uses >= pin.max_uses:
        pin.is_active = False
        await db.commit()
        raise HTTPException(400, "PIN has reached maximum uses")

    # Create staff member
    permissions = ROLE_PERMISSIONS.get(pin.role, ROLE_PERMISSIONS["pos_user"])
    member = StaffMember(
        restaurant_id=pin.restaurant_id,
        name=data.name,
        email=data.email,
        role=pin.role,
        phone=data.phone,
        permissions=str(permissions),
        is_active=True,
    )
    db.add(member)

    # Increment PIN usage
    pin.current_uses += 1
    if pin.current_uses >= pin.max_uses:
        pin.is_active = False

    await db.commit()
    await db.refresh(member)

    return {
        "joined": True,
        "restaurant_id": pin.restaurant_id,
        "role": pin.role,
        "staff": _serialize_staff(member),
    }


@router.get("/{restaurant_id}/business-pins")
async def list_business_pins(
    restaurant_id: str,
    active_only: bool = True,
    db: AsyncSession = Depends(get_session),
):
    """List all business PINs for a restaurant."""
    query = select(BusinessPIN).where(BusinessPIN.restaurant_id == restaurant_id)
    if active_only:
        query = query.where(BusinessPIN.is_active == True)

    result = await db.execute(query)
    pins = result.scalars().all()

    return {
        "restaurant_id": restaurant_id,
        "pins": [
            {
                "id": p.id,
                "pin_code": p.pin_code,
                "role": p.role,
                "max_uses": p.max_uses,
                "current_uses": p.current_uses,
                "is_active": p.is_active,
            }
            for p in pins
        ],
    }


@router.delete("/{restaurant_id}/business-pins/{pin_id}")
async def deactivate_business_pin(
    restaurant_id: str,
    pin_id: str,
    db: AsyncSession = Depends(get_session),
):
    """Deactivate a business PIN."""
    result = await db.execute(
        select(BusinessPIN).where(
            BusinessPIN.id == pin_id,
            BusinessPIN.restaurant_id == restaurant_id,
        )
    )
    pin = result.scalar_one_or_none()
    if not pin:
        raise HTTPException(404, "PIN not found")

    pin.is_active = False
    await db.commit()
    return {"deactivated": True, "pin_id": pin_id}


@router.get("/roles/permissions")
async def get_role_permissions():
    """Get all role definitions and their default permissions."""
    return {
        "roles": ROLE_PERMISSIONS,
        "role_descriptions": {
            "restaurant_admin": "Full access to all features. Can manage staff, finances, and settings.",
            "manager": "Can manage POS, inventory, menu, and view reports. No financial or settings access.",
            "pos_user": "POS-only access for taking orders and processing payments.",
        },
    }


# ==========================================
# Demo Data Seeding
# ==========================================

@router.post("/{restaurant_id}/seed-demo")
async def seed_demo_staff(
    restaurant_id: str,
    db: AsyncSession = Depends(get_session),
):
    """Seed demo staff: Ibe Mohammed Ali (Admin), Carter Tierney (Manager), Shaw Tesafye (Manager)."""
    existing = await db.execute(
        select(func.count(StaffMember.id)).where(
            StaffMember.restaurant_id == restaurant_id
        )
    )
    if existing.scalar() > 0:
        raise HTTPException(400, "Staff already seeded for this restaurant.")

    demo_staff = [
        {
            "name": "Ibe Mohammed Ali",
            "email": "ibe@wdym86.com",
            "role": "restaurant_admin",
            "pin_code": hashlib.sha256("1234".encode()).hexdigest(),
        },
        {
            "name": "Carter Tierney",
            "email": "carter@wdym86.com",
            "role": "manager",
            "pin_code": hashlib.sha256("5678".encode()).hexdigest(),
        },
        {
            "name": "Shaw Tesafye",
            "email": "shaw@wdym86.com",
            "role": "manager",
            "pin_code": hashlib.sha256("9012".encode()).hexdigest(),
        },
    ]

    created = []
    for s in demo_staff:
        permissions = ROLE_PERMISSIONS[s["role"]]
        member = StaffMember(
            restaurant_id=restaurant_id,
            name=s["name"],
            email=s["email"],
            role=s["role"],
            pin_code=s["pin_code"],
            permissions=str(permissions),
            is_active=True,
        )
        db.add(member)
        created.append(s["name"])

    await db.commit()
    return {
        "seeded": True,
        "restaurant_id": restaurant_id,
        "staff_created": created,
        "demo_pins": {
            "Ibe Mohammed Ali (Admin)": "1234",
            "Carter Tierney (Manager)": "5678",
            "Shaw Tesafye (Manager)": "9012",
        },
    }


def _serialize_staff(member: StaffMember) -> dict:
    permissions = {}
    if member.permissions:
        try:
            permissions = eval(member.permissions)
        except Exception:
            permissions = {}

    return {
        "id": member.id,
        "restaurant_id": member.restaurant_id,
        "name": member.name,
        "email": member.email,
        "role": member.role,
        "phone": member.phone,
        "is_active": member.is_active,
        "permissions": permissions,
        "has_pin": member.pin_code is not None,
        "created_at": member.created_at,
    }
