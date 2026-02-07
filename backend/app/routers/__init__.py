"""API Routers"""

from .auth import router as auth_router
from .restaurants import router as restaurants_router
from .ingredients import router as ingredients_router
from .suppliers import router as suppliers_router
from .inventory import router as inventory_router
from .forecasts import router as forecasts_router
from .agents import router as agents_router
from .gemini import router as gemini_router

__all__ = [
    'auth_router',
    'restaurants_router',
    'ingredients_router',
    'suppliers_router',
    'inventory_router',
    'forecasts_router',
    'agents_router',
    'gemini_router',
]
