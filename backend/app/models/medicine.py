from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text
from datetime import datetime, timezone
from app.database.session import Base

class Medicine(Base):
    __tablename__ = "medicines"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("profiles.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(255), nullable=False)
    strength = Column(String(100), nullable=True)  # e.g., 500mg, 10ml
    dosage = Column(String(100), nullable=False, default="1 tablet")  # e.g., 1 tablet, 2 drops
    frequency = Column(String(100), nullable=False, default="Once daily")
    scheduled_times = Column(String(255), nullable=False, default="08:00")  # comma-separated "08:00,20:00"
    meal_timing = Column(String(50), default="after_food")  # before_food, after_food, with_food, not_specified
    start_date = Column(String(50), nullable=False)
    end_date = Column(String(50), nullable=True)
    instructions = Column(Text, nullable=True)
    prescribing_doctor = Column(String(255), nullable=True)
    pill_shape = Column(String(50), default="round")  # round, oval, capsule, square
    pill_color = Column(String(50), default="teal")  # teal, white, yellow, blue, red
    image_url = Column(String(500), nullable=True)
    is_active = Column(Boolean, default=True, index=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

