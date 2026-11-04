import asyncio
import logging
from contextlib import asynccontextmanager, suppress

from fastapi import FastAPI

from src.core.config import settings
from src.core.db.base import AsyncSessionLocal, engine
from src.core.db.dependencies import check_db_connection
from src.domain.services import greenbook as greenbook_service

logger = logging.getLogger(__name__)


async def _run_greenbook_sync() -> None:
    try:
        async with AsyncSessionLocal() as session:
            run = await greenbook_service.sync_greenbook_products(
                session,
                limit=settings.GREENBOOK_SYNC_LIMIT,
                page_size=settings.GREENBOOK_SYNC_PAGE_SIZE,
            )
        logger.info(
            "Greenbook snapshot refreshed: fetched=%s inserted=%s updated=%s",
            run.fetched_count,
            run.inserted_count,
            run.updated_count,
        )
    except Exception:
        # A failed refresh must not stop the interval loop.
        logger.exception("Scheduled Greenbook snapshot refresh failed")


async def _greenbook_sync_loop() -> None:
    interval_seconds = max(1, settings.GREENBOOK_SYNC_INTERVAL_HOURS) * 3600
    logger.info(
        "Greenbook snapshot sync enabled; refreshing every %s hour(s)",
        max(1, settings.GREENBOOK_SYNC_INTERVAL_HOURS),
    )

    if settings.GREENBOOK_SYNC_ON_STARTUP:
        await _run_greenbook_sync()

    while True:
        await asyncio.sleep(interval_seconds)
        await _run_greenbook_sync()


@asynccontextmanager
async def lifespan(app: FastAPI):
    if not await check_db_connection():
        raise RuntimeError("Could not connect to the database. Exiting ...")

    sync_task: asyncio.Task | None = None
    if settings.GREENBOOK_SYNC_ENABLED:
        sync_task = asyncio.create_task(
            _greenbook_sync_loop(), name="greenbook-snapshot-sync"
        )

    yield

    if sync_task is not None:
        sync_task.cancel()
        with suppress(asyncio.CancelledError):
            await sync_task

    logger.info("Application shutting down...")
    logger.debug("Shutting down the database connection pool...")
    engine.dispose()
