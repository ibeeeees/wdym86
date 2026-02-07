"""
WDYM86 - AI-Powered Restaurant Inventory Intelligence Platform

FastAPI application entry point.
"""

import re
import time
import logging
from collections import defaultdict
from typing import Callable

from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
from contextlib import asynccontextmanager

from .config import settings
from .database import init_db
from .routers import (
    auth_router,
    restaurants_router,
    ingredients_router,
    suppliers_router,
    inventory_router,
    forecasts_router,
    agents_router,
    gemini_router,
    dishes_router,
    events_router,
    pos_router,
    payments_router,
    delivery_router,
    aws_router,
    subscriptions_router,
    solana_pay_router,
    floor_plan_router,
    disruptions_router,
    inventory_items_router,
    staff_router,
    timeline_router,
    pos_integration_router,
    payroll_router,
    stripe_webhooks_router,
    pos_payments_router,
    tax_router,
)

logger = logging.getLogger("wdym86.security")

# ---------------------------------------------------------------------------
# Sensitive key patterns used by the API key safety middleware
# ---------------------------------------------------------------------------
_SENSITIVE_PATTERNS = re.compile(
    r'("(?:api_key|apikey|api[-_]?secret|secret_key|secret[-_]?key|'
    r'access_key|access[-_]?token|private_key|auth_token|'
    r'aws_secret_access_key|aws_access_key_id|'
    r'gemini_api_key|ncr_bsp_secret_key|ncr_bsp_shared_key|'
    r'stripe_secret_key|stripe_publishable_key|stripe_webhook_secret|'
    r'taxjar_api_key|'
    r'rds_password|solana_wallet_address)"'
    r'\s*:\s*")'           # captures up to the opening quote of the value
    r'([^"]{4,})'          # the actual secret value (4+ chars to avoid masking short placeholders)
    r'(")',                 # closing quote
    re.IGNORECASE,
)


def _mask_secret(match: re.Match) -> str:
    """Replace the middle of a captured secret value with asterisks."""
    prefix = match.group(1)
    value = match.group(2)
    suffix = match.group(3)
    if len(value) <= 6:
        masked = value[0] + "*" * (len(value) - 1)
    else:
        masked = value[:3] + "*" * (len(value) - 6) + value[-3:]
    return f"{prefix}{masked}{suffix}"


# ---------------------------------------------------------------------------
# 1. Rate Limiting Middleware  (sliding window, in-memory)
# ---------------------------------------------------------------------------
class RateLimitMiddleware(BaseHTTPMiddleware):
    """
    Simple in-memory sliding-window rate limiter.
    - 100 req/min for general endpoints
    - 10 req/min  for auth endpoints (paths starting with /auth)
    """

    GENERAL_LIMIT = 100
    AUTH_LIMIT = 10
    WINDOW_SECONDS = 60

    def __init__(self, app):
        super().__init__(app)
        # {ip: [timestamps]}
        self._general_hits: dict[str, list[float]] = defaultdict(list)
        self._auth_hits: dict[str, list[float]] = defaultdict(list)

    def _prune(self, hits: list[float], now: float) -> list[float]:
        """Remove timestamps older than the sliding window."""
        cutoff = now - self.WINDOW_SECONDS
        # Bisect-style pruning (list is append-only so already sorted)
        idx = 0
        for i, t in enumerate(hits):
            if t >= cutoff:
                idx = i
                break
        else:
            # All entries are stale
            return []
        return hits[idx:]

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        client_ip = request.client.host if request.client else "unknown"
        now = time.time()
        path = request.url.path

        is_auth = path.startswith("/auth")
        bucket = self._auth_hits if is_auth else self._general_hits
        limit = self.AUTH_LIMIT if is_auth else self.GENERAL_LIMIT

        # Prune old entries
        bucket[client_ip] = self._prune(bucket[client_ip], now)

        remaining = max(0, limit - len(bucket[client_ip]))
        reset_at = int(now + self.WINDOW_SECONDS)

        if len(bucket[client_ip]) >= limit:
            logger.warning(
                "Rate limit exceeded for %s on %s (%d/%d)",
                client_ip, path, len(bucket[client_ip]), limit,
            )
            return JSONResponse(
                status_code=429,
                content={"detail": "Too many requests. Please try again later."},
                headers={
                    "X-RateLimit-Remaining": "0",
                    "X-RateLimit-Reset": str(reset_at),
                    "Retry-After": str(self.WINDOW_SECONDS),
                },
            )

        # Record this request
        bucket[client_ip].append(now)
        remaining = max(0, limit - len(bucket[client_ip]))

        response = await call_next(request)
        response.headers["X-RateLimit-Remaining"] = str(remaining)
        response.headers["X-RateLimit-Reset"] = str(reset_at)
        return response


# ---------------------------------------------------------------------------
# 2. Security Headers Middleware
# ---------------------------------------------------------------------------
class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """Injects standard security headers into every response."""

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Strict-Transport-Security"] = (
            "max-age=31536000; includeSubDomains"
        )
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        return response


# ---------------------------------------------------------------------------
# 4. API Key Safety Middleware  (strip leaked secrets from response bodies)
# ---------------------------------------------------------------------------
class APIKeySafetyMiddleware(BaseHTTPMiddleware):
    """
    Scans JSON response bodies for accidental secret leaks and masks them.
    Only processes application/json responses to avoid mangling binary data.
    """

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        response = await call_next(request)

        content_type = response.headers.get("content-type", "")
        if "application/json" not in content_type:
            return response

        # Read the body from the streaming response
        body_chunks: list[bytes] = []
        async for chunk in response.body_iterator:  # type: ignore[attr-defined]
            if isinstance(chunk, str):
                body_chunks.append(chunk.encode("utf-8"))
            else:
                body_chunks.append(chunk)
        body_text = b"".join(body_chunks).decode("utf-8", errors="replace")

        # Mask any sensitive values
        scrubbed = _SENSITIVE_PATTERNS.sub(_mask_secret, body_text)

        if scrubbed != body_text:
            logger.warning(
                "API key safety middleware masked secrets in response for %s",
                request.url.path,
            )

        return Response(
            content=scrubbed,
            status_code=response.status_code,
            headers=dict(response.headers),
            media_type=response.media_type,
        )


# ---------------------------------------------------------------------------
# 3. Global Exception Handler
# ---------------------------------------------------------------------------
async def global_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    """
    Catch-all handler: logs the real error, returns a safe generic message.
    In debug mode, includes error details for local development.
    """
    logger.error(
        "Unhandled exception on %s %s: %s",
        request.method,
        request.url.path,
        exc,
        exc_info=True,
    )
    content: dict = {"detail": "Internal server error."}
    if settings.debug:
        content["debug_error"] = str(exc)
        content["debug_type"] = type(exc).__name__
    return JSONResponse(status_code=500, content=content)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan events"""
    # Startup
    await init_db()
    yield
    # Shutdown
    pass


app = FastAPI(
    title=settings.app_name,
    description="""
    AI-Powered Restaurant Inventory Intelligence Platform

    Features:
    - Ground-up probabilistic forecasting (NumPy TCN + Negative Binomial)
    - Autonomous AI agents (Risk, Reorder, Supplier Strategy)
    - Gemini-powered explanations and conversational interface
    - Real-time disruption awareness (weather, traffic, hazards)

    Built for hackathon tracks:
    - Ground-Up Model Track
    - Best Overall Track
    - MLH Best Use of Google Gemini API
    """,
    version="0.1.0",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins.split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Security middleware (order matters -- outermost middleware runs first)
# Starlette adds middleware in reverse order: last added = outermost.
# Desired execution order per request:
#   Rate Limit -> Security Headers -> API Key Safety -> route handler
# So we add them in reverse:
app.add_middleware(APIKeySafetyMiddleware)
app.add_middleware(SecurityHeadersMiddleware)
app.add_middleware(RateLimitMiddleware)

# Global exception handler (catches anything not handled by route-level handlers)
app.add_exception_handler(Exception, global_exception_handler)

# Include routers
app.include_router(auth_router, prefix="/auth", tags=["Authentication"])
app.include_router(restaurants_router, prefix="/restaurants", tags=["Restaurants"])
app.include_router(ingredients_router, prefix="/ingredients", tags=["Ingredients"])
app.include_router(suppliers_router, prefix="/suppliers", tags=["Suppliers"])
app.include_router(inventory_router, prefix="/inventory", tags=["Inventory"])
app.include_router(forecasts_router, prefix="/forecasts", tags=["Forecasts"])
app.include_router(agents_router, prefix="/agents", tags=["AI Agents"])
app.include_router(gemini_router, prefix="/gemini", tags=["Gemini"])
app.include_router(dishes_router, prefix="/dishes", tags=["Dishes"])
app.include_router(events_router, prefix="/events", tags=["Events & Disruptions"])
app.include_router(pos_router, prefix="/pos", tags=["Point of Sale"])
app.include_router(payments_router, prefix="/payments", tags=["Payments"])
app.include_router(delivery_router, tags=["Delivery Services"])
app.include_router(aws_router, tags=["AWS"])
app.include_router(subscriptions_router, tags=["Subscriptions"])
app.include_router(solana_pay_router, tags=["Solana Pay"])
app.include_router(floor_plan_router, tags=["Floor Plans"])
app.include_router(disruptions_router, tags=["Automated Disruptions"])
app.include_router(inventory_items_router, tags=["Full Inventory"])
app.include_router(staff_router, tags=["Staff & Roles"])
app.include_router(timeline_router, tags=["Timeline Analytics"])
app.include_router(pos_integration_router, tags=["POS Integrations"])
app.include_router(payroll_router, tags=["Payroll"])
app.include_router(stripe_webhooks_router, tags=["Webhooks"])
app.include_router(pos_payments_router, tags=["POS Payments"])
app.include_router(tax_router, tags=["Tax Calculation"])


@app.get("/")
async def root():
    """API root endpoint"""
    return {
        "name": settings.app_name,
        "version": "0.1.0",
        "status": "running",
        "docs": "/docs",
        "components": {
            "forecasting_model": "NumPy TCN with Negative Binomial output",
            "agents": [
                "InventoryRiskAgent",
                "ReorderOptimizationAgent",
                "SupplierStrategyAgent"
            ],
            "explanation_layer": "Google Gemini"
        }
    }


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy"}
