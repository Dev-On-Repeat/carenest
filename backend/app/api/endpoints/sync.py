import json
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.models.user import User
from app.models.medicine import Medicine
from app.models.event import MedicationEvent
from app.models.sos import SyncEvent
from app.schemas.all_schemas import SyncBatchRequest, SyncBatchResponse
from app.api.deps import get_current_user

router = APIRouter()

@router.post("/batch", response_model=SyncBatchResponse)
def process_sync_batch(
    batch: SyncBatchRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    processed = 0
    now = datetime.now(timezone.utc)

    for item in batch.items:
        # Save sync event audit
        sync_log = SyncEvent(
            user_id=current_user.id,
            client_id=item.client_id,
            entity_type=item.entity_type,
            entity_id=item.entity_id,
            action=item.action,
            payload_json=json.dumps(item.payload),
            client_timestamp=item.client_timestamp,
            server_timestamp=now
        )
        db.add(sync_log)

        # Process offline event replay
        if item.entity_type == "event" and item.action == "create":
            payload = item.payload
            med_id = payload.get("medicine_id")
            sched_time = payload.get("scheduled_time")
            ev_status = payload.get("status", "taken")

            existing = db.query(MedicationEvent).filter(
                MedicationEvent.user_id == current_user.id,
                MedicationEvent.medicine_id == med_id,
                MedicationEvent.scheduled_time == sched_time
            ).first()

            if not existing:
                ev = MedicationEvent(
                    medicine_id=med_id,
                    user_id=current_user.id,
                    scheduled_time=sched_time,
                    action_time=item.client_timestamp,
                    status=ev_status,
                    notes=payload.get("notes", "Synced from offline IndexedDB queue"),
                    device_source="offline_sync"
                )
                db.add(ev)
            else:
                existing.status = ev_status
                existing.action_time = item.client_timestamp

        elif item.entity_type == "medicine" and item.action == "create":
            payload = item.payload
            med = Medicine(
                user_id=current_user.id,
                name=payload.get("name", "Unknown Medicine"),
                strength=payload.get("strength", "500 mg"),
                dosage=payload.get("dosage", "1 tablet"),
                frequency=payload.get("frequency", "Once daily"),
                scheduled_times=payload.get("scheduled_times", "08:00"),
                meal_timing=payload.get("meal_timing", "after_food"),
                start_date=payload.get("start_date", now.strftime("%Y-%m-%d")),
                instructions=payload.get("instructions", "Added offline"),
                is_active=True
            )
            db.add(med)

        processed += 1

    db.commit()
    return SyncBatchResponse(
        processed_count=processed,
        success=True,
        server_time=now
    )

