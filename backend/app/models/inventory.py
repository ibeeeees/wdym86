"""Inventory models"""

from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class InventoryStateBase(BaseModel):
    quantity: float


class InventoryUpdate(InventoryStateBase):
    pass


class InventoryState(InventoryStateBase):
    id: str
    ingredient_id: str
    recorded_at: datetime

    class Config:
        from_attributes = True


class UsageHistoryBase(BaseModel):
    date: datetime
    quantity_used: float
    event_flag: bool = False
    weather_severity: float = 0
    traffic_index: float = 0
    hazard_flag: bool = False


class UsageHistoryCreate(UsageHistoryBase):
    pass


class UsageHistory(UsageHistoryBase):
    id: str
    ingredient_id: str

    class Config:
        from_attributes = True
