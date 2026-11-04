import uuid

from fastapi import APIRouter, HTTPException, status

from src.core.db.dependencies import CurrentUser, DBSession
from src.domain.schemas.overview import OrganizationOverviewRead
from src.domain.services import organization as organization_service
from src.domain.services import overview as overview_service

router = APIRouter(
    prefix="/organizations/{organization_id}/overview",
    tags=["overview"],
)


@router.get("", response_model=OrganizationOverviewRead)
async def get_organization_overview(
    organization_id: uuid.UUID,
    current_user: CurrentUser,
    session: DBSession,
) -> OrganizationOverviewRead:
    """Return the aggregate counts for the workspace overview page."""
    try:
        await organization_service.get_organization_for_user(
            session, organization_id, current_user.id
        )
    except organization_service.OrganizationNotFoundError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Organization not found",
        ) from None
    except organization_service.OrganizationPermissionError:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to view this organization",
        ) from None

    return await overview_service.get_overview(session, organization_id)
