from typing import List, Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.models.user import User
from app.models.medicine import Medicine
from app.models.event import MedicationEvent
from app.schemas.schedule import EventCreate, EventOut
from app.schemas.medicine import MedicineOut
from app.api.deps import get_current_user

router = APIRouter()

@router.post("/taken", response_model=EventOut, status_code=status.HTTP_201_CREATED)
def record_taken(
    ev_in: EventCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    medicine = db.query(Medicine).filter(
        Medicine.id == ev_in.medicine_id,
        Medicine.user_id == current_user.id
    ).first()
    if not medicine:
        raise HTTPException(status_code=404, detail="Medicine not found.")

    # Check if existing event for this dose exists today, update or create
    existing = db.query(MedicationEvent).filter(
        MedicationEvent.user_id == current_user.id,
        MedicationEvent.medicine_id == ev_in.medicine_id,
        MedicationEvent.scheduled_time == ev_in.scheduled_time
    ).first()

    now = datetime.now(timezone.utc)
    if existing:
        existing.status = "taken"
        existing.action_time = now
        existing.notes = ev_in.notes or existing.notes
        existing.device_source = ev_in.device_source
        db.commit()
        db.refresh(existing)
        existing.medicine = MedicineOut.model_validate(medicine)
        return existing

    event = MedicationEvent(
        medicine_id=ev_in.medicine_id,
        user_id=current_user.id,
        scheduled_time=ev_in.scheduled_time,
        action_time=now,
        status="taken",
        notes=ev_in.notes,
        device_source=ev_in.device_source
    )
    db.add(event)
    db.commit()
    db.refresh(event)
    event.medicine = MedicineOut.model_validate(medicine)
    return event

@router.post("/snooze", response_model=EventOut)
def record_snooze(
    ev_in: EventCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    medicine = db.query(Medicine).filter(
        Medicine.id == ev_in.medicine_id,
        Medicine.user_id == current_user.id
    ).first()
    if not medicine:
        raise HTTPException(status_code=404, detail="Medicine not found.")

    existing = db.query(MedicationEvent).filter(
        MedicationEvent.user_id == current_user.id,
        MedicationEvent.medicine_id == ev_in.medicine_id,
        MedicationEvent.scheduled_time == ev_in.scheduled_time
    ).first()

    now = datetime.now(timezone.utc)
    if existing:
        existing.status = "snoozed"
        existing.action_time = now
        existing.notes = ev_in.notes or "Snoozed for 15 minutes"
        db.commit()
        db.refresh(existing)
        existing.medicine = MedicineOut.model_validate(medicine)
        return existing

    event = MedicationEvent(
        medicine_id=ev_in.medicine_id,
        user_id=current_user.id,
        scheduled_time=ev_in.scheduled_time,
        action_time=now,
        status="snoozed",
        notes=ev_in.notes or "Snoozed for 15 minutes",
        device_source=ev_in.device_source
    )
    db.add(event)
    db.commit()
    db.refresh(event)
    event.medicine = MedicineOut.model_validate(medicine)
    return event

@router.get("/history", response_model=List[EventOut])
def get_medication_history(
    status_filter: Optional[str] = Query(None, alias="status"),
    medicine_id: Optional[int] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(MedicationEvent).filter(MedicationEvent.user_id == current_user.id)
    if status_filter:
        query = query.filter(MedicationEvent.status == status_filter)
    if medicine_id:
        query = query.filter(MedicationEvent.medicine_id == medicine_id)

    events = query.order_by(MedicationEvent.action_time.desc()).limit(100).all()
    for ev in events:
        med = db.query(Medicine).filter(Medicine.id == ev.medicine_id).first()
        if med:
            ev.medicine = MedicineOut.model_validate(med)
    return events
