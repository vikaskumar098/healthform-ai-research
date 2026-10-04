import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    APP_NAME: str = "HealthForm AI"
    APP_VERSION: str = "2.0.0"
    DEBUG: bool = True
    
    # MongoDB
    MONGODB_URI: str = os.getenv("MONGODB_URI", "mongodb://localhost:27017")
    DATABASE_NAME: str = os.getenv("DATABASE_NAME", "healthform_ai")
    
    # JWT Authentication
    SECRET_KEY: str = os.getenv("SECRET_KEY", "healthform-ai-research-secret-token-key-2026")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours
    
    # AI / Provider Settings
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "")
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    GEMINI_MODEL: str = os.getenv("GEMINI_MODEL", "gemini-flash-latest")
    
    # Demo Mode: if API keys are absent, default to deterministic research mock engine
    DEMO_MODE: bool = os.getenv("DEMO_MODE", "true").lower() in ("true", "1", "yes")
    
    # Paths
    BASE_DIR: str = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    UPLOAD_DIR: str = os.path.join(BASE_DIR, "uploads")
    KNOWLEDGE_BASE_DIR: str = os.path.abspath(os.path.join(BASE_DIR, "..", "knowledge_base", "sample_documents"))
    SAMPLE_REPORTS_DIR: str = os.path.abspath(os.path.join(BASE_DIR, "..", "sample_reports"))

    class Config:
        env_file = ".env"
        extra = "ignore"

settings = Settings()

# Automatically manage demo mode based on API key availability
# If Gemini key is present, force production mode regardless of .env DEMO_MODE
if settings.GEMINI_API_KEY:
    settings.DEMO_MODE = False
elif not settings.OPENAI_API_KEY:
    settings.DEMO_MODE = True

