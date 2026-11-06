from typing import List
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.models.user import User
from app.models.sos import SOSEvent
from app.models.caregiver import CaregiverRelationship
from app.schemas.all_schemas import SOSCreate, SOSOut
from app.services.hardware_service import HardwareAbstractionLayer
from app.api.deps import get_current_user

router = APIRouter()

@router.post("/trigger", response_model=SOSOut, status_code=status.HTTP_201_CREATED)
def trigger_sos(
    payload: SOSCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    sos = SOSEvent(
        user_id=current_user.id,
        timestamp=datetime.now(timezone.utc),
        status="triggered",
        location_lat=payload.latitude,
        location_lng=payload.longitude,
        notes=payload.notes or "Elderly user triggered emergency SOS assistance",
        external_notified=False
    )
    db.add(sos)
    db.commit()
    db.refresh(sos)

    # Trigger mock hardware indicator (LED Flashes Red, Buzzer sounds)
    HardwareAbstractionLayer.trigger_button_event("SOS")

    sos_out = SOSOut.model_validate(sos)
    sos_out.user_name = current_user.full_name
    return sos_out

@router.get("/events", response_model=List[SOSOut])
def get_sos_events(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role == "caregiver":
        # Get all linked elderly users
        linked_rels = db.query(CaregiverRelationship).filter(
            CaregiverRelationship.caregiver_id == current_user.id,
            CaregiverRelationship.status == "active"
        ).all()
        elderly_ids = [r.elderly_id for r in linked_rels]
        events = db.query(SOSEvent).filter(
            SOSEvent.user_id.in_(elderly_ids)
        ).order_by(SOSEvent.timestamp.desc()).all()
    else:
        events = db.query(SOSEvent).filter(
            SOSEvent.user_id == current_user.id
        ).order_by(SOSEvent.timestamp.desc()).all()

    results: List[SOSOut] = []
    for ev in events:
        usr = db.query(User).filter(User.id == ev.user_id).first()
        item = SOSOut.model_validate(ev)
        item.user_name = usr.full_name if usr else "Unknown"
        results.append(item)
    return results

@router.post("/{sos_id}/resolve")
def resolve_sos(
    sos_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    sos = db.query(SOSEvent).filter(SOSEvent.id == sos_id).first()
    if not sos:
        raise HTTPException(status_code=404, detail="SOS alert not found.")

    sos.status = "resolved"
    db.commit()

    # Reset hardware alert
    HardwareAbstractionLayer.set_led("GREEN_IDLE")

    return {"success": True, "message": "SOS alert marked as resolved."}
