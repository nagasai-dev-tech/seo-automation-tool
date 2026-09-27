import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.core.config import settings
from app.core.database import Base, engine
from app.services.scheduler_service import init_scheduler
from app.api import auth, brands, websites, keywords, rankings, jobs, analytics, alerts, reports, settings as settings_api, search


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Ensure tables exist
    Base.metadata.create_all(bind=engine)
    
    # Ensure upload directory exists
    reports_dir = os.path.join(os.getcwd(), "uploads", "reports")
    os.makedirs(reports_dir, exist_ok=True)
    
    # Start scheduler
    init_scheduler()
    
    yield


app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Production-grade automated SEO rank tracking platform for digital marketing enterprises.",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
    lifespan=lifespan
)

# CORS setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount API Routers
api_v1 = settings.API_V1_STR
app.include_router(auth.router, prefix=api_v1)
app.include_router(brands.router, prefix=api_v1)
app.include_router(websites.router, prefix=api_v1)
app.include_router(keywords.router, prefix=api_v1)
app.include_router(rankings.router, prefix=api_v1)
app.include_router(jobs.router, prefix=api_v1)
app.include_router(analytics.router, prefix=api_v1)
app.include_router(alerts.router, prefix=api_v1)
app.include_router(reports.router, prefix=api_v1)
app.include_router(settings_api.router, prefix=api_v1)
app.include_router(search.router, prefix=api_v1)


@app.get("/health", tags=["Health"])
@app.get("/api/health", tags=["Health"])
def health_check():
    return {
        "status": "healthy",
        "service": settings.PROJECT_NAME,
        "provider": settings.RANK_PROVIDER
    }
