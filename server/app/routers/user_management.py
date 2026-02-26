from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import Annotated
from passlib.context import CryptContext
import logging
from datetime import datetime, timezone

from app.database import get_db
from app.models.model import User

from app.schemas.user_schema import UserCreate, ResendVerification, ForgotPassword, ResetPassword, VerifyOTP
from app.utils.tokens import (
    generate_otp,
    is_otp_expired,
    create_password_reset_token,
    verify_password_reset_token
)
from app.utils.email_service import email_service

# Configure logging
logger = logging.getLogger(__name__)

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

router = APIRouter(
    prefix="/auth",
    tags=["User Management"]
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
    
    # Generate OTP
    otp = generate_otp()

    # Create new user
    new_user = User(
        username=user.username,
        email=user.email,
        password = pwd_context.hash(user.password),
        verification_otp = otp,
        otp_created_at = datetime.now(timezone.utc),
        otp_attempts = 0,
        is_verified=False,
        is_accepting_messages=True,
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    # Send the verification OTP email
    try:
        await email_service.send_verification_email(
            email=new_user.email,
            username=new_user.username,
            otp=otp
        )
    except Exception as e:
        # Log error but don't fail registration
        logger.error(f"Error sending verification email to {new_user.email}: {str(e)}", exc_info=True)
    
    return {
        "message": "User registered successfully. Please check your email for the verification code.",
        "username": new_user.username,
        "email": new_user.email
    }

@router.post("/verify-email", status_code=status.HTTP_200_OK, response_model=dict)
async def verify_email(request_data: VerifyOTP, db: Session = Depends(get_db)):
    # Find user by email
    user = db.query(User).filter(User.email == request_data.email).first()
    
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    
    if user.is_verified:
        return {"message": "Email already verified", "success": True}
    
    # Check if OTP exists
    if not user.verification_otp:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail="No verification code found. Please request a new one."
        )
    
    # Check if OTP is expired
    if is_otp_expired(user.otp_created_at):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Verification code has expired. Please request a new one."
        )
    
    # Check OTP attempts (max 5 attempts)
    if user.otp_attempts >= 5:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many failed attempts. Please request a new verification code."
        )
    
    # Verify OTP
    if user.verification_otp != request_data.otp:
        # Increment failed attempts
        user.otp_attempts += 1
        db.commit()
        
        remaining_attempts = 5 - user.otp_attempts
        if remaining_attempts > 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid verification code. {remaining_attempts} attempt(s) remaining."
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Too many failed attempts. Please request a new verification code."
            )
    
    # OTP is valid - verify user
    user.is_verified = True
    user.verification_otp = None
    user.otp_created_at = None
    user.otp_attempts = 0
    db.commit()

    # Send welcome email
    try:
        await email_service.send_welcome_email(
            email=user.email,
            username=user.username
        )
    except Exception as e:
        logger.error(f"Error sending welcome email to {user.email}: {str(e)}", exc_info=True)
    
    return {
        "message": "Email verified successfully",
        "success": True
    }

@router.post("/resend-verification", status_code=status.HTTP_200_OK, response_model=dict)
async def resend_verification_email(request_data: ResendVerification, db: Session = Depends(get_db)):
    # Find user by email
    user = db.query(User).filter(User.email == request_data.email).first()
    
    if not user:
        # Don't reveal if email exists or not for security
        return {
            "message": "If the email exists, a verification code has been sent.",
            "success": True
        }
    
    # Check if user is already verified
    if user.is_verified:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email is already verified"
        )
    
    # Generate new OTP
    new_otp = generate_otp()
    
    # Update user's OTP and reset attempts
    user.verification_otp = new_otp
    user.otp_created_at = datetime.now(timezone.utc)
    user.otp_attempts = 0
    db.commit()
    
    # Send verification email
    try:
        await email_service.send_verification_email(
            email=user.email,
            username=user.username,
            otp=new_otp
        )
        logger.info(f"Verification OTP resent to {user.email}")
    except Exception as e:
        logger.error(f"Error resending verification email to {user.email}: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to send verification email. Please try again later."
        )
    
    return {
        "message": "Verification code has been sent to your email. Please check your inbox.",
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
