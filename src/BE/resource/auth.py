from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from src.BE.db.connect import get_db
from src.BE.db.models import User
from src.BE.schemas.user_schema import (
    TokenResponse,
    UserCreate,
    UserLogin,
    UserResponse,
)
from src.BE.service.auth_service import AuthService, get_current_user
from src.BE.utils.security import create_access_token

router = APIRouter(prefix="/api/auth", tags=["Authentication"])


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
def register(user_in: UserCreate, db: Session = Depends(get_db)):
    """Register a new user account."""
    user = AuthService.register_user(db, user_in)
    token = create_access_token(data={"sub": user.id, "email": user.email})
    return TokenResponse(
        access_token=token,
        token_type="bearer",
        user=UserResponse.model_validate(user),
    )


@router.post("/login", response_model=TokenResponse)
def login(credentials: UserLogin, db: Session = Depends(get_db)):
    """Authenticate user with email and password."""
    user, token = AuthService.authenticate_user(db, credentials)
    return TokenResponse(
        access_token=token,
        token_type="bearer",
        user=UserResponse.model_validate(user),
    )


@router.get("/me", response_model=UserResponse)
def get_current_user_profile(current_user: User = Depends(get_current_user)):
    """Retrieve profile of currently authenticated user."""
    return UserResponse.model_validate(current_user)
