"""User models"""

from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime


class UserBase(BaseModel):
    email: EmailStr
    name: Optional[str] = None


class UserCreate(UserBase):
    password: str


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class User(UserBase):
    id: str
    profile_picture_url: Optional[str] = None
    onboarding_completed: bool = False
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class TokenData(BaseModel):
    user_id: Optional[str] = None


class OnboardingData(BaseModel):
    subscription_tier: str = "free"
    restaurant_name: str
    restaurant_location: Optional[str] = None
    cuisine_type: Optional[str] = None
    menu_items: Optional[List[str]] = None
    notifications_enabled: bool = True
    theme_preference: str = "system"
    profile_picture_url: Optional[str] = None
