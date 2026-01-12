from pydantic import BaseModel, EmailStr
from datetime import datetime

class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str
    role_id: int
    designation: str | None = None

class UserResponse(BaseModel):
    id: int
    name: str
    email: EmailStr
    role_id: int
    designation: str | None
    created_at: datetime

    class Config:
        from_attributes = True
