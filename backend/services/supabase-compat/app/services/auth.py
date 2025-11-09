"""
Authentication Service
Business logic for authentication operations
"""
from datetime import datetime, timedelta
from typing import Optional
from uuid import UUID

import jwt
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.models.user import User, UserSession, LoginHistory
from app.services.password import PasswordService


class AuthService:
    """
    Authentication service with business logic
    """

    def __init__(self, db: AsyncSession):
        self.db = db
        self.settings = get_settings()
        self.password_service = PasswordService()

    async def create_user(
        self,
        email: str,
        password: str,
        full_name: Optional[str] = None,
        phone_number: Optional[str] = None,
    ) -> User:
        """
        Create a new user account

        Args:
            email: User email
            password: Plain text password (will be hashed)
            full_name: User's full name
            phone_number: User's phone number

        Returns:
            Created User object

        Raises:
            ValueError: If user already exists
        """
        # Check if user exists
        result = await self.db.execute(
            select(User).where(User.email == email)
        )
        existing_user = result.scalar_one_or_none()

        if existing_user:
            raise ValueError("User with this email already exists")

        # Hash password
        password_hash = self.password_service.hash_password(password)

        # Create user
        user = User(
            email=email,
            password_hash=password_hash,
            full_name=full_name,
            phone_number=phone_number,
            is_active=True,
            is_email_verified=False,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow(),
        )

        self.db.add(user)
        await self.db.commit()
        await self.db.refresh(user)

        return user

    async def authenticate_user(
        self,
        email: str,
        password: str,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None,
    ) -> Optional[User]:
        """
        Authenticate user with email and password

        Args:
            email: User email
            password: Plain text password
            ip_address: User's IP address
            user_agent: User's browser user agent

        Returns:
            User object if authentication successful, None otherwise
        """
        # Find user
        result = await self.db.execute(
            select(User).where(User.email == email)
        )
        user = result.scalar_one_or_none()

        # Log failed attempt if user not found
        if not user:
            await self._log_login_attempt(
                email=email,
                success=False,
                failure_reason="User not found",
                ip_address=ip_address,
                user_agent=user_agent,
            )
            return None

        # Check if account is locked
        if not user.can_login:
            await self._log_login_attempt(
                email=email,
                user_id=user.id,
                success=False,
                failure_reason="Account locked or suspended",
                ip_address=ip_address,
                user_agent=user_agent,
            )
            return None

        # Verify password
        if not self.password_service.verify_password(password, user.password_hash):
            # Increment failed attempts
            user.failed_login_attempts += 1
            if user.failed_login_attempts >= self.settings.MAX_LOGIN_ATTEMPTS:
                user.locked_until = datetime.utcnow() + timedelta(
                    minutes=self.settings.LOCKOUT_DURATION_MINUTES
                )

            await self.db.commit()

            await self._log_login_attempt(
                email=email,
                user_id=user.id,
                success=False,
                failure_reason="Invalid password",
                ip_address=ip_address,
                user_agent=user_agent,
            )
            return None

        # Successful login
        user.failed_login_attempts = 0
        user.last_login_at = datetime.utcnow()
        user.last_login_ip = ip_address
        await self.db.commit()

        await self._log_login_attempt(
            email=email,
            user_id=user.id,
            success=True,
            ip_address=ip_address,
            user_agent=user_agent,
        )

        return user

    async def create_session(
        self,
        user: User,
        device_id: Optional[str] = None,
        device_name: Optional[str] = None,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None,
    ) -> UserSession:
        """
        Create a new user session

        Args:
            user: User object
            device_id: Device identifier
            device_name: Device name
            ip_address: User's IP address
            user_agent: User's browser user agent

        Returns:
            Created UserSession object
        """
        # Generate refresh token
        refresh_token = self._generate_refresh_token(user)

        # Create session
        session = UserSession(
            user_id=user.id,
            refresh_token=refresh_token,
            device_id=device_id,
            device_name=device_name,
            ip_address=ip_address,
            user_agent=user_agent,
            expires_at=datetime.utcnow() + timedelta(days=self.settings.REFRESH_TOKEN_EXPIRE_DAYS),
            created_at=datetime.utcnow(),
        )

        self.db.add(session)
        await self.db.commit()
        await self.db.refresh(session)

        return session

    async def revoke_session(self, session_id: UUID) -> bool:
        """
        Revoke a user session

        Args:
            session_id: Session UUID

        Returns:
            True if session was revoked, False if not found
        """
        result = await self.db.execute(
            select(UserSession).where(UserSession.id == session_id)
        )
        session = result.scalar_one_or_none()

        if not session:
            return False

        session.is_active = False
        session.revoked_at = datetime.utcnow()
        await self.db.commit()

        return True

    def _generate_refresh_token(self, user: User) -> str:
        """Generate JWT refresh token"""
        now = datetime.utcnow()
        expires = now + timedelta(days=self.settings.REFRESH_TOKEN_EXPIRE_DAYS)

        payload = {
            "sub": str(user.id),
            "exp": int(expires.timestamp()),
            "iat": int(now.timestamp()),
            "type": "refresh",
        }

        return jwt.encode(payload, self.settings.JWT_SECRET_KEY, algorithm="HS256")

    async def _log_login_attempt(
        self,
        email: str,
        success: bool,
        user_id: Optional[UUID] = None,
        failure_reason: Optional[str] = None,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None,
    ):
        """Log login attempt for security monitoring"""
        log_entry = LoginHistory(
            user_id=user_id,
            email=email,
            success=success,
            failure_reason=failure_reason,
            ip_address=ip_address,
            user_agent=user_agent,
            attempted_at=datetime.utcnow(),
        )

        self.db.add(log_entry)
        await self.db.commit()
