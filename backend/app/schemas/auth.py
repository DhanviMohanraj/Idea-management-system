from pydantic import BaseModel, EmailStr


class AuthUser(BaseModel):
    id: int
    name: str
    email: EmailStr
    role: str

    class Config:
        from_attributes = True

class RegisterRequest(BaseModel):
    name: str
    email: EmailStr
    password: str
    # Accept either a numeric role_id (legacy) or a string role (preferred)
    role_id: int | None = None
    role: str | None = None
    designation: str | None = None

class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: AuthUser
