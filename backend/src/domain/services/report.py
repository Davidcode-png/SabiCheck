import math
import uuid
from datetime import datetime, timezone

from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload

from src.domain.models.distributor import Distributor
from src.domain.models.organization import OrganizationUser
from src.domain.models.verification_code import (
    CodeReport,
    ConcernType,
    ReportPriority,
)
from src.domain.schemas.report import ConsumerReportUpdate, ReportStatus


class ReportNotFoundError(Exception):
    pass


class ReportReviewerNotFoundError(Exception):
    """The selected reviewer is not a member of this organization."""


class ReportDistributorNotFoundError(Exception):
    """The selected distributor does not belong to this organization."""


def page_count(total: int, page_size: int) -> int:
    if total <= 0:
        return 1
    return max(1, math.ceil(total / page_size))


def _location_label(value: str | None) -> str | None:
    """Reduce a free-text purchase location to the city/state label.

    Consumers type values such as ``"Ketu, Kosofe, Lagos"``; the register
    filters by the final segment so all reports in Lagos group together.
    """
    if not value:
        return None

    parts = [part.strip() for part in value.split(",") if part.strip()]
    return parts[-1] if parts else None


def _filters(
    organization_id: uuid.UUID,
    *,
    search: str | None = None,
    concern: ConcernType | None = None,
    report_status: ReportStatus | None = None,
    priority: ReportPriority | None = None,
    location: str | None = None,
) -> list:
    filters = [CodeReport.organization_id == organization_id]

    if search and search.strip():
        term = f"%{search.strip()}%"
        filters.append(
            or_(
                CodeReport.reference.ilike(term),
                CodeReport.code.ilike(term),
                CodeReport.product_name.ilike(term),
                CodeReport.description.ilike(term),
                CodeReport.purchase_location.ilike(term),
            )
        )

    if concern is not None:
        filters.append(CodeReport.concern == concern)

    if report_status is not None:
        filters.append(CodeReport.status == report_status.value)

    if priority is not None:
        filters.append(CodeReport.priority == priority.value)

    if location and location.strip():
        term = f"%{location.strip()}%"
        filters.append(
            or_(
                CodeReport.purchase_location.ilike(term),
                CodeReport.distributor.has(Distributor.city.ilike(term)),
                CodeReport.distributor.has(Distributor.state.ilike(term)),
            )
        )

    return filters


async def list_locations(
    session: AsyncSession, organization_id: uuid.UUID
) -> list[str]:
    """Return the locations used by this organization's consumer reports."""
    result = await session.execute(
        select(CodeReport.purchase_location)
        .where(
            CodeReport.organization_id == organization_id,
            CodeReport.purchase_location.is_not(None),
        )
        .distinct()
    )

    locations: set[str] = set()
    for (value,) in result.all():
        label = _location_label(value)
        if label:
            locations.add(label)

    distributor_result = await session.execute(
        select(Distributor.city, Distributor.state)
        .join(CodeReport, CodeReport.distributor_id == Distributor.id)
        .where(CodeReport.organization_id == organization_id)
        .distinct()
    )
    for city, state in distributor_result.all():
        if city:
            locations.add(city)
        if state:
            locations.add(state)

    return sorted(locations, key=str.casefold)


async def list_reports(
    session: AsyncSession,
    organization_id: uuid.UUID,
    *,
    search: str | None = None,
    concern: ConcernType | None = None,
    report_status: ReportStatus | None = None,
    priority: ReportPriority | None = None,
    location: str | None = None,
    page: int = 1,
    page_size: int = 10,
) -> tuple[list[CodeReport], int, list[str]]:
    filters = _filters(
        organization_id,
        search=search,
        concern=concern,
        report_status=report_status,
        priority=priority,
        location=location,
    )

    total = (
        await session.scalar(
            select(func.count(CodeReport.id)).where(*filters)
        )
        or 0
    )

    result = await session.execute(
        select(CodeReport)
        .options(
            joinedload(CodeReport.reviewer),
            joinedload(CodeReport.distributor),
        )
        .where(*filters)
        .order_by(CodeReport.created_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
    )

    items = list(result.scalars().unique().all())
    locations = await list_locations(session, organization_id)

    return items, total, locations


async def list_reports_for_export(
    session: AsyncSession,
    organization_id: uuid.UUID,
    *,
    search: str | None = None,
    concern: ConcernType | None = None,
    report_status: ReportStatus | None = None,
    priority: ReportPriority | None = None,
    location: str | None = None,
) -> list[CodeReport]:
    filters = _filters(
        organization_id,
        search=search,
        concern=concern,
        report_status=report_status,
        priority=priority,
        location=location,
    )

    result = await session.execute(
        select(CodeReport)
        .options(
            joinedload(CodeReport.reviewer),
            joinedload(CodeReport.distributor),
        )
        .where(*filters)
        .order_by(CodeReport.created_at.desc())
    )

    return list(result.scalars().unique().all())


async def get_report(
    session: AsyncSession,
    organization_id: uuid.UUID,
    report_id: uuid.UUID,
) -> CodeReport:
    result = await session.execute(
        select(CodeReport)
        .options(
            joinedload(CodeReport.reviewer),
            joinedload(CodeReport.distributor),
        )
        .where(
            CodeReport.id == report_id,
            CodeReport.organization_id == organization_id,
        )
        # Triage updates can change the foreign keys, so overwrite any
        # relationships already cached on the session's identity map.
        .execution_options(populate_existing=True)
    )
    report = result.scalars().unique().one_or_none()

    if report is None:
        raise ReportNotFoundError

    return report


async def update_report(
    session: AsyncSession,
    organization_id: uuid.UUID,
    report_id: uuid.UUID,
    data: ConsumerReportUpdate,
) -> CodeReport:
    report = await get_report(session, organization_id, report_id)
    changes = data.model_dump(exclude_unset=True)

    if changes.get("reviewer_id") is not None:
        membership = await session.scalar(
            select(OrganizationUser.id).where(
                OrganizationUser.organization_id == organization_id,
                OrganizationUser.user_id == changes["reviewer_id"],
            )
        )
        if membership is None:
            raise ReportReviewerNotFoundError

    if changes.get("distributor_id") is not None:
        distributor = await session.scalar(
            select(Distributor.id).where(
                Distributor.id == changes["distributor_id"],
                Distributor.organization_id == organization_id,
            )
        )
        if distributor is None:
            raise ReportDistributorNotFoundError

    next_status = changes.get("status")

    if next_status is not None:
        report.status = next_status.value
        report.reviewed_at = (
            None
            if next_status == ReportStatus.RECEIVED
            else datetime.now(timezone.utc)
        )

    if "reviewer_id" in changes:
        report.reviewer_id = changes["reviewer_id"]

    if "distributor_id" in changes:
        report.distributor_id = changes["distributor_id"]

    if changes.get("priority") is not None:
        report.priority = changes["priority"].value

    await session.flush()

    # Re-query with the reviewer and distributor eagerly loaded so the
    # response can be serialised after the update.
    return await get_report(session, organization_id, report_id)


__all__ = [
    "ReportDistributorNotFoundError",
    "ReportNotFoundError",
    "ReportReviewerNotFoundError",
    "get_report",
    "list_locations",
    "list_reports",
    "list_reports_for_export",
    "page_count",
    "update_report",
]
