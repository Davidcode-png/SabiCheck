import uuid

from fastapi import APIRouter, HTTPException, Query, status

from src.core.db.dependencies import CurrentUser, DBSession
from src.domain.models.organization import OrganizationRole
from src.domain.schemas.verification import (
    VerificationAttemptList,
    VerificationResult,
    VerificationSort,
)
from src.domain.services import organization as organization_service
from src.domain.services import verification as verification_service

router = APIRouter(
    prefix="/organizations/{organization_id}/verifications",
    tags=["verifications"],
)


def _not_found(detail: str = "Organization not found") -> HTTPException:
    return HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=detail)


def _forbidden() -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="You do not have permission to view this organization",
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
        raise _not_found() from None
    except organization_service.OrganizationPermissionError:
        raise _forbidden() from None


@router.get("", response_model=VerificationAttemptList)
async def list_verifications(
    organization_id: uuid.UUID,
    current_user: CurrentUser,
    session: DBSession,
    search: str | None = Query(default=None, max_length=120),
    product_id: uuid.UUID | None = Query(default=None),
    location: str | None = Query(default=None, max_length=120),
    outcome: VerificationResult | None = Query(default=None),
    sort: VerificationSort = Query(default="latest"),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=50, ge=1, le=100),
) -> VerificationAttemptList:
    """List the code checks recorded for this workspace."""
    await _require_organization_access(
        session, organization_id, current_user.id
    )

    return await verification_service.list_attempts(
        session,
        organization_id,
        search=search,
        product_id=product_id,
        location=location,
        result=outcome,
        sort=sort,
        page=page,
        page_size=page_size,
    )
