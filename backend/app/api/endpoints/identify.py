import os
import shutil
import uuid
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from app.services.pill_identifier import PillIdentifierService
from app.core.config import settings
from app.models.user import User
from app.api.deps import get_current_user

router = APIRouter()

ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}

@router.post("")
async def identify_pill(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user)
):
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid image type. Please upload a PNG, JPEG, or WebP medicine photo."
        )

    file_id = f"pill_{uuid.uuid4().hex[:12]}{ext}"
    file_path = os.path.join(settings.UPLOAD_DIR, file_id)

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    result = PillIdentifierService.analyze_pill_image(file_path)
    result["image_url"] = f"/api/uploads/{file_id}"
    return result

