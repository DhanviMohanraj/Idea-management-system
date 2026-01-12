from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db

from app.models.user import User
from app.schemas.auth import RegisterRequest, LoginRequest







from sqlalchemy import text

from app.database import get_db
from app.models.user import User

from app.core.security import (
    get_password_hash,
    verify_password,
    create_access_token
)
router = APIRouter(prefix="/auth", tags=["Auth"])
@router.post("/register", status_code=status.HTTP_201_CREATED)
def register(user_data: RegisterRequest, db: Session = Depends(get_db)):
    print("🔥🔥🔥 REGISTER FUNCTION EXECUTED 🔥🔥🔥")

    print("👉 Register API hit")
    print("Payload:", user_data.dict())

    # Check role exists
    role = db.execute(
        text("SELECT id FROM roles WHERE id = :rid"),
        {"rid": user_data.role_id}
    ).fetchone()

    if not role:
        raise HTTPException(status_code=400, detail="Invalid role_id")

    # Check email exists
    existing_user = db.query(User).filter(User.email == user_data.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    hashed_password = get_password_hash(user_data.password)
    print("Password hashed")

    user = User(
        name=user_data.name,
        email=user_data.email,
        password=hashed_password,
        role_id=user_data.role_id,
        designation=user_data.designation
    )

    try:
        db.add(user)
        db.flush()      # 👈 forces INSERT
        print("Inserted user ID:", user.id)

        db.commit()
        db.refresh(user)

    except Exception as e:
        db.rollback()
        print("❌ DB ERROR:", str(e))
        raise HTTPException(status_code=500, detail="DB insert failed")

    return {
        "message": "User registered successfully",
        "user_id": user.id
    }

from fastapi.security import OAuth2PasswordBearer

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")


@router.post("/login")
def login(data: LoginRequest, db: Session = Depends(get_db)):
    # 1️⃣ Find user by email
    user = db.query(User).filter(User.email == data.email).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )

    # 2️⃣ Verify password
    if not verify_password(data.password, user.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )

    # 3️⃣ Create JWT token
    access_token = create_access_token(
        data={"sub": str(user.id)}
    )

    return {
        "access_token": access_token,
        "token_type": "bearer"
    }
