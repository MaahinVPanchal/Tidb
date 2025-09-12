from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    # Redis configuration
    redis_url: str = "redis://localhost:6379/0"
    
    # JWT configuration
    secret_key: str
    algorithm: str = "HS256"
    access_token_expire_hours: int = 24
    
    # Email configuration
    smtp_host: str = ""
    smtp_port: int = 587
    smtp_user: str = ""
    smtp_password: str = ""
    from_email: str = ""
    from_name: str = ""

    class Config:
        env_file = ".env"

settings = Settings()