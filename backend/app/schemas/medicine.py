from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class MedicineBase(BaseModel):
    name: str
    strength: Optional[str] = "500 mg"
    dosage: str = "1 tablet"
    frequency: str = "Once daily"
    scheduled_times: str = "08:00"  # Comma separated HH:MM e.g. "08:00,20:00"
    meal_timing: str = "after_food"  # before_food, after_food, with_food, not_specified
    start_date: str
    end_date: Optional[str] = None
    instructions: Optional[str] = None
    prescribing_doctor: Optional[str] = None
    pill_shape: Optional[str] = "round"  # round, oval, capsule, square
    pill_color: Optional[str] = "teal"  # teal, white, yellow, blue, red
    image_url: Optional[str] = None
    is_active: bool = True

class MedicineCreate(MedicineBase):
    pass

class MedicineUpdate(BaseModel):
    name: Optional[str] = None
    strength: Optional[str] = None
    dosage: Optional[str] = None
    frequency: Optional[str] = None
    scheduled_times: Optional[str] = None
    meal_timing: Optional[str] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    instructions: Optional[str] = None
    prescribing_doctor: Optional[str] = None
    pill_shape: Optional[str] = None
    pill_color: Optional[str] = None
    image_url: Optional[str] = None
    is_active: Optional[bool] = None

class MedicineOut(MedicineBase):
    id: int
    user_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

