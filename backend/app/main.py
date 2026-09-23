import os
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse

from app.config import settings
from app.database import db_manager
from app.utils.logger import logger
from app.routes import auth, reports, comparison, rag, research, health

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: connect to database & initialize directories
    logger.info("Initializing HealthForm AI Backend Service...")
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    await db_manager.connect()
    logger.info(f"HealthForm AI running in {'DEMO_MODE (Deterministic Grounded Engine)' if settings.DEMO_MODE else 'PRODUCTION AI MODE'}")
    yield
    # Shutdown
    logger.info("Shutting down HealthForm AI Backend Service...")
    await db_manager.close()

app = FastAPI(
    title="HealthForm AI API",
    version="1.0.0",
    description="""
# HealthForm AI: Multimodal LLM-Based System for Explainable and Grounded Laboratory Report Understanding

### Academic Research Prototype
HealthForm AI parses laboratory reports, extracts parameters, validates numerical boundaries, evaluates results strictly against report-printed reference ranges, retrieves contextual evidence via RAG, generates grounded explanations, and verifies generated claims.

**Strict Non-Diagnostic Policy**: HealthForm AI is designed for laboratory-report understanding and academic benchmarking. It **MUST NOT** diagnose diseases, prescribe medicines, or recommend treatments.
    """,
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Static file serving for uploads and samples if needed
if os.path.exists(settings.UPLOAD_DIR):
    app.mount("/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")
if os.path.exists(settings.SAMPLE_REPORTS_DIR):
    app.mount("/samples", StaticFiles(directory=settings.SAMPLE_REPORTS_DIR), name="samples")

# Include Routers
app.include_router(health.router)
app.include_router(auth.router)
app.include_router(reports.router)
app.include_router(comparison.router)
app.include_router(rag.router)
app.include_router(research.router)

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled error on {request.url.path}: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"detail": "An internal server error occurred during report processing."}
    )
