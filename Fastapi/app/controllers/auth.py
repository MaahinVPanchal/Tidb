from app.schemas.user import UserCreate, Token, RegisterResponse, LoginRequest
from app.utils.security import hash_password, verify_password, create_access_token
from app.utils.redis import (
    store_token,
    get_token,
    refresh_ttl,
    get_user_by_email,
    create_user,
)
from app.utils.email import send_welcome_email
from fastapi import HTTPException


def register_user(data: UserCreate) -> RegisterResponse:
    # Check if user already exists in Redis
    existing = get_user_by_email(data.email)
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    # Create user in Redis and get assigned user_id
    user = create_user(
        email=data.email,
        name=data.name,
        hashed_password=hash_password(data.password),
    )

    # Optionally send welcome email containing passid
    try:
        send_welcome_email(user["email"], user["name"], user.get("passid", ""))
    except Exception:
        # Do not block registration on email failure
        pass
    return RegisterResponse(passid=user["passid"])


def login_user(payload: LoginRequest) -> Token:
    # Lookup by passid if provided, otherwise by email
    user = None
    if payload.passid:
        from app.utils.redis import get_user_by_passid
        user = get_user_by_passid(payload.passid)
    elif payload.email:
        user = get_user_by_email(payload.email)
    else:
        raise HTTPException(status_code=400, detail="Provide passid or email")
    if not user or not verify_password(payload.password, user.get("hashed_password", "")):
        raise HTTPException(status_code=401, detail="Bad credentials")

    cached = get_token(user["id"])
    if cached:
        refresh_ttl(user["id"], ex=86400)
        return Token(access_token=cached)

    new_token = create_access_token({"sub": str(user["id"])})
    store_token(user["id"], new_token, ex=86400)
    return Token(access_token=new_token)