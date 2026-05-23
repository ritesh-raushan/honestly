from datetime import datetime, timedelta, timezone
from typing import Optional, Dict, Any
from jose import JWTError, jwt
import secrets
import string
from app.config import settings

# OTP Functions
def generate_otp(length: int = 6) -> str:
    # Use secrets (CSPRNG) instead of random so OTPs cannot be predicted from a seed
    return ''.join(secrets.choice(string.digits) for _ in range(length))

def is_otp_expired(otp_created_at: datetime) -> bool:
    if not otp_created_at:
        return True
    expiry_time = otp_created_at + timedelta(hours=settings.verification_token_expire_hours)
    return datetime.now(timezone.utc) > expiry_time

def create_verification_token(email: str) -> str:
    expire = datetime.now(timezone.utc) + timedelta(hours=settings.verification_token_expire_hours)
    to_encode = {"sub": email, "exp": expire, "type": "verification"}
    token = jwt.encode(to_encode, settings.secret_key, algorithm=settings.algorithm)
    return token

def verify_verification_token(token: str) -> Optional[str]:
    try:
        payload = jwt.decode(token, settings.secret_key, algorithms=[settings.algorithm])
        if payload.get("type") != "verification":
            return None
        email: str = payload.get("sub")
        return email
    except JWTError:
        return None

def create_access_token(data: dict, expiry_time: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    
    if expiry_time:
        expire = datetime.now(timezone.utc) + expiry_time
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=settings.access_token_expire_minutes)
    
    to_encode.update({"exp": expire, "type": "access"})
    encoded_jwt = jwt.encode(to_encode, settings.secret_key, algorithm=settings.algorithm)
    return encoded_jwt

def create_refresh_token(data: dict, expiry_time: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    
    if expiry_time:
        expire = datetime.now(timezone.utc) + expiry_time
    else:
        expire = datetime.now(timezone.utc) + timedelta(days=settings.refresh_token_expire_days)
    
    to_encode.update({"exp": expire, "type": "refresh"})
    encoded_jwt = jwt.encode(to_encode, settings.refresh_token_secret_key, algorithm=settings.algorithm)
    return encoded_jwt

def verify_refresh_token(token: str) -> Optional[Dict[str, Any]]:
    """
    Verify and decode refresh token.
    Returns payload dict if valid, None if invalid/expired.
    """
    try:
        payload = jwt.decode(token, settings.refresh_token_secret_key, algorithms=[settings.algorithm])
        if payload.get("type") != "refresh":
            return None
        return payload
    except JWTError:
        return None

def create_password_reset_token(email: str) -> str:
    expire = datetime.now(timezone.utc) + timedelta(hours=settings.password_reset_token_expire_hours)
    to_encode = {"sub": email, "exp": expire, "type": "password_reset"}
    token = jwt.encode(to_encode, settings.secret_key, algorithm=settings.algorithm)
    return token

def verify_password_reset_token(token: str) -> Optional[str]:
    try:
        payload = jwt.decode(token, settings.secret_key, algorithms=[settings.algorithm])
        if payload.get("type") != "password_reset":
            return None
        email: str = payload.get("sub")
        return email
    except JWTError:
        return None