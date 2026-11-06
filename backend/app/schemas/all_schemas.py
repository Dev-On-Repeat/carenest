from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime

class ExtractedMedicine(BaseModel):
    name: str
    strength: Optional[str] = "500 mg"
    dosage: str = "1 tablet"
    frequency: str = "Twice daily"
    meal_timing: str = "after_food"
    instructions: Optional[str] = None
    confidence: float = 0.85

class OCRResultOut(BaseModel):
    prescription_id: Optional[int] = None
    image_url: str
    raw_text: str
    doctor_name: Optional[str] = None
    clinic_name: Optional[str] = None
    date: Optional[str] = None
    medicines: List[ExtractedMedicine]
    disclaimer: str = "Prescription information may contain OCR errors. Please verify all details with your prescription or healthcare professional before saving."

class PrescriptionConfirm(BaseModel):
    medicines: List[ExtractedMedicine]
    doctor_name: Optional[str] = None
    clinic_name: Optional[str] = None

class AssistantMessage(BaseModel):
    question: str
    language: str = "en"

class AssistantResponse(BaseModel):
    answer: str
    language: str
    source: str  # local_engine or cloud_llm
    related_medicines: List[str] = []
    disclaimer: str = "CareNest AI is an academic prototype and does not replace medical advice from doctors, pharmacists, or licensed caregivers."

class CaregiverLinkRequest(BaseModel):
    caregiver_code: str  # The unique code of the elderly user

class CaregiverElderlySummary(BaseModel):
    elderly_id: int
    full_name: str
    email: str
    emergency_contact: Optional[str] = None
    emergency_phone: Optional[str] = None
    active_medicines_count: int
    today_adherence_percent: int
    missed_doses_today: int
    last_action: Optional[str] = None
    last_action_time: Optional[datetime] = None
    sos_active: bool

class SOSCreate(BaseModel):
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    notes: Optional[str] = None

class SOSOut(BaseModel):
    id: int
    user_id: int
    user_name: Optional[str] = None
    timestamp: datetime
    status: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    notes: Optional[str] = None
    external_notified: bool
    notice: str = "SOS recorded in application. Local emergency services must be contacted directly in an actual emergency."

    class Config:
        from_attributes = True

class SyncBatchItem(BaseModel):
    client_id: str
    entity_type: str
    entity_id: str
    action: str  # create, update, delete
    payload: Dict[str, Any]
    client_timestamp: datetime

class SyncBatchRequest(BaseModel):
    items: List[SyncBatchItem]

class SyncBatchResponse(BaseModel):
    processed_count: int
    success: bool
    server_time: datetime

