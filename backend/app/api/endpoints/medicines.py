from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.models.user import User
from app.models.medicine import Medicine
from app.models.schedule import MedicationSchedule
from app.schemas.medicine import MedicineCreate, MedicineUpdate, MedicineOut
from app.api.deps import get_current_user

router = APIRouter()

@router.get("", response_model=List[MedicineOut])
def list_medicines(
    search: Optional[str] = None,
    active_only: bool = True,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(Medicine).filter(Medicine.user_id == current_user.id)
    if active_only:
        query = query.filter(Medicine.is_active == True)
    if search:
        query = query.filter(Medicine.name.ilike(f"%{search}%"))
    return query.order_by(Medicine.name.asc()).all()

@router.post("", response_model=MedicineOut, status_code=status.HTTP_201_CREATED)
def create_medicine(
    med_in: MedicineCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    medicine = Medicine(
        user_id=current_user.id,
        name=med_in.name.strip(),
        strength=med_in.strength,
        dosage=med_in.dosage,
        frequency=med_in.frequency,
        scheduled_times=med_in.scheduled_times,
        meal_timing=med_in.meal_timing,
        start_date=med_in.start_date,
        end_date=med_in.end_date,
        instructions=med_in.instructions,
        prescribing_doctor=med_in.prescribing_doctor,
        pill_shape=med_in.pill_shape or "round",
        pill_color=med_in.pill_color or "teal",
        image_url=med_in.image_url,
        is_active=med_in.is_active
    )
    db.add(medicine)
    db.commit()
    db.refresh(medicine)

    # Automatically generate default MedicationSchedule entries for the scheduled times
    times = [t.strip() for t in med_in.scheduled_times.split(",") if t.strip()]
    for t in times:
        sched = MedicationSchedule(
            medicine_id=medicine.id,
            user_id=current_user.id,
            time_of_day=t,
            days_of_week="mon,tue,wed,thu,fri,sat,sun",
            dose_quantity=med_in.dosage
        )
        db.add(sched)
    db.commit()

    return medicine

@router.get("/{medicine_id}", response_model=MedicineOut)
def get_medicine(
    medicine_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    medicine = db.query(Medicine).filter(
        Medicine.id == medicine_id,
        Medicine.user_id == current_user.id
    ).first()
    if not medicine:
        raise HTTPException(status_code=404, detail="Medicine not found.")
    return medicine

@router.put("/{medicine_id}", response_model=MedicineOut)
def update_medicine(
    medicine_id: int,
    med_update: MedicineUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    medicine = db.query(Medicine).filter(
        Medicine.id == medicine_id,
        Medicine.user_id == current_user.id
    ).first()
    if not medicine:
        raise HTTPException(status_code=404, detail="Medicine not found.")

    update_data = med_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(medicine, field, value)

    # If scheduled_times updated, re-sync default schedules
    if "scheduled_times" in update_data and update_data["scheduled_times"]:
        db.query(MedicationSchedule).filter(
            MedicationSchedule.medicine_id == medicine.id,
            MedicationSchedule.user_id == current_user.id
        ).delete()
        times = [t.strip() for t in update_data["scheduled_times"].split(",") if t.strip()]
        for t in times:
            sched = MedicationSchedule(
                medicine_id=medicine.id,
                user_id=current_user.id,
                time_of_day=t,
                days_of_week="mon,tue,wed,thu,fri,sat,sun",
                dose_quantity=medicine.dosage
            )
            db.add(sched)

    db.commit()
    db.refresh(medicine)
    return medicine

@router.delete("/{medicine_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_medicine(
    medicine_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    medicine = db.query(Medicine).filter(
        Medicine.id == medicine_id,
        Medicine.user_id == current_user.id
    ).first()
    if not medicine:
        raise HTTPException(status_code=404, detail="Medicine not found.")

    db.query(MedicationSchedule).filter(MedicationSchedule.medicine_id == medicine.id).delete()
    db.delete(medicine)
    db.commit()
    return None

