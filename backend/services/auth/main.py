"""
Betcha Auth Service
Production-grade authentication microservice with FastAPI
"""
import logging
import sys
from contextlib import asynccontextmanager
from typing import AsyncGenerator

import structlog
from fastapi import FastAPI, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.responses import JSONResponse
from prometheus_client import Counter, Histogram, make_asgi_app
from starlette.middleware.base import BaseHTTPMiddleware

from app.api.v1 import router as api_v1_router
from app.core.config import get_settings
from app.core.database import close_db, init_db
from app.core.redis import close_redis, init_redis
from app.middleware.rate_limit import RateLimitMiddleware
from app.middleware.request_id import RequestIDMiddleware
from app.middleware.security import SecurityHeadersMiddleware

# ==================== Logging Configuration ====================
structlog.configure(
    processors=[
        structlog.contextvars.merge_contextvars,
        structlog.processors.add_log_level,
        structlog.processors.StackInfoRenderer(),
        structlog.dev.set_exc_info,
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.JSONRenderer(),
    ],
    wrapper_class=structlog.make_filtering_bound_logger(logging.INFO),
    context_class=dict,
    logger_factory=structlog.PrintLoggerFactory(),
    cache_logger_on_first_use=False,
)

logger = structlog.get_logger()

# ==================== Metrics ====================
REQUEST_COUNT = Counter(
    "http_requests_total",
    "Total HTTP requests",
    ["method", "endpoint", "status"]
)

REQUEST_DURATION = Histogram(
    "http_request_duration_seconds",
    "HTTP request duration",
    ["method", "endpoint"]
)

AUTH_ATTEMPTS = Counter(
    "auth_attempts_total",
    "Total authentication attempts",
    ["method", "status"]
)

# ==================== Lifespan Events ====================
@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator:
    """
    Lifespan context manager for startup and shutdown events
    """
    settings = get_settings()
    logger.info("Starting Auth Service", environment=settings.ENVIRONMENT)

    # Startup
    try:
        await init_db()
        await init_redis()
        logger.info("Database and Redis connections initialized")
    except Exception as e:
        logger.error("Failed to initialize connections", error=str(e))
        sys.exit(1)

    yield

    # Shutdown
    logger.info("Shutting down Auth Service")
    await close_redis()
    await close_db()
    logger.info("Auth Service stopped")


# ==================== Application Factory ====================
def create_application() -> FastAPI:
    """
    Application factory pattern
    """
    settings = get_settings()

    app = FastAPI(
        title="Betcha Auth Service",
        description="Enterprise-grade authentication and authorization service",
        version="1.0.0",
        docs_url="/api/docs" if settings.ENVIRONMENT == "development" else None,
        redoc_url="/api/redoc" if settings.ENVIRONMENT == "development" else None,
        openapi_url="/api/openapi.json" if settings.ENVIRONMENT == "development" else None,
        lifespan=lifespan,
    )

    # ==================== Middleware ====================

    # Security Headers
    app.add_middleware(SecurityHeadersMiddleware)

    # Trusted Hosts (Production only)
    if settings.ENVIRONMENT == "production":
        app.add_middleware(
            TrustedHostMiddleware,
            allowed_hosts=settings.ALLOWED_HOSTS.split(",")
        )

    # CORS
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.CORS_ORIGINS.split(","),
        allow_credentials=True,
        allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH"],
        allow_headers=["*"],
        max_age=3600,
    )

    # GZip Compression
    app.add_middleware(GZipMiddleware, minimum_size=1000)

    # Rate Limiting
    app.add_middleware(RateLimitMiddleware)

    # Request ID
    app.add_middleware(RequestIDMiddleware)

    # ==================== Exception Handlers ====================

    @app.exception_handler(RequestValidationError)
    async def validation_exception_handler(
        request: Request,
        exc: RequestValidationError
    ) -> JSONResponse:
        """Handle validation errors"""
        logger.warning(
            "Validation error",
            path=request.url.path,
            errors=exc.errors()
        )
        return JSONResponse(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            content={
                "detail": exc.errors(),
                "body": exc.body,
            },
        )

    @app.exception_handler(Exception)
    async def global_exception_handler(
        request: Request,
        exc: Exception
    ) -> JSONResponse:
        """Handle all uncaught exceptions"""
        logger.error(
            "Unhandled exception",
            path=request.url.path,
            error=str(exc),
            exc_info=True
        )
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"detail": "Internal server error"},
        )

    # ==================== Routes ====================

    # Health check
    @app.get("/health", tags=["Health"])
    async def health_check():
        """Basic health check"""
        return {"status": "healthy", "service": "auth"}

    @app.get("/health/ready", tags=["Health"])
    async def readiness_check():
        """Readiness check (includes dependencies)"""
        from app.core.database import engine
        from app.core.redis import redis_client

        try:
            # Check database
            async with engine.begin() as conn:
                await conn.execute("SELECT 1")

            # Check Redis
            await redis_client.ping()

            return {"status": "ready", "service": "auth"}
        except Exception as e:
            logger.error("Readiness check failed", error=str(e))
            return JSONResponse(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                content={"status": "not ready", "error": str(e)}
            )

    # Include API routes
    app.include_router(api_v1_router, prefix="/api/v1")

    # Prometheus metrics
    metrics_app = make_asgi_app()
    app.mount("/metrics", metrics_app)

    return app


# ==================== Application Instance ====================
app = create_application()


# ==================== Request Logging Middleware ====================
@app.middleware("http")
async def log_requests(request: Request, call_next):
    """Log all HTTP requests"""
    import time

    start_time = time.time()

    # Process request
    response = await call_next(request)

    # Calculate duration
    duration = time.time() - start_time

    # Update metrics
    REQUEST_COUNT.labels(
        method=request.method,
        endpoint=request.url.path,
        status=response.status_code
    ).inc()

    REQUEST_DURATION.labels(
        method=request.method,
        endpoint=request.url.path
    ).observe(duration)

    # Log request
    logger.info(
        "HTTP request",
        method=request.method,
        path=request.url.path,
        status_code=response.status_code,
        duration=f"{duration:.3f}s"
    )

    return response


if __name__ == "__main__":
    import uvicorn

    settings = get_settings()

    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.ENVIRONMENT == "development",
        workers=4 if settings.ENVIRONMENT == "production" else 1,
        log_level="info",
    )
