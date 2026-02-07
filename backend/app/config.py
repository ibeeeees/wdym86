"""
Application Configuration

Loads settings from environment variables.
Supports AWS RDS for production database.
"""

from pydantic_settings import BaseSettings
from functools import lru_cache
from typing import Optional


class Settings(BaseSettings):
    """Application settings"""

    # App
    app_name: str = "WDYM86 - AI Inventory Intelligence"
    debug: bool = True
    host: str = "0.0.0.0"
    port: int = 8000

    # Database (SQLite default, RDS for production)
    database_url: str = "sqlite+aiosqlite:///./wdym86.db"
    use_aws_rds: bool = False

    # JWT Auth
    secret_key: str = "your-secret-key-change-in-production"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30

    # AWS Cognito Auth (alternative to JWT)
    use_cognito: bool = False

    # Gemini
    gemini_api_key: Optional[str] = None

    # CORS
    cors_origins: str = "*"

    # AWS Configuration
    aws_region: str = "us-east-1"
    aws_access_key_id: Optional[str] = None
    aws_secret_access_key: Optional[str] = None

    # AWS RDS
    rds_enabled: bool = False
    rds_host: Optional[str] = None
    rds_port: int = 5432
    rds_database: str = "wdym86"
    rds_username: Optional[str] = None
    rds_password: Optional[str] = None

    # AWS S3
    s3_enabled: bool = False
    s3_bucket_name: Optional[str] = None

    # AWS Cognito
    cognito_enabled: bool = False
    cognito_user_pool_id: Optional[str] = None
    cognito_app_client_id: Optional[str] = None

    # AWS Secrets Manager
    secrets_enabled: bool = False
    db_secret_name: Optional[str] = None

    class Config:
        env_file = ".env"
        case_sensitive = False

    def get_database_url(self) -> str:
        """Get database URL, using AWS RDS if enabled"""
        if self.rds_enabled and self.rds_host:
            from urllib.parse import quote_plus
            password = quote_plus(self.rds_password or "")
            return f"postgresql+asyncpg://{self.rds_username}:{password}@{self.rds_host}:{self.rds_port}/{self.rds_database}"
        return self.database_url


@lru_cache()
def get_settings() -> Settings:
    """Get cached settings instance"""
    return Settings()


settings = get_settings()
