"""
AWS Configuration

Settings for AWS services and session management.
"""

from pydantic_settings import BaseSettings
from typing import Optional
from functools import lru_cache
import boto3
from botocore.config import Config


class AWSSettings(BaseSettings):
    """AWS configuration settings"""

    # AWS Credentials (use IAM roles in production)
    aws_access_key_id: Optional[str] = None
    aws_secret_access_key: Optional[str] = None
    aws_region: str = "us-east-1"

    # RDS Configuration
    rds_enabled: bool = False
    rds_host: Optional[str] = None
    rds_port: int = 5432
    rds_database: str = "wdym86"
    rds_username: Optional[str] = None
    rds_password: Optional[str] = None
    rds_use_ssl: bool = True

    # S3 Configuration
    s3_enabled: bool = False
    s3_bucket_name: Optional[str] = None
    s3_prefix: str = "wdym86"

    # Secrets Manager
    secrets_enabled: bool = False
    db_secret_name: Optional[str] = None

    # Cognito Configuration
    cognito_enabled: bool = False
    cognito_user_pool_id: Optional[str] = None
    cognito_app_client_id: Optional[str] = None
    cognito_region: Optional[str] = None

    # SES Configuration
    ses_enabled: bool = False
    ses_sender_email: Optional[str] = None

    # DynamoDB (alternative to RDS)
    dynamodb_enabled: bool = False
    dynamodb_table_prefix: str = "wdym86"

    class Config:
        env_file = ".env"
        case_sensitive = False


@lru_cache()
def get_aws_settings() -> AWSSettings:
    """Get cached AWS settings"""
    return AWSSettings()


aws_settings = get_aws_settings()


def get_aws_session() -> boto3.Session:
    """
    Create AWS session with credentials.
    Uses environment variables or IAM role.
    """
    if aws_settings.aws_access_key_id and aws_settings.aws_secret_access_key:
        return boto3.Session(
            aws_access_key_id=aws_settings.aws_access_key_id,
            aws_secret_access_key=aws_settings.aws_secret_access_key,
            region_name=aws_settings.aws_region
        )
    # Use default credentials (IAM role, environment, ~/.aws/credentials)
    return boto3.Session(region_name=aws_settings.aws_region)


def get_boto_config() -> Config:
    """Get boto3 config with retry settings"""
    return Config(
        retries={
            'max_attempts': 3,
            'mode': 'adaptive'
        },
        connect_timeout=5,
        read_timeout=30
    )
