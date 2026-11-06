import csv
import io
import uuid

from fastapi import APIRouter, HTTPException, Query, Response
from fastapi import status as http_status

from src.core.db.dependencies import CurrentUser, DBSession
from src.domain.models.organization import OrganizationRole
from src.domain.models.verification_code import ConcernType, ReportPriority
from src.domain.schemas.report import (
    ConsumerReportList,
    ConsumerReportRead,
    ConsumerReportUpdate,
    ReportStatus,
)
from src.domain.services import organization as organization_service
from src.domain.services import report as report_service
from src.domain.services import triage as triage_service

router = APIRouter(
    prefix="/organizations/{organization_id}/reports",
    tags=["consumer-reports"],
)

_MANAGER_ROLES = {OrganizationRole.OWNER, OrganizationRole.ADMIN}

_STATUS_LABELS = {
    ReportStatus.RECEIVED: "Received",
    ReportStatus.UNDER_REVIEW: "Under review",
    ReportStatus.REFERRED: "Referred",
}

_PRIORITY_LABELS = {
    ReportPriority.LOW: "Low",
    ReportPriority.NORMAL: "Normal",
    ReportPriority.URGENT: "Urgent",
}


def _not_found(detail: str = "Report not found") -> HTTPException:
    return HTTPException(
        status_code=http_status.HTTP_404_NOT_FOUND, detail=detail
    )


def _forbidden() -> HTTPException:
    return HTTPException(
        status_code=http_status.HTTP_403_FORBIDDEN,
        detail="You do not have permission to manage this organization",
    )


async def _require_organization_access(
    session: DBSession,
    organization_id: uuid.UUID,
    user_id: uuid.UUID,
    *,
    roles: set[OrganizationRole] | None = None,
) -> None:
    try:
        await organization_service.get_organization_for_user(
            session, organization_id, user_id, roles=roles
        )
    except organization_service.OrganizationNotFoundError:
        raise _not_found("Organization not found") from None
    except organization_service.OrganizationPermissionError:
        raise _forbidden() from None


@router.get("", response_model=ConsumerReportList)
async def list_reports(
    organization_id: uuid.UUID,
    current_user: CurrentUser,
    session: DBSession,
    search: str | None = Query(default=None, max_length=120),
    issue_type: ConcernType | None = Query(default=None),
    report_status: ReportStatus | None = Query(default=None, alias="status"),
    priority: ReportPriority | None = Query(default=None),
    location: str | None = Query(default=None, max_length=120),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=10, ge=1, le=100),
) -> ConsumerReportList:
    await _require_organization_access(
        session, organization_id, current_user.id
    )

    items, total, locations = await report_service.list_reports(
        session,
        organization_id,
        search=search,
        concern=issue_type,
        report_status=report_status,
        priority=priority,
        location=location,
        page=page,
        page_size=page_size,
    )

    return ConsumerReportList(
        items=[ConsumerReportRead.model_validate(item) for item in items],
        total=total,
        page=page,
        page_size=page_size,
        pages=report_service.page_count(total, page_size),
        locations=locations,
    )


@router.get("/export")
async def export_reports(
    organization_id: uuid.UUID,
    current_user: CurrentUser,
    session: DBSession,
    search: str | None = Query(default=None, max_length=120),
    issue_type: ConcernType | None = Query(default=None),
    report_status: ReportStatus | None = Query(default=None, alias="status"),
    priority: ReportPriority | None = Query(default=None),
    location: str | None = Query(default=None, max_length=120),
) -> Response:
    """Download every report matching the current register filters."""
    await _require_organization_access(
        session, organization_id, current_user.id
    )

    reports = await report_service.list_reports_for_export(
        session,
        organization_id,
        search=search,
        concern=issue_type,
        report_status=report_status,
        priority=priority,
        location=location,
    )

    buffer = io.StringIO()
    writer = csv.writer(buffer)
    writer.writerow(
        [
            "Case code",
            "Product name",
            "Product code",
            "Case/issue",
            "Priority",
            "Reviewer",
            "Distributor",
            "Location",
            "Date reported",
            "Status",
        ]
    )

    for report in reports:
        reviewer = ""
        if report.reviewer is not None:
            reviewer = (
                f"{report.reviewer.first_name} {report.reviewer.last_name}"
            ).strip()

        distributor = ""
        location_value = report.purchase_location or ""
        if report.distributor is not None:
            distributor = report.distributor.name
            location_value = ", ".join(
                part
                for part in (
                    report.distributor.city,
                    report.distributor.state,
                )
                if part
            )

        try:
            status_value = ReportStatus(report.status)
        except ValueError:
            status_value = ReportStatus.RECEIVED

        try:
            priority_value = ReportPriority(report.priority)
        except ValueError:
            priority_value = ReportPriority.NORMAL

        writer.writerow(
            [
                report.reference,
                report.product_name or "",
                report.code,
                report.concern.value,
                _PRIORITY_LABELS[priority_value],
                reviewer,
                distributor,
                location_value,
                report.created_at.strftime("%Y-%m-%d"),
                _STATUS_LABELS[status_value],
            ]
        )

    # The BOM lets Excel open the UTF-8 file without garbled characters.
    content = "\ufeff" + buffer.getvalue()

    return Response(
        content=content,
        media_type="text/csv; charset=utf-8",
        headers={
            "Content-Disposition": (
                'attachment; filename="consumer-reports.csv"'
            )
        },
    )


@router.get("/{report_id}", response_model=ConsumerReportRead)
async def get_report(
    organization_id: uuid.UUID,
    report_id: uuid.UUID,
    current_user: CurrentUser,
    session: DBSession,
) -> ConsumerReportRead:
    await _require_organization_access(
        session, organization_id, current_user.id
    )

    try:
        report = await report_service.get_report(
            session, organization_id, report_id
        )
    except report_service.ReportNotFoundError:
        raise _not_found() from None

    return ConsumerReportRead.model_validate(report)


@router.patch("/{report_id}", response_model=ConsumerReportRead)
async def update_report(
    organization_id: uuid.UUID,
    report_id: uuid.UUID,
    payload: ConsumerReportUpdate,
    current_user: CurrentUser,
    session: DBSession,
) -> ConsumerReportRead:
    await _require_organization_access(
        session, organization_id, current_user.id, roles=_MANAGER_ROLES
    )

    try:
        report = await report_service.update_report(
            session, organization_id, report_id, payload
        )
    except report_service.ReportNotFoundError:
        raise _not_found() from None
    except report_service.ReportReviewerNotFoundError:
        raise _not_found("Reviewer not found in this organization") from None
    except report_service.ReportDistributorNotFoundError:
        raise _not_found("Distributor not found in this organization") from None

    return ConsumerReportRead.model_validate(report)


@router.post("/{report_id}/triage", response_model=ConsumerReportRead)
async def triage_report(
    organization_id: uuid.UUID,
    report_id: uuid.UUID,
    current_user: CurrentUser,
    session: DBSession,
) -> ConsumerReportRead:
    """Generate an AI triage suggestion for one consumer report.

    The suggestion is stored alongside the report. It never changes the
    report's status, priority, reviewer, or distributor.
    """
    await _require_organization_access(
        session, organization_id, current_user.id, roles=_MANAGER_ROLES
    )

    try:
        report = await triage_service.triage_report(
            session, organization_id, report_id
        )
    except report_service.ReportNotFoundError:
        raise _not_found() from None
    except triage_service.TriageNotConfiguredError:
        raise HTTPException(
            status_code=http_status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=(
                "AI triage is not configured. Add GEMINI_API_KEY to the "
                "backend environment."
            ),
        ) from None
    except triage_service.TriageUnavailableError:
        raise HTTPException(
            status_code=http_status.HTTP_502_BAD_GATEWAY,
            detail=(
                "AI triage is temporarily unavailable. Please review this "
                "case manually."
            ),
        ) from None
    except triage_service.TriageInvalidResponseError:
        raise HTTPException(
            status_code=http_status.HTTP_502_BAD_GATEWAY,
            detail="AI triage returned an unusable response. Please try again.",
        ) from None

    return ConsumerReportRead.model_validate(report)
