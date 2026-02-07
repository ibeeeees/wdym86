"""
AWS RDS Integration

PostgreSQL connection via Amazon RDS.
"""

from typing import Optional
from urllib.parse import quote_plus
from .config import aws_settings, get_aws_session
from .secrets import get_database_credentials


def get_rds_connection_string(async_driver: bool = True) -> str:
    """
    Build PostgreSQL connection string for RDS.

    Args:
        async_driver: Use asyncpg for async, psycopg2 for sync

    Returns:
        SQLAlchemy connection string
    """
    if not aws_settings.rds_enabled:
        return None

    # Get credentials from Secrets Manager if enabled
    if aws_settings.secrets_enabled and aws_settings.db_secret_name:
        creds = get_database_credentials()
        username = creds.get('username', aws_settings.rds_username)
        password = creds.get('password', aws_settings.rds_password)
        host = creds.get('host', aws_settings.rds_host)
        port = creds.get('port', aws_settings.rds_port)
        database = creds.get('database', aws_settings.rds_database)
    else:
        username = aws_settings.rds_username
        password = aws_settings.rds_password
        host = aws_settings.rds_host
        port = aws_settings.rds_port
        database = aws_settings.rds_database

    if not all([username, password, host]):
        raise ValueError("RDS credentials not configured. Set RDS_USERNAME, RDS_PASSWORD, RDS_HOST")

    # URL-encode password to handle special characters
    encoded_password = quote_plus(password)

    # Build connection string
    if async_driver:
        driver = "postgresql+asyncpg"
    else:
        driver = "postgresql+psycopg2"

    connection_string = f"{driver}://{username}:{encoded_password}@{host}:{port}/{database}"

    # Add SSL for production
    if aws_settings.rds_use_ssl:
        if async_driver:
            connection_string += "?ssl=require"
        else:
            connection_string += "?sslmode=require"

    return connection_string


def get_rds_status() -> dict:
    """Check RDS instance status"""
    if not aws_settings.rds_enabled:
        return {"enabled": False, "status": "disabled"}

    try:
        session = get_aws_session()
        rds = session.client('rds')

        # Get instance identifier from host
        if aws_settings.rds_host:
            instance_id = aws_settings.rds_host.split('.')[0]
            response = rds.describe_db_instances(DBInstanceIdentifier=instance_id)

            if response['DBInstances']:
                instance = response['DBInstances'][0]
                return {
                    "enabled": True,
                    "status": instance['DBInstanceStatus'],
                    "engine": instance['Engine'],
                    "endpoint": instance['Endpoint']['Address'],
                    "port": instance['Endpoint']['Port']
                }
    except Exception as e:
        return {"enabled": True, "status": "error", "error": str(e)}

    return {"enabled": True, "status": "unknown"}


async def test_rds_connection() -> bool:
    """Test RDS database connection"""
    if not aws_settings.rds_enabled:
        return False

    try:
        from sqlalchemy.ext.asyncio import create_async_engine

        connection_string = get_rds_connection_string(async_driver=True)
        engine = create_async_engine(connection_string, echo=False)

        async with engine.connect() as conn:
            await conn.execute("SELECT 1")

        await engine.dispose()
        return True
    except Exception as e:
        print(f"RDS connection test failed: {e}")
        return False
