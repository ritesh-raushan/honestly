from fastapi import FastAPI
from .models import model
from .database import engine
from .routers import auth, feedback, user_management

model.Base.metadata.create_all(bind=engine)

app = FastAPI()

app.include_router(auth.router)
app.include_router(user_management.router)
app.include_router(feedback.router)

@app.get("/")
def root():
    return "Hello World"