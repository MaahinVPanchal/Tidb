import redis
import secrets
import string
from app.config import settings

redis_client = redis.from_url(settings.redis_url, decode_responses=True)

def store_token(user_id: int, token: str, ex: int = 86400):
    redis_client.setex(f"token:{user_id}", ex, token)

def get_token(user_id: int) -> str | None:
    return redis_client.get(f"token:{user_id}")

def refresh_ttl(user_id: int, ex: int = 86400):
    redis_client.expire(f"token:{user_id}", ex)

# User storage helpers (Redis-only)
# Keys:
# - user:id:{id} -> hash of user fields
# - user:email:{email} -> id (for quick lookup)
# - user:passid:{passid} -> id (for login via passid)
# - user:seq -> int (auto-increment counter)

def _next_user_id() -> int:
    return int(redis_client.incr("user:seq"))

def get_user_by_email(email: str) -> dict | None:
    user_id = redis_client.get(f"user:email:{email}")
    if not user_id:
        return None
    data = redis_client.hgetall(f"user:id:{user_id}")
    if not data:
        return None
    # ensure id is int
    data["id"] = int(data.get("id", user_id))
    return data

def get_user_by_passid(passid: str) -> dict | None:
    user_id = redis_client.get(f"user:passid:{passid}")
    if not user_id:
        return None
    data = redis_client.hgetall(f"user:id:{user_id}")
    if not data:
        return None
    data["id"] = int(data.get("id", user_id))
    return data

def _generate_passid(length: int = 10) -> str:
    alphabet = string.ascii_uppercase + string.digits
    while True:
        pid = ''.join(secrets.choice(alphabet) for _ in range(length))
        # ensure not used
        if not redis_client.exists(f"user:passid:{pid}"):
            return pid

def create_user(email: str, name: str, hashed_password: str) -> dict:
    # prevent duplicates by email
    if redis_client.exists(f"user:email:{email}"):
        raise ValueError("User already exists")
    uid = _next_user_id()
    user_key = f"user:id:{uid}"
    # store as hash
    passid = _generate_passid()
    user_data = {
        "id": str(uid),
        "email": email,
        "name": name,
        "hashed_password": hashed_password,
        "passid": passid,
    }
    redis_client.hset(user_key, mapping=user_data)
    # index by email -> id
    redis_client.set(f"user:email:{email}", uid)
    # index by passid -> id
    redis_client.set(f"user:passid:{passid}", uid)
    user_data["id"] = uid
    return user_data