from contextlib import asynccontextmanager
from pathlib import Path
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles

from src.BE.constant.config import settings
from src.BE.db.init_db import init_db
from src.BE.exceptions.custom_exceptions import AppException
from src.BE.resource.auth import router as auth_router
from src.BE.resource.task import router as task_router

# Path to the frontend build artifacts
FRONTEND_DIST_DIR = Path(__file__).resolve().parent.parent / "fe-react" / "dist"
ASSETS_DIR = FRONTEND_DIST_DIR / "assets"


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

# CORS Middleware (supports port 8000 same-origin as well as optional dev servers)
allowed_origins = [
    settings.FRONTEND_URL,
    "http://localhost:8000",
    "http://127.0.0.1:8000",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
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


# Register API Routers
app.include_router(auth_router)
app.include_router(task_router)


# Mount static frontend assets if built
if ASSETS_DIR.exists():
    app.mount("/assets", StaticFiles(directory=str(ASSETS_DIR)), name="assets")


@app.get("/api", tags=["Health"])
def api_info():
    """API metadata and status."""
    return {
        "app": "DigitalSelf API",
        "version": "1.0.0",
        "status": "online",
        "docs": "/docs",
    }


@app.get("/api/health", tags=["Health"])
def health_check():
    """Health check endpoint."""
    return {"status": "healthy", "database": "postgresql"}


# Catch-all Route for Single Page Application (SPA) on port 8000
@app.get("/{full_path:path}", include_in_schema=False)
async def serve_spa_frontend(full_path: str):
    # Do not intercept API or documentation routes
    if full_path.startswith("api/") or full_path in ("docs", "redoc", "openapi.json"):
        return JSONResponse(
            status_code=status.HTTP_404_NOT_FOUND,
            content={"detail": "Endpoint not found"},
        )

    # If a specific static file in dist was requested (e.g. favicon, robots.txt)
    target_file = FRONTEND_DIST_DIR / full_path
    if full_path and target_file.is_file():
        return FileResponse(target_file)

    # Otherwise return index.html for client-side routing (/, /login, /signup, etc.)
    index_file = FRONTEND_DIST_DIR / "index.html"
    if index_file.is_file():
        return FileResponse(index_file)

    return JSONResponse(
        status_code=status.HTTP_404_NOT_FOUND,
        content={
            "detail": "Frontend dist is not built yet. Run 'npm run build' inside src/fe-react."
        },
    )
