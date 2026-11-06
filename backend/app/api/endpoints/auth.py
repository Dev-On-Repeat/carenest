import random
import string
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.models.user import User
from app.schemas.user import UserCreate, UserLogin, UserOut, Token, UserUpdate
from app.core.security import get_password_hash, verify_password, create_access_token
from app.api.deps import get_current_user

router = APIRouter()

def generate_caregiver_code() -> str:
    """Generates an easy-to-read 8-char code for elderly to share with family caregiver e.g. CARE-4892"""
    digits = ''.join(random.choices(string.digits, k=4))
    return f"CARE-{digits}"

@router.post("/register", response_model=Token, status_code=status.HTTP_201_CREATED)
def register(user_in: UserCreate, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == user_in.email).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email address already exists."
        )

    code = generate_caregiver_code() if user_in.role == "elderly" else None

    user = User(
        email=user_in.email,
        hashed_password=get_password_hash(user_in.password),
        full_name=user_in.full_name,
        role=user_in.role,
        emergency_contact=user_in.emergency_contact,
        emergency_phone=user_in.emergency_phone,
        phone=user_in.phone,
        preferred_language=user_in.preferred_language,
        text_size=user_in.text_size,
        caregiver_code=code
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_access_token(subject=user.id, role=user.role)
    return Token(access_token=token, token_type="bearer", user=UserOut.model_validate(user))

@router.post("/login", response_model=Token)
def login(login_in: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == login_in.email).first()
    if not user or not verify_password(login_in.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password. Please check your credentials."
        )

    token = create_access_token(subject=user.id, role=user.role)
    return Token(access_token=token, token_type="bearer", user=UserOut.model_validate(user))

@router.get("/me", response_model=UserOut)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user

@router.put("/me", response_model=UserOut)
def update_me(
    user_update: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if user_update.full_name is not None:
        current_user.full_name = user_update.full_name
    if user_update.emergency_contact is not None:
        current_user.emergency_contact = user_update.emergency_contact
    if user_update.emergency_phone is not None:
        current_user.emergency_phone = user_update.emergency_phone
    if user_update.phone is not None:
        current_user.phone = user_update.phone
    if user_update.preferred_language is not None:
        current_user.preferred_language = user_update.preferred_language
    if user_update.text_size is not None:
        current_user.text_size = user_update.text_size

    db.commit()
    db.refresh(current_user)
    return current_user
