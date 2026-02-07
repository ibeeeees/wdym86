"""Supplier models"""

from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class SupplierBase(BaseModel):
    name: str
    lead_time_days: int
    min_order_quantity: Optional[float] = None
    reliability_score: float = 0.9
    shipping_cost: float = 0


class SupplierCreate(SupplierBase):
    pass


class Supplier(SupplierBase):
    id: str
    restaurant_id: str
    created_at: datetime

    class Config:
        from_attributes = True


class IngredientSupplier(BaseModel):
    ingredient_id: str
    supplier_id: str
    unit_cost: Optional[float] = None
    priority: int = 1
