"""
AWS Integration Module

Provides AWS service integrations:
- RDS (PostgreSQL) for persistent database
- S3 for file/image storage
- Secrets Manager for credentials
- Cognito for authentication (optional)
- SES for email notifications
"""

from .config import aws_settings, get_aws_session
from .rds import get_rds_connection_string
from .s3 import S3Client, s3_client
from .secrets import get_secret, get_database_credentials
from .cognito import CognitoAuth, cognito_auth

__all__ = [
    'aws_settings',
    'get_aws_session',
    'get_rds_connection_string',
    'S3Client',
    's3_client',
    'get_secret',
    'get_database_credentials',
    'CognitoAuth',
    'cognito_auth',
]
