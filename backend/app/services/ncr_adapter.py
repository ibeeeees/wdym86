"""
NCR Aloha Adapter

Maps between NCR BSP data formats and internal WDYM86 models.
Handles catalog sync, transaction log import, and order sync.
"""

import logging
from datetime import datetime, timezone
from typing import Optional

from .ncr_client import NCRBSPClient, get_ncr_client

logger = logging.getLogger(__name__)


class NCRAlohaAdapter:
    """Adapter bridging NCR BSP API data with internal WDYM86 models."""

    def __init__(self, client: Optional[NCRBSPClient] = None):
        self.client = client or get_ncr_client()

    # ─── Catalog Sync ────────────────────────────────────────────────

    async def get_catalog_items(self) -> list[dict]:
        """Fetch NCR catalog items and normalize to internal format."""
        result = await self.client.find_items()
        items = result.get("items", result.get("pageContent", []))
        return [self._normalize_catalog_item(item) for item in items]

    def _normalize_catalog_item(self, ncr_item: dict) -> dict:
        """Map NCR catalog item to internal Dish-compatible format."""
        name = "Unknown Item"
        short_desc = ncr_item.get("shortDescription", {})
        if isinstance(short_desc, dict):
            values = short_desc.get("values", [])
            if values:
                name = values[0].get("value", name)
        elif isinstance(short_desc, str):
            name = short_desc

        category_node = ncr_item.get("merchandiseCategory", {})
        category = category_node.get("nodeId", "uncategorized") if isinstance(category_node, dict) else "uncategorized"

        return {
            "ncr_item_code": ncr_item.get("itemCode", ""),
            "name": name,
            "category": category.lower(),
            "price": ncr_item.get("price", 0.0),
            "is_active": ncr_item.get("status", "ACTIVE") == "ACTIVE",
            "ncr_raw": ncr_item,
        }

    # ─── Transaction Log (TDM) Sync ──────────────────────────────────

    async def get_tlogs(self, from_date: str, to_date: str) -> list[dict]:
        """Fetch NCR transaction logs and normalize to analytics format."""
        result = await self.client.find_tlogs(from_date, to_date)
        tlogs = result.get("transactionDocuments", result.get("tlogData", []))
        return [self._normalize_tlog(tlog) for tlog in tlogs]

    def _normalize_tlog(self, ncr_tlog: dict) -> dict:
        """Map NCR tlog to DailySalesSnapshot-compatible format."""
        tlog = ncr_tlog.get("tlog", {})
        totals = tlog.get("totals", {})
        tenders = tlog.get("tenders", [])
        items = tlog.get("items", [])
        employees = tlog.get("employees", [])

        total_tips = sum(
            t.get("tipAmount", {}).get("amount", 0) for t in tenders
        )
        total_revenue = totals.get("netAmount", {}).get("amount", 0)
        tax = totals.get("taxExclusive", {}).get("amount", 0)
        voids = totals.get("voidsAmount", {}).get("amount", 0)
        discount = totals.get("discountAmount", {}).get("amount", 0)

        # Item analytics
        item_sales = []
        for item in items:
            qty = item.get("quantity", {}).get("quantity", 0)
            amount = item.get("actualAmount", {}).get("amount", 0)
            cat = item.get("category", {})
            item_sales.append({
                "product_id": item.get("productId", ""),
                "name": item.get("productName", "Unknown"),
                "quantity": qty,
                "revenue": amount,
                "category": cat.get("name", "Other") if isinstance(cat, dict) else "Other",
                "is_voided": item.get("isVoided", False),
            })

        # Find top item
        top_item = max(item_sales, key=lambda x: x["revenue"], default={"name": "", "product_id": ""})

        # Order channel breakdown
        orders = tlog.get("orders", [])
        dine_in = sum(1 for o in orders if o.get("orderChannel") == "WALK_IN")
        delivery = sum(1 for o in orders if o.get("orderChannel") == "DELIVERY")
        takeout = sum(1 for o in orders if o.get("orderChannel") in ("PICKUP", "DRIVE_THROUGH"))

        # Business day
        biz_day = ncr_tlog.get("businessDay", {})
        date_str = biz_day.get("dateTime", datetime.now(timezone.utc).isoformat())

        return {
            "date": date_str,
            "total_revenue": total_revenue,
            "total_orders": tlog.get("customerCount", len(orders) or 1),
            "dine_in_orders": dine_in,
            "takeout_orders": takeout,
            "delivery_orders": delivery,
            "total_tips": total_tips,
            "tax": tax,
            "refunds": 0,
            "voids": int(voids),
            "discount": discount,
            "top_dish_name": top_item["name"],
            "top_dish_id": top_item["product_id"],
            "item_sales": item_sales,
            "employees": [{"id": e.get("id"), "name": e.get("name"), "role": e.get("roleName")} for e in employees],
            "tenders": [
                {"type": t.get("type", ""), "name": t.get("name", ""), "amount": t.get("tenderAmount", {}).get("amount", 0), "tip": t.get("tipAmount", {}).get("amount", 0)}
                for t in tenders
            ],
            "ncr_tlog_id": ncr_tlog.get("id", ""),
        }

    # ─── Order Sync ──────────────────────────────────────────────────

    async def pull_orders(self) -> list[dict]:
        """Fetch unacknowledged NCR orders and normalize to internal format."""
        result = await self.client.find_unacknowledged()
        orders = result.get("results", [])
        normalized = []
        for ncr_order in orders:
            normalized.append(self._normalize_order(ncr_order))
        return normalized

    async def get_all_orders(self) -> list[dict]:
        """Fetch all NCR orders."""
        result = await self.client.find_orders()
        orders = result.get("results", [])
        return [self._normalize_order(o) for o in orders]

    def _normalize_order(self, ncr_order: dict) -> dict:
        """Map NCR order to internal Order-compatible format."""
        # Status mapping
        status_map = {
            "OrderPlaced": "pending",
            "InFulfillment": "preparing",
            "ReadyForPickup": "ready",
            "Completed": "completed",
            "Cancelled": "cancelled",
        }
        ncr_status = ncr_order.get("status", "OrderPlaced")

        # Fulfillment type mapping
        fulfillment = ncr_order.get("fulfillment", {})
        ftype = fulfillment.get("type", "")
        order_type_map = {"Delivery": "delivery", "Pickup": "takeout"}
        order_type = order_type_map.get(ftype, "dine_in")

        # Parse order lines
        items = []
        for line in ncr_order.get("orderLines", []):
            product = line.get("productId", {})
            qty_obj = line.get("quantity", {})
            items.append({
                "name": product.get("value", line.get("description", "Unknown")),
                "quantity": int(qty_obj.get("value", 1)),
                "unit_price": line.get("unitPrice", 0),
                "subtotal": line.get("extendedAmount", 0),
                "modifiers": [m.get("description", "") for m in line.get("priceModifiers", [])],
                "special_instructions": "; ".join(n.get("value", "") for n in line.get("notes", [])),
            })

        # Totals
        net_total = 0
        for t in ncr_order.get("totals", []):
            if t.get("type") == "Net":
                net_total = t.get("value", 0)

        tax_total = sum(t.get("amount", 0) for t in ncr_order.get("taxes", []))

        # Payments and tips
        payments = ncr_order.get("payments", [])
        tip_total = sum(p.get("gratuity", 0) for p in payments)
        payment_method = payments[0].get("type", "card") if payments else "card"
        payment_method_map = {"Cash": "cash", "CreditDebit": "card", "Mobile": "mobile"}

        customer = ncr_order.get("customer", {})

        return {
            "ncr_order_id": ncr_order.get("id", ""),
            "status": status_map.get(ncr_status, "pending"),
            "order_type": order_type,
            "customer_name": customer.get("name", ""),
            "items": items,
            "subtotal": net_total,
            "tax": tax_total,
            "tip": tip_total,
            "total": net_total + tax_total + tip_total,
            "payment_method": payment_method_map.get(payment_method, "card"),
            "ncr_raw": ncr_order,
        }

    def build_ncr_order(self, internal_order: dict) -> dict:
        """Convert internal order format to NCR BSP order format for pushing."""
        order_type_map = {"delivery": "Delivery", "takeout": "Pickup", "dine_in": "DineIn"}
        status_map = {"pending": "OrderPlaced", "preparing": "InFulfillment", "ready": "ReadyForPickup", "completed": "Completed", "cancelled": "Cancelled"}

        order_lines = []
        for item in internal_order.get("items", []):
            order_lines.append({
                "productId": {"type": "UPC", "value": item.get("name", "")},
                "description": item.get("name", ""),
                "unitPrice": item.get("unit_price", 0),
                "extendedAmount": item.get("subtotal", 0),
                "quantity": {"value": item.get("quantity", 1), "unitOfMeasure": "EA"},
            })

        return {
            "channel": "Web",
            "currency": "USD",
            "status": status_map.get(internal_order.get("status", "pending"), "OrderPlaced"),
            "owner": "Mykonos Mediterranean",
            "customer": {"name": internal_order.get("customer_name", "")},
            "orderLines": order_lines,
            "fulfillment": {"type": order_type_map.get(internal_order.get("order_type", "dine_in"), "DineIn")},
            "totals": [{"type": "Net", "value": internal_order.get("subtotal", 0)}],
            "taxes": [{"amount": internal_order.get("tax", 0), "code": "Sales Tax", "percentage": 0.09}],
            "payments": [{
                "amount": internal_order.get("total", 0),
                "gratuity": internal_order.get("tip", 0),
                "status": "Authorized",
                "type": {"cash": "Cash", "card": "CreditDebit", "mobile": "Mobile"}.get(internal_order.get("payment_method", "card"), "CreditDebit"),
            }],
        }

    async def push_order(self, internal_order: dict) -> dict:
        """Push an internal order to NCR BSP."""
        ncr_order = self.build_ncr_order(internal_order)
        return await self.client.create_order(ncr_order)

    # ─── Sites ───────────────────────────────────────────────────────

    async def verify_connection(self) -> dict:
        """Verify NCR BSP connection by fetching sites."""
        try:
            result = await self.client.find_sites()
            sites = result.get("sites", result.get("pageContent", []))
            return {
                "connected": True,
                "site_count": len(sites) if isinstance(sites, list) else 0,
                "sites": sites[:5] if isinstance(sites, list) else [],
            }
        except Exception as e:
            logger.error(f"NCR connection verification failed: {e}")
            return {"connected": False, "error": str(e)}
