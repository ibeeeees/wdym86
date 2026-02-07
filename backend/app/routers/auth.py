"""Authentication router"""

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from passlib.context import CryptContext
from jose import JWTError, jwt
from datetime import datetime, timedelta
from typing import Optional
import base64
import uuid

from ..database import get_session, User as UserDB, Restaurant as RestaurantDB
from ..models.user import UserCreate, User, Token, TokenData, OnboardingData
from ..config import settings
from ..aws.s3 import s3_client

router = APIRouter()

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# OAuth2
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.access_token_expire_minutes)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.secret_key, algorithm=settings.algorithm)
    return encoded_jwt


async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_session)
) -> UserDB:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.secret_key, algorithms=[settings.algorithm])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    result = await db.execute(select(UserDB).where(UserDB.id == user_id))
    user = result.scalar_one_or_none()
    if user is None:
        raise credentials_exception
    return user


@router.post("/register", response_model=User)
async def register(
    user_data: UserCreate,
    db: AsyncSession = Depends(get_session)
):
    """Register a new user"""
    # Check if user exists
    result = await db.execute(select(UserDB).where(UserDB.email == user_data.email))
    if result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )

    # Create user
    user = UserDB(
        email=user_data.email,
        password_hash=get_password_hash(user_data.password),
        name=user_data.name
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)

    return user


@router.post("/login", response_model=Token)
async def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: AsyncSession = Depends(get_session)
):
    """Login and get access token"""
    result = await db.execute(select(UserDB).where(UserDB.email == form_data.username))
    user = result.scalar_one_or_none()

    if not user or not verify_password(form_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token = create_access_token(data={"sub": user.id})
    return {"access_token": access_token, "token_type": "bearer"}


@router.get("/me", response_model=User)
async def get_me(current_user: UserDB = Depends(get_current_user)):
    """Get current user profile"""
    return current_user


@router.post("/complete-onboarding")
async def complete_onboarding(
    data: OnboardingData,
    current_user: UserDB = Depends(get_current_user),
    db: AsyncSession = Depends(get_session)
):
    """Complete onboarding for a new user"""
    profile_url = data.profile_picture_url

    # Upload base64 profile picture to S3 if enabled
    if profile_url and profile_url.startswith("data:image/") and s3_client.enabled:
        try:
            # Parse base64 data URI: "data:image/png;base64,iVBOR..."
            header, b64_data = profile_url.split(",", 1)
            content_type = header.split(":")[1].split(";")[0]  # e.g. "image/png"
            ext = content_type.split("/")[1]  # e.g. "png"
            image_bytes = base64.b64decode(b64_data)
            filename = f"{current_user.id}-{uuid.uuid4().hex[:8]}.{ext}"
            s3_url = await s3_client.upload_bytes(
                image_bytes, filename, folder="profile-pictures", content_type=content_type
            )
            if s3_url:
                # Generate a presigned URL for access
                key = f"{s3_client.prefix}/profile-pictures/{filename}"
                presigned = await s3_client.get_presigned_url(key, expiration=86400 * 7)
                profile_url = presigned or s3_url
        except Exception:
            pass  # Fall back to storing the base64 string

    current_user.profile_picture_url = profile_url
    current_user.onboarding_completed = True

    restaurant = RestaurantDB(
        user_id=current_user.id,
        name=data.restaurant_name,
        location=data.restaurant_location,
        cuisine_type=data.cuisine_type,
        subscription_tier=data.subscription_tier
    )
    db.add(restaurant)
    await db.commit()

    return {"status": "ok", "restaurant_id": restaurant.id}
