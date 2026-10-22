from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from src.BE.constant.config import settings
from src.BE.db.init_db import init_db
from src.BE.exceptions.custom_exceptions import AppException
from src.BE.resource.auth import router as auth_router
from src.BE.resource.task import router as task_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Initialize database schema & seed demo data if needed
    try:
        init_db()
        print("[DigitalSelf Backend] Database initialized successfully.")
    except Exception as e:
        print(f"[DigitalSelf Backend] DB initialization note: {e}")
    yield
    # Shutdown logic if any
    pass


app = FastAPI(
    title="DigitalSelf API",
    description="High-performance backend for DigitalSelf Task Assistant",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS Middleware
allowed_origins = [
    settings.FRONTEND_URL,
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global Exception Handlers
@app.exception_handler(AppException)
async def app_exception_handler(request: Request, exc: AppException):
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail},
    )


@app.exception_handler(Exception)
async def generic_exception_handler(request: Request, exc: Exception):
    print(f"[Unhandled Error] {request.method} {request.url}: {exc}")
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "An internal server error occurred"},
    )


# Register Routers
app.include_router(auth_router)
app.include_router(task_router)


@app.get("/", tags=["Health"])
def root():
    return {
        "app": "DigitalSelf API",
        "version": "1.0.0",
        "status": "online",
        "docs": "/docs",
    }


@app.get("/api/health", tags=["Health"])
def health_check():
    return {"status": "healthy", "database": "postgresql"}
