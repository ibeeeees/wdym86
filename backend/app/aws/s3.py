"""
AWS S3 Integration

File storage for images, reports, and exports.
Gracefully degrades to local filesystem when S3 is disabled.
"""

import os
import logging
from typing import Optional, BinaryIO
from datetime import datetime, timezone
from pathlib import Path
import mimetypes
from .config import aws_settings, get_aws_session, get_boto_config

logger = logging.getLogger("wdym86.s3")

# Local uploads directory (relative to backend root)
LOCAL_UPLOADS_DIR = Path(__file__).resolve().parent.parent.parent / "uploads"


def _ensure_local_dir(folder: str = "") -> Path:
    """Ensure local uploads directory exists and return the path."""
    target = LOCAL_UPLOADS_DIR
    if folder:
        target = target / folder
    target.mkdir(parents=True, exist_ok=True)
    return target


class S3Client:
    """
    S3 file storage client with local filesystem fallback.

    When S3_ENABLED=false, all operations transparently use a local
    uploads/ directory instead. No crashes, no unhandled exceptions.
    """

    def __init__(self):
        self.enabled = aws_settings.s3_enabled
        self.bucket = aws_settings.s3_bucket_name
        self.region = aws_settings.s3_region
        self.prefix = aws_settings.s3_prefix
        self._client = None

    @property
    def client(self):
        """Lazy-load S3 client"""
        if self._client is None and self.enabled:
            try:
                session = get_aws_session()
                self._client = session.client('s3', config=get_boto_config())
            except Exception as e:
                logger.error("Failed to create S3 client: %s", e)
                self._client = None
        return self._client

    def _get_key(self, filename: str, folder: str = "") -> str:
        """Build S3 key with prefix"""
        parts = [self.prefix]
        if folder:
            parts.append(folder)
        parts.append(filename)
        return "/".join(p for p in parts if p)

    def _local_path(self, filename: str, folder: str = "") -> Path:
        """Build local filesystem path for fallback storage."""
        base = _ensure_local_dir(folder)
        return base / filename

    # ------------------------------------------------------------------
    # Upload
    # ------------------------------------------------------------------

    async def upload_file(
        self,
        file: BinaryIO,
        filename: str,
        folder: str = "",
        content_type: Optional[str] = None
    ) -> Optional[str]:
        """
        Upload file to S3, or local storage if S3 is disabled.

        Args:
            file: File-like object
            filename: Filename for storage
            folder: Optional folder within bucket
            content_type: MIME type (auto-detected if not provided)

        Returns:
            S3 URL or local:// URL if successful, None on error
        """
        if not content_type:
            content_type, _ = mimetypes.guess_type(filename)
            content_type = content_type or 'application/octet-stream'

        if not self.enabled:
            return self._upload_local(file, filename, folder)

        try:
            key = self._get_key(filename, folder)

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
            logger.warning("S3 upload failed, falling back to local storage: %s", e)
            # Reset file position for local fallback
            try:
                file.seek(0)
            except Exception:
                pass
            return self._upload_local(file, filename, folder)

    def _upload_local(
        self,
        file: BinaryIO,
        filename: str,
        folder: str = ""
    ) -> Optional[str]:
        """Save file to local uploads/ directory."""
        try:
            path = self._local_path(filename, folder)
            data = file.read()
            path.write_bytes(data)
            rel = path.relative_to(LOCAL_UPLOADS_DIR)
            logger.info("File saved locally: %s", rel)
            return f"local://{rel}"
        except Exception as e:
            logger.error("Local upload failed: %s", e)
            return None

    async def upload_bytes(
        self,
        data: bytes,
        filename: str,
        folder: str = "",
        content_type: Optional[str] = None
    ) -> Optional[str]:
        """Upload bytes to S3 or local storage."""
        from io import BytesIO
        file = BytesIO(data)
        return await self.upload_file(file, filename, folder, content_type)

    # ------------------------------------------------------------------
    # Download
    # ------------------------------------------------------------------

    async def download_file(self, key: str) -> Optional[bytes]:
        """
        Download file from S3 or local storage.

        Checks local storage first, then S3 if enabled.
        """
        # Always check local storage first
        local_bytes = self._download_local(key)
        if local_bytes is not None:
            return local_bytes

        if not self.enabled:
            logger.info("S3 disabled, file not found in local storage: %s", key)
            return None

        try:
            response = self.client.get_object(Bucket=self.bucket, Key=key)
            return response['Body'].read()
        except Exception as e:
            logger.error("S3 download failed: %s", e)
            return None

    def _download_local(self, key: str) -> Optional[bytes]:
        """Try to read file from local uploads directory."""
        try:
            # Strip the prefix if present
            clean_key = key
            if clean_key.startswith(self.prefix + "/"):
                clean_key = clean_key[len(self.prefix) + 1:]
            # Also handle local:// URIs
            if clean_key.startswith("local://"):
                clean_key = clean_key[len("local://"):]

            path = LOCAL_UPLOADS_DIR / clean_key
            if path.is_file():
                return path.read_bytes()
        except Exception as e:
            logger.debug("Local download lookup failed (non-fatal): %s", e)
        return None

    # ------------------------------------------------------------------
    # Presigned URLs
    # ------------------------------------------------------------------

    async def get_presigned_url(
        self,
        key: str,
        expiration: int = 3600
    ) -> Optional[str]:
        """
        Generate presigned URL for temporary access.

        When S3 is disabled, returns a local file path reference instead.
        """
        if not self.enabled:
            # Check if the file exists locally and return a path-based reference
            local_bytes = self._download_local(key)
            if local_bytes is not None:
                clean_key = key
                if clean_key.startswith(self.prefix + "/"):
                    clean_key = clean_key[len(self.prefix) + 1:]
                return f"/uploads/{clean_key}"
            logger.info("S3 disabled, no local file for presigned URL: %s", key)
            return None

        try:
            url = self.client.generate_presigned_url(
                'get_object',
                Params={'Bucket': self.bucket, 'Key': key},
                ExpiresIn=expiration
            )
            return url
        except Exception as e:
            logger.error("Presigned URL generation failed: %s", e)
            return None

    # ------------------------------------------------------------------
    # Delete
    # ------------------------------------------------------------------

    async def delete_file(self, key: str) -> bool:
        """
        Delete file from S3 or local storage.

        Returns True if deleted, False otherwise.
        """
        if not self.enabled:
            return self._delete_local(key)

        try:
            self.client.delete_object(Bucket=self.bucket, Key=key)
            # Also clean up any local copy
            self._delete_local(key)
            return True
        except Exception as e:
            logger.error("S3 delete failed: %s", e)
            return False

    def _delete_local(self, key: str) -> bool:
        """Delete file from local uploads directory."""
        try:
            clean_key = key
            if clean_key.startswith(self.prefix + "/"):
                clean_key = clean_key[len(self.prefix) + 1:]
            if clean_key.startswith("local://"):
                clean_key = clean_key[len("local://"):]

            path = LOCAL_UPLOADS_DIR / clean_key
            if path.is_file():
                path.unlink()
                logger.info("Deleted local file: %s", clean_key)
                return True
        except Exception as e:
            logger.debug("Local delete failed (non-fatal): %s", e)
        return False

    # ------------------------------------------------------------------
    # List files
    # ------------------------------------------------------------------

    async def list_files(
        self,
        folder: str = "",
        max_keys: int = 100
    ) -> list[dict]:
        """
        List files in a folder.

        When S3 is disabled, lists files from local uploads/ directory.
        """
        if not self.enabled:
            return self._list_local(folder, max_keys)

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
            logger.error("S3 list failed, falling back to local: %s", e)
            return self._list_local(folder, max_keys)

    def _list_local(self, folder: str = "", max_keys: int = 100) -> list[dict]:
        """List files from local uploads directory."""
        try:
            target = LOCAL_UPLOADS_DIR
            if folder:
                target = target / folder

            if not target.is_dir():
                return []

            files = []
            for path in sorted(target.iterdir()):
                if path.is_file() and not path.name.startswith('.'):
                    stat = path.stat()
                    files.append({
                        'key': f"local://{path.relative_to(LOCAL_UPLOADS_DIR)}",
                        'size': stat.st_size,
                        'last_modified': datetime.fromtimestamp(
                            stat.st_mtime, tz=timezone.utc
                        ).isoformat(),
                        'storage': 'local'
                    })
                    if len(files) >= max_keys:
                        break
            return files
        except Exception as e:
            logger.debug("Local list failed (non-fatal): %s", e)
            return []

    # ------------------------------------------------------------------
    # Status
    # ------------------------------------------------------------------

    def get_status(self) -> dict:
        """
        Get S3 / storage status.

        Always returns a well-formed dict -- never raises.
        """
        base = {
            "enabled": self.enabled,
            "bucket": self.bucket,
            "region": self.region,
            "prefix": self.prefix,
        }

        if not self.enabled:
            base["status"] = "disabled"
            base["storage_mode"] = "local"
            base["local_path"] = str(LOCAL_UPLOADS_DIR)
            base["message"] = "S3 disabled - using local storage"
            # Count local files
            try:
                local_files = self._list_local()
                base["local_file_count"] = len(local_files)
            except Exception:
                base["local_file_count"] = 0
            return base

        # S3 is enabled -- test connectivity
        try:
            if self.client is None:
                base["status"] = "error"
                base["error"] = "Failed to initialize S3 client"
                base["storage_mode"] = "local_fallback"
                return base

            self.client.head_bucket(Bucket=self.bucket)
            base["status"] = "connected"
            base["storage_mode"] = "s3"
            return base
        except Exception as e:
            base["status"] = "error"
            base["error"] = str(e)
            base["storage_mode"] = "local_fallback"
            base["message"] = "S3 unreachable - local fallback active"
            return base


# Global instance
s3_client = S3Client()
