"""
Database Configuration

SQLAlchemy async setup with SQLite (easily swappable to PostgreSQL).
"""

from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import declarative_base
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
