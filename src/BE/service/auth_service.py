from datetime import timedelta
from typing import Optional
from fastapi import Depends
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from src.BE.constant.config import settings
from src.BE.db.connect import get_db
from src.BE.db.models import User
from src.BE.exceptions.custom_exceptions import (
    ConflictException,
    NotFoundException,
    UnauthorizedException,
)
from src.BE.schemas.user_schema import UserCreate, UserLogin
from src.BE.utils.security import (
    create_access_token,
    decode_access_token,
    get_password_hash,
    verify_password,
)

security = HTTPBearer(auto_error=False)


class AuthService:
    @staticmethod
    def register_user(db: Session, user_in: UserCreate) -> User:
        existing_user = db.query(User).filter(User.email == user_in.email.lower()).first()
        if existing_user:
            raise ConflictException(detail="An account with this email already exists")

        user = User(
            full_name=user_in.full_name.strip(),
            email=user_in.email.lower(),
            hashed_password=get_password_hash(user_in.password),
            is_active=True,
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        return user

    @staticmethod
    def authenticate_user(db: Session, credentials: UserLogin) -> tuple[User, str]:
        user = db.query(User).filter(User.email == credentials.email.lower()).first()
        if not user or not verify_password(credentials.password, user.hashed_password):
            raise UnauthorizedException(detail="Incorrect email or password")

        if not user.is_active:
            raise UnauthorizedException(detail="Account is inactive")

        # Remember me extends token life to 30 days
        expires_delta = timedelta(days=30) if credentials.remember_me else None
        token = create_access_token(data={"sub": user.id, "email": user.email}, expires_delta=expires_delta)
        return user, token

    @staticmethod
    def get_user_by_id(db: Session, user_id: str) -> User:
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise NotFoundException(detail="User not found")
        return user


def get_current_user(
    auth: Optional[HTTPAuthorizationCredentials] = Depends(security),
    db: Session = Depends(get_db),
) -> User:
    if not auth or not auth.credentials:
        raise UnauthorizedException(detail="Missing authorization token")

    payload = decode_access_token(auth.credentials)
    if not payload or "sub" not in payload:
        raise UnauthorizedException(detail="Invalid or expired authorization token")

    user_id = payload["sub"]
    user = db.query(User).filter(User.id == user_id).first()
    if not user or not user.is_active:
        raise UnauthorizedException(detail="User account not found or inactive")

    return user
