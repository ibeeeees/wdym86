"""Ingredient models"""

from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class IngredientBase(BaseModel):
    name: str
    unit: str  # lbs, units, cases
    category: Optional[str] = None  # produce, meat, dairy, dry_goods
    shelf_life_days: Optional[int] = None
    is_perishable: bool = False
    unit_cost: float = 1.0


class IngredientCreate(IngredientBase):
    pass


class Ingredient(IngredientBase):
    id: str
    restaurant_id: str
    created_at: datetime

    class Config:
        from_attributes = True


class IngredientWithInventory(Ingredient):
    current_inventory: float = 0
    risk_level: Optional[str] = None
    days_of_cover: Optional[int] = None
