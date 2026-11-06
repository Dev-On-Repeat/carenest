from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.models.user import User
from app.schemas.all_schemas import AssistantMessage, AssistantResponse
from app.services.assistant_service import AssistantService
from app.api.deps import get_current_user

router = APIRouter()

@router.post("/ask", response_model=AssistantResponse)
def ask_carenest(
    message: AssistantMessage,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    result = AssistantService.answer_question(
        db=db,
        user=current_user,
        question=message.question,
        language=message.language
    )
    return AssistantResponse(
        answer=result["answer"],
        language=result["language"],
        source=result["source"],
        related_medicines=result["related_medicines"],
        disclaimer="CareNest AI is an academic prototype and does not replace medical advice from doctors, pharmacists, or licensed caregivers."
    )

