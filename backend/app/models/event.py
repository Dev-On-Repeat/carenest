from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text
from datetime import datetime, timezone
from app.database.session import Base

class MedicationEvent(Base):
    __tablename__ = "medication_events"

    id = Column(Integer, primary_key=True, index=True)
    medicine_id = Column(Integer, ForeignKey("medicines.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("profiles.id", ondelete="CASCADE"), nullable=False, index=True)
    scheduled_time = Column(String(50), nullable=False)  # ISO string or HH:MM on date
    action_time = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    status = Column(String(50), nullable=False)  # taken, snoozed, missed
    notes = Column(Text, nullable=True)
    device_source = Column(String(50), default="web")  # web, rpi_hardware, offline_sync
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

