from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.services.demo_seeder import (
    DemoDataSeeder, DEMO_ELDERLY_EMAIL, DEMO_CAREGIVER_EMAIL, DEMO_PASSWORD
)

router = APIRouter()

@router.post("/seed")
def seed_demo_data(db: Session = Depends(get_db)):
    return DemoDataSeeder.seed_or_reset(db)

@router.get("/info")
def get_demo_info():
    return {
        "is_demo_mode_available": True,
        "sample_accounts": [
            {
                "role": "Elderly Patient",
                "name": "Ramakrishna Varma (Demo)",
                "email": DEMO_ELDERLY_EMAIL,
                "password": DEMO_PASSWORD,
                "caregiver_code": "RAMA-7890",
                "description": "72-year old user managing diabetes & blood pressure medications with voice and large-text display."
            },
            {
                "role": "Authorized Family Caregiver",
                "name": "Dr. Priya Varma (Demo)",
                "email": DEMO_CAREGIVER_EMAIL,
                "password": DEMO_PASSWORD,
                "description": "Remote daughter/caregiver monitoring Ramakrishna's adherence, dose schedules, and SOS alerts."
            }
        ],
        "demo_scenarios": [
            "Scenario 1: Elderly marks due morning Metformin as TAKEN with audio chime confirmation.",
            "Scenario 2: Prescription Scanner OCR extracts Tab Metformin & Telmisartan with review & confirmation.",
            "Scenario 3: Medicine Pill Identifier scans pill image with shape/color classification and disclaimers.",
            "Scenario 4: Ask CareNest AI responds in English & Telugu using user's real scheduled medications.",
            "Scenario 5: Caregiver logs in, views Ramakrishna's 100% adherence, schedule, and resolves SOS alerts.",
            "Scenario 6: Offline mode disconnects, records TAKEN in IndexedDB, and auto-syncs when online."
        ]
    }

