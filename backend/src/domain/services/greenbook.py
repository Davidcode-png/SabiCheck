import asyncio
import csv
import html
import logging
import re
import unicodedata
from datetime import date, datetime, timezone
from pathlib import Path
from typing import Any, Sequence

import httpx
from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.config import settings
from src.domain.models.greenbook import GreenbookProduct, GreenbookSyncRun

logger = logging.getLogger(__name__)

_PUNCTUATION_RE = re.compile(r"[^a-z0-9]+")
_NRN_RE = re.compile(r"[^A-Z0-9]+")
_WHITESPACE_RE = re.compile(r"\s+")


def normalize_nrn(value: str | None) -> str | None:
    """Normalise a NAFDAC registration number for comparison.

    Punctuation and spacing are discarded so ``A4-100153``, ``A4 100153`` and
    ``a4-100153`` are treated as the same registration number.
    """
    if not value:
        return None

    normalized = _NRN_RE.sub("", value.upper())
    return normalized or None


def normalize_product_name(value: str | None) -> str:
    """Normalise a product name for simple exact/contains matching."""
    if not value:
        return ""

    text = unicodedata.normalize("NFKC", html.unescape(value))
    text = text.lower().replace("&", " and ")
    text = _PUNCTUATION_RE.sub(" ", text)
    return _WHITESPACE_RE.sub(" ", text).strip()


def _clean_text(value: Any) -> str | None:
    if value is None:
        return None
    if not isinstance(value, str):
        return str(value)
    cleaned = html.unescape(value).strip()
    return cleaned or None


def _parse_date(value: Any) -> date | None:
    if not value:
        return None

    try:
        return date.fromisoformat(str(value)[:10])
    except ValueError:
        return None


def _parse_datetime(value: Any) -> datetime | None:
    if not value:
        return None

    text = str(value).replace("Z", "+00:00")
    try:
        return datetime.fromisoformat(text)
    except ValueError:
        return None


def _row_to_values(row: dict[str, Any]) -> dict[str, Any]:
    product_name = _clean_text(row.get("product_name")) or ""
    nrn = _clean_text(row.get("NAFDAC"))
    ingredient = row.get("ingredient") or {}
    applicant = row.get("applicant") or {}
    form = row.get("form") or {}
    route = row.get("route") or {}
    category = row.get("product_category") or {}

    return {
        "product_name": product_name,
        "normalized_name": normalize_product_name(product_name),
        "nrn": nrn,
        "normalized_nrn": normalize_nrn(nrn),
        "status": _clean_text(row.get("status")),
        "approval_date": _parse_date(row.get("approval_date")),
        "expiry_date": _parse_date(row.get("expiry_date")),
        "applicant_name": _clean_text(applicant.get("name")),
        "ingredient_name": _clean_text(ingredient.get("ingredient_name")),
        "form": _clean_text(form.get("name")),
        "route": _clean_text(route.get("name")),
        "strength": _clean_text(row.get("strength")),
        "pack_size": _clean_text(row.get("pack_size")),
        "product_category": _clean_text(category.get("name")),
        "product_category_id": row.get("product_category_id"),
        "applicant_id": row.get("applicant_id"),
        "ingredient_id": row.get("ingredient_id"),
        "manufacturer_id": row.get("manufacturer_id"),
        "greenbook_created_at": _parse_datetime(row.get("created_at")),
        "greenbook_updated_at": _parse_datetime(row.get("updated_at")),
        "raw_payload": row,
    }


def _client() -> httpx.AsyncClient:
    return httpx.AsyncClient(
        timeout=settings.GREENBOOK_REQUEST_TIMEOUT_SECONDS,
        follow_redirects=True,
        headers={
            "Accept": "application/json",
            "X-Requested-With": "XMLHttpRequest",
            "User-Agent": "SabiCheck/1.0 (+https://sabicheck.app)",
        },
    )


async def fetch_greenbook_page(
    client: httpx.AsyncClient,
    *,
    start: int = 0,
    length: int = 100,
    search: str = "",
) -> dict[str, Any]:
    """Fetch one DataTables page from the public Greenbook endpoint."""
    params = {
        "draw": "1",
        "start": str(start),
        "length": str(length),
        "search[value]": search,
        "search[regex]": "false",
        "search_ingredient": "",
    }

    response = await client.get(settings.GREENBOOK_BASE_URL, params=params)
    response.raise_for_status()
    payload = response.json()

    if not isinstance(payload, dict) or "data" not in payload:
        raise ValueError("Unexpected response from the NAFDAC Greenbook")

    return payload


async def sync_greenbook_products(
    session: AsyncSession,
    *,
    limit: int = 40,
    start: int = 0,
    page_size: int = 100,
    delay_seconds: float | None = None,
    search: str = "",
) -> GreenbookSyncRun:
    """Scrape the Greenbook and upsert records into the local snapshot.

    ``limit=0`` means "keep fetching until the Greenbook is exhausted". The
    default keeps the initial snapshot small; the CLI can be used later to pull
    more records.
    """
    started_at = datetime.now(timezone.utc)
    run = GreenbookSyncRun(
        status="running",
        source_url=settings.GREENBOOK_BASE_URL,
        requested_limit=limit,
        page_size=page_size,
        started_at=started_at,
    )
    session.add(run)
    await session.flush()

    fetched_count = 0
    inserted_count = 0
    updated_count = 0
    effective_page_size = max(1, page_size)
    delay = (
        settings.GREENBOOK_REQUEST_DELAY_SECONDS
        if delay_seconds is None
        else delay_seconds
    )

    try:
        async with _client() as client:
            offset = start
            remaining = limit if limit > 0 else None

            while True:
                length = (
                    effective_page_size
                    if remaining is None
                    else min(effective_page_size, remaining)
                )
                if length <= 0:
                    break

                payload = await fetch_greenbook_page(
                    client,
                    start=offset,
                    length=length,
                    search=search,
                )
                rows = payload.get("data") or []
                if not rows:
                    break

                fetched_count += len(rows)
                product_ids = [
                    int(row["product_id"])
                    for row in rows
                    if row.get("product_id") is not None
                ]

                existing_by_id: dict[int, GreenbookProduct] = {}
                if product_ids:
                    existing_result = await session.execute(
                        select(GreenbookProduct).where(
                            GreenbookProduct.greenbook_product_id.in_(product_ids)
                        )
                    )
                    existing_by_id = {
                        product.greenbook_product_id: product
                        for product in existing_result.scalars().all()
                    }

                synced_at = datetime.now(timezone.utc)
                for row in rows:
                    raw_id = row.get("product_id")
                    if raw_id is None:
                        continue

                    product_id = int(raw_id)
                    values = _row_to_values(row)
                    product = existing_by_id.get(product_id)

                    if product is None:
                        product = GreenbookProduct(
                            **values,
                            greenbook_product_id=product_id,
                            first_seen_at=synced_at,
                            last_seen_at=synced_at,
                            last_synced_at=synced_at,
                        )
                        session.add(product)
                        existing_by_id[product_id] = product
                        inserted_count += 1
                    else:
                        for key, value in values.items():
                            setattr(product, key, value)
                        product.last_seen_at = synced_at
                        product.last_synced_at = synced_at
                        updated_count += 1

                await session.flush()

                offset += len(rows)
                if remaining is not None:
                    remaining -= len(rows)
                    if remaining <= 0:
                        break

                total = int(payload.get("recordsFiltered") or 0)
                if total and offset >= total:
                    break
                if len(rows) < length:
                    break

                if delay > 0:
                    await asyncio.sleep(delay)

        run.status = "success"
        run.fetched_count = fetched_count
        run.inserted_count = inserted_count
        run.updated_count = updated_count
        run.finished_at = datetime.now(timezone.utc)
        await session.commit()
        return run
    except Exception as exc:
        logger.exception("Greenbook snapshot sync failed")
        await session.rollback()

        failed_run = GreenbookSyncRun(
            status="failed",
            source_url=settings.GREENBOOK_BASE_URL,
            requested_limit=limit,
            page_size=page_size,
            fetched_count=fetched_count,
            inserted_count=inserted_count,
            updated_count=updated_count,
            started_at=started_at,
            finished_at=datetime.now(timezone.utc),
            error_message=str(exc)[:4000],
        )
        session.add(failed_run)
        await session.commit()
        raise


async def count_greenbook_products(session: AsyncSession) -> int:
    result = await session.execute(select(func.count(GreenbookProduct.id)))
    return int(result.scalar_one())


async def get_greenbook_product(
    session: AsyncSession, greenbook_product_id: int
) -> GreenbookProduct | None:
    result = await session.execute(
        select(GreenbookProduct).where(
            GreenbookProduct.greenbook_product_id == greenbook_product_id
        )
    )
    return result.scalar_one_or_none()


async def get_greenbook_product_by_nrn(
    session: AsyncSession, nrn: str | None
) -> GreenbookProduct | None:
    """Return the Greenbook record for a NAFDAC registration number."""
    normalized_nrn = normalize_nrn(nrn)
    if not normalized_nrn:
        return None

    result = await session.execute(
        select(GreenbookProduct)
        .where(GreenbookProduct.normalized_nrn == normalized_nrn)
        .limit(1)
    )
    return result.scalar_one_or_none()


async def get_latest_sync_run(
    session: AsyncSession,
) -> GreenbookSyncRun | None:
    result = await session.execute(
        select(GreenbookSyncRun).order_by(GreenbookSyncRun.started_at.desc()).limit(1)
    )
    return result.scalar_one_or_none()


def _search_filters(query: str | None, nrn: str | None):
    filters = []

    if nrn:
        normalized_nrn = normalize_nrn(nrn)
        if normalized_nrn:
            filters.append(GreenbookProduct.normalized_nrn == normalized_nrn)

    if query:
        normalized_name = normalize_product_name(query)
        normalized_nrn_query = normalize_nrn(query)
        terms = [
            (
                GreenbookProduct.normalized_name.contains(normalized_name)
                if normalized_name
                else None
            ),
            GreenbookProduct.nrn.ilike(f"%{query.strip()}%"),
        ]
        if normalized_nrn_query:
            terms.append(GreenbookProduct.normalized_nrn.contains(normalized_nrn_query))

        valid_terms = [term for term in terms if term is not None]
        if valid_terms:
            filters.append(or_(*valid_terms))

    return filters


async def search_greenbook_products(
    session: AsyncSession,
    *,
    query: str | None = None,
    nrn: str | None = None,
    limit: int = 20,
    offset: int = 0,
) -> tuple[list[GreenbookProduct], int]:
    filters = _search_filters(query, nrn)

    count_stmt = select(func.count(GreenbookProduct.id))
    items_stmt = select(GreenbookProduct)

    for condition in filters:
        count_stmt = count_stmt.where(condition)
        items_stmt = items_stmt.where(condition)

    total = int((await session.execute(count_stmt)).scalar_one())
    items_stmt = (
        items_stmt.order_by(GreenbookProduct.product_name, GreenbookProduct.nrn)
        .offset(offset)
        .limit(limit)
    )
    items = list((await session.execute(items_stmt)).scalars().all())

    return items, total


async def list_greenbook_products(
    session: AsyncSession,
    *,
    limit: int = 100_000,
    offset: int = 0,
) -> list[GreenbookProduct]:
    result = await session.execute(
        select(GreenbookProduct)
        .order_by(GreenbookProduct.product_name, GreenbookProduct.nrn)
        .offset(offset)
        .limit(limit)
    )
    return list(result.scalars().all())


def export_greenbook_csv(
    products: Sequence[GreenbookProduct], output_path: Path
) -> Path:
    """Write the snapshot to a UTF-8 CSV that Excel can open."""
    output_path = output_path.resolve()
    output_path.parent.mkdir(parents=True, exist_ok=True)

    with output_path.open("w", newline="", encoding="utf-8-sig") as handle:
        writer = csv.writer(handle)
        writer.writerow(
            [
                "greenbook_product_id",
                "product_name",
                "nrn",
                "status",
                "approval_date",
                "expiry_date",
                "applicant_name",
                "ingredient_name",
                "form",
                "route",
                "strength",
                "pack_size",
                "product_category",
                "first_seen_at",
                "last_seen_at",
                "last_synced_at",
            ]
        )

        for product in products:
            writer.writerow(
                [
                    product.greenbook_product_id,
                    product.product_name,
                    product.nrn,
                    product.status,
                    product.approval_date.isoformat() if product.approval_date else "",
                    product.expiry_date.isoformat() if product.expiry_date else "",
                    product.applicant_name or "",
                    product.ingredient_name or "",
                    product.form or "",
                    product.route or "",
                    product.strength or "",
                    product.pack_size or "",
                    product.product_category or "",
                    product.first_seen_at.isoformat() if product.first_seen_at else "",
                    product.last_seen_at.isoformat() if product.last_seen_at else "",
                    (
                        product.last_synced_at.isoformat()
                        if product.last_synced_at
                        else ""
                    ),
                ]
            )

    return output_path
