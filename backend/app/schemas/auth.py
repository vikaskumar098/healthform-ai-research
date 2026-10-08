from pydantic import BaseModel, EmailStr
from typing import Optional

class UserRegister(BaseModel):
    email: EmailStr
    password: str
    full_name: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: str
    email: EmailStr
    full_name: str
    role: str = "researcher"
    phone: Optional[str] = "+91 98765 43210"
    dob: Optional[str] = "1998-03-15"
    gender: Optional[str] = "Male"
    avatar: Optional[str] = None
    created_at: Optional[str] = "2024-01-12T00:00:00Z"
    account_type: Optional[str] = "Premium"

class UserProfileUpdate(BaseModel):
    full_name: Optional[str] = None
    phone: Optional[str] = None
    dob: Optional[str] = None
    gender: Optional[str] = None
    avatar: Optional[str] = None

class PasswordChangeRequest(BaseModel):
    current_password: str
    new_password: str

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse
