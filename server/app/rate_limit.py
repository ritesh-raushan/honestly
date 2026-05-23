from slowapi import Limiter
from slowapi.util import get_remote_address

# Shared rate limiter keyed by client IP. Routers import this and decorate
# specific endpoints. The limiter itself is registered on the FastAPI app in
# app.py so the limit-exceeded responses are handled globally.
limiter = Limiter(key_func=get_remote_address)
