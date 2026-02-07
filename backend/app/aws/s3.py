"""
AWS S3 Integration

File storage for images, reports, and exports.
"""

from typing import Optional, BinaryIO
from datetime import datetime
import mimetypes
from .config import aws_settings, get_aws_session, get_boto_config


class S3Client:
    """S3 file storage client"""

    def __init__(self):
        self.enabled = aws_settings.s3_enabled
        self.bucket = aws_settings.s3_bucket_name
        self.prefix = aws_settings.s3_prefix
        self._client = None

    @property
    def client(self):
        """Lazy-load S3 client"""
        if self._client is None and self.enabled:
            session = get_aws_session()
            self._client = session.client('s3', config=get_boto_config())
        return self._client

    def _get_key(self, filename: str, folder: str = "") -> str:
        """Build S3 key with prefix"""
        parts = [self.prefix]
        if folder:
            parts.append(folder)
        parts.append(filename)
        return "/".join(parts)

    async def upload_file(
        self,
        file: BinaryIO,
        filename: str,
        folder: str = "",
        content_type: Optional[str] = None
    ) -> Optional[str]:
        """
        Upload file to S3.

        Args:
            file: File-like object
            filename: Filename for storage
            folder: Optional folder within bucket
            content_type: MIME type (auto-detected if not provided)

        Returns:
            S3 URL if successful, None otherwise
        """
        if not self.enabled:
            return None

        try:
            key = self._get_key(filename, folder)

            # Auto-detect content type
            if not content_type:
                content_type, _ = mimetypes.guess_type(filename)
                content_type = content_type or 'application/octet-stream'

            self.client.upload_fileobj(
                file,
                self.bucket,
                key,
                ExtraArgs={
                    'ContentType': content_type,
                    'ACL': 'private'
                }
            )

            return f"s3://{self.bucket}/{key}"
        except Exception as e:
            print(f"S3 upload failed: {e}")
            return None

    async def upload_bytes(
        self,
        data: bytes,
        filename: str,
        folder: str = "",
        content_type: Optional[str] = None
    ) -> Optional[str]:
        """Upload bytes to S3"""
        from io import BytesIO
        file = BytesIO(data)
        return await self.upload_file(file, filename, folder, content_type)

    async def download_file(self, key: str) -> Optional[bytes]:
        """Download file from S3"""
        if not self.enabled:
            return None

        try:
            response = self.client.get_object(Bucket=self.bucket, Key=key)
            return response['Body'].read()
        except Exception as e:
            print(f"S3 download failed: {e}")
            return None

    async def get_presigned_url(
        self,
        key: str,
        expiration: int = 3600
    ) -> Optional[str]:
        """
        Generate presigned URL for temporary access.

        Args:
            key: S3 object key
            expiration: URL validity in seconds

        Returns:
            Presigned URL
        """
        if not self.enabled:
            return None

        try:
            url = self.client.generate_presigned_url(
                'get_object',
                Params={'Bucket': self.bucket, 'Key': key},
                ExpiresIn=expiration
            )
            return url
        except Exception as e:
            print(f"Presigned URL generation failed: {e}")
            return None

    async def delete_file(self, key: str) -> bool:
        """Delete file from S3"""
        if not self.enabled:
            return False

        try:
            self.client.delete_object(Bucket=self.bucket, Key=key)
            return True
        except Exception as e:
            print(f"S3 delete failed: {e}")
            return False

    async def list_files(
        self,
        folder: str = "",
        max_keys: int = 100
    ) -> list[dict]:
        """List files in a folder"""
        if not self.enabled:
            return []

        try:
            prefix = self._get_key("", folder)
            response = self.client.list_objects_v2(
                Bucket=self.bucket,
                Prefix=prefix,
                MaxKeys=max_keys
            )

            files = []
            for obj in response.get('Contents', []):
                files.append({
                    'key': obj['Key'],
                    'size': obj['Size'],
                    'last_modified': obj['LastModified'].isoformat()
                })
            return files
        except Exception as e:
            print(f"S3 list failed: {e}")
            return []

    def get_status(self) -> dict:
        """Get S3 bucket status"""
        if not self.enabled:
            return {"enabled": False}

        try:
            self.client.head_bucket(Bucket=self.bucket)
            return {
                "enabled": True,
                "bucket": self.bucket,
                "prefix": self.prefix,
                "status": "connected"
            }
        except Exception as e:
            return {
                "enabled": True,
                "bucket": self.bucket,
                "status": "error",
                "error": str(e)
            }


# Global instance
s3_client = S3Client()
