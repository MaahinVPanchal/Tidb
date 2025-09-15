from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional

class Settings(BaseSettings):
    # Application configuration
    app_name: str = "Atelier API"
    app_version: str = "1.0.0"
    debug: bool = False
    
    # Server configuration
    host: str = "0.0.0.0"
    port: int = 8000
    reload: bool = True
    
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

    # Database configuration
    tidb_database_url: str
    db_host: str = ""
    db_port: int = 4000
    db_username: str = ""
    db_password: str = ""
    db_database: str = "atelier"

    # AI Services
    embedding_provider: str = "tidbcloud"
    openai_api_key: Optional[str] = None
    moonshot_api_key: Optional[str] = None
    
    # File storage
    upload_dir: str = "./uploads"
    max_upload_size: int = 10 * 1024 * 1024  # 10MB
    allowed_file_types: list[str] = ["image/jpeg", "image/png", "image/webp"]
    
    # CORS
    cors_origins: list[str] = ["*"]
    cors_methods: list[str] = ["*"]
    cors_headers: list[str] = ["*"]
    cors_allow_credentials: bool = True

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding='utf-8',
        extra='ignore'  # Ignore extra fields in .env
    )

# Create settings instance
settings = Settings()