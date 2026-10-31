import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "ComplianceTwin 360"
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./compliance360.db")
    SECRET_KEY: str = os.getenv("SECRET_KEY", "compliancetwin-secret-key-360-hackathon-2025-secure")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440  # 24 hours
    STORAGE_DIR: str = os.getenv("STORAGE_DIR", "./uploads")

    class Config:
        env_file = ".env"

settings = Settings()
os.makedirs(settings.STORAGE_DIR, exist_ok=True)

