import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.core.config import settings
from app.database.session import Base, engine, SessionLocal
from app.models import *  # Import all models for table creation
from app.services.demo_seeder import DemoDataSeeder
from app.models.user import User

from app.api.endpoints import (
    auth, medicines, schedules, events,
    prescriptions, identify, assistant,
    caregiver, sos, sync, hardware, demo
)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Ensure tables exist
    Base.metadata.create_all(bind=engine)
    
    # Auto-seed demo data if database is fresh
    db = SessionLocal()
    try:
        user_count = db.query(User).count()
        if user_count == 0:
            print("Fresh database detected — Auto-seeding CareNest demo data...")
            DemoDataSeeder.seed_or_reset(db)
    except Exception as e:
        print(f"Startup seeder notice: {e}")
    finally:
        db.close()
    
    yield
    # Shutdown logic if needed

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="CareNest AI — AI-Powered Smart Healthcare Companion for Medication Management, Reminders & Caregiver Monitoring",
    version="1.0.0",
    lifespan=lifespan
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Static file serving for uploads (prescriptions and pill images)
try:
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
except OSError:
    settings.UPLOAD_DIR = "/tmp/uploads"
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
app.mount("/api/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")

# Include Routers
app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(medicines.router, prefix="/api/medicines", tags=["Medicines"])
app.include_router(schedules.router, prefix="/api/schedules", tags=["Schedules"])
app.include_router(events.router, prefix="/api/events", tags=["Medication Events"])
app.include_router(prescriptions.router, prefix="/api/prescriptions", tags=["Prescription Scanner & OCR"])
app.include_router(identify.router, prefix="/api/identify", tags=["Medicine Identification"])
app.include_router(assistant.router, prefix="/api/assistant", tags=["Ask CareNest Assistant"])
app.include_router(caregiver.router, prefix="/api/caregiver", tags=["Caregiver Portal"])
app.include_router(sos.router, prefix="/api/sos", tags=["Emergency SOS"])
app.include_router(sync.router, prefix="/api/sync", tags=["Offline Synchronization"])
app.include_router(hardware.router, prefix="/api/hardware", tags=["Hardware Abstraction Layer"])
app.include_router(demo.router, prefix="/api/demo", tags=["Demo Mode"])

@app.get("/api/health", tags=["Health"])
def health_check():
    return {
        "status": "healthy",
        "service": settings.PROJECT_NAME,
        "database": "connected",
        "version": "1.0.0"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)

