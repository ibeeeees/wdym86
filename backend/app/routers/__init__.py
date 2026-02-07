"""API Routers"""

from .auth import router as auth_router
from .restaurants import router as restaurants_router
from .ingredients import router as ingredients_router
from .suppliers import router as suppliers_router
from .inventory import router as inventory_router
from .forecasts import router as forecasts_router
from .agents import router as agents_router
from .gemini import router as gemini_router
from .dishes import router as dishes_router
from .events import router as events_router
from .pos import router as pos_router
from .payments import router as payments_router
from .delivery import router as delivery_router

__all__ = [
    'auth_router',
    'restaurants_router',
    'ingredients_router',
    'suppliers_router',
    'inventory_router',
    'forecasts_router',
    'agents_router',
    'gemini_router',
    'dishes_router',
    'events_router',
    'pos_router',
    'payments_router',
    'delivery_router',
]
