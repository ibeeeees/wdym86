"""
Shared test fixtures for wdym86 backend tests.

Provides:
- In-memory SQLite async database (shared via StaticPool)
- Test HTTP client (httpx.AsyncClient against FastAPI app)
- Auth helpers (create user, get token)
- Factory fixtures for restaurants, ingredients, etc.
"""

import os
import pytest
import uuid

os.environ["TESTING"] = "1"
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.pool import StaticPool

from app.database import Base, get_session
from app.main import app
from app.routers.auth import get_password_hash, create_access_token


# ---------------------------------------------------------------------------
# Database fixtures — StaticPool ensures a single shared in-memory DB
# ---------------------------------------------------------------------------

TEST_DATABASE_URL = "sqlite+aiosqlite:///:memory:"


@pytest.fixture()
async def engine():
    eng = create_async_engine(
        TEST_DATABASE_URL,
        echo=False,
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    async with eng.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield eng
    async with eng.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    await eng.dispose()


@pytest.fixture()
async def session_maker(engine):
    return async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


@pytest.fixture()
async def db(session_maker):
    async with session_maker() as session:
        yield session


# ---------------------------------------------------------------------------
# HTTP client with dependency override
# ---------------------------------------------------------------------------

@pytest.fixture()
async def client(session_maker):
    """AsyncClient that talks to the FastAPI app with test DB."""

    async def _override_get_session():
        async with session_maker() as session:
            yield session

    app.dependency_overrides[get_session] = _override_get_session
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac
    app.dependency_overrides.clear()


# ---------------------------------------------------------------------------
# Auth helpers
# ---------------------------------------------------------------------------

@pytest.fixture()
async def test_user(db):
    """Create a test user directly in the database and return it."""
    from app.database import User as UserDB

    user = UserDB(
        id=str(uuid.uuid4()),
        email="testuser@example.com",
        password_hash=get_password_hash("testpassword123"),
        name="Test User",
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user


@pytest.fixture()
def auth_token(test_user):
    """Create a valid JWT for the test user."""
    return create_access_token(data={"sub": test_user.id})


@pytest.fixture()
def auth_headers(auth_token):
    """Authorization header dict for authenticated requests."""
    return {"Authorization": f"Bearer {auth_token}"}


# ---------------------------------------------------------------------------
# Factory fixtures
# ---------------------------------------------------------------------------

@pytest.fixture()
async def test_restaurant(db, test_user):
    """Create a test restaurant owned by test_user."""
    from app.database import Restaurant as RestaurantDB

    restaurant = RestaurantDB(
        id=str(uuid.uuid4()),
        user_id=test_user.id,
        name="Test Restaurant",
        location="Athens, GA",
    )
    db.add(restaurant)
    await db.commit()
    await db.refresh(restaurant)
    return restaurant


@pytest.fixture()
async def test_ingredient(db, test_restaurant):
    """Create a test ingredient in the test restaurant."""
    from app.database import Ingredient as IngredientDB

    ingredient = IngredientDB(
        id=str(uuid.uuid4()),
        restaurant_id=test_restaurant.id,
        name="Test Tomatoes",
        unit="lbs",
        category="produce",
        shelf_life_days=7,
        is_perishable=True,
        unit_cost=2.50,
    )
    db.add(ingredient)
    await db.commit()
    await db.refresh(ingredient)
    return ingredient


@pytest.fixture()
async def test_supplier(db, test_restaurant):
    """Create a test supplier."""
    from app.database import Supplier as SupplierDB

    supplier = SupplierDB(
        id=str(uuid.uuid4()),
        restaurant_id=test_restaurant.id,
        name="Test Supplier Co",
        lead_time_days=3,
        min_order_quantity=10,
        reliability_score=0.95,
        shipping_cost=25.0,
    )
    db.add(supplier)
    await db.commit()
    await db.refresh(supplier)
    return supplier


@pytest.fixture()
async def test_dish(db, test_restaurant):
    """Create a test dish."""
    from app.database import Dish as DishDB

    dish = DishDB(
        id=str(uuid.uuid4()),
        restaurant_id=test_restaurant.id,
        name="Test Pasta",
        category="Main",
        price=15.99,
        is_active=True,
    )
    db.add(dish)
    await db.commit()
    await db.refresh(dish)
    return dish


@pytest.fixture()
async def test_inventory(db, test_ingredient):
    """Create inventory record for test ingredient."""
    from app.database import InventoryState as InventoryDB

    inv = InventoryDB(
        id=str(uuid.uuid4()),
        ingredient_id=test_ingredient.id,
        quantity=100.0,
    )
    db.add(inv)
    await db.commit()
    await db.refresh(inv)
    return inv
