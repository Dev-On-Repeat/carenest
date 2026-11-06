from typing import List
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.models.user import User
from app.models.caregiver import CaregiverRelationship
from app.models.medicine import Medicine
from app.models.schedule import MedicationSchedule
from app.models.event import MedicationEvent
from app.models.sos import SOSEvent
from app.schemas.all_schemas import CaregiverLinkRequest, CaregiverElderlySummary, SOSOut
from app.schemas.schedule import DoseSlotOut, EventOut
from app.schemas.medicine import MedicineOut
from app.api.deps import get_current_user

router = APIRouter()

@router.post("/link")
def link_patient(
    payload: CaregiverLinkRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    code = payload.caregiver_code.strip().upper()
    elderly = db.query(User).filter(User.caregiver_code == code).first()
    if not elderly:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No elderly patient found with this Caregiver Code. Please check the code."
        )

    if elderly.id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You cannot link to your own account."
        )

    # Check existing relationship
    rel = db.query(CaregiverRelationship).filter(
        CaregiverRelationship.caregiver_id == current_user.id,
        CaregiverRelationship.elderly_id == elderly.id
    ).first()

    if rel:
        rel.status = "active"
        db.commit()
        return {"success": True, "message": f"Successfully linked to {elderly.full_name}."}

    new_rel = CaregiverRelationship(
        caregiver_id=current_user.id,
        elderly_id=elderly.id,
        status="active",
        permissions="manage"
    )
    db.add(new_rel)
    db.commit()

    return {"success": True, "message": f"Successfully linked to {elderly.full_name}."}

@router.get("/patients", response_model=List[CaregiverElderlySummary])
def list_linked_patients(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    rels = db.query(CaregiverRelationship).filter(
        CaregiverRelationship.caregiver_id == current_user.id,
        CaregiverRelationship.status == "active"
    ).all()

    summaries: List[CaregiverElderlySummary] = []
    today_str = datetime.now().strftime("%Y-%m-%d")

    for r in rels:
        p = db.query(User).filter(User.id == r.elderly_id).first()
        if not p:
            continue

        active_meds = db.query(Medicine).filter(Medicine.user_id == p.id, Medicine.is_active == True).all()
        events = db.query(MedicationEvent).filter(MedicationEvent.user_id == p.id).all()
        
        taken_count = sum(1 for e in events if e.status == "taken")
        missed_count = sum(1 for e in events if e.status == "missed")

        # Total expected doses
        total_doses = 0
        for m in active_meds:
            times = [t for t in m.scheduled_times.split(",") if t.strip()]
            total_doses += len(times)

        adherence = int((taken_count / max(1, total_doses)) * 100) if total_doses > 0 else 100

        # Last action
        latest_event = db.query(MedicationEvent).filter(
            MedicationEvent.user_id == p.id
        ).order_by(MedicationEvent.action_time.desc()).first()

        # Active SOS
        active_sos = db.query(SOSEvent).filter(
            SOSEvent.user_id == p.id,
            SOSEvent.status == "triggered"
        ).first() is not None

        summaries.append(CaregiverElderlySummary(
            elderly_id=p.id,
            full_name=p.full_name,
            email=p.email,
            emergency_contact=p.emergency_contact,
            emergency_phone=p.emergency_phone,
            active_medicines_count=len(active_meds),
            today_adherence_percent=min(100, adherence),
            missed_doses_today=missed_count,
            last_action=f"{latest_event.status.upper()} - {latest_event.scheduled_time}" if latest_event else "No activity yet today",
            last_action_time=latest_event.action_time if latest_event else None,
            sos_active=active_sos
        ))

    return summaries

@router.get("/patient/{elderly_id}/schedule", response_model=List[DoseSlotOut])
def get_patient_schedule(
    elderly_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Verify authorization
    rel = db.query(CaregiverRelationship).filter(
        CaregiverRelationship.caregiver_id == current_user.id,
        CaregiverRelationship.elderly_id == elderly_id,
        CaregiverRelationship.status == "active"
    ).first()
    if not rel:
        raise HTTPException(status_code=403, detail="Unauthorized: You are not a linked caregiver for this patient.")

    # Fetch today schedule
    active_meds = db.query(Medicine).filter(Medicine.user_id == elderly_id, Medicine.is_active == True).all()
    events_today = db.query(MedicationEvent).filter(MedicationEvent.user_id == elderly_id).all()
    event_map = {(ev.medicine_id, ev.scheduled_time): ev for ev in events_today}
    now_hm = datetime.now().strftime("%H:%M")
    slots: List[DoseSlotOut] = []

    for med in active_meds:
        for t in [t.strip() for t in med.scheduled_times.split(",") if t.strip()]:
            ev = event_map.get((med.id, t))
            status_val = ev.status if ev else ("due" if t < now_hm else "upcoming")
            slots.append(DoseSlotOut(
                medicine_id=med.id,
                medicine_name=med.name,
                strength=med.strength,
                dosage=med.dosage,
                scheduled_time=t,
                meal_timing=med.meal_timing,
                pill_shape=med.pill_shape or "round",
                pill_color=med.pill_color or "teal",
                instructions=med.instructions,
                status=status_val,
                event_id=ev.id if ev else None,
                action_time=ev.action_time if ev else None
            ))

    slots.sort(key=lambda x: x.scheduled_time)
    return slots

