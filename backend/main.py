from contextlib import asynccontextmanager
from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address

from backend.db import open_pool, close_pool
from backend.routers import heartbeat, hours, students, assess, assessments, shifts

limiter = Limiter(key_func=get_remote_address)

@asynccontextmanager
async def lifespan(app: FastAPI):
    await open_pool()
    yield
    await close_pool()

app = FastAPI(title="Runtime API", lifespan=lifespan)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.include_router(heartbeat.router)
app.include_router(hours.router)
app.include_router(students.router)
app.include_router(assess.router)
app.include_router(assessments.router)
app.include_router(shifts.router)

@app.get("/health")
async def health():
    return {"status": "ok"}
