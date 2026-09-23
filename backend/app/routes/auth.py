import uuid
from datetime import datetime
from fastapi import APIRouter, HTTPException, status, Depends
from app.schemas.auth import UserRegister, UserLogin, UserResponse, Token
from app.database import get_users_col
from app.utils.security import hash_password, verify_password, create_access_token, get_current_user
from app.config import settings

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

@router.post("/register", response_model=Token)
async def register(user_in: UserRegister):
    users_col = get_users_col()
    existing = await users_col.find_one({"email": user_in.email.lower()})
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email already exists."
        )

    user_id = str(uuid.uuid4())
    user_doc = {
        "_id": user_id,
        "email": user_in.email.lower(),
        "password_hash": hash_password(user_in.password),
        "full_name": user_in.full_name,
        "role": "researcher",
        "created_at": datetime.utcnow().isoformat() + "Z"
    }
    await users_col.insert_one(user_doc)

    access_token = create_access_token(data={"sub": user_id, "email": user_doc["email"]})
    return Token(
        access_token=access_token,
        token_type="bearer",
        user=UserResponse(
            id=user_id,
            email=user_doc["email"],
            full_name=user_doc["full_name"],
            role=user_doc["role"]
        )
    )

@router.post("/login", response_model=Token)
async def login(login_data: UserLogin):
    users_col = get_users_col()
    user = await users_col.find_one({"email": login_data.email.lower()})
    
    # In Demo Mode, if user isn't found and email is demo@healthform.ai, auto-create demo user
    if not user and settings.DEMO_MODE and login_data.email.lower() == "demo@healthform.ai":
        user_id = "demo_user_001"
        user = {
            "_id": user_id,
            "email": "demo@healthform.ai",
            "password_hash": hash_password("demo123"),
            "full_name": "Demo Researcher",
            "role": "researcher",
            "created_at": datetime.utcnow().isoformat() + "Z"
        }
        await users_col.insert_one(user)

    if not user or not verify_password(login_data.password, user.get("password_hash", "")):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password."
        )

    access_token = create_access_token(data={"sub": user["_id"], "email": user["email"]})
    return Token(
        access_token=access_token,
        token_type="bearer",
        user=UserResponse(
            id=str(user["_id"]),
            email=user["email"],
            full_name=user.get("full_name", "Researcher"),
            role=user.get("role", "researcher")
        )
    )

@router.post("/demo-login", response_model=Token)
async def demo_login():
    """One-click instant demo login for rapid research review and testing."""
    users_col = get_users_col()
    user_id = "demo_user_001"
    user = await users_col.find_one({"_id": user_id})
    if not user:
        user = {
            "_id": user_id,
            "email": "demo@healthform.ai",
            "password_hash": hash_password("demo123"),
            "full_name": "Dr. Alex Rivera (Demo Researcher)",
            "role": "researcher",
            "created_at": datetime.utcnow().isoformat() + "Z"
        }
        await users_col.insert_one(user)

    access_token = create_access_token(data={"sub": user_id, "email": user["email"]})
    return Token(
        access_token=access_token,
        token_type="bearer",
        user=UserResponse(
            id=user_id,
            email=user["email"],
            full_name=user["full_name"],
            role=user["role"]
        )
    )

@router.get("/me", response_model=UserResponse)
async def get_me(current_user: dict = Depends(get_current_user)):
    return UserResponse(
        id=str(current_user.get("_id") or current_user.get("id")),
        email=current_user["email"],
        full_name=current_user.get("full_name", "Researcher"),
        role=current_user.get("role", "researcher")
    )
