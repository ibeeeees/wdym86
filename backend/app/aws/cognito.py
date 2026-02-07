"""
AWS Cognito Integration

User authentication and management via Amazon Cognito.
"""

from typing import Optional, Dict, Any
from datetime import datetime
import hmac
import hashlib
import base64
from .config import aws_settings, get_aws_session, get_boto_config


class CognitoAuth:
    """AWS Cognito authentication client"""

    def __init__(self):
        self.enabled = aws_settings.cognito_enabled
        self.user_pool_id = aws_settings.cognito_user_pool_id
        self.client_id = aws_settings.cognito_app_client_id
        self.region = aws_settings.cognito_region or aws_settings.aws_region
        self._client = None
        self._client_secret = None

    @property
    def client(self):
        """Lazy-load Cognito client"""
        if self._client is None and self.enabled:
            session = get_aws_session()
            self._client = session.client(
                'cognito-idp',
                region_name=self.region,
                config=get_boto_config()
            )
        return self._client

    def _get_secret_hash(self, username: str) -> Optional[str]:
        """Calculate secret hash for app client with secret"""
        if not self._client_secret:
            return None

        message = username + self.client_id
        dig = hmac.new(
            self._client_secret.encode('utf-8'),
            message.encode('utf-8'),
            hashlib.sha256
        ).digest()
        return base64.b64encode(dig).decode()

    async def sign_up(
        self,
        email: str,
        password: str,
        name: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Register a new user.

        Args:
            email: User email (used as username)
            password: User password
            name: Optional display name

        Returns:
            Registration result with user sub (ID)
        """
        if not self.enabled:
            return {"error": "Cognito not enabled"}

        try:
            attributes = [
                {'Name': 'email', 'Value': email}
            ]
            if name:
                attributes.append({'Name': 'name', 'Value': name})

            params = {
                'ClientId': self.client_id,
                'Username': email,
                'Password': password,
                'UserAttributes': attributes
            }

            secret_hash = self._get_secret_hash(email)
            if secret_hash:
                params['SecretHash'] = secret_hash

            response = self.client.sign_up(**params)

            return {
                "success": True,
                "user_sub": response['UserSub'],
                "confirmed": response['UserConfirmed']
            }

        except self.client.exceptions.UsernameExistsException:
            return {"error": "User already exists"}
        except self.client.exceptions.InvalidPasswordException as e:
            return {"error": f"Invalid password: {str(e)}"}
        except Exception as e:
            return {"error": str(e)}

    async def confirm_sign_up(self, email: str, code: str) -> Dict[str, Any]:
        """Confirm user registration with verification code"""
        if not self.enabled:
            return {"error": "Cognito not enabled"}

        try:
            params = {
                'ClientId': self.client_id,
                'Username': email,
                'ConfirmationCode': code
            }

            secret_hash = self._get_secret_hash(email)
            if secret_hash:
                params['SecretHash'] = secret_hash

            self.client.confirm_sign_up(**params)
            return {"success": True}

        except self.client.exceptions.CodeMismatchException:
            return {"error": "Invalid verification code"}
        except self.client.exceptions.ExpiredCodeException:
            return {"error": "Verification code expired"}
        except Exception as e:
            return {"error": str(e)}

    async def sign_in(self, email: str, password: str) -> Dict[str, Any]:
        """
        Authenticate user.

        Args:
            email: User email
            password: User password

        Returns:
            Authentication tokens (access, id, refresh)
        """
        if not self.enabled:
            return {"error": "Cognito not enabled"}

        try:
            params = {
                'ClientId': self.client_id,
                'AuthFlow': 'USER_PASSWORD_AUTH',
                'AuthParameters': {
                    'USERNAME': email,
                    'PASSWORD': password
                }
            }

            secret_hash = self._get_secret_hash(email)
            if secret_hash:
                params['AuthParameters']['SECRET_HASH'] = secret_hash

            response = self.client.initiate_auth(**params)

            auth_result = response.get('AuthenticationResult', {})
            return {
                "success": True,
                "access_token": auth_result.get('AccessToken'),
                "id_token": auth_result.get('IdToken'),
                "refresh_token": auth_result.get('RefreshToken'),
                "expires_in": auth_result.get('ExpiresIn')
            }

        except self.client.exceptions.NotAuthorizedException:
            return {"error": "Invalid credentials"}
        except self.client.exceptions.UserNotConfirmedException:
            return {"error": "User not confirmed"}
        except self.client.exceptions.UserNotFoundException:
            return {"error": "User not found"}
        except Exception as e:
            return {"error": str(e)}

    async def refresh_tokens(self, refresh_token: str, email: str) -> Dict[str, Any]:
        """Refresh access tokens"""
        if not self.enabled:
            return {"error": "Cognito not enabled"}

        try:
            params = {
                'ClientId': self.client_id,
                'AuthFlow': 'REFRESH_TOKEN_AUTH',
                'AuthParameters': {
                    'REFRESH_TOKEN': refresh_token
                }
            }

            secret_hash = self._get_secret_hash(email)
            if secret_hash:
                params['AuthParameters']['SECRET_HASH'] = secret_hash

            response = self.client.initiate_auth(**params)

            auth_result = response.get('AuthenticationResult', {})
            return {
                "success": True,
                "access_token": auth_result.get('AccessToken'),
                "id_token": auth_result.get('IdToken'),
                "expires_in": auth_result.get('ExpiresIn')
            }

        except Exception as e:
            return {"error": str(e)}

    async def get_user(self, access_token: str) -> Dict[str, Any]:
        """Get user info from access token"""
        if not self.enabled:
            return {"error": "Cognito not enabled"}

        try:
            response = self.client.get_user(AccessToken=access_token)

            user_attributes = {}
            for attr in response.get('UserAttributes', []):
                user_attributes[attr['Name']] = attr['Value']

            return {
                "success": True,
                "username": response['Username'],
                "email": user_attributes.get('email'),
                "name": user_attributes.get('name'),
                "sub": user_attributes.get('sub'),
                "email_verified": user_attributes.get('email_verified') == 'true'
            }

        except self.client.exceptions.NotAuthorizedException:
            return {"error": "Token expired or invalid"}
        except Exception as e:
            return {"error": str(e)}

    async def sign_out(self, access_token: str) -> Dict[str, Any]:
        """Sign out user (invalidate tokens)"""
        if not self.enabled:
            return {"error": "Cognito not enabled"}

        try:
            self.client.global_sign_out(AccessToken=access_token)
            return {"success": True}
        except Exception as e:
            return {"error": str(e)}

    async def forgot_password(self, email: str) -> Dict[str, Any]:
        """Initiate password reset"""
        if not self.enabled:
            return {"error": "Cognito not enabled"}

        try:
            params = {
                'ClientId': self.client_id,
                'Username': email
            }

            secret_hash = self._get_secret_hash(email)
            if secret_hash:
                params['SecretHash'] = secret_hash

            self.client.forgot_password(**params)
            return {"success": True, "message": "Password reset code sent"}

        except self.client.exceptions.UserNotFoundException:
            # Don't reveal if user exists
            return {"success": True, "message": "If account exists, reset code sent"}
        except Exception as e:
            return {"error": str(e)}

    async def confirm_forgot_password(
        self,
        email: str,
        code: str,
        new_password: str
    ) -> Dict[str, Any]:
        """Complete password reset with verification code"""
        if not self.enabled:
            return {"error": "Cognito not enabled"}

        try:
            params = {
                'ClientId': self.client_id,
                'Username': email,
                'ConfirmationCode': code,
                'Password': new_password
            }

            secret_hash = self._get_secret_hash(email)
            if secret_hash:
                params['SecretHash'] = secret_hash

            self.client.confirm_forgot_password(**params)
            return {"success": True}

        except self.client.exceptions.CodeMismatchException:
            return {"error": "Invalid verification code"}
        except self.client.exceptions.ExpiredCodeException:
            return {"error": "Verification code expired"}
        except Exception as e:
            return {"error": str(e)}

    def get_status(self) -> dict:
        """Get Cognito status"""
        if not self.enabled:
            return {"enabled": False}

        try:
            response = self.client.describe_user_pool(UserPoolId=self.user_pool_id)
            pool = response.get('UserPool', {})
            return {
                "enabled": True,
                "user_pool_id": self.user_pool_id,
                "name": pool.get('Name'),
                "status": pool.get('Status', 'Unknown')
            }
        except Exception as e:
            return {
                "enabled": True,
                "status": "error",
                "error": str(e)
            }


# Global instance
cognito_auth = CognitoAuth()
