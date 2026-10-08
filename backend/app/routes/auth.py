import uuid
from datetime import datetime
from fastapi import APIRouter, HTTPException, status, Depends
from app.schemas.auth import UserRegister, UserLogin, UserResponse, Token, UserProfileUpdate, PasswordChangeRequest
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
            role=user["role"],
            phone=user.get("phone", "+91 98765 43210"),
            dob=user.get("dob", "1998-03-15"),
            gender=user.get("gender", "Male"),
            avatar=user.get("avatar"),
            created_at=user.get("created_at", "2024-01-12T00:00:00Z"),
            account_type=user.get("account_type", "Premium"),
        )
    )

@router.get("/me", response_model=UserResponse)
async def get_me(current_user: dict = Depends(get_current_user)):
    return UserResponse(
        id=str(current_user.get("_id") or current_user.get("id")),
        email=current_user["email"],
        full_name=current_user.get("full_name", "Vikram Kumar"),
        role=current_user.get("role", "researcher"),
        phone=current_user.get("phone", "+91 98765 43210"),
        dob=current_user.get("dob", "1998-03-15"),
        gender=current_user.get("gender", "Male"),
        avatar=current_user.get("avatar"),
        created_at=current_user.get("created_at", "2024-01-12T00:00:00Z"),
        account_type=current_user.get("account_type", "Premium"),
    )

@router.put("/profile", response_model=UserResponse)
async def update_profile(
    profile_data: UserProfileUpdate,
    current_user: dict = Depends(get_current_user)
):
    users_col = get_users_col()
    uid = str(current_user.get("_id") or current_user.get("id"))
    update_fields = {}
    if profile_data.full_name is not None:
        update_fields["full_name"] = profile_data.full_name
    if profile_data.phone is not None:
        update_fields["phone"] = profile_data.phone
    if profile_data.dob is not None:
        update_fields["dob"] = profile_data.dob
    if profile_data.gender is not None:
        update_fields["gender"] = profile_data.gender
    if profile_data.avatar is not None:
        update_fields["avatar"] = profile_data.avatar

    if update_fields:
        await users_col.update_one({"_id": uid}, {"$set": update_fields})
        updated = await users_col.find_one({"_id": uid})
        if updated:
            current_user = updated

    return UserResponse(
        id=uid,
        email=current_user["email"],
        full_name=current_user.get("full_name", "Vikram Kumar"),
        role=current_user.get("role", "researcher"),
        phone=current_user.get("phone", "+91 98765 43210"),
        dob=current_user.get("dob", "1998-03-15"),
        gender=current_user.get("gender", "Male"),
        avatar=current_user.get("avatar"),
        created_at=current_user.get("created_at", "2024-01-12T00:00:00Z"),
        account_type=current_user.get("account_type", "Premium"),
    )

@router.post("/change-password")
async def change_password(
    data: PasswordChangeRequest,
    current_user: dict = Depends(get_current_user)
):
    users_col = get_users_col()
    uid = str(current_user.get("_id") or current_user.get("id"))
    stored = await users_col.find_one({"_id": uid})
    if not stored or not verify_password(data.current_password, stored.get("password_hash", "")):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Current password is incorrect.")
    
    await users_col.update_one(
        {"_id": uid},
        {"$set": {"password_hash": hash_password(data.new_password)}}
    )
    return {"message": "Password changed successfully."}

@router.get("/export-data")
async def export_user_data(current_user: dict = Depends(get_current_user)):
    from app.database import get_reports_col
    uid = str(current_user.get("_id") or current_user.get("id"))
    reports_col = get_reports_col()
    cursor = reports_col.find({"user_id": uid})
    user_reports = await cursor.to_list(length=500)
    
    # Strip internal MongoDB id or passwords
    safe_user = {
        "id": uid,
        "email": current_user.get("email"),
        "full_name": current_user.get("full_name"),
        "phone": current_user.get("phone"),
        "dob": current_user.get("dob"),
        "gender": current_user.get("gender"),
        "created_at": current_user.get("created_at"),
        "total_reports": len(user_reports),
    }
    return {
        "export_date": datetime.utcnow().isoformat() + "Z",
        "user_profile": safe_user,
        "reports": [
            {
                "id": str(r.get("_id")),
                "filename": r.get("filename"),
                "upload_date": r.get("upload_date"),
                "report_date": r.get("report_date"),
                "parameters_count": len(r.get("parameters", [])),
                "summary": r.get("analysis", {}).get("summary", ""),
            }
            for r in user_reports
        ]
    }

@router.delete("/account")
async def delete_account(current_user: dict = Depends(get_current_user)):
    from app.database import get_reports_col
    uid = str(current_user.get("_id") or current_user.get("id"))
    users_col = get_users_col()
    reports_col = get_reports_col()
    
    # Remove reports
    await reports_col.delete_one({"user_id": uid})
    # Remove user
    await users_col.delete_one({"_id": uid})
    return {"message": "Account and associated research records removed successfully."}
