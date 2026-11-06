from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text, Float
from datetime import datetime, timezone
from app.database.session import Base

class SOSEvent(Base):
    __tablename__ = "sos_events"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("profiles.id", ondelete="CASCADE"), nullable=False, index=True)
    timestamp = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    status = Column(String(50), default="triggered")  # triggered, acknowledged, resolved
    location_lat = Column(Float, nullable=True)
    location_lng = Column(Float, nullable=True)
    notes = Column(Text, nullable=True)
    external_notified = Column(Boolean, default=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

class SyncEvent(Base):
    __tablename__ = "sync_events"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("profiles.id", ondelete="CASCADE"), nullable=False, index=True)
    client_id = Column(String(100), nullable=False)
    entity_type = Column(String(50), nullable=False)  # medicine, event, schedule, sos
    entity_id = Column(String(100), nullable=False)
    action = Column(String(50), nullable=False)  # create, update, delete
    payload_json = Column(Text, nullable=False)
    client_timestamp = Column(DateTime, nullable=False)
    server_timestamp = Column(DateTime, default=lambda: datetime.now(timezone.utc))

