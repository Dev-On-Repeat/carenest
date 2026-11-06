from datetime import datetime, timezone, timedelta
from sqlalchemy.orm import Session
from app.models.user import User
from app.models.medicine import Medicine
from app.models.schedule import MedicationSchedule
from app.models.event import MedicationEvent
from app.models.caregiver import CaregiverRelationship
from app.models.sos import SOSEvent
from app.core.security import get_password_hash

DEMO_ELDERLY_EMAIL = "ramakrishna.demo@carenest.ai"
DEMO_CAREGIVER_EMAIL = "dr.priya.demo@carenest.ai"
DEMO_PASSWORD = "DemoPassword123!"

class DemoDataSeeder:
    @classmethod
    def seed_or_reset(cls, db: Session) -> dict:
        """
        Seeds complete, realistic demonstration data:
        - Elderly User: 'Ramakrishna Varma (Demo)'
        - Caregiver: 'Dr. Priya Varma (Demo)'
        - 3 realistic medicines (Metformin 500mg, Amlodipine 5mg, Atorvastatin 20mg)
        - Schedules for morning, afternoon, night
        - Past taken and snoozed history events
        - Caregiver linking relationship
        - Past test SOS event for testing resolution
        """
        # 1. Clean existing demo users
        existing_elderly = db.query(User).filter(User.email == DEMO_ELDERLY_EMAIL).first()
        existing_caregiver = db.query(User).filter(User.email == DEMO_CAREGIVER_EMAIL).first()

        if existing_elderly:
            # Delete child records
            db.query(MedicationEvent).filter(MedicationEvent.user_id == existing_elderly.id).delete()
            db.query(MedicationSchedule).filter(MedicationSchedule.user_id == existing_elderly.id).delete()
            db.query(Medicine).filter(Medicine.user_id == existing_elderly.id).delete()
            db.query(SOSEvent).filter(SOSEvent.user_id == existing_elderly.id).delete()
            db.query(CaregiverRelationship).filter(
                (CaregiverRelationship.elderly_id == existing_elderly.id) |
                (CaregiverRelationship.caregiver_id == existing_elderly.id)
            ).delete()
            db.delete(existing_elderly)

        if existing_caregiver:
            db.query(CaregiverRelationship).filter(CaregiverRelationship.caregiver_id == existing_caregiver.id).delete()
            db.delete(existing_caregiver)

        db.commit()

        # 2. Create Elderly User
        elderly = User(
            email=DEMO_ELDERLY_EMAIL,
            hashed_password=get_password_hash(DEMO_PASSWORD),
            full_name="Ramakrishna Varma (Demo)",
            role="elderly",
            emergency_contact="Dr. Priya Varma (Daughter & Physician)",
            emergency_phone="+91 98480 12345",
            phone="+91 94401 56789",
            preferred_language="en",
            text_size="large",
            caregiver_code="RAMA-7890"
        )
        db.add(elderly)

        # 3. Create Caregiver User
        caregiver = User(
            email=DEMO_CAREGIVER_EMAIL,
            hashed_password=get_password_hash(DEMO_PASSWORD),
            full_name="Dr. Priya Varma (Demo)",
            role="caregiver",
            phone="+91 98480 12345",
            preferred_language="en",
            text_size="normal"
        )
        db.add(caregiver)
        db.commit()
        db.refresh(elderly)
        db.refresh(caregiver)

        # 4. Link Caregiver and Elderly
        relationship = CaregiverRelationship(
            caregiver_id=caregiver.id,
            elderly_id=elderly.id,
            status="active",
            permissions="manage"
        )
        db.add(relationship)

        # 5. Add 3 realistic medicines
        med1 = Medicine(
            user_id=elderly.id,
            name="Metformin Hydrochloride",
            strength="500 mg",
            dosage="1 tablet",
            frequency="Twice daily",
            scheduled_times="08:00,20:00",
            meal_timing="after_food",
            start_date="2026-01-01",
            instructions="Take immediately after breakfast and dinner with water for blood glucose control.",
            prescribing_doctor="Dr. K. Srinivas Rao, MD",
            pill_shape="oval",
            pill_color="white",
            is_active=True
        )
        med2 = Medicine(
            user_id=elderly.id,
            name="Amlodipine Besylate",
            strength="5 mg",
            dosage="1 tablet",
            frequency="Once daily",
            scheduled_times="08:00",
            meal_timing="after_food",
            start_date="2026-01-01",
            instructions="Take in the morning after breakfast for blood pressure stabilization.",
            prescribing_doctor="Dr. K. Srinivas Rao, MD",
            pill_shape="round",
            pill_color="teal",
            is_active=True
        )
        med3 = Medicine(
            user_id=elderly.id,
            name="Atorvastatin",
            strength="20 mg",
            dosage="1 tablet",
            frequency="Once daily",
            scheduled_times="21:00",
            meal_timing="after_food",
            start_date="2026-01-01",
            instructions="Take at night after dinner for lipid control.",
            prescribing_doctor="Dr. K. Srinivas Rao, MD",
            pill_shape="oval",
            pill_color="yellow",
            is_active=True
        )
        db.add_all([med1, med2, med3])
        db.commit()
        db.refresh(med1)
        db.refresh(med2)
        db.refresh(med3)

        # 6. Add medication schedules
        schedules = [
            MedicationSchedule(medicine_id=med1.id, user_id=elderly.id, time_of_day="08:00", days_of_week="mon,tue,wed,thu,fri,sat,sun", dose_quantity="1"),
            MedicationSchedule(medicine_id=med1.id, user_id=elderly.id, time_of_day="20:00", days_of_week="mon,tue,wed,thu,fri,sat,sun", dose_quantity="1"),
            MedicationSchedule(medicine_id=med2.id, user_id=elderly.id, time_of_day="08:00", days_of_week="mon,tue,wed,thu,fri,sat,sun", dose_quantity="1"),
            MedicationSchedule(medicine_id=med3.id, user_id=elderly.id, time_of_day="21:00", days_of_week="mon,tue,wed,thu,fri,sat,sun", dose_quantity="1"),
        ]
        db.add_all(schedules)

        # 7. Add sample history events (one taken, one snoozed)
        now = datetime.now(timezone.utc)
        yesterday = now - timedelta(days=1)
        events = [
            MedicationEvent(
                medicine_id=med1.id,
                user_id=elderly.id,
                scheduled_time="08:00",
                action_time=now - timedelta(hours=2),
                status="taken",
                notes="Taken on time with warm water",
                device_source="web"
            ),
            MedicationEvent(
                medicine_id=med2.id,
                user_id=elderly.id,
                scheduled_time="08:00",
                action_time=now - timedelta(hours=2),
                status="taken",
                notes="Taken with morning tea and toast",
                device_source="rpi_hardware"
            ),
            MedicationEvent(
                medicine_id=med1.id,
                user_id=elderly.id,
                scheduled_time="20:00",
                action_time=yesterday,
                status="taken",
                notes="Taken after dinner",
                device_source="web"
            ),
        ]
        db.add_all(events)

        # 8. Add sample test SOS event
        sos = SOSEvent(
            user_id=elderly.id,
            timestamp=yesterday,
            status="resolved",
            notes="Test SOS simulation drill — verified caregiver notification receipt",
            external_notified=True
        )
        db.add(sos)

        db.commit()

        return {
            "success": True,
            "message": "Demo data successfully seeded!",
            "credentials": {
                "elderly": {
                    "email": DEMO_ELDERLY_EMAIL,
                    "password": DEMO_PASSWORD,
                    "name": "Ramakrishna Varma (Demo)",
                    "caregiver_code": "RAMA-7890"
                },
                "caregiver": {
                    "email": DEMO_CAREGIVER_EMAIL,
                    "password": DEMO_PASSWORD,
                    "name": "Dr. Priya Varma (Demo)"
                }
            }
        }

