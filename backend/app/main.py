"""Creditxora API — FastAPI application entrypoint."""

from __future__ import annotations

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.core.config import settings
from app.db.mongo import close_mongo_connection, connect_to_mongo, get_database, is_connected
from app.routers import admin, auth, documents, portal, public
from app.services.notifications import wait_for_pending_email
from app.services.seed import bootstrap

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)-8s %(name)s: %(message)s",
)
logger = logging.getLogger("creditxora")


@asynccontextmanager
async def lifespan(app: FastAPI):
    settings.upload_dir.mkdir(parents=True, exist_ok=True)
    try:
        await connect_to_mongo()
        await bootstrap(get_database())
    except Exception:
        # The API still boots so /health can report the problem, rather than the
        # process dying in a restart loop behind a load balancer.
        logger.exception("Startup failed to reach MongoDB at %s", settings.mongodb_uri)
    yield
    # Let queued notification emails finish before the process goes away.
    await wait_for_pending_email()
    await close_mongo_connection()


app = FastAPI(
    title=settings.app_name,
    version="1.0.0",
    description=(
        "Backend for the Creditxora credit-services platform: assessment intake, "
        "CRM lead pipeline, client portal, secure document handling and the admin "
        "dashboard."
    ),
    lifespan=lifespan,
    docs_url="/docs",
    openapi_url="/openapi.json",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(RequestValidationError)
async def validation_handler(request: Request, exc: RequestValidationError) -> JSONResponse:
    """Return the first human-readable message rather than FastAPI's raw array."""
    errors = exc.errors()
    detail = "Please check the information you entered."
    if errors:
        first = errors[0]
        field = ".".join(str(p) for p in first.get("loc", []) if p not in ("body", "query"))
        message = first.get("msg", detail)
        message = message.removeprefix("Value error, ")
        detail = f"{field}: {message}" if field else message
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={"detail": detail, "errors": [
            {"field": ".".join(str(p) for p in e.get("loc", []) if p != "body"),
             "message": e.get("msg", "").removeprefix("Value error, ")}
            for e in errors
        ]},
    )


@app.get("/health", tags=["system"])
async def health() -> dict[str, object]:
    database_ok = False
    if is_connected():
        try:
            await get_database().command("ping")
            database_ok = True
        except Exception:
            database_ok = False
    return {
        "status": "ok" if database_ok else "degraded",
        "service": settings.app_name,
        "environment": settings.environment,
        "database": "connected" if database_ok else "unavailable",
    }


for router in (auth.router, public.router, portal.router, documents.router, admin.router):
    app.include_router(router, prefix=settings.api_prefix)
