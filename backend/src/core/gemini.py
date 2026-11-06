import asyncio
import logging
import time
from collections.abc import Awaitable, Callable
from functools import lru_cache
from typing import TypeVar

from src.core.config import settings

logger = logging.getLogger(__name__)

T = TypeVar("T")

# These mean "try again later" or "this model is not available here". They are
# the only failures worth retrying on another model; auth and bad-request
# errors would fail identically everywhere.
_RETRYABLE_CODES = {404, 429, 500, 502, 503, 504}
_RETRYABLE_STATUSES = {
    "DEADLINE_EXCEEDED",
    "INTERNAL",
    "NOT_FOUND",
    "RESOURCE_EXHAUSTED",
    "UNAVAILABLE",
}

# Process-local health cache. A model that just ran out of capacity is skipped
# briefly so the next request does not pay the same timeout again.
_cooldowns: dict[str, float] = {}


@lru_cache(maxsize=1)
def get_gemini_client():
    """Return one shared Gemini client for the process.

    The import is lazy so the API can start (and report a clear error) even
    when the optional SDK has not been installed yet.
    """
    from google import genai

    return genai.Client(api_key=settings.GEMINI_API_KEY)


def is_capacity_error(exc: BaseException) -> bool:
    """Return True when switching to another Gemini model could help."""
    if isinstance(exc, asyncio.TimeoutError):
        return True

    try:
        from google.genai import errors as genai_errors
    except ImportError:
        return False

    if not isinstance(exc, genai_errors.APIError):
        return False

    status = (exc.status or "").upper()
    return exc.code in _RETRYABLE_CODES or status in _RETRYABLE_STATUSES


def _describe(exc: BaseException) -> str:
    code = getattr(exc, "code", None)
    status = getattr(exc, "status", None)
    detail = " ".join(str(part) for part in (code, status) if part)
    return detail or type(exc).__name__


def _is_cooling(model: str) -> bool:
    until = _cooldowns.get(model)
    if until is None:
        return False

    if time.monotonic() >= until:
        _cooldowns.pop(model, None)
        return False

    return True


def _start_cooldown(model: str) -> None:
    seconds = settings.GEMINI_MODEL_COOLDOWN_SECONDS
    if seconds > 0:
        _cooldowns[model] = time.monotonic() + seconds


async def generate_with_fallback(
    *,
    operation: str,
    request: Callable[[str], Awaitable[T]],
    timeout: float,
) -> tuple[T, str]:
    """Run ``request`` against each configured model until one succeeds.

    Capacity, timeout, and availability failures move on to the next model and
    put that model on a short cooldown. Every other error is raised immediately
    because retrying it would only repeat the same failure.
    """
    models = settings.gemini_models
    available = [model for model in models if not _is_cooling(model)]

    if not available:
        # Everything is cooling down; try the configured order again rather
        # than failing without making a request.
        available = models
    elif len(available) < len(models):
        skipped = [model for model in models if model not in available]
        logger.info(
            "%s: skipping cooling models %s",
            operation,
            ", ".join(skipped),
        )

    last_error: BaseException | None = None

    for index, model in enumerate(available):
        try:
            result = await asyncio.wait_for(request(model), timeout=timeout)
        except Exception as exc:  # noqa: BLE001 - classified below
            if not is_capacity_error(exc):
                raise
            last_error = exc
            _start_cooldown(model)
            if index < len(available) - 1:
                logger.warning(
                    "%s: model %s unavailable (%s); retrying with %s",
                    operation,
                    model,
                    _describe(exc),
                    available[index + 1],
                )
            continue

        if index > 0:
            logger.info("%s: answered with fallback model %s", operation, model)
        return result, model

    logger.warning("%s: every Gemini model is unavailable", operation)
    if last_error is not None:
        raise last_error
    raise RuntimeError("No Gemini models are configured")
