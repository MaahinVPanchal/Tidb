from typing import Optional
from pydantic import BaseModel, EmailStr

class UserCreate(BaseModel):
    email: EmailStr
    name: str
    password: str

class RegisterResponse(BaseModel):
    passid: str

class LoginRequest(BaseModel):
    # Either passid or email must be provided
    passid: Optional[str] = None
    email: Optional[EmailStr] = None
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"