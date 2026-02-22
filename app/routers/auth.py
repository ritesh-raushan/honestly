from fastapi import APIRouter, Depends, HTTPException, status, Response, Query, Request
from sqlalchemy.orm import Session
from typing import Annotated
from passlib.context import CryptContext
import logging

from app.database import get_db
from app.models.model import User

from app.schemas.user_schema import UserCreate, UserLogin, UserResponse, LoginResponse, ResendVerification, ForgotPassword, ResetPassword
from app.utils.tokens import (
    create_verification_token, 
    verify_verification_token,
    create_access_token,
    create_refresh_token,
    verify_refresh_token,
    create_password_reset_token,
    verify_password_reset_token
)
from app.utils.email_service import email_service

# Configure logging
logger = logging.getLogger(__name__)

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

router = APIRouter(
    prefix="/auth",
    tags=["Authentication"]
)

@router.get("/check-username", response_model=dict)
async def check_username_availability(username: str = Query(..., min_length=3, max_length=20), db: Session = Depends(get_db)):
    # Check if username exists (case-insensitive)
    existing_user = db.query(User).filter(User.username.ilike(username)).first()
    
    if existing_user:
        return {
            "available": False,
            "message": "Username is already taken"
        }
    
    return {
        "available": True,
        "message": "Username is available"
    }

@router.get("/check-email", response_model=dict)
async def check_email_availability(email: str = Query(..., description="Email to check"), db: Session = Depends(get_db)):
    # Check if email exists (case-insensitive)
    existing_user = db.query(User).filter(User.email.ilike(email)).first()
    
    if existing_user:
        return {
            "available": False,
            "message": "Email is already registered"
        }
    
    return {
        "available": True,
        "message": "Email is available"
    }

@router.post("/register", status_code=status.HTTP_201_CREATED, response_model=dict)
async def signup(user: UserCreate, db: Session = Depends(get_db)):
    # Check if username or email already exixts
    existing_user = db.query(User).filter((User.username == user.username) | (User.email == user.email)).first()
    if existing_user:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Username or email already exists")
    
    verification_token = create_verification_token(user.email)

    # Create new user
    new_user = User(
        username=user.username,
        email=user.email,
        password = pwd_context.hash(user.password),
        verification_token = verification_token,
        is_verified=False,
        is_accepting_messages=True,
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    # Send the VErfification Mail
    try:
        await email_service.send_verification_email(
            email=new_user.email,
            username=new_user.username,
            verification_token=verification_token
        )
    except Exception as e:
        # Log error but don't fail registration
        logger.error(f"Error sending verification email to {new_user.email}: {str(e)}", exc_info=True)
    
    return {
        "message": "User registered successfully. Please check your email to verify your account.",
        "username": new_user.username,
        "email": new_user.email
    }

@router.get("/verify-email", status_code=status.HTTP_200_OK, response_model=dict)
async def verify_email(token: str, db: Session = Depends(get_db)):
    email = verify_verification_token(token)
    if not email:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid or expired verification token")
    
    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    if user.is_verified:
        return {"message": "Email already verified"}
    
    # Validate token matches the one stored in database
    if user.verification_token != token:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid verification token")
    
    # Update user
    user.is_verified = True
    user.verification_token = None
    db.commit()

    # Send welcome email
    try:
        await email_service.send_welcome_email(
            email=user.email,
            username=user.username
        )
    except Exception as e:
        logger.error(f"Error sending welcome email to {user.email}: {str(e)}", exc_info=True)
    
    return {"message": "Email verified successfully"}

@router.post("/resend-verification", status_code=status.HTTP_200_OK, response_model=dict)
async def resend_verification_email(request_data: ResendVerification, db: Session = Depends(get_db)):
    # Find user by email
    user = db.query(User).filter(User.email == request_data.email).first()
    
    if not user:
        # Security: Don't reveal if email exists or not
        return {
            "message": "If the email exists and is not verified, a verification email has been sent.",
            "success": True
        }
    
    # Check if user is already verified
    if user.is_verified:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email is already verified"
        )
    
    # Generate new verification token
    new_verification_token = create_verification_token(user.email)
    
    # Update user's verification token
    user.verification_token = new_verification_token
    db.commit()
    
    # Send verification email
    try:
        await email_service.send_verification_email(
            email=user.email,
            username=user.username,
            verification_token=new_verification_token
        )
        logger.info(f"Verification email resent to {user.email}")
    except Exception as e:
        logger.error(f"Error resending verification email to {user.email}: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to send verification email. Please try again later."
        )
    
    return {
        "message": "Verification email has been sent. Please check your inbox.",
        "success": True
    }

@router.post("/login", response_model=LoginResponse)
async def login(user_credentials: UserLogin, response: Response, db: Session = Depends(get_db)):
    # Find user by email or username
    user = db.query(User).filter(
        (User.email == user_credentials.identifier) | (User.username == user_credentials.identifier)
    ).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Verify password
    if not pwd_context.verify(user_credentials.password, user.password):
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
        secure=True,
        samesite="lax",
        max_age=7 * 24 * 60 * 60  # 7 days
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
        secure=True,
        samesite="lax",
        max_age=7 * 24 * 60 * 60  # 7 days
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
        secure=True,
        samesite="lax"
    )
    
    logger.info("User logged out successfully")
    
    return {
        "message": "Logged out successfully",
        "success": True
    }

@router.post("/forgot-password", status_code=status.HTTP_200_OK, response_model=dict)
async def forgot_password(request_data: ForgotPassword, db: Session = Depends(get_db)):
    # Find user by email
    user = db.query(User).filter(User.email == request_data.email).first()
    
    if not user:
        logger.warning(f"Password reset requested for non-existent email: {request_data.email}")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Email address is not registered"
        )
    
    # Generate password reset token
    reset_token = create_password_reset_token(user.email)    
    # Store token in database (overwrites any previous token)
    user.password_reset_token = reset_token
    db.commit()    
    # Send password reset email
    try:
        await email_service.send_password_reset_email(
            email=user.email,
            username=user.username,
            reset_token=reset_token
        )
        logger.info(f"Password reset email sent to {user.email}")
    except Exception as e:
        logger.error(f"Error sending password reset email to {user.email}: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to send password reset email. Please try again later."
        )
    
    return {
        "message": "Password reset link has been sent to your email address.",
        "success": True
    }

@router.post("/reset-password", status_code=status.HTTP_200_OK, response_model=dict)
async def reset_password(request_data: ResetPassword, db: Session = Depends(get_db)):
    # Verify reset token
    email = verify_password_reset_token(request_data.token)
    
    if not email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired password reset token"
        )
    
    # Find user by email
    user = db.query(User).filter(User.email == email).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Validate token matches the one stored in database
    if user.password_reset_token != request_data.token:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired password reset token"
        )
    
    # Hash new password and update
    user.password = pwd_context.hash(request_data.new_password)
    # Clear the password reset token
    user.password_reset_token = None
    db.commit()
    
    logger.info(f"Password reset successful for user {user.username}")
    
    return {
        "message": "Password has been reset successfully. You can now login with your new password.",
        "success": True
    }