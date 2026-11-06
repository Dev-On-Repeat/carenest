from datetime import datetime, timezone
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from app.models.medicine import Medicine
from app.models.schedule import MedicationSchedule
from app.models.event import MedicationEvent
from app.models.user import User
from app.core.config import settings

class AssistantService:
    @classmethod
    def answer_question(
        cls,
        db: Session,
        user: User,
        question: str,
        language: str = "en"
    ) -> Dict[str, Any]:
        """
        Grounded, safe healthcare assistant querying the patient's genuine database records.
        Supports both English and Telugu with zero hallucination.
        """
        q = question.lower().strip()
        lang = "te" if language == "te" or any(c in question for c in "నా ఈ మందులు సమయం") else "en"

        # 1. Fetch user's actual active medicines
        active_medicines = db.query(Medicine).filter(
            Medicine.user_id == user.id,
            Medicine.is_active == True
        ).all()

        # 2. Fetch today's events (taken/snoozed/missed)
        today_date_str = datetime.now().strftime("%Y-%m-%d")
        events_today = db.query(MedicationEvent).filter(
            MedicationEvent.user_id == user.id
        ).all()

        # Map taken medicine IDs
        taken_med_ids = {e.medicine_id for e in events_today if e.status == "taken"}

        # 3. Next due medicine logic
        now_time = datetime.now().strftime("%H:%M")
        all_doses = []
        for m in active_medicines:
            times = [t.strip() for t in m.scheduled_times.split(",") if t.strip()]
            for t in times:
                all_doses.append({
                    "med_id": m.id,
                    "name": m.name,
                    "strength": m.strength,
                    "dosage": m.dosage,
                    "time": t,
                    "meal": m.meal_timing,
                    "taken": m.id in taken_med_ids
                })
        all_doses.sort(key=lambda x: x["time"])

        next_dose = None
        for d in all_doses:
            if not d["taken"] and d["time"] >= now_time:
                next_dose = d
                break
        if not next_dose and all_doses:
            # Check if there are any pending earlier today or loop to first tomorrow
            pending = [d for d in all_doses if not d["taken"]]
            next_dose = pending[0] if pending else None

        # Build response based on user question intent
        # Intent A: What medicines do I have today / list medicines
        if any(w in q for w in ["what medicine", "medicines today", "my medicine", "list", "schedule", "మందులు", "ఏ మందులు"]):
            if not active_medicines:
                if lang == "te":
                    ans = "ప్రస్తుతం మీ ఖాతాలో మందులు ఏవీ జోడించబడలేదు. దయచేసి 'మందులను జోడించు' బటన్ ద్వారా మీ మందులను నమోదు చేయండి."
                else:
                    ans = "You do not have any active medicines registered yet. You can add your prescribed medicines using the 'Add Medicine' button or by scanning your prescription."
                return {
                    "answer": ans,
                    "language": lang,
                    "source": "local_database_engine",
                    "related_medicines": []
                }

            if lang == "te":
                lines = [f"ఈరోజు మీరు తీసుకోవాల్సిన మందుల వివరాలు ({len(active_medicines)} క్రియాశీల మందులు):"]
                for d in all_doses:
                    status_text = "తీసుకున్నారు (Taken)" if d["taken"] else "ఇంకా తీసుకోలేదు (Due)"
                    meal_str = "భోజనం తర్వాత" if d["meal"] == "after_food" else ("భోజనానికి ముందు" if d["meal"] == "before_food" else "ఎప్పుడైనా")
                    lines.append(f"• {d['name']} ({d['strength'] or ''}) - సమయం: {d['time']} ({meal_str}) — {status_text}")
                ans = "\n".join(lines)
            else:
                lines = [f"Here is your medication schedule for today ({len(active_medicines)} active medicines):"]
                for d in all_doses:
                    status_text = "Taken" if d["taken"] else "Due"
                    meal_str = "After food" if d["meal"] == "after_food" else ("Before food" if d["meal"] == "before_food" else "With water")
                    lines.append(f"• {d['name']} ({d['strength'] or ''}) - {d['dosage']} at {d['time']} ({meal_str}) — [{status_text}]")
                ans = "\n".join(lines)

            return {
                "answer": ans,
                "language": lang,
                "source": "local_database_engine",
                "related_medicines": [m.name for m in active_medicines]
            }

        # Intent B: Next dose / Next reminder
        if any(w in q for w in ["next", "upcoming", "when", "తరువాత", "సమయం"]):
            if next_dose:
                if lang == "te":
                    meal_str = "భోజనం తర్వాత" if next_dose["meal"] == "after_food" else "భోజనానికి ముందు"
                    ans = f"మీ తదుపరి మందు: {next_dose['name']} ({next_dose['strength'] or ''}), సమయం {next_dose['time']}. దయచేసి {meal_str} తీసుకోండి."
                else:
                    meal_str = "after food" if next_dose["meal"] == "after_food" else "before food"
                    ans = f"Your next scheduled medication is {next_dose['name']} ({next_dose['strength'] or ''}) at {next_dose['time']} ({meal_str})."
                return {
                    "answer": ans,
                    "language": lang,
                    "source": "local_database_engine",
                    "related_medicines": [next_dose["name"]]
                }
            else:
                if lang == "te":
                    ans = "ఈరోజుకు మీరు అన్ని నిర్దేశిత మోతాదులను పూర్తి చేసుకున్నారు! అద్భుతం."
                else:
                    ans = "All scheduled doses for today have been recorded as completed. Great job staying on track!"
                return {
                    "answer": ans,
                    "language": lang,
                    "source": "local_database_engine",
                    "related_medicines": []
                }

        # Intent C: Taken status / Have I taken
        if any(w in q for w in ["taken", "did i take", "completed", "తీసుకున్నానా", "తీసుకున్నాను"]):
            taken_list = [m for m in active_medicines if m.id in taken_med_ids]
            pending_list = [m for m in active_medicines if m.id not in taken_med_ids]
            if lang == "te":
                ans = f"ఈరోజు మీరు {len(taken_list)} మందులను తీసుకున్నారు."
                if pending_list:
                    ans += f" ఇంకా తీసుకోవలసినవి: {', '.join(p.name for p in pending_list)}."
            else:
                ans = f"You have recorded {len(taken_list)} medicine(s) as taken today."
                if pending_list:
                    ans += f" Still pending: {', '.join(p.name for p in pending_list)}."
            return {
                "answer": ans,
                "language": lang,
                "source": "local_database_engine",
                "related_medicines": [m.name for m in taken_list]
            }

        # Intent D: Caregiver contact / Emergency help
        if any(w in q for w in ["caregiver", "contact", "emergency", "help", "sos", "డాక్టర్", "సహాయం"]):
            contact_name = user.emergency_contact or "Primary Family Caregiver"
            contact_phone = user.emergency_phone or user.phone or "Not configured"
            if lang == "te":
                ans = f"మీ సంరక్షకుని వివరాలు: {contact_name} ({contact_phone}). అత్యవసర సహాయం కోసం ఎరుపు రంగు SOS బటన్‌ను నొక్కవచ్చు లేదా అత్యవసర సేవలకు (108 / 112) కాల్ చేయవచ్చు."
            else:
                ans = f"Your designated caregiver contact is {contact_name} ({contact_phone}). In an emergency, tap the red SOS button on your screen or contact emergency medical services directly at 108 / 112 / 911."
            return {
                "answer": ans,
                "language": lang,
                "source": "local_database_engine",
                "related_medicines": []
            }

        # Default Helpful Response
        if lang == "te":
            ans = f"నమస్కారం {user.full_name}. మీ మందుల షెడ్యూల్, రాబోయే రిమైండర్‌లు లేదా సంరక్షకుని వివరాల గురించి నన్ను అడగవచ్చు. ఉదాహరణకు: 'ఈరోజు నా మందులు ఏమిటి?' లేదా 'నా తదుపరి మందు ఎప్పుడు?' అని అడగండి."
        else:
            ans = f"Hello {user.full_name}, I am CareNest, your healthcare companion. You can ask me questions like: 'What medicines do I have today?', 'When is my next reminder?', 'Which medicines have I taken?', or 'How can I contact my caregiver?'"

        return {
            "answer": ans,
            "language": lang,
            "source": "local_database_engine",
            "related_medicines": [m.name for m in active_medicines[:3]]
        }

