from pydantic_settings import BaseSettings
from typing import List, Optional
import os

class Settings(BaseSettings):
    PROJECT_NAME: str = "CareNest AI"
    API_V1_STR: str = "/api"
    SECRET_KEY: str = "carenest-production-jwt-secret-key-2026-high-security"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    
    # Database: defaults to SQLite (or /tmp/carenest.db in serverless),
    # or set DATABASE_URL to Supabase/PostgreSQL e.g. postgresql://user:pwd@db.supabase.co:5432/postgres
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL",
        "sqlite:////tmp/carenest.db" if os.getenv("VERCEL") else "sqlite:///./carenest.db"
    )
    
    # CORS
    BACKEND_CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://localhost:8000",
        "*"
    ]
    
    # Optional Cloud LLM API Keys (Gemini or OpenAI)
    GEMINI_API_KEY: Optional[str] = os.getenv("GEMINI_API_KEY", None)
    OPENAI_API_KEY: Optional[str] = os.getenv("OPENAI_API_KEY", None)
    
    # Upload storage directory (/tmp on serverless environments)
    UPLOAD_DIR: str = "/tmp/uploads" if os.getenv("VERCEL") else os.path.join(os.path.dirname(os.path.dirname(__file__)), "uploads")
    
    class Config:
        env_file = ".env"
        case_sensitive = True

settings = Settings()
try:
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
except OSError:
    settings.UPLOAD_DIR = "/tmp/uploads"
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)

