import uuid

from fastapi import APIRouter, HTTPException, Query
from fastapi import status as http_status

from src.core.db.dependencies import CurrentUser, DBSession
from src.domain.schemas.alert import (
    AlertEventType,
    AlertList,
    AlertStatus,
)
from src.domain.services import alert as alert_service
from src.domain.services import organization as organization_service

router = APIRouter(
    prefix="/organizations/{organization_id}/alerts",
    tags=["alerts"],
)


async def _require_organization_access(
    session: DBSession,
    organization_id: uuid.UUID,
    user_id: uuid.UUID,
) -> None:
    try:
        await organization_service.get_organization_for_user(
            session, organization_id, user_id
        )
    except organization_service.OrganizationNotFoundError:
        raise HTTPException(
            status_code=http_status.HTTP_404_NOT_FOUND,
            detail="Organization not found",
        ) from None
    except organization_service.OrganizationPermissionError:
        raise HTTPException(
            status_code=http_status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to view this organization",
        ) from None


@router.get("", response_model=AlertList)
async def list_alerts(
    organization_id: uuid.UUID,
    current_user: CurrentUser,
    session: DBSession,
    search: str | None = Query(default=None, max_length=120),
    event_type: AlertEventType | None = Query(default=None),
    alert_status: AlertStatus | None = Query(default=None, alias="status"),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=10, ge=1, le=100),
) -> AlertList:
    """Return the workspace's repeat-code and consumer-report events."""
    await _require_organization_access(
        session, organization_id, current_user.id
    )

    items, total = await alert_service.list_alerts(
        session,
        organization_id,
        search=search,
        event_type=event_type,
        alert_status=alert_status,
        page=page,
        page_size=page_size,
    )

    return AlertList(
        items=items,
        total=total,
        page=page,
        page_size=page_size,
        pages=alert_service.page_count(total, page_size),
    )
