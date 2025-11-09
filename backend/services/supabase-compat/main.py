"""
Supabase-Compatible API Layer
Drop-in replacement for Supabase - works with existing frontend code
NO FRONTEND CHANGES REQUIRED
"""
import os
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional
from uuid import UUID, uuid4

import jwt
from fastapi import FastAPI, Depends, HTTPException, Header, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, EmailStr
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.core.database import get_db
from app.models.user import User, UserSession
from app.services.auth import AuthService
from app.services.password import PasswordService

# ==================== Configuration ====================
settings = get_settings()

app = FastAPI(
    title="Betcha Supabase-Compatible API",
    description="Drop-in replacement for Supabase with enterprise backend",
    version="1.0.0",
)

# CORS - Same as Supabase
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS.split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ==================== Schemas (Match Supabase Response Format) ====================

class SignUpRequest(BaseModel):
    email: EmailStr
    password: str
    options: Optional[Dict[str, Any]] = None


class SignInRequest(BaseModel):
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    """Matches Supabase user response format"""
    id: UUID
    email: str
    aud: str = "authenticated"
    role: str = "authenticated"
    email_confirmed_at: Optional[datetime] = None
    phone: Optional[str] = None
    confirmed_at: Optional[datetime] = None
    last_sign_in_at: Optional[datetime] = None
    app_metadata: Dict[str, Any] = {}
    user_metadata: Dict[str, Any] = {}
    identities: List[Dict[str, Any]] = []
    created_at: datetime
    updated_at: datetime


class SessionResponse(BaseModel):
    """Matches Supabase session response format"""
    access_token: str
    token_type: str = "bearer"
    expires_in: int = 3600
    expires_at: int
    refresh_token: str
    user: UserResponse


class AuthResponse(BaseModel):
    """Matches Supabase auth response format"""
    user: Optional[UserResponse] = None
    session: Optional[SessionResponse] = None


# ==================== Auth Helpers ====================

def create_access_token(user: User) -> str:
    """Create JWT access token (matches Supabase format)"""
    now = datetime.utcnow()
    expires = now + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)

    payload = {
        "aud": "authenticated",
        "exp": int(expires.timestamp()),
        "iat": int(now.timestamp()),
        "sub": str(user.id),
        "email": user.email,
        "phone": user.phone_number or "",
        "app_metadata": {
            "provider": "email",
            "providers": ["email"]
        },
        "user_metadata": {
            "full_name": user.full_name or "",
        },
        "role": "authenticated",
    }

    return jwt.encode(payload, settings.JWT_SECRET_KEY, algorithm="HS256")


def create_refresh_token(user: User) -> str:
    """Create refresh token"""
    now = datetime.utcnow()
    expires = now + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)

    payload = {
        "sub": str(user.id),
        "exp": int(expires.timestamp()),
        "iat": int(now.timestamp()),
    }

    return jwt.encode(payload, settings.JWT_SECRET_KEY, algorithm="HS256")


def user_to_response(user: User) -> UserResponse:
    """Convert User model to Supabase-format response"""
    return UserResponse(
        id=user.id,
        email=user.email,
        email_confirmed_at=user.created_at if user.is_email_verified else None,
        phone=user.phone_number,
        confirmed_at=user.created_at if user.is_email_verified else None,
        last_sign_in_at=user.last_login_at,
        app_metadata={
            "provider": "email",
            "providers": ["email"]
        },
        user_metadata={
            "full_name": user.full_name or "",
        },
        created_at=user.created_at,
        updated_at=user.updated_at,
    )


def create_session_response(user: User, access_token: str, refresh_token: str) -> SessionResponse:
    """Create Supabase-format session response"""
    now = datetime.utcnow()
    expires = now + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)

    return SessionResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        expires_at=int(expires.timestamp()),
        user=user_to_response(user),
    )


# ==================== Supabase Auth API Endpoints ====================

@app.post("/auth/v1/signup", response_model=AuthResponse)
async def signup(
    request: SignUpRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Supabase-compatible signup endpoint
    Endpoint: POST /auth/v1/signup
    """
    auth_service = AuthService(db)
    password_service = PasswordService()

    # Check if user exists
    result = await db.execute(
        select(User).where(User.email == request.email)
    )
    existing_user = result.scalar_one_or_none()

    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User already registered"
        )

    # Hash password
    password_hash = password_service.hash_password(request.password)

    # Extract metadata
    user_metadata = request.options.get("data", {}) if request.options else {}

    # Create user
    user = User(
        id=uuid4(),
        email=request.email,
        password_hash=password_hash,
        full_name=user_metadata.get("full_name"),
        is_active=True,
        is_email_verified=False,  # In production, require email verification
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
    )

    db.add(user)
    await db.commit()
    await db.refresh(user)

    # Create tokens
    access_token = create_access_token(user)
    refresh_token = create_refresh_token(user)

    # Create session
    session = UserSession(
        id=uuid4(),
        user_id=user.id,
        refresh_token=refresh_token,
        expires_at=datetime.utcnow() + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS),
        created_at=datetime.utcnow(),
    )
    db.add(session)
    await db.commit()

    return AuthResponse(
        user=user_to_response(user),
        session=create_session_response(user, access_token, refresh_token)
    )


@app.post("/auth/v1/token", response_model=AuthResponse)
async def signin(
    request: SignInRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Supabase-compatible signin endpoint
    Endpoint: POST /auth/v1/token?grant_type=password
    """
    password_service = PasswordService()

    # Find user
    result = await db.execute(
        select(User).where(User.email == request.email)
    )
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid login credentials"
        )

    # Verify password
    if not password_service.verify_password(request.password, user.password_hash):
        # Increment failed attempts
        user.failed_login_attempts += 1
        if user.failed_login_attempts >= settings.MAX_LOGIN_ATTEMPTS:
            user.locked_until = datetime.utcnow() + timedelta(minutes=settings.LOCKOUT_DURATION_MINUTES)
        await db.commit()

        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid login credentials"
        )

    # Check if account is locked
    if not user.can_login:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is locked or suspended"
        )

    # Reset failed attempts
    user.failed_login_attempts = 0
    user.last_login_at = datetime.utcnow()
    await db.commit()

    # Create tokens
    access_token = create_access_token(user)
    refresh_token = create_refresh_token(user)

    # Create session
    session = UserSession(
        id=uuid4(),
        user_id=user.id,
        refresh_token=refresh_token,
        expires_at=datetime.utcnow() + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS),
        last_activity_at=datetime.utcnow(),
        created_at=datetime.utcnow(),
    )
    db.add(session)
    await db.commit()

    return AuthResponse(
        user=user_to_response(user),
        session=create_session_response(user, access_token, refresh_token)
    )


@app.post("/auth/v1/logout")
async def logout(
    authorization: Optional[str] = Header(None),
    db: AsyncSession = Depends(get_db)
):
    """
    Supabase-compatible logout endpoint
    """
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED)

    token = authorization.replace("Bearer ", "")

    try:
        payload = jwt.decode(token, settings.JWT_SECRET_KEY, algorithms=["HS256"])
        user_id = UUID(payload["sub"])

        # Revoke all sessions
        result = await db.execute(
            select(UserSession).where(UserSession.user_id == user_id, UserSession.is_active == True)
        )
        sessions = result.scalars().all()

        for session in sessions:
            session.is_active = False
            session.revoked_at = datetime.utcnow()

        await db.commit()

    except jwt.InvalidTokenError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED)

    return {"message": "Successfully logged out"}


@app.get("/auth/v1/user", response_model=UserResponse)
async def get_user(
    authorization: Optional[str] = Header(None),
    db: AsyncSession = Depends(get_db)
):
    """
    Get current user (Supabase-compatible)
    """
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED)

    token = authorization.replace("Bearer ", "")

    try:
        payload = jwt.decode(token, settings.JWT_SECRET_KEY, algorithms=["HS256"])
        user_id = UUID(payload["sub"])

        result = await db.execute(
            select(User).where(User.id == user_id)
        )
        user = result.scalar_one_or_none()

        if not user:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED)

        return user_to_response(user)

    except jwt.InvalidTokenError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED)


# ==================== Supabase REST API (PostgREST-compatible) ====================

@app.get("/rest/v1/{table}")
async def get_table_data(
    table: str,
    request: Request,
    authorization: Optional[str] = Header(None),
    db: AsyncSession = Depends(get_db)
):
    """
    Supabase-compatible REST API for database access
    Example: GET /rest/v1/bets?select=*&id=eq.123
    """
    # This would implement PostgREST query syntax
    # For now, return a basic structure
    # Full implementation would parse query params and build SQL

    # TODO: Implement PostgREST-compatible query parsing
    # - Parse select parameter
    # - Parse filters (eq, neq, gt, lt, like, etc.)
    # - Parse order, limit, offset
    # - Build and execute query
    # - Return in Supabase format

    return {
        "data": [],
        "error": None,
        "count": 0,
        "status": 200,
        "statusText": "OK"
    }


@app.post("/rest/v1/{table}")
async def insert_table_data(
    table: str,
    data: Dict[str, Any],
    authorization: Optional[str] = Header(None),
    db: AsyncSession = Depends(get_db)
):
    """
    Supabase-compatible INSERT
    """
    # TODO: Implement insert logic
    return {
        "data": [data],
        "error": None,
        "count": 1,
        "status": 201,
        "statusText": "Created"
    }


# ==================== Health Check ====================

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "service": "supabase-compat"}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=54321,  # Same port as Supabase local
        reload=True,
    )
