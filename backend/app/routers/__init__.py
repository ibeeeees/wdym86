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
from .aws_status import router as aws_router
from .subscriptions import router as subscriptions_router
from .solana_pay import router as solana_pay_router
from .floor_plan import router as floor_plan_router
from .disruptions import router as disruptions_router
from .inventory_items import router as inventory_items_router
from .staff import router as staff_router
from .timeline import router as timeline_router
from .pos_integration import router as pos_integration_router
from .payroll import router as payroll_router
from .stripe_webhooks import router as stripe_webhooks_router
from .pos_payments import router as pos_payments_router
from .tax import router as tax_router

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
    'aws_router',
    'subscriptions_router',
    'solana_pay_router',
    'floor_plan_router',
    'disruptions_router',
    'inventory_items_router',
    'staff_router',
    'timeline_router',
    'pos_integration_router',
    'payroll_router',
    'stripe_webhooks_router',
    'pos_payments_router',
    'tax_router',
]
