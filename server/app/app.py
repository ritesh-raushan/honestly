from fastapi import FastAPI, Depends, HTTPException, status
from sqlalchemy import text
from sqlalchemy.orm import Session

from .models import model
from .database import engine, get_db
from .routers import auth, feedback, user_management

model.Base.metadata.create_all(bind=engine)

app = FastAPI()

app.include_router(auth.router)
app.include_router(user_management.router)
app.include_router(feedback.router)

@app.get("/")
def root():
    return "Hello World"

@app.get("/health")
def health(db: Session = Depends(get_db)):
    """
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
