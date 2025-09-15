from fastapi import APIRouter
from app.controllers import auth as ctrl
from app.schemas.user import UserCreate, Token, RegisterResponse, LoginRequest

router = APIRouter(tags=["auth"])

@router.post("/register", response_model=RegisterResponse)
def register(data: UserCreate):
    return ctrl.register_user(data)

@router.post("/login", response_model=Token)
def login(data: LoginRequest):
    return ctrl.login_user(data)