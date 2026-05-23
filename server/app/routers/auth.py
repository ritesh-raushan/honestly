from fastapi import APIRouter, Depends, HTTPException, status, Response, Request
from sqlalchemy.orm import Session
from typing import Annotated
import logging

from app.database import get_db
from app.models.model import User
from app.config import settings
from app.rate_limit import limiter

from app.schemas.user_schema import UserLogin, UserResponse, LoginResponse
from app.utils.auth import get_current_verified_user
from app.utils.password import verify_password
from app.utils.tokens import (
    create_access_token,
    create_refresh_token,
    verify_refresh_token
)

# Configure logging
logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/auth",
    tags=["Authentication"]
)

# Cookie settings derived from the environment so refresh tokens work over plain http on localhost while still requiring https in production.
_COOKIE_SECURE = settings.environment != "development"
_REFRESH_COOKIE_MAX_AGE = settings.refresh_token_expire_days * 24 * 60 * 60

@router.post("/login", response_model=LoginResponse)
@limiter.limit("10/minute")
async def login(request: Request, user_credentials: UserLogin, response: Response, db: Session = Depends(get_db)):
    identifier = user_credentials.identifier.lower()

    # Find user by email or username
    user = db.query(User).filter(
        (User.email == identifier) | (User.username == identifier)
    ).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Verify password
    if not verify_password(user_credentials.password, user.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Check if email is verified
    if not user.is_verified:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Please verify your email before logging in"
        )
    
    # Create access and refresh tokens
    access_token = create_access_token(data={"sub": user.email, "user_id": str(user.id)})
    refresh_token = create_refresh_token(data={"sub": user.email, "user_id": str(user.id)})

    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        secure=_COOKIE_SECURE,
        samesite="lax",
        max_age=_REFRESH_COOKIE_MAX_AGE
    )
    
    return LoginResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        token_type="bearer",
        user=UserResponse.model_validate(user)
    )

@router.post("/refresh", response_model=dict)
async def refresh_token(request: Request, response: Response, db: Session = Depends(get_db)):
    # Get refresh token from cookie
    refresh_token = request.cookies.get("refresh_token")
    
    if not refresh_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token not found",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Verify refresh token
    payload = verify_refresh_token(refresh_token)
    
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired refresh token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Extract user info from token
    user_id = payload.get("user_id")
    user_email = payload.get("sub")
    
    if not user_id or not user_email:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Verify user still exists and is verified
    user = db.query(User).filter(User.id == user_id).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if not user.is_verified:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User email not verified"
        )
    
    # Create new access token
    new_access_token = create_access_token(data={"sub": user.email, "user_id": str(user.id)})
    
    # Optionally create new refresh token (token rotation for better security)
    new_refresh_token = create_refresh_token(data={"sub": user.email, "user_id": str(user.id)})
    
    # Update refresh token cookie
    response.set_cookie(
        key="refresh_token",
        value=new_refresh_token,
        httponly=True,
        secure=_COOKIE_SECURE,
        samesite="lax",
        max_age=_REFRESH_COOKIE_MAX_AGE
    )
    
    logger.info(f"Token refreshed for user {user.username}")
    
    return {
        "access_token": new_access_token,
        "refresh_token": new_refresh_token,
        "token_type": "bearer"
    }

@router.post("/logout", response_model=dict)
async def logout(response: Response):
    """
    Logout user by clearing the refresh token cookie.
    """
    # Clear the refresh token cookie
    response.delete_cookie(
        key="refresh_token",
        httponly=True,
        secure=_COOKIE_SECURE,
        samesite="lax"
    )
    
    logger.info("User logged out successfully")
    
    return {
        "message": "Logged out successfully",
        "success": True
    }

@router.get("/me", response_model=UserResponse)
async def get_me(current_user: Annotated[User, Depends(get_current_verified_user)]):
    """
    Return the currently authenticated user.
    The frontend calls this on app boot to hydrate the user session.
    """
    return current_user