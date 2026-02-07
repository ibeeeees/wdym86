"""
Database Configuration

SQLAlchemy async setup with SQLite (dev) or AWS RDS PostgreSQL (production).
"""

from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import declarative_base, relationship
from sqlalchemy import Column, String, Float, Integer, Boolean, DateTime, Text, ForeignKey, JSON
from sqlalchemy.sql import func
from datetime import datetime
from typing import AsyncGenerator
import uuid

from .config import settings

# Get database URL (supports AWS RDS)
database_url = settings.get_database_url()

# Create async engine with appropriate settings
engine_kwargs = {
    "echo": settings.debug,
    "future": True
}

# Add PostgreSQL-specific settings for RDS
if settings.rds_enabled:
    engine_kwargs.update({
        "pool_size": 5,
        "max_overflow": 10,
        "pool_timeout": 30,
        "pool_recycle": 1800,  # Recycle connections after 30 minutes
        "pool_pre_ping": True  # Test connections before use
    })

engine = create_async_engine(database_url, **engine_kwargs)

# Session factory
async_session_maker = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False
)

# Base class for models
Base = declarative_base()


def generate_uuid() -> str:
    """Generate a UUID string"""
    return str(uuid.uuid4())


# ==========================================
# SQLAlchemy ORM Models
# ==========================================

class User(Base):
    """User account"""
    __tablename__ = "users"

    id = Column(String, primary_key=True, default=generate_uuid)
    email = Column(String, unique=True, nullable=False, index=True)
    password_hash = Column(String, nullable=False)
    name = Column(String)
    profile_picture_url = Column(String, nullable=True)
    onboarding_completed = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow, server_default=func.now())
    updated_at = Column(DateTime, onupdate=func.now())


class Restaurant(Base):
    """Restaurant location"""
    __tablename__ = "restaurants"

    id = Column(String, primary_key=True, default=generate_uuid)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    name = Column(String, nullable=False)
    location = Column(String)
    cuisine_type = Column(String, nullable=True)
    subscription_tier = Column(String, default="free")  # free, starter, pro, enterprise
    created_at = Column(DateTime, server_default=func.now())


class Subscription(Base):
    """Restaurant subscription"""
    __tablename__ = "subscriptions"

    id = Column(String, primary_key=True, default=generate_uuid)
    restaurant_id = Column(String, ForeignKey("restaurants.id"), nullable=False, unique=True)
    tier = Column(String, nullable=False, default="free")  # free, starter, pro, enterprise
    status = Column(String, nullable=False, default="active")  # active, cancelled, past_due, trialing
    billing_cycle = Column(String, default="monthly")  # monthly, yearly
    stripe_customer_id = Column(String)
    stripe_subscription_id = Column(String)
    current_period_start = Column(DateTime)
    current_period_end = Column(DateTime)
    cancel_at_period_end = Column(Boolean, default=False)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, onupdate=func.now())


class Ingredient(Base):
    """Ingredient in inventory"""
    __tablename__ = "ingredients"

    id = Column(String, primary_key=True, default=generate_uuid)
    restaurant_id = Column(String, ForeignKey("restaurants.id"), nullable=False)
    name = Column(String, nullable=False)
    unit = Column(String, nullable=False)  # lbs, units, cases
    category = Column(String)  # produce, meat, dairy, dry_goods
    shelf_life_days = Column(Integer)
    is_perishable = Column(Boolean, default=False)
    unit_cost = Column(Float, default=1.0)
    created_at = Column(DateTime, server_default=func.now())


class Supplier(Base):
    """Supplier"""
    __tablename__ = "suppliers"

    id = Column(String, primary_key=True, default=generate_uuid)
    restaurant_id = Column(String, ForeignKey("restaurants.id"), nullable=False)
    name = Column(String, nullable=False)
    lead_time_days = Column(Integer, nullable=False)
    min_order_quantity = Column(Float)
    reliability_score = Column(Float, default=0.9)
    shipping_cost = Column(Float, default=0)
    created_at = Column(DateTime, server_default=func.now())


class IngredientSupplier(Base):
    """Ingredient-Supplier mapping"""
    __tablename__ = "ingredient_suppliers"

    id = Column(String, primary_key=True, default=generate_uuid)
    ingredient_id = Column(String, ForeignKey("ingredients.id"), nullable=False)
    supplier_id = Column(String, ForeignKey("suppliers.id"), nullable=False)
    unit_cost = Column(Float)
    priority = Column(Integer, default=1)


class InventoryState(Base):
    """Current inventory state"""
    __tablename__ = "inventory"

    id = Column(String, primary_key=True, default=generate_uuid)
    ingredient_id = Column(String, ForeignKey("ingredients.id"), nullable=False)
    quantity = Column(Float, nullable=False)
    recorded_at = Column(DateTime, server_default=func.now())


class UsageHistory(Base):
    """Historical usage data for training"""
    __tablename__ = "usage_history"

    id = Column(String, primary_key=True, default=generate_uuid)
    ingredient_id = Column(String, ForeignKey("ingredients.id"), nullable=False)
    date = Column(DateTime, nullable=False)
    quantity_used = Column(Float, nullable=False)
    event_flag = Column(Boolean, default=False)
    weather_severity = Column(Float, default=0)
    traffic_index = Column(Float, default=0)
    hazard_flag = Column(Boolean, default=False)


class Forecast(Base):
    """Generated forecasts"""
    __tablename__ = "forecasts"

    id = Column(String, primary_key=True, default=generate_uuid)
    ingredient_id = Column(String, ForeignKey("ingredients.id"), nullable=False)
    forecast_date = Column(DateTime, nullable=False)
    mu = Column(Float, nullable=False)
    k = Column(Float, nullable=False)
    created_at = Column(DateTime, server_default=func.now())


class AgentDecision(Base):
    """Agent decision audit trail"""
    __tablename__ = "agent_decisions"

    id = Column(String, primary_key=True, default=generate_uuid)
    ingredient_id = Column(String, ForeignKey("ingredients.id"), nullable=False)
    decision_type = Column(String, nullable=False)  # risk, reorder, strategy
    decision_data = Column(JSON, nullable=False)
    created_at = Column(DateTime, server_default=func.now())


class Dish(Base):
    """Menu dish"""
    __tablename__ = "dishes"

    id = Column(String, primary_key=True, default=generate_uuid)
    restaurant_id = Column(String, ForeignKey("restaurants.id"), nullable=False)
    name = Column(String, nullable=False)
    category = Column(String)  # appetizer, main, dessert, etc.
    price = Column(Float)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, server_default=func.now())


class Recipe(Base):
    """Recipe linking dishes to ingredients with quantities"""
    __tablename__ = "recipes"

    id = Column(String, primary_key=True, default=generate_uuid)
    dish_id = Column(String, ForeignKey("dishes.id"), nullable=False)
    ingredient_id = Column(String, ForeignKey("ingredients.id"), nullable=False)
    quantity = Column(Float, nullable=False)  # amount of ingredient per dish
    unit = Column(String, nullable=False)  # unit for this recipe entry
    notes = Column(Text)


class DishSales(Base):
    """Historical dish sales for demand derivation"""
    __tablename__ = "dish_sales"

    id = Column(String, primary_key=True, default=generate_uuid)
    dish_id = Column(String, ForeignKey("dishes.id"), nullable=False)
    date = Column(DateTime, nullable=False)
    quantity_sold = Column(Integer, nullable=False)
    revenue = Column(Float)


# ==========================================
# POS System Models
# ==========================================

class Order(Base):
    """POS Order"""
    __tablename__ = "orders"

    order_id = Column(String, primary_key=True, default=generate_uuid)
    restaurant_id = Column(String, ForeignKey("restaurants.id"), nullable=False)
    table_number = Column(Integer)
    customer_name = Column(String)
    status = Column(String, nullable=False, default="pending")  # pending, preparing, ready, completed, cancelled
    order_type = Column(String, nullable=False, default="dine_in")  # dine_in, takeout, delivery
    subtotal = Column(Float, default=0.0)
    tax = Column(Float, default=0.0)
    tip = Column(Float, default=0.0)
    total = Column(Float, default=0.0)
    payment_status = Column(String, default="unpaid")  # unpaid, paid, refunded, partial
    payment_method = Column(String)  # cash, card, mobile
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, onupdate=func.now())

    # Relationships
    items = relationship("OrderItem", back_populates="order", cascade="all, delete-orphan")
    table = relationship("Table", back_populates="current_order", foreign_keys="Table.current_order_id", uselist=False)
    transactions = relationship("PaymentTransaction", back_populates="order", cascade="all, delete-orphan")
    restaurant = relationship("Restaurant", backref="orders")


class OrderItem(Base):
    """Individual item in an order"""
    __tablename__ = "order_items"

    id = Column(String, primary_key=True, default=generate_uuid)
    order_id = Column(String, ForeignKey("orders.order_id"), nullable=False)
    ingredient_id = Column(String, ForeignKey("ingredients.id"))  # Links to menu item/ingredient
    name = Column(String, nullable=False)
    quantity = Column(Integer, nullable=False, default=1)
    unit_price = Column(Float, nullable=False)
    modifiers = Column(JSON, default=list)  # e.g., [{"name": "extra cheese", "price": 1.50}]
    special_instructions = Column(Text)
    subtotal = Column(Float, nullable=False)

    # Relationships
    order = relationship("Order", back_populates="items")
    ingredient = relationship("Ingredient", backref="order_items")


class Table(Base):
    """Restaurant table"""
    __tablename__ = "tables"

    id = Column(String, primary_key=True, default=generate_uuid)
    restaurant_id = Column(String, ForeignKey("restaurants.id"), nullable=False)
    table_number = Column(Integer, nullable=False)
    capacity = Column(Integer, default=4)
    status = Column(String, default="available")  # available, occupied, reserved, cleaning
    current_order_id = Column(String, ForeignKey("orders.order_id"))

    # Relationships
    current_order = relationship("Order", back_populates="table", foreign_keys=[current_order_id])
    restaurant = relationship("Restaurant", backref="tables")


class Customer(Base):
    """Customer for loyalty and saved payments"""
    __tablename__ = "customers"

    id = Column(String, primary_key=True, default=generate_uuid)
    restaurant_id = Column(String, ForeignKey("restaurants.id"), nullable=False)
    name = Column(String, nullable=False)
    email = Column(String, index=True)
    phone = Column(String, index=True)
    loyalty_points = Column(Integer, default=0)
    payment_tokens = Column(JSON, default=list)  # Saved payment methods (tokenized)
    created_at = Column(DateTime, server_default=func.now())

    # Relationships
    restaurant = relationship("Restaurant", backref="customers")


class PaymentTransaction(Base):
    """Payment transaction record"""
    __tablename__ = "payment_transactions"

    id = Column(String, primary_key=True, default=generate_uuid)
    order_id = Column(String, ForeignKey("orders.order_id"), nullable=False)
    payment_provider = Column(String, nullable=False)  # stripe, square, cash
    transaction_id = Column(String)  # External transaction ID from provider
    amount = Column(Float, nullable=False)
    status = Column(String, nullable=False, default="pending")  # pending, completed, failed, refunded
    payment_method_type = Column(String)  # credit_card, debit_card, cash, apple_pay, etc.
    transaction_data = Column(JSON, default=dict)  # Additional provider-specific data
    created_at = Column(DateTime, server_default=func.now())

    # Relationships
    order = relationship("Order", back_populates="transactions")


# ==========================================
# Floor Plan & Table Layout Models
# ==========================================

class FloorPlan(Base):
    """Restaurant floor plan / layout"""
    __tablename__ = "floor_plans"

    id = Column(String, primary_key=True, default=generate_uuid)
    restaurant_id = Column(String, ForeignKey("restaurants.id"), nullable=False)
    name = Column(String, nullable=False, default="Main Floor")
    width = Column(Integer, default=800)  # virtual canvas px
    height = Column(Integer, default=600)
    zones = Column(JSON, default=list)  # [{ id, name, type, x, y, w, h, color }]
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, onupdate=func.now())

    restaurant = relationship("Restaurant", backref="floor_plans")


class FloorTable(Base):
    """Table placed on a floor plan with position, shape, capacity"""
    __tablename__ = "floor_tables"

    id = Column(String, primary_key=True, default=generate_uuid)
    floor_plan_id = Column(String, ForeignKey("floor_plans.id"), nullable=False)
    restaurant_id = Column(String, ForeignKey("restaurants.id"), nullable=False)
    table_number = Column(Integer, nullable=False)
    label = Column(String)  # e.g. "T1", "Bar-3"
    capacity = Column(Integer, default=4)
    shape = Column(String, default="square")  # square, round, rectangle, bar_stool
    section = Column(String, default="dining")  # dining, bar, patio, private
    zone_id = Column(String)  # FK to zone within floor plan JSON
    x = Column(Float, default=0)  # position on canvas
    y = Column(Float, default=0)
    width = Column(Float, default=80)
    height = Column(Float, default=80)
    rotation = Column(Float, default=0)
    is_accessible = Column(Boolean, default=False)
    server_id = Column(String)  # assigned server (user id or name)
    status = Column(String, default="available")  # available, occupied, reserved, cleaning
    current_order_id = Column(String, ForeignKey("orders.order_id"))

    floor_plan = relationship("FloorPlan", backref="tables")
    restaurant = relationship("Restaurant", backref="floor_tables")


# ==========================================
# Extended Supplier Model
# ==========================================

class SupplierExtended(Base):
    """Extended supplier data — real distributor information"""
    __tablename__ = "suppliers_extended"

    id = Column(String, primary_key=True, default=generate_uuid)
    supplier_id = Column(String, ForeignKey("suppliers.id"), nullable=False)
    supplier_type = Column(String, nullable=False)  # food_distributor, alcohol_distributor, produce, meat_seafood, packaging, janitorial
    region_coverage = Column(JSON, default=list)  # ["Southeast US", "National"]
    delivery_schedule = Column(JSON, default=dict)  # { "days": ["Mon","Wed","Fri"], "cutoff_time": "14:00" }
    volatility_risk_score = Column(Float, default=0.1)  # 0-1, higher = more volatile
    substitute_supplier_ids = Column(JSON, default=list)  # list of supplier_ids as substitutes
    contact_phone = Column(String)
    contact_email = Column(String)
    account_number = Column(String)
    website = Column(String)
    notes = Column(Text)
    created_at = Column(DateTime, server_default=func.now())

    supplier = relationship("Supplier", backref="extended_info")


# ==========================================
# Full Inventory Tracking (Beyond Food)
# ==========================================

class InventoryItem(Base):
    """Non-food inventory: equipment, serviceware, cleaning, staff supplies"""
    __tablename__ = "inventory_items"

    id = Column(String, primary_key=True, default=generate_uuid)
    restaurant_id = Column(String, ForeignKey("restaurants.id"), nullable=False)
    name = Column(String, nullable=False)
    category = Column(String, nullable=False)  # kitchen_equipment, serviceware, cleaning, beverages, staff_supplies
    subcategory = Column(String)  # e.g. "ovens", "cups", "trash_bags", "uniforms"
    unit = Column(String, nullable=False)  # units, cases, boxes, bottles, sets
    current_quantity = Column(Float, default=0)
    min_quantity = Column(Float, default=0)  # reorder threshold
    max_quantity = Column(Float)
    unit_cost = Column(Float, default=0)
    supplier_id = Column(String, ForeignKey("suppliers.id"))
    storage_location = Column(String)  # "kitchen", "bar", "storage_room", "bathroom"
    last_restocked = Column(DateTime)
    notes = Column(Text)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, server_default=func.now())

    restaurant = relationship("Restaurant", backref="inventory_items")
    supplier = relationship("Supplier", backref="inventory_items")


# ==========================================
# Disruption Log (Automated, Non-User)
# ==========================================

class DisruptionLog(Base):
    """Automated disruption events — never user-triggered"""
    __tablename__ = "disruption_logs"

    id = Column(String, primary_key=True, default=generate_uuid)
    restaurant_id = Column(String, ForeignKey("restaurants.id"), nullable=False)
    disruption_type = Column(String, nullable=False)  # weather, traffic, supply_chain, local_event, news
    source = Column(String)  # "weather_api", "news_api", "auto_simulation"
    title = Column(String, nullable=False)
    description = Column(Text)
    severity = Column(String, default="low")  # low, moderate, high, critical
    impact_data = Column(JSON, default=dict)  # { weather_risk, traffic_risk, delivery_delay, cost_impact, affected_ingredients }
    location_context = Column(JSON, default=dict)  # { lat, lng, city, state, radius_miles }
    started_at = Column(DateTime, server_default=func.now())
    resolved_at = Column(DateTime)
    is_active = Column(Boolean, default=True)
    auto_generated = Column(Boolean, default=True)  # MUST be True — users never create

    restaurant = relationship("Restaurant", backref="disruption_logs")


# ==========================================
# Timeline Analytics / Sales History
# ==========================================

class DailySalesSnapshot(Base):
    """Daily aggregated sales for timeline analytics"""
    __tablename__ = "daily_sales_snapshots"

    id = Column(String, primary_key=True, default=generate_uuid)
    restaurant_id = Column(String, ForeignKey("restaurants.id"), nullable=False)
    date = Column(DateTime, nullable=False)
    total_revenue = Column(Float, default=0)
    total_orders = Column(Integer, default=0)
    dine_in_orders = Column(Integer, default=0)
    takeout_orders = Column(Integer, default=0)
    delivery_orders = Column(Integer, default=0)
    total_tips = Column(Float, default=0)
    refunds = Column(Float, default=0)
    voids = Column(Integer, default=0)
    labor_hours = Column(Float, default=0)
    top_dish_id = Column(String)
    top_dish_name = Column(String)
    waste_cost = Column(Float, default=0)
    stockout_count = Column(Integer, default=0)
    ai_tip_of_day = Column(Text)
    created_at = Column(DateTime, server_default=func.now())

    restaurant = relationship("Restaurant", backref="daily_snapshots")


# ==========================================
# Staff / Roles / Business PIN
# ==========================================

class StaffMember(Base):
    """Restaurant staff — managers, workers, servers"""
    __tablename__ = "staff_members"

    id = Column(String, primary_key=True, default=generate_uuid)
    restaurant_id = Column(String, ForeignKey("restaurants.id"), nullable=False)
    user_id = Column(String, ForeignKey("users.id"))  # optional link to full user
    name = Column(String, nullable=False)
    role = Column(String, nullable=False, default="worker")  # admin, manager, worker, server
    email = Column(String)
    phone = Column(String)
    pin_code = Column(String)  # 4-6 digit for quick POS login
    is_active = Column(Boolean, default=True)
    permissions = Column(JSON, default=dict)  # { can_void: true, can_refund: false, ... }
    hire_date = Column(DateTime)
    created_at = Column(DateTime, server_default=func.now())

    restaurant = relationship("Restaurant", backref="staff_members")
    user = relationship("User", backref="staff_profiles")


class BusinessPIN(Base):
    """Business join PIN for managers/workers"""
    __tablename__ = "business_pins"

    id = Column(String, primary_key=True, default=generate_uuid)
    restaurant_id = Column(String, ForeignKey("restaurants.id"), nullable=False, unique=True)
    pin_hash = Column(String, nullable=False)
    expires_at = Column(DateTime)
    created_by = Column(String, ForeignKey("users.id"))
    created_at = Column(DateTime, server_default=func.now())

    restaurant = relationship("Restaurant", backref="business_pin", uselist=False)


# ==========================================
# POS Integration Tracking
# ==========================================

class POSIntegration(Base):
    """External POS platform integrations (Toast, Aloha, etc.)"""
    __tablename__ = "pos_integrations"

    id = Column(String, primary_key=True, default=generate_uuid)
    restaurant_id = Column(String, ForeignKey("restaurants.id"), nullable=False)
    platform = Column(String, nullable=False)  # toast, aloha, square, clover
    api_key_encrypted = Column(String)
    location_id = Column(String)
    is_active = Column(Boolean, default=False)
    last_sync_at = Column(DateTime)
    sync_config = Column(JSON, default=dict)  # { sync_sales: true, sync_labor: true, ... }
    created_at = Column(DateTime, server_default=func.now())

    restaurant = relationship("Restaurant", backref="pos_integrations")


# ==========================================
# Payroll System
# ==========================================

class PayrollEmployee(Base):
    """Employee with compensation data for payroll"""
    __tablename__ = "payroll_employees"

    id = Column(String, primary_key=True, default=generate_uuid)
    restaurant_id = Column(String, ForeignKey("restaurants.id"), nullable=False)
    staff_member_id = Column(String, ForeignKey("staff_members.id"))
    name = Column(String, nullable=False)
    role = Column(String, nullable=False)  # restaurant_admin, manager, server, bartender, line_cook, prep_cook, dishwasher, host
    department = Column(String, nullable=False)  # Management, Front of House, Back of House
    employment_type = Column(String, nullable=False, default="full_time")  # full_time, part_time
    compensation_type = Column(String, nullable=False, default="hourly")  # hourly, salary
    hourly_rate = Column(Float)
    annual_salary = Column(Float)
    status = Column(String, default="active")  # active, on_leave, terminated
    start_date = Column(DateTime)
    created_at = Column(DateTime, server_default=func.now())

    restaurant = relationship("Restaurant", backref="payroll_employees")
    staff_member = relationship("StaffMember", backref="payroll_info")


class PayRun(Base):
    """Payroll run record"""
    __tablename__ = "pay_runs"

    id = Column(String, primary_key=True, default=generate_uuid)
    restaurant_id = Column(String, ForeignKey("restaurants.id"), nullable=False)
    period_start = Column(DateTime, nullable=False)
    period_end = Column(DateTime, nullable=False)
    run_date = Column(DateTime, nullable=False)
    total_gross = Column(Float, default=0)
    total_net = Column(Float, default=0)
    total_taxes = Column(Float, default=0)
    total_tips = Column(Float, default=0)
    employee_count = Column(Integer, default=0)
    status = Column(String, default="pending")  # pending, processing, completed, failed
    s3_export_key = Column(String)  # S3 key for exported paycheck CSV
    created_at = Column(DateTime, server_default=func.now())

    restaurant = relationship("Restaurant", backref="pay_runs")


class ExpenseRecord(Base):
    """Business expense tracking"""
    __tablename__ = "expenses"

    id = Column(String, primary_key=True, default=generate_uuid)
    restaurant_id = Column(String, ForeignKey("restaurants.id"), nullable=False)
    date = Column(DateTime, nullable=False)
    category = Column(String, nullable=False)  # food_beverage, labor, rent_utilities, equipment, marketing, insurance, supplies, other
    description = Column(String, nullable=False)
    amount = Column(Float, nullable=False)
    vendor = Column(String)
    status = Column(String, default="pending")  # approved, pending, rejected
    receipt_s3_key = Column(String)  # S3 key for receipt image/PDF
    created_at = Column(DateTime, server_default=func.now())

    restaurant = relationship("Restaurant", backref="expenses")


# ==========================================
# Audit Log
# ==========================================

class AuditLog(Base):
    """Audit log for tracking all important actions"""
    __tablename__ = "audit_logs"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    restaurant_id = Column(String, ForeignKey("restaurants.id"), nullable=False)
    user_id = Column(String, ForeignKey("users.id"))
    action = Column(String, nullable=False)  # create, update, delete, login, payment, etc.
    resource_type = Column(String)  # order, ingredient, user, subscription, etc.
    resource_id = Column(String)  # ID of the resource affected
    details = Column(JSON, default=dict)  # Additional context
    ip_address = Column(String)
    user_agent = Column(String)
    created_at = Column(DateTime, server_default=func.now())
    
    restaurant = relationship("Restaurant", backref="audit_logs")
    user = relationship("User", backref="audit_logs")


# ==========================================
# Database Lifecycle
# ==========================================

async def init_db():
    """Initialize database tables"""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)


async def get_session() -> AsyncGenerator[AsyncSession, None]:
    """Get database session"""
    async with async_session_maker() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()
