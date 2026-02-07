"""
AWS Status Router

Endpoints for checking AWS service connectivity.
"""

from fastapi import APIRouter, Depends
from typing import Dict, Any

from ..config import settings

router = APIRouter(prefix="/aws", tags=["AWS"])


@router.get("/status", response_model=Dict[str, Any])
async def get_aws_status():
    """
    Get status of all AWS services.

    Returns connectivity status for:
    - RDS (database)
    - S3 (file storage)
    - Cognito (authentication)
    - Secrets Manager
    """
    status = {
        "aws_enabled": any([
            settings.rds_enabled,
            settings.s3_enabled,
            settings.cognito_enabled,
            settings.secrets_enabled
        ]),
        "region": settings.aws_region,
        "services": {}
    }

    # RDS Status
    if settings.rds_enabled:
        try:
            from ..aws.rds import get_rds_status
            status["services"]["rds"] = get_rds_status()
        except Exception as e:
            status["services"]["rds"] = {"enabled": True, "status": "error", "error": str(e)}
    else:
        status["services"]["rds"] = {"enabled": False, "using": "sqlite"}

    # S3 Status
    if settings.s3_enabled:
        try:
            from ..aws.s3 import s3_client
            status["services"]["s3"] = s3_client.get_status()
        except Exception as e:
            status["services"]["s3"] = {"enabled": True, "status": "error", "error": str(e)}
    else:
        status["services"]["s3"] = {"enabled": False}

    # Cognito Status
    if settings.cognito_enabled:
        try:
            from ..aws.cognito import cognito_auth
            status["services"]["cognito"] = cognito_auth.get_status()
        except Exception as e:
            status["services"]["cognito"] = {"enabled": True, "status": "error", "error": str(e)}
    else:
        status["services"]["cognito"] = {"enabled": False, "using": "jwt"}

    # Secrets Manager
    if settings.secrets_enabled:
        try:
            from ..aws.secrets import list_secrets
            secrets = list_secrets()
            status["services"]["secrets_manager"] = {
                "enabled": True,
                "status": "connected",
                "secrets_count": len(secrets)
            }
        except Exception as e:
            status["services"]["secrets_manager"] = {"enabled": True, "status": "error", "error": str(e)}
    else:
        status["services"]["secrets_manager"] = {"enabled": False}

    return status


@router.get("/health")
async def aws_health_check():
    """Quick health check for AWS services"""
    healthy = True
    checks = {}

    if settings.rds_enabled:
        try:
            from ..aws.rds import test_rds_connection
            rds_ok = await test_rds_connection()
            checks["rds"] = "ok" if rds_ok else "failed"
            healthy = healthy and rds_ok
        except:
            checks["rds"] = "error"
            healthy = False

    if settings.s3_enabled:
        try:
            from ..aws.s3 import s3_client
            s3_status = s3_client.get_status()
            checks["s3"] = "ok" if s3_status.get("status") == "connected" else "failed"
            healthy = healthy and (s3_status.get("status") == "connected")
        except:
            checks["s3"] = "error"
            healthy = False

    return {
        "healthy": healthy,
        "checks": checks
    }
