from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from datetime import datetime, timezone
from app.database.session import Base

class CaregiverRelationship(Base):
    __tablename__ = "caregiver_relationships"

    id = Column(Integer, primary_key=True, index=True)
    caregiver_id = Column(Integer, ForeignKey("profiles.id", ondelete="CASCADE"), nullable=False, index=True)
    elderly_id = Column(Integer, ForeignKey("profiles.id", ondelete="CASCADE"), nullable=False, index=True)
    status = Column(String(50), default="active")  # pending, active, revoked
    permissions = Column(String(50), default="manage")  # read, manage
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

