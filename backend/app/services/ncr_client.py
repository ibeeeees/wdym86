"""
NCR BSP API Client

Async HTTP client for NCR Voyix Business Services Platform APIs.
Covers Order, TDM (Transaction Document Management), Catalog, and Sites services.
Falls back to demo data when credentials are not configured.
"""

import logging
from datetime import datetime, timezone
from typing import Optional

import httpx

from .ncr_auth import NCRAuth

logger = logging.getLogger(__name__)

# Service path constants (from Postman pre-request script lines 2322-2328)
ORDER_PATH = "/order/3/orders/1"
TDM_PATH = "/transaction-document/transaction-documents"
CATALOG_PATH = "/catalog/v2"
SITE_PATH = "/site"
CDM_PATH = "/cdm"


class NCRBSPClient:
    """Async client for NCR BSP APIs with demo fallback."""

    def __init__(self, auth: NCRAuth, base_url: str = "https://api.ncr.com"):
        self.auth = auth
        self.base_url = base_url.rstrip("/")
        self.client = httpx.AsyncClient(timeout=15.0)
        self._demo_mode = not (auth.shared_key and auth.secret_key)

    async def close(self):
        await self.client.aclose()

    async def _request(
        self,
        method: str,
        path: str,
        json_data: dict | None = None,
        params: dict | None = None,
    ) -> dict:
        """Make an authenticated request to NCR BSP API."""
        url = f"{self.base_url}{path}"
        headers = self.auth.generate_headers(method, url)

        if method.upper() == "GET":
            headers.pop("Content-Type", None)

        try:
            response = await self.client.request(
                method=method,
                url=url,
                headers=headers,
                json=json_data,
                params=params,
            )
            response.raise_for_status()
            return response.json() if response.content else {}
        except httpx.HTTPStatusError as e:
            logger.error(f"NCR API error {e.response.status_code}: {e.response.text[:500]}")
            raise
        except httpx.RequestError as e:
            logger.error(f"NCR API request failed: {e}")
            raise

    # ─── Order Service ────────────────────────────────────────────────

    async def create_order(self, order_data: dict) -> dict:
        if self._demo_mode:
            return _demo_order()
        return await self._request("POST", ORDER_PATH, json_data=order_data)

    async def get_order(self, order_id: str) -> dict:
        if self._demo_mode:
            return _demo_order(order_id)
        return await self._request("GET", f"{ORDER_PATH}/{order_id}")

    async def find_orders(self, enterprise_unit_id: str | None = None) -> dict:
        if self._demo_mode:
            return {"results": [_demo_order("demo-001"), _demo_order("demo-002")]}
        body = {}
        if enterprise_unit_id:
            body["enterpriseUnitId"] = enterprise_unit_id
        return await self._request("POST", f"{ORDER_PATH}/find", json_data=body)

    async def patch_order(self, order_id: str, patch_data: dict) -> dict:
        if self._demo_mode:
            return _demo_order(order_id)
        return await self._request("PATCH", f"{ORDER_PATH}/{order_id}", json_data=patch_data)

    async def find_unacknowledged(self) -> dict:
        if self._demo_mode:
            return {"results": [_demo_order("unack-001")]}
        return await self._request("GET", f"{ORDER_PATH}/find-unacknowledged")

    async def acknowledge_order(self, order_id: str) -> dict:
        if self._demo_mode:
            return {"acknowledged": True}
        return await self._request("POST", f"{ORDER_PATH}/{order_id}/acks")

    # ─── TDM (Transaction Document Management) ───────────────────────

    async def create_tlog(self, tlog_data: dict) -> dict:
        if self._demo_mode:
            return {"id": "demo-tlog-001", "status": "created"}
        return await self._request("POST", TDM_PATH, json_data=tlog_data)

    async def get_tlog(self, tlog_id: str) -> dict:
        if self._demo_mode:
            return _demo_tlog(tlog_id)
        return await self._request("GET", f"{TDM_PATH}/{tlog_id}")

    async def find_tlogs(self, from_date: str, to_date: str) -> dict:
        if self._demo_mode:
            return {"transactionDocuments": [_demo_tlog("demo-tlog-001"), _demo_tlog("demo-tlog-002")]}
        body = {
            "fromTransactionDateTimeUtc": {"dateTime": from_date},
            "toTransactionDateTimeUtc": {"dateTime": to_date},
        }
        return await self._request("POST", f"{TDM_PATH}/find", json_data=body)

    # ─── Catalog Service ─────────────────────────────────────────────

    async def create_or_update_item(self, item_code: str, item_data: dict) -> dict:
        if self._demo_mode:
            return {"itemCode": item_code, "status": "ACTIVE"}
        return await self._request("PUT", f"{CATALOG_PATH}/items/{item_code}", json_data=item_data)

    async def get_item(self, item_code: str) -> dict:
        if self._demo_mode:
            return _demo_catalog_item(item_code)
        return await self._request("GET", f"{CATALOG_PATH}/items/{item_code}")

    async def find_items(self, code_pattern: str = "*", description_pattern: str = "*") -> dict:
        if self._demo_mode:
            return {"items": _demo_catalog_items()}
        return await self._request(
            "GET",
            f"{CATALOG_PATH}/items/",
            params={"codePattern": code_pattern, "longDescriptionPattern": description_pattern},
        )

    async def create_or_update_price(self, item_code: str, price_code: str, price_data: dict) -> dict:
        if self._demo_mode:
            return {"itemCode": item_code, "priceCode": price_code, "price": 12.99}
        return await self._request("PUT", f"{CATALOG_PATH}/item-prices/{item_code}/{price_code}", json_data=price_data)

    async def get_price_snapshot(self) -> dict:
        if self._demo_mode:
            return {"prices": []}
        return await self._request("GET", f"{CATALOG_PATH}/item-prices/snapshot")

    # ─── Sites Service ───────────────────────────────────────────────

    async def create_site(self, site_data: dict) -> dict:
        if self._demo_mode:
            return _demo_site()
        return await self._request("POST", f"{SITE_PATH}/sites", json_data=site_data)

    async def get_site(self, site_id: str) -> dict:
        if self._demo_mode:
            return _demo_site(site_id)
        return await self._request("GET", f"{SITE_PATH}/sites/{site_id}")

    async def find_sites(self, criteria: dict | None = None) -> dict:
        if self._demo_mode:
            return {"sites": [_demo_site()]}
        body = {"criteria": criteria or {"status": "ACTIVE"}}
        return await self._request("POST", f"{SITE_PATH}/sites/find-by-criteria", json_data=body)


# ─── Demo Data (Mykonos Mediterranean theme) ─────────────────────────

def _demo_order(order_id: str = "demo-order-001") -> dict:
    return {
        "id": order_id,
        "status": "OrderPlaced",
        "channel": "Web",
        "currency": "USD",
        "customer": {"firstName": "Demo", "lastName": "Customer", "name": "Demo Customer"},
        "orderLines": [
            {
                "productId": {"type": "UPC", "value": "Lamb Souvlaki"},
                "description": "Lamb Souvlaki Plate",
                "unitPrice": 28.00,
                "extendedAmount": 28.00,
                "quantity": {"value": 1, "unitOfMeasure": "EA"},
            },
            {
                "productId": {"type": "UPC", "value": "Greek Salad"},
                "description": "Traditional Greek Salad",
                "unitPrice": 14.00,
                "extendedAmount": 14.00,
                "quantity": {"value": 1, "unitOfMeasure": "EA"},
            },
        ],
        "payments": [{"amount": 48.38, "gratuity": 7.26, "status": "Paid", "type": "CreditDebit"}],
        "totals": [{"type": "Net", "value": 42.00}],
        "taxes": [{"amount": 3.78, "code": "Sales Tax", "percentage": 0.09}],
        "owner": "Mykonos Mediterranean",
    }


def _demo_tlog(tlog_id: str = "demo-tlog-001") -> dict:
    return {
        "id": tlog_id,
        "siteInfo": {"name": "Mykonos Mediterranean", "id": "5"},
        "transactionNumber": "12345",
        "businessDay": {"dateTime": datetime.now(timezone.utc).strftime("%Y-%m-%dT00:00:00Z")},
        "tlog": {
            "transactionType": "SALES",
            "totals": {
                "grossAmount": {"amount": 4523.50},
                "grandAmount": {"amount": 4928.62},
                "netAmount": {"amount": 4523.50},
                "taxExclusive": {"amount": 405.12},
                "discountAmount": {"amount": 0.00},
                "voidsAmount": {"amount": 0.00},
            },
            "employees": [
                {"id": "1001", "name": "Maria K.", "roleName": "Server", "isTippableEmployee": True},
                {"id": "1002", "name": "Nikos P.", "roleName": "Server", "isTippableEmployee": True},
            ],
            "items": [
                {
                    "id": "item-001",
                    "productId": "GYRO-001",
                    "productName": "Lamb Gyro Plate",
                    "quantity": {"quantity": 45},
                    "actualAmount": {"amount": 1260.00},
                    "category": {"id": "MAINS", "name": "Mains"},
                },
                {
                    "id": "item-002",
                    "productId": "SOUV-001",
                    "productName": "Chicken Souvlaki",
                    "quantity": {"quantity": 38},
                    "actualAmount": {"amount": 874.00},
                    "category": {"id": "MAINS", "name": "Mains"},
                },
                {
                    "id": "item-003",
                    "productId": "SAL-001",
                    "productName": "Greek Salad",
                    "quantity": {"quantity": 52},
                    "actualAmount": {"amount": 728.00},
                    "category": {"id": "SALADS", "name": "Salads"},
                },
                {
                    "id": "item-004",
                    "productId": "HUM-001",
                    "productName": "Hummus Platter",
                    "quantity": {"quantity": 34},
                    "actualAmount": {"amount": 408.00},
                    "category": {"id": "MEZZE", "name": "Mezze"},
                },
                {
                    "id": "item-005",
                    "productId": "OCTO-001",
                    "productName": "Grilled Octopus",
                    "quantity": {"quantity": 22},
                    "actualAmount": {"amount": 572.00},
                    "category": {"id": "SEAFOOD", "name": "Seafood"},
                },
                {
                    "id": "item-006",
                    "productId": "BKLV-001",
                    "productName": "Baklava",
                    "quantity": {"quantity": 28},
                    "actualAmount": {"amount": 252.00},
                    "category": {"id": "DESSERTS", "name": "Desserts"},
                },
            ],
            "tenders": [
                {"id": "t-001", "name": "Visa", "type": "CREDIT_CARD", "tenderAmount": {"amount": 3200.00}, "tipAmount": {"amount": 480.00}},
                {"id": "t-002", "name": "Am Ex", "type": "CREDIT_CARD", "tenderAmount": {"amount": 1200.00}, "tipAmount": {"amount": 180.00}},
                {"id": "t-003", "name": "Cash", "type": "CASH", "tenderAmount": {"amount": 528.62}, "tipAmount": {"amount": 62.00}},
            ],
            "orders": [{"orderNumber": "1", "orderChannel": "WALK_IN", "orderSource": "POS"}],
            "customerCount": 87,
        },
        "transactionCategory": "SALE_OR_RETURN",
    }


def _demo_catalog_item(item_code: str = "GYRO-001") -> dict:
    items = {item["itemCode"]: item for item in _demo_catalog_items()}
    return items.get(item_code, _demo_catalog_items()[0])


def _demo_catalog_items() -> list:
    return [
        {"itemCode": "GYRO-001", "shortDescription": {"values": [{"locale": "en-US", "value": "Lamb Gyro Plate"}]}, "status": "ACTIVE", "merchandiseCategory": {"nodeId": "MAINS"}, "price": 28.00},
        {"itemCode": "SOUV-001", "shortDescription": {"values": [{"locale": "en-US", "value": "Chicken Souvlaki"}]}, "status": "ACTIVE", "merchandiseCategory": {"nodeId": "MAINS"}, "price": 23.00},
        {"itemCode": "SAL-001", "shortDescription": {"values": [{"locale": "en-US", "value": "Greek Salad"}]}, "status": "ACTIVE", "merchandiseCategory": {"nodeId": "SALADS"}, "price": 14.00},
        {"itemCode": "HUM-001", "shortDescription": {"values": [{"locale": "en-US", "value": "Hummus Platter"}]}, "status": "ACTIVE", "merchandiseCategory": {"nodeId": "MEZZE"}, "price": 12.00},
        {"itemCode": "OCTO-001", "shortDescription": {"values": [{"locale": "en-US", "value": "Grilled Octopus"}]}, "status": "ACTIVE", "merchandiseCategory": {"nodeId": "SEAFOOD"}, "price": 26.00},
        {"itemCode": "BKLV-001", "shortDescription": {"values": [{"locale": "en-US", "value": "Baklava"}]}, "status": "ACTIVE", "merchandiseCategory": {"nodeId": "DESSERTS"}, "price": 9.00},
        {"itemCode": "MOUS-001", "shortDescription": {"values": [{"locale": "en-US", "value": "Moussaka"}]}, "status": "ACTIVE", "merchandiseCategory": {"nodeId": "MAINS"}, "price": 22.00},
        {"itemCode": "SPAN-001", "shortDescription": {"values": [{"locale": "en-US", "value": "Spanakopita"}]}, "status": "ACTIVE", "merchandiseCategory": {"nodeId": "MEZZE"}, "price": 11.00},
        {"itemCode": "CALAM-001", "shortDescription": {"values": [{"locale": "en-US", "value": "Calamari"}]}, "status": "ACTIVE", "merchandiseCategory": {"nodeId": "SEAFOOD"}, "price": 16.00},
        {"itemCode": "TZAT-001", "shortDescription": {"values": [{"locale": "en-US", "value": "Tzatziki & Pita"}]}, "status": "ACTIVE", "merchandiseCategory": {"nodeId": "MEZZE"}, "price": 10.00},
    ]


def _demo_site(site_id: str = "demo-site-001") -> dict:
    return {
        "id": site_id,
        "siteName": "Mykonos Mediterranean",
        "enterpriseUnitName": "Mykonos Mediterranean",
        "status": "ACTIVE",
        "currency": "USD",
        "timeZone": "US/Eastern",
        "address": {"street": "123 Mediterranean Ave", "city": "Athens", "state": "GA", "country": "USA", "postalCode": "30601"},
        "coordinates": {"latitude": 33.9519, "longitude": -83.3576},
        "contact": {"contactPerson": "Nikos Papadopoulos", "phoneNumber": "7065551234"},
    }


def get_ncr_client() -> NCRBSPClient:
    """Factory function to create an NCR BSP client from app settings."""
    from ..config import settings

    auth = NCRAuth(
        shared_key=settings.ncr_bsp_shared_key or "",
        secret_key=settings.ncr_bsp_secret_key or "",
        organization=settings.ncr_bsp_organization or "",
        enterprise_unit=settings.ncr_bsp_enterprise_unit or "",
    )
    return NCRBSPClient(auth=auth, base_url=settings.ncr_bsp_base_url)
