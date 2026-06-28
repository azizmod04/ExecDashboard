from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    app_name: str = "ExecDashboard"
    version: str = "2.0.0"
    debug: bool = True

    database_url: str = "sqlite:///./exec_dashboard.db"
    secret_key: str = "change-this-secret-key-in-production"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 1440

    allowed_origins: list[str] = ["http://localhost:5173", "http://localhost:3000"]

    supabase_url: Optional[str] = None
    supabase_key: Optional[str] = None

    openai_api_key: Optional[str] = None
    anthropic_api_key: Optional[str] = None
    qwen_api_key: Optional[str] = None

    s3_endpoint: Optional[str] = None
    s3_access_key: Optional[str] = None
    s3_secret_key: Optional[str] = None
    s3_bucket: str = "exec-dashboard-files"

    max_file_size: int = 50 * 1024 * 1024
    supported_formats: list[str] = [
        ".xlsx", ".xls", ".csv",
        ".pbix", ".twb", ".twbx"
    ]

    class Config:
        env_file = "../../.env"
        env_file_encoding = "utf-8"


settings = Settings()
