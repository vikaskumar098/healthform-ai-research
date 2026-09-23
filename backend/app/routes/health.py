import os
from fastapi import APIRouter
from app.config import settings
from app.database import db_manager
from app.services.rag_service import rag_service

router = APIRouter(tags=["Health"])

@router.get("/api/health")
async def health_check():
    return {
        "status": "healthy",
        "app_name": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "demo_mode": settings.DEMO_MODE,
        "database_connected": db_manager.is_connected,
        "storage_mode": "mongodb" if db_manager.is_connected else "in_memory_resilient_store",
        "knowledge_chunks_indexed": len(rag_service.chunks),
        "ai_provider": "gemini" if settings.GEMINI_API_KEY else ("openai" if settings.OPENAI_API_KEY else "deterministic_research_engine")
    }
