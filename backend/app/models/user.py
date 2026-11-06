from sqlalchemy import Column, Integer, String, Boolean, DateTime
from datetime import datetime, timezone
from app.database.session import Base

class User(Base):
    __tablename__ = "profiles"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=False)
    role = Column(String(50), default="elderly")  # elderly, caregiver, admin
    emergency_contact = Column(String(100), nullable=True)
    emergency_phone = Column(String(50), nullable=True)
    phone = Column(String(50), nullable=True)
    preferred_language = Column(String(10), default="en")  # en, te
    text_size = Column(String(20), default="normal")  # normal, large, xlarge
    caregiver_code = Column(String(20), unique=True, index=True, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

