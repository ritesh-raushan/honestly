from fastapi import FastAPI, Depends, HTTPException, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy import text
from sqlalchemy.orm import Session
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware
import logging

from .config import settings
from .logging_config import configure_logging
from .models import model
from .database import engine, get_db
from .rate_limit import limiter
from .routers import auth, feedback, user_management

configure_logging(settings.environment)
logger = logging.getLogger(__name__)

model.Base.metadata.create_all(bind=engine)

app = FastAPI()

# Register slowapi
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
app.add_middleware(SlowAPIMiddleware)

# Allow comma-separated origins in FRONTEND_URL
allowed_origins = [origin.strip() for origin in settings.frontend_url.split(",") if origin.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(user_management.router)
app.include_router(feedback.router)

@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    """
    Catch-all for unhandled exceptions so the client never sees a stack trace.
    HTTPExceptions are handled separately by Starlette and bypass this handler.
    """
    logger.exception(f"Unhandled exception on {request.method} {request.url.path}")
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "Internal server error"}
    )

@app.get("/")
def root():
    return "Hello World"

@app.get("/health")
def health(db: Session = Depends(get_db)):
    """
    Liveness + readiness probe.
    Returns ok only if the database is reachable.
    """
    try:
        db.execute(text("SELECT 1"))
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database unavailable"
        )
    return {"status": "ok"}
