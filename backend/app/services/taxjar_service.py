"""
TaxJar Service

Provides accurate sales tax calculation for restaurant transactions.
Falls back to configurable default rate when TaxJar is not enabled.
"""

from typing import Optional, Dict, Any
from decimal import Decimal
import logging

logger = logging.getLogger(__name__)


class TaxJarService:
    """Service for calculating sales tax using TaxJar API"""

    def __init__(self, api_key: Optional[str] = None, enabled: bool = False):
        self.api_key = api_key
        self.enabled = enabled and api_key is not None
        self.client = None

        if self.enabled:
            try:
                import taxjar
                self.client = taxjar.Client(api_key=api_key)
                logger.info("TaxJar service initialized successfully")
            except ImportError:
                logger.warning("TaxJar package not installed. Run: pip install taxjar")
                self.enabled = False
            except Exception as e:
                logger.error(f"Failed to initialize TaxJar: {e}")
                self.enabled = False

    async def calculate_tax(
        self,
        amount: float,
        from_address: Dict[str, str],
        to_address: Dict[str, str],
        line_items: Optional[list] = None,
        shipping: float = 0.0,
    ) -> Dict[str, Any]:
        """
        Calculate sales tax for a transaction.

        Args:
            amount: Order subtotal
            from_address: Restaurant address (nexus)
            to_address: Customer address (for delivery)
            line_items: Optional detailed line items
            shipping: Shipping/delivery fee

        Returns:
            Dict with tax amount, rate, and breakdown
        """
        if not self.enabled or not self.client:
            # Fallback to default rate based on restaurant location
            default_rate = self._get_default_rate(from_address.get("state", ""))
            tax_amount = amount * default_rate
            return {
                "tax_amount": round(tax_amount, 2),
                "tax_rate": default_rate,
                "taxable_amount": amount,
                "breakdown": {"combined_tax_rate": default_rate},
                "source": "default",
            }

        try:
            # Call TaxJar API
            tax_data = self.client.tax_for_order({
                "from_country": from_address.get("country", "US"),
                "from_zip": from_address.get("zip", ""),
                "from_state": from_address.get("state", ""),
                "from_city": from_address.get("city", ""),
                "from_street": from_address.get("street", ""),
                "to_country": to_address.get("country", "US"),
                "to_zip": to_address.get("zip", ""),
                "to_state": to_address.get("state", ""),
                "to_city": to_address.get("city", ""),
                "to_street": to_address.get("street", ""),
                "amount": amount,
                "shipping": shipping,
                "line_items": line_items or [],
            })

            return {
                "tax_amount": float(tax_data.amount_to_collect),
                "tax_rate": float(tax_data.rate),
                "taxable_amount": float(tax_data.taxable_amount),
                "breakdown": {
                    "combined_tax_rate": float(tax_data.rate),
                    "state_tax_rate": float(getattr(tax_data.breakdown, "state_tax_rate", 0)),
                    "county_tax_rate": float(getattr(tax_data.breakdown, "county_tax_rate", 0)),
                    "city_tax_rate": float(getattr(tax_data.breakdown, "city_tax_rate", 0)),
                    "special_tax_rate": float(getattr(tax_data.breakdown, "special_district_tax_rate", 0)),
                },
                "source": "taxjar",
            }

        except Exception as e:
            logger.error(f"TaxJar API error: {e}")
            # Fallback to default rate on error
            default_rate = self._get_default_rate(from_address.get("state", ""))
            tax_amount = amount * default_rate
            return {
                "tax_amount": round(tax_amount, 2),
                "tax_rate": default_rate,
                "taxable_amount": amount,
                "breakdown": {"combined_tax_rate": default_rate},
                "source": "default",
                "error": str(e),
            }

    def _get_default_rate(self, state: str) -> float:
        """
        Get default tax rate for a state when TaxJar is unavailable.
        
        These are approximate state base rates. Real rates include local taxes.
        """
        DEFAULT_STATE_RATES = {
            # High tax states
            "CA": 0.0725,  # California
            "NY": 0.04,    # New York
            "WA": 0.065,   # Washington
            "IL": 0.0625,  # Illinois
            "TX": 0.0625,  # Texas
            # Medium tax states
            "FL": 0.06,    # Florida
            "PA": 0.06,    # Pennsylvania
            "OH": 0.0575,  # Ohio
            "GA": 0.04,    # Georgia
            "NC": 0.0475,  # North Carolina
            "MI": 0.06,    # Michigan
            "NJ": 0.06625, # New Jersey
            "VA": 0.053,   # Virginia
            "MA": 0.0625,  # Massachusetts
            "AZ": 0.056,   # Arizona
            "TN": 0.07,    # Tennessee
            "IN": 0.07,    # Indiana
            "MO": 0.04225, # Missouri
            "MD": 0.06,    # Maryland
            "WI": 0.05,    # Wisconsin
            # Low/no tax states
            "OR": 0.0,     # Oregon (no sales tax)
            "NH": 0.0,     # New Hampshire
            "DE": 0.0,     # Delaware
            "MT": 0.0,     # Montana
            "AK": 0.0,     # Alaska
        }
        
        return DEFAULT_STATE_RATES.get(state.upper(), 0.08)  # Default 8% if state unknown

    async def validate_address(self, address: Dict[str, str]) -> Dict[str, Any]:
        """Validate an address using TaxJar"""
        if not self.enabled or not self.client:
            return {"valid": True, "source": "not_validated"}

        try:
            result = self.client.validate_address({
                "country": address.get("country", "US"),
                "state": address.get("state", ""),
                "zip": address.get("zip", ""),
                "city": address.get("city", ""),
                "street": address.get("street", ""),
            })
            
            return {
                "valid": True,
                "source": "taxjar",
                "addresses": result.addresses,
            }
        except Exception as e:
            logger.error(f"TaxJar address validation error: {e}")
            return {"valid": False, "error": str(e)}

    async def create_transaction(
        self,
        transaction_id: str,
        transaction_date: str,
        amount: float,
        tax_amount: float,
        from_address: Dict[str, str],
        to_address: Dict[str, str],
        line_items: Optional[list] = None,
    ) -> Dict[str, Any]:
        """
        Create a transaction record in TaxJar for reporting.
        
        This helps with sales tax filing and compliance.
        """
        if not self.enabled or not self.client:
            return {"created": False, "source": "disabled"}

        try:
            transaction = self.client.create_order({
                "transaction_id": transaction_id,
                "transaction_date": transaction_date,
                "amount": amount,
                "sales_tax": tax_amount,
                "from_country": from_address.get("country", "US"),
                "from_zip": from_address.get("zip", ""),
                "from_state": from_address.get("state", ""),
                "from_city": from_address.get("city", ""),
                "from_street": from_address.get("street", ""),
                "to_country": to_address.get("country", "US"),
                "to_zip": to_address.get("zip", ""),
                "to_state": to_address.get("state", ""),
                "to_city": to_address.get("city", ""),
                "to_street": to_address.get("street", ""),
                "line_items": line_items or [],
            })

            return {
                "created": True,
                "transaction_id": transaction.transaction_id,
                "source": "taxjar",
            }

        except Exception as e:
            logger.error(f"TaxJar create transaction error: {e}")
            return {"created": False, "error": str(e)}

    async def create_refund(
        self,
        refund_id: str,
        transaction_id: str,
        refund_date: str,
        amount: float,
        tax_amount: float,
        from_address: Dict[str, str],
        to_address: Dict[str, str],
    ) -> Dict[str, Any]:
        """Create a refund transaction in TaxJar"""
        if not self.enabled or not self.client:
            return {"created": False, "source": "disabled"}

        try:
            refund = self.client.create_refund({
                "transaction_id": refund_id,
                "transaction_reference_id": transaction_id,
                "transaction_date": refund_date,
                "amount": amount,
                "sales_tax": tax_amount,
                "from_country": from_address.get("country", "US"),
                "from_zip": from_address.get("zip", ""),
                "from_state": from_address.get("state", ""),
                "from_city": from_address.get("city", ""),
                "from_street": from_address.get("street", ""),
                "to_country": to_address.get("country", "US"),
                "to_zip": to_address.get("zip", ""),
                "to_state": to_address.get("state", ""),
                "to_city": to_address.get("city", ""),
                "to_street": to_address.get("street", ""),
            })

            return {
                "created": True,
                "refund_id": refund.transaction_id,
                "source": "taxjar",
            }

        except Exception as e:
            logger.error(f"TaxJar create refund error: {e}")
            return {"created": False, "error": str(e)}


# Global service instance
from ..config import settings

taxjar_service = TaxJarService(
    api_key=settings.taxjar_api_key,
    enabled=settings.taxjar_enabled
)
