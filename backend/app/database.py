"""
Database Configuration

SQLAlchemy async setup with SQLite (easily swappable to PostgreSQL).
"""

from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import declarative_base, relationship
from sqlalchemy import Column, String, Float, Integer, Boolean, DateTime, Text, ForeignKey, JSON
from sqlalchemy.sql import func
from typing import AsyncGenerator
import uuid

from .config import settings

# Create async engine
engine = create_async_engine(
    settings.database_url,
    echo=settings.debug,
    future=True
)

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
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, onupdate=func.now())


class Restaurant(Base):
    """Restaurant location"""
    __tablename__ = "restaurants"

    id = Column(String, primary_key=True, default=generate_uuid)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    name = Column(String, nullable=False)
    location = Column(String)
    created_at = Column(DateTime, server_default=func.now())


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
