from typing import List, Optional
from datetime import datetime, timezone, timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.models.user import User
from app.models.medicine import Medicine
from app.models.schedule import MedicationSchedule
from app.models.event import MedicationEvent
from app.schemas.schedule import ScheduleCreate, ScheduleOut, DoseSlotOut
from app.api.deps import get_current_user

router = APIRouter()

@router.get("", response_model=List[ScheduleOut])
def list_schedules(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    schedules = db.query(MedicationSchedule).filter(
        MedicationSchedule.user_id == current_user.id
    ).all()
    # Attach medicine object
    for s in schedules:
        s.medicine = db.query(Medicine).filter(Medicine.id == s.medicine_id).first()
    return schedules

@router.get("/today", response_model=List[DoseSlotOut])
def get_today_schedule(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Returns today's computed medication slots with live status:
    'taken', 'snoozed', 'due', 'upcoming', 'missed'.
    """
    active_meds = db.query(Medicine).filter(
        Medicine.user_id == current_user.id,
        Medicine.is_active == True
    ).all()

    today_str = datetime.now().strftime("%Y-%m-%d")
    events_today = db.query(MedicationEvent).filter(
        MedicationEvent.user_id == current_user.id
    ).all()

    # Event map by (medicine_id, scheduled_time)
    event_map = {}
    for ev in events_today:
        event_map[(ev.medicine_id, ev.scheduled_time)] = ev

    now_hm = datetime.now().strftime("%H:%M")
    slots: List[DoseSlotOut] = []

    for med in active_meds:
        times = [t.strip() for t in med.scheduled_times.split(",") if t.strip()]
        for t in times:
            key = (med.id, t)
            recorded_event = event_map.get(key)

            if recorded_event:
                calc_status = recorded_event.status
                event_id = recorded_event.id
                action_time = recorded_event.action_time
            else:
                event_id = None
                action_time = None
                # Compare time string
                if t < now_hm:
                    # Past time today without taken event
                    calc_status = "due"
                else:
                    calc_status = "upcoming"

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
                status=calc_status,
                event_id=event_id,
                action_time=action_time
            ))

    slots.sort(key=lambda x: x.scheduled_time)
    return slots

@router.post("", response_model=ScheduleOut, status_code=status.HTTP_201_CREATED)
def create_schedule(
    sched_in: ScheduleCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    medicine = db.query(Medicine).filter(
        Medicine.id == sched_in.medicine_id,
        Medicine.user_id == current_user.id
    ).first()
    if not medicine:
        raise HTTPException(status_code=404, detail="Medicine not found.")

    sched = MedicationSchedule(
        medicine_id=sched_in.medicine_id,
        user_id=current_user.id,
        time_of_day=sched_in.time_of_day,
        days_of_week=sched_in.days_of_week,
        dose_quantity=sched_in.dose_quantity,
        is_active=sched_in.is_active
    )
    db.add(sched)
    db.commit()
    db.refresh(sched)
    sched.medicine = medicine
    return sched

@router.delete("/{schedule_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_schedule(
    schedule_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    sched = db.query(MedicationSchedule).filter(
        MedicationSchedule.id == schedule_id,
        MedicationSchedule.user_id == current_user.id
    ).first()
    if not sched:
        raise HTTPException(status_code=404, detail="Schedule not found.")
    db.delete(sched)
    db.commit()
    return None

