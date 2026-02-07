"""Restaurant models"""

from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class RestaurantBase(BaseModel):
    name: str
    location: Optional[str] = None


class RestaurantCreate(RestaurantBase):
    pass


class Restaurant(RestaurantBase):
    id: str
    user_id: str
    created_at: datetime

    class Config:
        from_attributes = True
