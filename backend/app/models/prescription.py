from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text
from datetime import datetime, timezone
from app.database.session import Base

class Prescription(Base):
    __tablename__ = "prescriptions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("profiles.id", ondelete="CASCADE"), nullable=False, index=True)
    image_path = Column(String(500), nullable=False)
    ocr_raw_text = Column(Text, nullable=True)
    extracted_data_json = Column(Text, nullable=True)  # JSON string of detected medicines
    doctor_name = Column(String(255), nullable=True)
    clinic_name = Column(String(255), nullable=True)
    is_confirmed = Column(Boolean, default=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

