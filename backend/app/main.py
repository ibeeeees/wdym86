"""
WDYM86 - AI-Powered Restaurant Inventory Intelligence Platform

FastAPI application entry point.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from .config import settings
from .database import init_db
from .data.seed import seed_database
from .routers import (
    auth_router,
    restaurants_router,
    ingredients_router,
    suppliers_router,
    inventory_router,
    forecasts_router,
    agents_router,
    gemini_router,
    dishes_router,
    events_router,
    pos_router,
    payments_router,
    delivery_router,
    aws_router,
    subscriptions_router
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan events"""
    # Startup
    await init_db()
    # Seed demo data if database is empty
    await seed_database(force=False)
    yield
    # Shutdown
    pass


app = FastAPI(
    title=settings.app_name,
    description="""
    AI-Powered Restaurant Inventory Intelligence Platform

    Features:
    - Ground-up probabilistic forecasting (NumPy TCN + Negative Binomial)
    - Autonomous AI agents (Risk, Reorder, Supplier Strategy)
    - Gemini-powered explanations and conversational interface
    - Real-time disruption awareness (weather, traffic, hazards)

    Built for hackathon tracks:
    - Ground-Up Model Track
    - Best Overall Track
    - MLH Best Use of Google Gemini API
    """,
    version="0.1.0",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins.split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth_router, prefix="/auth", tags=["Authentication"])
app.include_router(restaurants_router, prefix="/restaurants", tags=["Restaurants"])
app.include_router(ingredients_router, prefix="/ingredients", tags=["Ingredients"])
app.include_router(suppliers_router, prefix="/suppliers", tags=["Suppliers"])
app.include_router(inventory_router, prefix="/inventory", tags=["Inventory"])
app.include_router(forecasts_router, prefix="/forecasts", tags=["Forecasts"])
app.include_router(agents_router, prefix="/agents", tags=["AI Agents"])
app.include_router(gemini_router, prefix="/gemini", tags=["Gemini"])
app.include_router(dishes_router, prefix="/dishes", tags=["Dishes"])
app.include_router(events_router, prefix="/events", tags=["Events & Disruptions"])
app.include_router(pos_router, prefix="/pos", tags=["Point of Sale"])
app.include_router(payments_router, prefix="/payments", tags=["Payments"])
app.include_router(delivery_router, tags=["Delivery Services"])
app.include_router(aws_router, tags=["AWS"])
app.include_router(subscriptions_router, tags=["Subscriptions"])


@app.get("/")
async def root():
    """API root endpoint"""
    return {
        "name": settings.app_name,
        "version": "0.1.0",
        "status": "running",
        "docs": "/docs",
        "components": {
            "forecasting_model": "NumPy TCN with Negative Binomial output",
            "agents": [
                "InventoryRiskAgent",
                "ReorderOptimizationAgent",
                "SupplierStrategyAgent"
            ],
            "explanation_layer": "Google Gemini"
        }
    }


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy"}
