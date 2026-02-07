"""POS (Point of Sale) router"""

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, delete
from typing import List, Optional
from datetime import datetime, date, timedelta
from pydantic import BaseModel, Field
from enum import Enum

from ..database import (
    get_session,
    Dish as DishDB,
    Restaurant as RestaurantDB,
    User as UserDB,
    DishSales as DishSalesDB,
    Base,
    generate_uuid
)
from sqlalchemy import Column, String, Float, Integer, Boolean, DateTime, Text, ForeignKey, JSON
from sqlalchemy.sql import func as sql_func
from .auth import get_current_user

router = APIRouter()


# ==========================================
# Enums
# ==========================================

class OrderStatus(str, Enum):
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    READY = "ready"
    SERVED = "served"
    PAID = "paid"
    CANCELLED = "cancelled"


class TableStatus(str, Enum):
    AVAILABLE = "available"
    OCCUPIED = "occupied"
    RESERVED = "reserved"
    CLEANING = "cleaning"


class PaymentMethod(str, Enum):
    CASH = "cash"
    CARD = "card"
    MOBILE = "mobile"
    SPLIT = "split"


# ==========================================
# Pydantic Models - Requests
# ==========================================

class OrderItemCreate(BaseModel):
    dish_id: str
    quantity: int = Field(ge=1, default=1)
    notes: Optional[str] = None
    modifiers: Optional[List[str]] = None


class OrderCreate(BaseModel):
    restaurant_id: str
    table_id: Optional[str] = None
    customer_name: Optional[str] = None
    items: List[OrderItemCreate] = []
    notes: Optional[str] = None


class OrderUpdate(BaseModel):
    status: Optional[OrderStatus] = None
    table_id: Optional[str] = None
    customer_name: Optional[str] = None
    notes: Optional[str] = None


class PaymentRequest(BaseModel):
    method: PaymentMethod
    amount: float
    tip: Optional[float] = 0
    split_payments: Optional[List[dict]] = None


class RefundRequest(BaseModel):
    amount: float
    reason: str
    item_ids: Optional[List[str]] = None


class TableStatusUpdate(BaseModel):
    status: TableStatus


class TableAssign(BaseModel):
    order_id: str


class QuickCheckoutRequest(BaseModel):
    restaurant_id: str
    items: List[OrderItemCreate]
    payment_method: PaymentMethod
    customer_name: Optional[str] = None


# ==========================================
# Pydantic Models - Responses
# ==========================================

class OrderItemResponse(BaseModel):
    id: str
    dish_id: str
    dish_name: str
    quantity: int
    unit_price: float
    total_price: float
    notes: Optional[str] = None
    modifiers: Optional[List[str]] = None

    class Config:
        from_attributes = True


class OrderResponse(BaseModel):
    id: str
    restaurant_id: str
    table_id: Optional[str] = None
    customer_name: Optional[str] = None
    status: OrderStatus
    items: List[OrderItemResponse] = []
    subtotal: float
    tax: float
    total: float
    notes: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class TableResponse(BaseModel):
    id: str
    restaurant_id: str
    table_number: str
    capacity: int
    status: TableStatus
    current_order_id: Optional[str] = None

    class Config:
        from_attributes = True


class MenuItemResponse(BaseModel):
    id: str
    name: str
    category: str
    price: float
    is_available: bool

    class Config:
        from_attributes = True


class POSStatsResponse(BaseModel):
    date: date
    total_revenue: float
    total_orders: int
    average_ticket: float
    orders_by_status: dict
    top_selling_items: List[dict]
    hourly_breakdown: List[dict]


class PaymentResponse(BaseModel):
    order_id: str
    amount_paid: float
    tip: float
    payment_method: PaymentMethod
    change_due: float
    transaction_id: str
    timestamp: datetime


class RefundResponse(BaseModel):
    order_id: str
    refund_amount: float
    reason: str
    transaction_id: str
    timestamp: datetime


# ==========================================
# In-memory storage (replace with DB tables in production)
# ==========================================

# Simulated order storage
_orders: dict = {}
_order_items: dict = {}
_tables: dict = {}
_payments: dict = {}


def _init_tables(restaurant_id: str):
    """Initialize tables for a restaurant if not exists"""
    if restaurant_id not in _tables:
        _tables[restaurant_id] = {}
        for i in range(1, 21):  # 20 tables by default
            table_id = f"{restaurant_id}_table_{i}"
            _tables[restaurant_id][table_id] = {
                "id": table_id,
                "restaurant_id": restaurant_id,
                "table_number": str(i),
                "capacity": 4 if i <= 15 else 6,
                "status": TableStatus.AVAILABLE,
                "current_order_id": None
            }


# ==========================================
# Order Endpoints
# ==========================================

@router.post("/orders", response_model=OrderResponse, status_code=status.HTTP_201_CREATED)
async def create_order(
    order_data: OrderCreate,
    current_user: UserDB = Depends(get_current_user),
    db: AsyncSession = Depends(get_session)
):
    """Create a new order"""
    # Verify restaurant exists and belongs to user
    result = await db.execute(
        select(RestaurantDB).where(
            RestaurantDB.id == order_data.restaurant_id,
            RestaurantDB.user_id == current_user.id
        )
    )
    restaurant = result.scalar_one_or_none()
    if not restaurant:
        raise HTTPException(status_code=404, detail="Restaurant not found")

    # Initialize tables if needed
    _init_tables(order_data.restaurant_id)

    # Validate table if provided
    if order_data.table_id:
        if order_data.table_id not in _tables.get(order_data.restaurant_id, {}):
            raise HTTPException(status_code=404, detail="Table not found")

    order_id = generate_uuid()
    now = datetime.utcnow()

    # Process items
    items = []
    subtotal = 0

    for item in order_data.items:
        # Get dish details
        dish_result = await db.execute(
            select(DishDB).where(
                DishDB.id == item.dish_id,
                DishDB.is_active == True
            )
        )
        dish = dish_result.scalar_one_or_none()
        if not dish:
            raise HTTPException(
                status_code=404,
                detail=f"Dish {item.dish_id} not found or not active"
            )

        item_id = generate_uuid()
        item_total = (dish.price or 0) * item.quantity
        subtotal += item_total

        items.append({
            "id": item_id,
            "dish_id": dish.id,
            "dish_name": dish.name,
            "quantity": item.quantity,
            "unit_price": dish.price or 0,
            "total_price": item_total,
            "notes": item.notes,
            "modifiers": item.modifiers
        })

    tax = subtotal * 0.08  # 8% tax rate
    total = subtotal + tax

    order = {
        "id": order_id,
        "restaurant_id": order_data.restaurant_id,
        "table_id": order_data.table_id,
        "customer_name": order_data.customer_name,
        "status": OrderStatus.PENDING,
        "items": items,
        "subtotal": round(subtotal, 2),
        "tax": round(tax, 2),
        "total": round(total, 2),
        "notes": order_data.notes,
        "created_at": now,
        "updated_at": None
    }

    _orders[order_id] = order

    # Update table status if assigned
    if order_data.table_id and order_data.restaurant_id in _tables:
        if order_data.table_id in _tables[order_data.restaurant_id]:
            _tables[order_data.restaurant_id][order_data.table_id]["status"] = TableStatus.OCCUPIED
            _tables[order_data.restaurant_id][order_data.table_id]["current_order_id"] = order_id

    return OrderResponse(**order)


@router.get("/orders", response_model=List[OrderResponse])
async def list_orders(
    restaurant_id: str = Query(..., description="Restaurant ID"),
    status: Optional[OrderStatus] = None,
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
    table_id: Optional[str] = None,
    current_user: UserDB = Depends(get_current_user),
    db: AsyncSession = Depends(get_session)
):
    """List orders with optional filters"""
    # Verify restaurant belongs to user
    result = await db.execute(
        select(RestaurantDB).where(
            RestaurantDB.id == restaurant_id,
            RestaurantDB.user_id == current_user.id
        )
    )
    if not result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Restaurant not found")

    orders = []
    for order in _orders.values():
        if order["restaurant_id"] != restaurant_id:
            continue

        if status and order["status"] != status:
            continue

        if table_id and order["table_id"] != table_id:
            continue

        if date_from:
            order_date = order["created_at"].date()
            if order_date < date_from:
                continue

        if date_to:
            order_date = order["created_at"].date()
            if order_date > date_to:
                continue

        orders.append(OrderResponse(**order))

    return sorted(orders, key=lambda x: x.created_at, reverse=True)


@router.get("/orders/{order_id}", response_model=OrderResponse)
async def get_order(
    order_id: str,
    current_user: UserDB = Depends(get_current_user),
    db: AsyncSession = Depends(get_session)
):
    """Get order details"""
    if order_id not in _orders:
        raise HTTPException(status_code=404, detail="Order not found")

    order = _orders[order_id]

    # Verify user owns the restaurant
    result = await db.execute(
        select(RestaurantDB).where(
            RestaurantDB.id == order["restaurant_id"],
            RestaurantDB.user_id == current_user.id
        )
    )
    if not result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Order not found")

    return OrderResponse(**order)


@router.put("/orders/{order_id}", response_model=OrderResponse)
async def update_order(
    order_id: str,
    order_update: OrderUpdate,
    current_user: UserDB = Depends(get_current_user),
    db: AsyncSession = Depends(get_session)
):
    """Update order (status, table, customer name, notes)"""
    if order_id not in _orders:
        raise HTTPException(status_code=404, detail="Order not found")

    order = _orders[order_id]

    # Verify user owns the restaurant
    result = await db.execute(
        select(RestaurantDB).where(
            RestaurantDB.id == order["restaurant_id"],
            RestaurantDB.user_id == current_user.id
        )
    )
    if not result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Order not found")

    # Validate status transitions
    if order_update.status:
        current_status = order["status"]
        new_status = order_update.status

        # Define valid transitions
        valid_transitions = {
            OrderStatus.PENDING: [OrderStatus.IN_PROGRESS, OrderStatus.CANCELLED],
            OrderStatus.IN_PROGRESS: [OrderStatus.READY, OrderStatus.CANCELLED],
            OrderStatus.READY: [OrderStatus.SERVED, OrderStatus.CANCELLED],
            OrderStatus.SERVED: [OrderStatus.PAID],
            OrderStatus.PAID: [],
            OrderStatus.CANCELLED: []
        }

        if new_status not in valid_transitions.get(current_status, []):
            raise HTTPException(
                status_code=400,
                detail=f"Cannot transition from {current_status} to {new_status}"
            )

        order["status"] = new_status

        # Free table if order is paid or cancelled
        if new_status in [OrderStatus.PAID, OrderStatus.CANCELLED]:
            if order["table_id"] and order["restaurant_id"] in _tables:
                table = _tables[order["restaurant_id"]].get(order["table_id"])
                if table and table["current_order_id"] == order_id:
                    table["status"] = TableStatus.CLEANING
                    table["current_order_id"] = None

    if order_update.table_id is not None:
        # Validate new table
        if order_update.table_id:
            _init_tables(order["restaurant_id"])
            if order_update.table_id not in _tables.get(order["restaurant_id"], {}):
                raise HTTPException(status_code=404, detail="Table not found")

        # Release old table
        if order["table_id"] and order["restaurant_id"] in _tables:
            old_table = _tables[order["restaurant_id"]].get(order["table_id"])
            if old_table and old_table["current_order_id"] == order_id:
                old_table["status"] = TableStatus.AVAILABLE
                old_table["current_order_id"] = None

        # Assign new table
        if order_update.table_id:
            _tables[order["restaurant_id"]][order_update.table_id]["status"] = TableStatus.OCCUPIED
            _tables[order["restaurant_id"]][order_update.table_id]["current_order_id"] = order_id

        order["table_id"] = order_update.table_id

    if order_update.customer_name is not None:
        order["customer_name"] = order_update.customer_name

    if order_update.notes is not None:
        order["notes"] = order_update.notes

    order["updated_at"] = datetime.utcnow()

    return OrderResponse(**order)


@router.post("/orders/{order_id}/items", response_model=OrderResponse)
async def add_item_to_order(
    order_id: str,
    item: OrderItemCreate,
    current_user: UserDB = Depends(get_current_user),
    db: AsyncSession = Depends(get_session)
):
    """Add item to an existing order"""
    if order_id not in _orders:
        raise HTTPException(status_code=404, detail="Order not found")

    order = _orders[order_id]

    # Verify user owns the restaurant
    result = await db.execute(
        select(RestaurantDB).where(
            RestaurantDB.id == order["restaurant_id"],
            RestaurantDB.user_id == current_user.id
        )
    )
    if not result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Order not found")

    # Cannot add items to paid/cancelled orders
    if order["status"] in [OrderStatus.PAID, OrderStatus.CANCELLED]:
        raise HTTPException(
            status_code=400,
            detail="Cannot add items to paid or cancelled orders"
        )

    # Get dish details
    dish_result = await db.execute(
        select(DishDB).where(
            DishDB.id == item.dish_id,
            DishDB.is_active == True
        )
    )
    dish = dish_result.scalar_one_or_none()
    if not dish:
        raise HTTPException(status_code=404, detail="Dish not found or not active")

    item_id = generate_uuid()
    item_total = (dish.price or 0) * item.quantity

    new_item = {
        "id": item_id,
        "dish_id": dish.id,
        "dish_name": dish.name,
        "quantity": item.quantity,
        "unit_price": dish.price or 0,
        "total_price": item_total,
        "notes": item.notes,
        "modifiers": item.modifiers
    }

    order["items"].append(new_item)

    # Recalculate totals
    subtotal = sum(i["total_price"] for i in order["items"])
    tax = subtotal * 0.08
    order["subtotal"] = round(subtotal, 2)
    order["tax"] = round(tax, 2)
    order["total"] = round(subtotal + tax, 2)
    order["updated_at"] = datetime.utcnow()

    return OrderResponse(**order)


@router.delete("/orders/{order_id}/items/{item_id}", response_model=OrderResponse)
async def remove_item_from_order(
    order_id: str,
    item_id: str,
    current_user: UserDB = Depends(get_current_user),
    db: AsyncSession = Depends(get_session)
):
    """Remove item from an order"""
    if order_id not in _orders:
        raise HTTPException(status_code=404, detail="Order not found")

    order = _orders[order_id]

    # Verify user owns the restaurant
    result = await db.execute(
        select(RestaurantDB).where(
            RestaurantDB.id == order["restaurant_id"],
            RestaurantDB.user_id == current_user.id
        )
    )
    if not result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Order not found")

    # Cannot remove items from paid/cancelled orders
    if order["status"] in [OrderStatus.PAID, OrderStatus.CANCELLED]:
        raise HTTPException(
            status_code=400,
            detail="Cannot remove items from paid or cancelled orders"
        )

    # Find and remove item
    item_found = False
    for i, item in enumerate(order["items"]):
        if item["id"] == item_id:
            order["items"].pop(i)
            item_found = True
            break

    if not item_found:
        raise HTTPException(status_code=404, detail="Item not found in order")

    # Recalculate totals
    subtotal = sum(i["total_price"] for i in order["items"])
    tax = subtotal * 0.08
    order["subtotal"] = round(subtotal, 2)
    order["tax"] = round(tax, 2)
    order["total"] = round(subtotal + tax, 2)
    order["updated_at"] = datetime.utcnow()

    return OrderResponse(**order)


@router.post("/orders/{order_id}/pay", response_model=PaymentResponse)
async def process_payment(
    order_id: str,
    payment: PaymentRequest,
    current_user: UserDB = Depends(get_current_user),
    db: AsyncSession = Depends(get_session)
):
    """Process payment for an order"""
    if order_id not in _orders:
        raise HTTPException(status_code=404, detail="Order not found")

    order = _orders[order_id]

    # Verify user owns the restaurant
    result = await db.execute(
        select(RestaurantDB).where(
            RestaurantDB.id == order["restaurant_id"],
            RestaurantDB.user_id == current_user.id
        )
    )
    if not result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Order not found")

    # Validate order can be paid
    if order["status"] == OrderStatus.PAID:
        raise HTTPException(status_code=400, detail="Order already paid")

    if order["status"] == OrderStatus.CANCELLED:
        raise HTTPException(status_code=400, detail="Cannot pay cancelled order")

    total_with_tip = order["total"] + (payment.tip or 0)

    if payment.amount < total_with_tip:
        raise HTTPException(
            status_code=400,
            detail=f"Insufficient payment. Required: ${total_with_tip:.2f}, Provided: ${payment.amount:.2f}"
        )

    # Process payment
    transaction_id = generate_uuid()
    change_due = payment.amount - total_with_tip

    # Update order status
    order["status"] = OrderStatus.PAID
    order["updated_at"] = datetime.utcnow()

    # Free table
    if order["table_id"] and order["restaurant_id"] in _tables:
        table = _tables[order["restaurant_id"]].get(order["table_id"])
        if table and table["current_order_id"] == order_id:
            table["status"] = TableStatus.CLEANING
            table["current_order_id"] = None

    # Record payment
    payment_record = {
        "order_id": order_id,
        "amount_paid": payment.amount,
        "tip": payment.tip or 0,
        "payment_method": payment.method,
        "change_due": round(change_due, 2),
        "transaction_id": transaction_id,
        "timestamp": datetime.utcnow()
    }
    _payments[transaction_id] = payment_record

    # Record dish sales for analytics
    for item in order["items"]:
        sale = DishSalesDB(
            dish_id=item["dish_id"],
            date=datetime.utcnow(),
            quantity_sold=item["quantity"],
            revenue=item["total_price"]
        )
        db.add(sale)

    return PaymentResponse(**payment_record)


@router.post("/orders/{order_id}/refund", response_model=RefundResponse)
async def process_refund(
    order_id: str,
    refund: RefundRequest,
    current_user: UserDB = Depends(get_current_user),
    db: AsyncSession = Depends(get_session)
):
    """Process refund for an order"""
    if order_id not in _orders:
        raise HTTPException(status_code=404, detail="Order not found")

    order = _orders[order_id]

    # Verify user owns the restaurant
    result = await db.execute(
        select(RestaurantDB).where(
            RestaurantDB.id == order["restaurant_id"],
            RestaurantDB.user_id == current_user.id
        )
    )
    if not result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Order not found")

    # Validate order can be refunded
    if order["status"] != OrderStatus.PAID:
        raise HTTPException(
            status_code=400,
            detail="Can only refund paid orders"
        )

    if refund.amount > order["total"]:
        raise HTTPException(
            status_code=400,
            detail=f"Refund amount ${refund.amount:.2f} exceeds order total ${order['total']:.2f}"
        )

    # Process refund
    transaction_id = generate_uuid()

    refund_record = {
        "order_id": order_id,
        "refund_amount": refund.amount,
        "reason": refund.reason,
        "transaction_id": transaction_id,
        "timestamp": datetime.utcnow()
    }

    return RefundResponse(**refund_record)


# ==========================================
# Table Endpoints
# ==========================================

@router.get("/tables", response_model=List[TableResponse])
async def list_tables(
    restaurant_id: str = Query(..., description="Restaurant ID"),
    status: Optional[TableStatus] = None,
    current_user: UserDB = Depends(get_current_user),
    db: AsyncSession = Depends(get_session)
):
    """List all tables with status"""
    # Verify restaurant belongs to user
    result = await db.execute(
        select(RestaurantDB).where(
            RestaurantDB.id == restaurant_id,
            RestaurantDB.user_id == current_user.id
        )
    )
    if not result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Restaurant not found")

    _init_tables(restaurant_id)

    tables = []
    for table in _tables.get(restaurant_id, {}).values():
        if status and table["status"] != status:
            continue
        tables.append(TableResponse(**table))

    return sorted(tables, key=lambda x: int(x.table_number))


@router.put("/tables/{table_id}/status", response_model=TableResponse)
async def update_table_status(
    table_id: str,
    status_update: TableStatusUpdate,
    current_user: UserDB = Depends(get_current_user),
    db: AsyncSession = Depends(get_session)
):
    """Update table status"""
    # Find table across all restaurants
    table = None
    restaurant_id = None
    for rid, tables in _tables.items():
        if table_id in tables:
            table = tables[table_id]
            restaurant_id = rid
            break

    if not table:
        raise HTTPException(status_code=404, detail="Table not found")

    # Verify user owns the restaurant
    result = await db.execute(
        select(RestaurantDB).where(
            RestaurantDB.id == restaurant_id,
            RestaurantDB.user_id == current_user.id
        )
    )
    if not result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Table not found")

    # Cannot change status if occupied with active order
    if table["current_order_id"]:
        order = _orders.get(table["current_order_id"])
        if order and order["status"] not in [OrderStatus.PAID, OrderStatus.CANCELLED]:
            raise HTTPException(
                status_code=400,
                detail="Cannot change status of table with active order"
            )

    table["status"] = status_update.status

    return TableResponse(**table)


@router.post("/tables/{table_id}/assign", response_model=TableResponse)
async def assign_order_to_table(
    table_id: str,
    assignment: TableAssign,
    current_user: UserDB = Depends(get_current_user),
    db: AsyncSession = Depends(get_session)
):
    """Assign an order to a table"""
    # Find table
    table = None
    restaurant_id = None
    for rid, tables in _tables.items():
        if table_id in tables:
            table = tables[table_id]
            restaurant_id = rid
            break

    if not table:
        raise HTTPException(status_code=404, detail="Table not found")

    # Verify user owns the restaurant
    result = await db.execute(
        select(RestaurantDB).where(
            RestaurantDB.id == restaurant_id,
            RestaurantDB.user_id == current_user.id
        )
    )
    if not result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Table not found")

    # Check order exists
    if assignment.order_id not in _orders:
        raise HTTPException(status_code=404, detail="Order not found")

    order = _orders[assignment.order_id]

    # Verify order belongs to same restaurant
    if order["restaurant_id"] != restaurant_id:
        raise HTTPException(status_code=400, detail="Order belongs to different restaurant")

    # Check table availability
    if table["status"] == TableStatus.OCCUPIED and table["current_order_id"] != assignment.order_id:
        raise HTTPException(status_code=400, detail="Table is occupied")

    # Release old table if order was at different table
    if order["table_id"] and order["table_id"] != table_id:
        old_table = _tables.get(restaurant_id, {}).get(order["table_id"])
        if old_table:
            old_table["status"] = TableStatus.AVAILABLE
            old_table["current_order_id"] = None

    # Assign
    table["status"] = TableStatus.OCCUPIED
    table["current_order_id"] = assignment.order_id
    order["table_id"] = table_id
    order["updated_at"] = datetime.utcnow()

    return TableResponse(**table)


# ==========================================
# Quick Action Endpoints
# ==========================================

@router.get("/menu", response_model=List[MenuItemResponse])
async def get_pos_menu(
    restaurant_id: str = Query(..., description="Restaurant ID"),
    category: Optional[str] = None,
    current_user: UserDB = Depends(get_current_user),
    db: AsyncSession = Depends(get_session)
):
    """Get menu items for POS display"""
    # Verify restaurant belongs to user
    result = await db.execute(
        select(RestaurantDB).where(
            RestaurantDB.id == restaurant_id,
            RestaurantDB.user_id == current_user.id
        )
    )
    if not result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Restaurant not found")

    # Build query
    query = select(DishDB).where(
        DishDB.restaurant_id == restaurant_id,
        DishDB.is_active == True
    )

    if category:
        query = query.where(DishDB.category == category)

    result = await db.execute(query)
    dishes = result.scalars().all()

    return [
        MenuItemResponse(
            id=dish.id,
            name=dish.name,
            category=dish.category or "General",
            price=dish.price or 0,
            is_available=dish.is_active
        )
        for dish in dishes
    ]


@router.post("/checkout", response_model=PaymentResponse)
async def quick_checkout(
    checkout: QuickCheckoutRequest,
    current_user: UserDB = Depends(get_current_user),
    db: AsyncSession = Depends(get_session)
):
    """Quick checkout flow - create order and process payment in one step"""
    # Verify restaurant
    result = await db.execute(
        select(RestaurantDB).where(
            RestaurantDB.id == checkout.restaurant_id,
            RestaurantDB.user_id == current_user.id
        )
    )
    if not result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Restaurant not found")

    # Create order
    order_id = generate_uuid()
    now = datetime.utcnow()

    items = []
    subtotal = 0

    for item in checkout.items:
        dish_result = await db.execute(
            select(DishDB).where(
                DishDB.id == item.dish_id,
                DishDB.is_active == True
            )
        )
        dish = dish_result.scalar_one_or_none()
        if not dish:
            raise HTTPException(
                status_code=404,
                detail=f"Dish {item.dish_id} not found or not active"
            )

        item_id = generate_uuid()
        item_total = (dish.price or 0) * item.quantity
        subtotal += item_total

        items.append({
            "id": item_id,
            "dish_id": dish.id,
            "dish_name": dish.name,
            "quantity": item.quantity,
            "unit_price": dish.price or 0,
            "total_price": item_total,
            "notes": item.notes,
            "modifiers": item.modifiers
        })

        # Record sale
        sale = DishSalesDB(
            dish_id=dish.id,
            date=now,
            quantity_sold=item.quantity,
            revenue=item_total
        )
        db.add(sale)

    tax = subtotal * 0.08
    total = subtotal + tax

    order = {
        "id": order_id,
        "restaurant_id": checkout.restaurant_id,
        "table_id": None,
        "customer_name": checkout.customer_name,
        "status": OrderStatus.PAID,
        "items": items,
        "subtotal": round(subtotal, 2),
        "tax": round(tax, 2),
        "total": round(total, 2),
        "notes": None,
        "created_at": now,
        "updated_at": now
    }

    _orders[order_id] = order

    # Create payment record
    transaction_id = generate_uuid()
    payment_record = {
        "order_id": order_id,
        "amount_paid": round(total, 2),
        "tip": 0,
        "payment_method": checkout.payment_method,
        "change_due": 0,
        "transaction_id": transaction_id,
        "timestamp": now
    }
    _payments[transaction_id] = payment_record

    return PaymentResponse(**payment_record)


@router.get("/stats", response_model=POSStatsResponse)
async def get_pos_stats(
    restaurant_id: str = Query(..., description="Restaurant ID"),
    stats_date: Optional[date] = None,
    current_user: UserDB = Depends(get_current_user),
    db: AsyncSession = Depends(get_session)
):
    """Get real-time sales stats"""
    # Verify restaurant
    result = await db.execute(
        select(RestaurantDB).where(
            RestaurantDB.id == restaurant_id,
            RestaurantDB.user_id == current_user.id
        )
    )
    if not result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Restaurant not found")

    target_date = stats_date or date.today()

    # Calculate stats from orders
    total_revenue = 0
    total_orders = 0
    orders_by_status = {status.value: 0 for status in OrderStatus}
    item_sales = {}
    hourly_data = {hour: {"orders": 0, "revenue": 0} for hour in range(24)}

    for order in _orders.values():
        if order["restaurant_id"] != restaurant_id:
            continue

        order_date = order["created_at"].date()
        if order_date != target_date:
            continue

        total_orders += 1
        orders_by_status[order["status"].value] += 1

        if order["status"] == OrderStatus.PAID:
            total_revenue += order["total"]

            # Track hourly
            hour = order["created_at"].hour
            hourly_data[hour]["orders"] += 1
            hourly_data[hour]["revenue"] += order["total"]

            # Track item sales
            for item in order["items"]:
                dish_id = item["dish_id"]
                if dish_id not in item_sales:
                    item_sales[dish_id] = {
                        "dish_id": dish_id,
                        "dish_name": item["dish_name"],
                        "quantity": 0,
                        "revenue": 0
                    }
                item_sales[dish_id]["quantity"] += item["quantity"]
                item_sales[dish_id]["revenue"] += item["total_price"]

    # Get top selling items
    top_items = sorted(
        item_sales.values(),
        key=lambda x: x["revenue"],
        reverse=True
    )[:10]

    # Format hourly breakdown
    hourly_breakdown = [
        {"hour": hour, "orders": data["orders"], "revenue": round(data["revenue"], 2)}
        for hour, data in hourly_data.items()
        if data["orders"] > 0
    ]

    average_ticket = total_revenue / total_orders if total_orders > 0 else 0

    return POSStatsResponse(
        date=target_date,
        total_revenue=round(total_revenue, 2),
        total_orders=total_orders,
        average_ticket=round(average_ticket, 2),
        orders_by_status=orders_by_status,
        top_selling_items=top_items,
        hourly_breakdown=hourly_breakdown
    )
