from pydantic import BaseModel, EmailStr, Field, ConfigDict
from datetime import datetime
from typing import Optional
import uuid

class UserCreate(BaseModel):
    username: str = Field(..., min_length=3, max_length=20, pattern=r'^[a-zA-Z0-9_]+$', description="Username must contain 3-20 alphanumeric characters or underscores")
    email: EmailStr = Field(..., description="Valid email address")
    password: str = Field(..., min_length=6, description="Password must be at least 6 characters long")

class UserLogin(BaseModel):
    identifier: str = Field(..., description="Email or Username")
    password: str = Field(..., min_length=6, description="Password")

class ResendVerification(BaseModel):
    email: EmailStr = Field(..., description="Email address to resend verification")

class VerifyOTP(BaseModel):
    email: EmailStr = Field(..., description="Email address to verify")
    otp: str = Field(..., min_length=6, max_length=6, pattern=r'^\d{6}$', description="6-digit OTP code")

class ForgotPassword(BaseModel):
    email: EmailStr = Field(..., description="Email address to send password reset code")

class VerifyResetOTP(BaseModel):
    email: EmailStr = Field(..., description="Email address")
    otp: str = Field(..., min_length=6, max_length=6, pattern=r'^\d{6}$', description="6-digit OTP code")

class ResetPassword(BaseModel):
    email: EmailStr = Field(..., description="Email address")
    new_password: str = Field(..., min_length=6, description="New password must be at least 6 characters long")

class UserResponse(BaseModel):
    """Schema for user response."""
    id: uuid.UUID
    username: str
    email: EmailStr
    is_verified: bool
    is_accepting_messages: bool
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)

class LoginResponse(BaseModel):
    """Schema for login response."""
    access_token: str
    refresh_token: str
    token_type: str
    user: UserResponse