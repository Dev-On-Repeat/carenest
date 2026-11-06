from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from app.schemas.medicine import MedicineOut

class ScheduleBase(BaseModel):
    medicine_id: int
    time_of_day: str  # "08:00"
    days_of_week: str = "mon,tue,wed,thu,fri,sat,sun"
    dose_quantity: str = "1"
    is_active: bool = True

class ScheduleCreate(ScheduleBase):
    pass

class ScheduleOut(ScheduleBase):
    id: int
    user_id: int
    created_at: datetime
    medicine: Optional[MedicineOut] = None

    class Config:
        from_attributes = True

class EventCreate(BaseModel):
    medicine_id: int
    scheduled_time: str
    status: str  # taken, snoozed, missed
    notes: Optional[str] = None
    device_source: str = "web"

class EventOut(BaseModel):
    id: int
    medicine_id: int
    user_id: int
    scheduled_time: str
    action_time: datetime
    status: str
    notes: Optional[str] = None
    device_source: str
    created_at: datetime
    medicine: Optional[MedicineOut] = None

    class Config:
        from_attributes = True

class DoseSlotOut(BaseModel):
    medicine_id: int
    medicine_name: str
    strength: Optional[str]
    dosage: str
    scheduled_time: str
    meal_timing: str
    pill_shape: str
    pill_color: str
    instructions: Optional[str]
    status: str  # upcoming, due, taken, snoozed, missed
    event_id: Optional[int] = None
    action_time: Optional[datetime] = None

