from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime

class UserBase(BaseModel):
    email: EmailStr
    full_name: str
    role: str = "elderly"  # elderly, caregiver, admin
    emergency_contact: Optional[str] = None
    emergency_phone: Optional[str] = None
    phone: Optional[str] = None
    preferred_language: str = "en"
    text_size: str = "normal"

class UserCreate(UserBase):
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    emergency_contact: Optional[str] = None
    emergency_phone: Optional[str] = None
    phone: Optional[str] = None
    preferred_language: Optional[str] = None
    text_size: Optional[str] = None

class UserOut(UserBase):
    id: int
    caregiver_code: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut

class TokenData(BaseModel):
    user_id: Optional[int] = None
    role: Optional[str] = None

