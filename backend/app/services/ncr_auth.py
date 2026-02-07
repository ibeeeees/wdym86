"""
NCR BSP HMAC-SHA512 Authentication

Ports the exact HMAC algorithm from the Postman collection pre-request script
(sandbox-collection.postman_collection.json, lines 2351-2379).

Authorization format: AccessKey {sharedKey}:{base64_hmac}
"""

import hmac
import hashlib
import base64
from datetime import datetime, timezone
from email.utils import formatdate
from urllib.parse import urlparse


class NCRAuth:
    """Generates HMAC-SHA512 signed headers for NCR BSP API requests."""

    def __init__(
        self,
        shared_key: str,
        secret_key: str,
        organization: str,
        enterprise_unit: str,
    ):
        self.shared_key = shared_key
        self.secret_key = secret_key
        self.organization = organization
        self.enterprise_unit = enterprise_unit

    def generate_headers(
        self,
        method: str,
        url: str,
        content_type: str = "application/json",
        content_md5: str | None = None,
    ) -> dict:
        """
        Generate signed headers for an NCR BSP API request.

        Args:
            method: HTTP method (GET, POST, PUT, PATCH, DELETE)
            url: Full request URL
            content_type: Content-Type header value
            content_md5: Optional Content-MD5 header value

        Returns:
            Dict of headers to include in the request
        """
        now = datetime.now(timezone.utc)

        # Date header in RFC 2822 format (matches JS toGMTString())
        date_str = formatdate(timeval=now.timestamp(), localtime=False, usegmt=True)

        # ISO nonce for signing key (matches JS: date.toISOString().slice(0,19) + '.000Z')
        iso_nonce = now.strftime("%Y-%m-%dT%H:%M:%S") + ".000Z"
        unique_key = self.secret_key + iso_nonce

        # Extract request path from URL (matches JS: url.replace(/^https?:\/\/[^\/]+\//, '/'))
        parsed = urlparse(url)
        request_path = parsed.path
        if parsed.query:
            request_path += "?" + parsed.query

        # Build signable content (matches JS: params.filter(p => p && p.length > 0).join('\n'))
        params = [
            method.upper(),
            request_path,
            content_type,
            content_md5,
            self.organization,
        ]
        signable_content = "\n".join(p for p in params if p)

        # Compute HMAC-SHA512 and Base64 encode
        signature = hmac.new(
            unique_key.encode("utf-8"),
            signable_content.encode("utf-8"),
            hashlib.sha512,
        ).digest()
        b64_signature = base64.b64encode(signature).decode("utf-8")

        return {
            "Authorization": f"AccessKey {self.shared_key}:{b64_signature}",
            "Date": date_str,
            "Content-Type": content_type,
            "nep-organization": self.organization,
            "nep-enterprise-unit": self.enterprise_unit,
        }
