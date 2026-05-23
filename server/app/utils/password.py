import bcrypt

# Bcrypt operates on the first 72 bytes of the input and rejects anything longer
# since bcrypt 4.1. The schemas enforce a 72-character cap on incoming passwords
# so this module never has to truncate or special-case long inputs.

def hash_password(password: str) -> str:
    """Hash a plaintext password with bcrypt and return the hash as a string."""
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")

def verify_password(password: str, hashed: str) -> bool:
    """Check a plaintext password against a stored bcrypt hash."""
    return bcrypt.checkpw(password.encode("utf-8"), hashed.encode("utf-8"))
