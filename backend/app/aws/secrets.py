"""
AWS Secrets Manager Integration

Secure credential management for database, API keys, etc.
"""

import json
from typing import Optional, Dict, Any
from functools import lru_cache
from .config import aws_settings, get_aws_session, get_boto_config


@lru_cache(maxsize=10)
def get_secret(secret_name: str) -> Optional[Dict[str, Any]]:
    """
    Retrieve secret from AWS Secrets Manager.

    Args:
        secret_name: Name or ARN of the secret

    Returns:
        Parsed secret as dictionary
    """
    if not aws_settings.secrets_enabled:
        return None

    try:
        session = get_aws_session()
        client = session.client('secretsmanager', config=get_boto_config())

        response = client.get_secret_value(SecretId=secret_name)

        if 'SecretString' in response:
            return json.loads(response['SecretString'])
        else:
            # Binary secret (e.g., private key)
            import base64
            return {"binary": base64.b64decode(response['SecretBinary'])}

    except Exception as e:
        print(f"Failed to retrieve secret {secret_name}: {e}")
        return None


def get_database_credentials() -> Dict[str, str]:
    """
    Get database credentials from Secrets Manager.

    Expected secret format:
    {
        "username": "db_user",
        "password": "db_password",
        "host": "rds-instance.xxx.region.rds.amazonaws.com",
        "port": 5432,
        "database": "wdym86"
    }
    """
    if not aws_settings.db_secret_name:
        return {}

    secret = get_secret(aws_settings.db_secret_name)
    if secret:
        return {
            "username": secret.get("username", ""),
            "password": secret.get("password", ""),
            "host": secret.get("host", ""),
            "port": secret.get("port", 5432),
            "database": secret.get("database", "wdym86")
        }
    return {}


def get_api_key(key_name: str) -> Optional[str]:
    """
    Get API key from Secrets Manager.

    Args:
        key_name: Name of the API key secret

    Returns:
        API key string
    """
    secret = get_secret(key_name)
    if secret:
        return secret.get("api_key") or secret.get("key")
    return None


def clear_secret_cache():
    """Clear the secrets cache (for testing or rotation)"""
    get_secret.cache_clear()


def list_secrets() -> list[str]:
    """List available secrets (names only)"""
    if not aws_settings.secrets_enabled:
        return []

    try:
        session = get_aws_session()
        client = session.client('secretsmanager', config=get_boto_config())

        response = client.list_secrets(MaxResults=100)

        return [s['Name'] for s in response.get('SecretList', [])]

    except Exception as e:
        print(f"Failed to list secrets: {e}")
        return []
