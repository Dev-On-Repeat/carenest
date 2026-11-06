import os
import shutil
import uuid
import json
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.models.user import User
from app.models.prescription import Prescription
from app.models.medicine import Medicine
from app.models.schedule import MedicationSchedule
from app.schemas.all_schemas import OCRResultOut, PrescriptionConfirm
from app.services.ocr_service import OCRService
from app.core.config import settings
from app.api.deps import get_current_user

router = APIRouter()

ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}

@router.post("/upload", response_model=OCRResultOut)
async def upload_and_process_prescription(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Validate extension
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid image type. Please upload a PNG, JPEG, or WebP prescription image."
        )

    # Save to uploads directory
    file_id = f"rx_{uuid.uuid4().hex[:12]}{ext}"
    file_path = os.path.join(settings.UPLOAD_DIR, file_id)

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # Generate public URL path
    public_url = f"/api/uploads/{file_id}"

    # Run OCR Service
    ocr_result = OCRService.extract_from_image(file_path, public_url)

    # Save prescription record
    rx_record = Prescription(
        user_id=current_user.id,
        image_path=public_url,
        ocr_raw_text=ocr_result.raw_text,
        extracted_data_json=json.dumps([m.dict() for m in ocr_result.medicines]),
        doctor_name=ocr_result.doctor_name,
        clinic_name=ocr_result.clinic_name,
        is_confirmed=False
    )
    db.add(rx_record)
    db.commit()
    db.refresh(rx_record)

    ocr_result.prescription_id = rx_record.id
    return ocr_result

@router.post("/confirm")
def confirm_prescription_medicines(
    payload: PrescriptionConfirm,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Takes user-verified medicine items extracted from the prescription
    and commits them to the user's active medication list.
    """
    if not payload.medicines:
        raise HTTPException(status_code=400, detail="No medicines selected to add.")

    added_medicines = []
    today_str = os.getenv("DEFAULT_START_DATE", "2026-01-01")

    for item in payload.medicines:
        med = Medicine(
            user_id=current_user.id,
            name=item.name,
            strength=item.strength or "500 mg",
            dosage=item.dosage,
            frequency=item.frequency,
            scheduled_times="08:00,20:00" if "twice" in item.frequency.lower() else "08:00",
            meal_timing=item.meal_timing,
            start_date=today_str,
            instructions=item.instructions or "Added from verified prescription scan",
            prescribing_doctor=payload.doctor_name,
            pill_shape="round",
            pill_color="teal",
            is_active=True
        )
        db.add(med)
        db.commit()
        db.refresh(med)

        # Create schedule
        times = [t.strip() for t in med.scheduled_times.split(",") if t.strip()]
        for t in times:
            sched = MedicationSchedule(
                medicine_id=med.id,
                user_id=current_user.id,
                time_of_day=t,
                days_of_week="mon,tue,wed,thu,fri,sat,sun",
                dose_quantity=med.dosage
            )
            db.add(sched)
        db.commit()
        added_medicines.append(med.id)

    return {
        "success": True,
        "message": f"Successfully confirmed and created {len(added_medicines)} medicines.",
        "medicine_ids": added_medicines
    }

