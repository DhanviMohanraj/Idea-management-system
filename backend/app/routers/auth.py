from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.deps import get_current_user
from app.core.security import create_access_token, get_password_hash, verify_password
from app.database import get_db
from app.models.role import Role
from app.models.user import User
from app.schemas.auth import RegisterRequest, TokenResponse
from app.schemas.auth import LoginRequest


router = APIRouter(prefix="/auth", tags=["Auth"])


def _resolve_role_id(db: Session, user_data: RegisterRequest) -> int:
    if user_data.role_id is not None:
        role = db.query(Role).filter(Role.id == user_data.role_id).first()
        if not role:
            raise HTTPException(status_code=400, detail="Invalid role_id")
        return role.id

    role_name = (user_data.role or "").strip()
    if not role_name:
        raise HTTPException(status_code=400, detail="role or role_id is required")

    role = db.query(Role).filter(Role.role_name == role_name).first()
    if not role:
        raise HTTPException(status_code=400, detail="Invalid role")
    return role.id


@router.post("/register", status_code=status.HTTP_201_CREATED)
def register(user_data: RegisterRequest, db: Session = Depends(get_db)):
    existing_user = db.query(User).filter(User.email == user_data.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    role_id = _resolve_role_id(db, user_data)
    hashed_password = get_password_hash(user_data.password)

    user = User(
        name=user_data.name,
        email=user_data.email,
        password=hashed_password,
        role_id=role_id,
        designation=user_data.designation,
    )

    db.add(user)
    db.commit()
    db.refresh(user)

    return {"message": "User registered successfully", "user_id": user.id}


@router.post("/login", response_model=TokenResponse)
def login(data: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == data.email).first()
    if not user or not verify_password(data.password, user.password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")

    role = db.query(Role).filter(Role.id == user.role_id).first()
    role_name = role.role_name if role else ""

    access_token = create_access_token(data={"user_id": user.id})
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "role": role_name,
        },
    }


@router.get("/me")
def me(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    role = db.query(Role).filter(Role.id == current_user.role_id).first()
    return {
        "id": current_user.id,
        "name": current_user.name,
        "email": current_user.email,
        "role": role.role_name if role else "",
    }
