"""Derived alerts feed.

Alerts are not a separate table: they are read directly from the two events
the workspace already records. This keeps the feed consistent with the source
of truth and avoids a second, drift-prone copy of the same facts.

- A **repeat-code alert** is a verification code whose checks returned
  ``repeat``. It is shown once per code, recorded at the latest repeat check.
- A **consumer report** is every report submitted for the workspace, including
  reports whose code did not match a unit record.

Both are merged with ``UNION ALL`` so filtering, ordering and pagination happen
in the database rather than in Python.
"""

import math
import uuid

from sqlalchemy import (
    String,
    case,
    cast,
    func,
    literal,
    null,
    or_,
    select,
    union_all,
)
from sqlalchemy.ext.asyncio import AsyncSession

from src.domain.models.distributor import Distributor
from src.domain.models.product import Product
from src.domain.models.verification_code import (
    CodeCheck,
    CodeReport,
    CodeReportStatus,
    ConcernType,
    VerificationCode,
    VerificationCodeStatus,
)
from src.domain.schemas.alert import (
    AlertDistributorRead,
    AlertEventType,
    AlertRead,
    AlertStatus,
)

# Repeat-code state follows the code's lifecycle: a code that has been marked
# used (applied) has been dealt with, a reported code is under review, and any
# other repeat signal still needs a look.
_REPEAT_STATUS = case(
    (
        VerificationCode.status == VerificationCodeStatus.USED,
        literal(AlertStatus.REVIEWED.value),
    ),
    (
        VerificationCode.status == VerificationCodeStatus.REPORTED,
        literal(AlertStatus.IN_REVIEW.value),
    ),
    else_=literal(AlertStatus.NEEDS_REVIEW.value),
)

_REPORT_STATUS = case(
    (
        CodeReport.status == CodeReportStatus.REFERRED.value,
        literal(AlertStatus.REVIEWED.value),
    ),
    (
        CodeReport.status == CodeReportStatus.UNDER_REVIEW.value,
        literal(AlertStatus.IN_REVIEW.value),
    ),
    else_=literal(AlertStatus.NEEDS_REVIEW.value),
)

_REPEAT_NOTE = "Multiple checks recorded for this unit code."

# SQLAlchemy stores enum *names* in Postgres, so translate them back to the
# human-readable values used everywhere else in the API.
_CONCERN_NOTE = case(
    {member.name: literal(member.value) for member in ConcernType},
    value=cast(CodeReport.concern, String),
    else_=literal("Consumer concern"),
)


def page_count(total: int, page_size: int) -> int:
    if total <= 0:
        return 1
    return max(1, math.ceil(total / page_size))


def _repeat_select(organization_id: uuid.UUID):
    """One row per code, at its latest repeat check.

    ``DISTINCT ON`` keeps the distributor snapshot recorded on that check, so a
    later reassignment does not rewrite the history of the alert.
    """
    latest = (
        select(
            CodeCheck.verification_code_id.label("verification_code_id"),
            CodeCheck.distributor_id.label("distributor_id"),
            CodeCheck.checked_at.label("recorded_at"),
        )
        .where(
            CodeCheck.organization_id == organization_id,
            CodeCheck.result == "repeat",
        )
        .distinct(CodeCheck.verification_code_id)
        .order_by(
            CodeCheck.verification_code_id,
            CodeCheck.checked_at.desc(),
        )
        .subquery("latest_repeat")
    )

    # Prefer the distributor recorded on the check, but fall back to the code's
    # current assignment so a code assigned after the check still shows context.
    resolved_distributor_id = func.coalesce(
        latest.c.distributor_id, VerificationCode.distributor_id
    )

    return (
        select(
            (literal("repeat:") + cast(VerificationCode.id, String)).label(
                "id"
            ),
            literal(AlertEventType.REPEAT_CODE.value).label("event_type"),
            VerificationCode.id.label("source_id"),
            cast(null(), String(32)).label("reference"),
            VerificationCode.product_id.label("product_id"),
            Product.name.label("product_name"),
            Product.pack_size.label("pack_size"),
            VerificationCode.code.label("code"),
            literal(_REPEAT_NOTE).label("note"),
            resolved_distributor_id.label("distributor_id"),
            Distributor.name.label("distributor_name"),
            Distributor.city.label("distributor_city"),
            Distributor.state.label("distributor_state"),
            Distributor.tracking_code.label("distributor_tracking_code"),
            latest.c.recorded_at.label("recorded_at"),
            _REPEAT_STATUS.label("status"),
        )
        .select_from(latest)
        .join(
            VerificationCode,
            VerificationCode.id == latest.c.verification_code_id,
        )
        .join(Product, Product.id == VerificationCode.product_id)
        .outerjoin(Distributor, Distributor.id == resolved_distributor_id)
    )


def _report_select(organization_id: uuid.UUID):
    """Every consumer report, with the code's product/distributor as fallback."""
    resolved_product_id = func.coalesce(
        CodeReport.product_id, VerificationCode.product_id
    )
    resolved_distributor_id = func.coalesce(
        CodeReport.distributor_id, VerificationCode.distributor_id
    )

    return (
        select(
            (literal("report:") + cast(CodeReport.id, String)).label("id"),
            literal(AlertEventType.CONSUMER_REPORT.value).label(
                "event_type"
            ),
            CodeReport.id.label("source_id"),
            CodeReport.reference.label("reference"),
            resolved_product_id.label("product_id"),
            func.coalesce(Product.name, CodeReport.product_name).label(
                "product_name"
            ),
            Product.pack_size.label("pack_size"),
            CodeReport.code.label("code"),
            _CONCERN_NOTE.label("note"),
            resolved_distributor_id.label("distributor_id"),
            Distributor.name.label("distributor_name"),
            Distributor.city.label("distributor_city"),
            Distributor.state.label("distributor_state"),
            Distributor.tracking_code.label("distributor_tracking_code"),
            CodeReport.created_at.label("recorded_at"),
            _REPORT_STATUS.label("status"),
        )
        .select_from(CodeReport)
        .outerjoin(
            VerificationCode,
            VerificationCode.id == CodeReport.verification_code_id,
        )
        .outerjoin(Product, Product.id == resolved_product_id)
        .outerjoin(Distributor, Distributor.id == resolved_distributor_id)
        .where(CodeReport.organization_id == organization_id)
    )


def _alert_feed(organization_id: uuid.UUID):
    return union_all(
        _repeat_select(organization_id),
        _report_select(organization_id),
    ).subquery("alerts")


async def list_alerts(
    session: AsyncSession,
    organization_id: uuid.UUID,
    *,
    search: str | None = None,
    event_type: AlertEventType | None = None,
    alert_status: AlertStatus | None = None,
    page: int = 1,
    page_size: int = 10,
) -> tuple[list[AlertRead], int]:
    """Return one page of the merged alert feed, newest first."""
    feed = _alert_feed(organization_id)
    filters = []

    if search and search.strip():
        term = f"%{search.strip()}%"
        filters.append(
            or_(
                feed.c.code.ilike(term),
                feed.c.product_name.ilike(term),
                feed.c.reference.ilike(term),
                feed.c.note.ilike(term),
                feed.c.distributor_name.ilike(term),
            )
        )

    if event_type is not None:
        filters.append(feed.c.event_type == event_type.value)

    if alert_status is not None:
        filters.append(feed.c.status == alert_status.value)

    total = (
        await session.scalar(
            select(func.count()).select_from(feed).where(*filters)
        )
        or 0
    )

    result = await session.execute(
        select(feed)
        .where(*filters)
        .order_by(feed.c.recorded_at.desc(), feed.c.id.asc())
        .offset((page - 1) * page_size)
        .limit(page_size)
    )

    items = [
        AlertRead(
            id=row.id,
            event_type=AlertEventType(row.event_type),
            source_id=row.source_id,
            reference=row.reference,
            product_id=row.product_id,
            product_name=row.product_name,
            pack_size=row.pack_size,
            code=row.code,
            note=row.note or "",
            distributor=(
                AlertDistributorRead(
                    id=row.distributor_id,
                    name=row.distributor_name,
                    tracking_code=row.distributor_tracking_code,
                    city=row.distributor_city,
                    state=row.distributor_state,
                )
                if row.distributor_id and row.distributor_name
                else None
            ),
            recorded_at=row.recorded_at,
            status=AlertStatus(row.status),
        )
        for row in result.all()
    ]

    return items, total


async def count_repeat_code_alerts(
    session: AsyncSession, organization_id: uuid.UUID
) -> int:
    """Count codes that have produced a repeat check (one alert per code)."""
    return (
        await session.scalar(
            select(
                func.count(func.distinct(CodeCheck.verification_code_id))
            ).where(
                CodeCheck.organization_id == organization_id,
                CodeCheck.result == "repeat",
            )
        )
        or 0
    )


__all__ = [
    "count_repeat_code_alerts",
    "list_alerts",
    "page_count",
]
