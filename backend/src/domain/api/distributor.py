import uuid

from fastapi import APIRouter, HTTPException, Query, status

from src.core.db.dependencies import CurrentUser, DBSession
from src.domain.models.distributor import DistributorType
from src.domain.models.organization import OrganizationRole
from src.domain.schemas.distributor import (
    DistributorCreate,
    DistributorList,
    DistributorRead,
    DistributorUpdate,
)
from src.domain.services import distributor as distributor_service
from src.domain.services import organization as organization_service

router = APIRouter(
    prefix="/organizations/{organization_id}/distributors",
    tags=["distributors"],
)

_MANAGER_ROLES = {OrganizationRole.OWNER, OrganizationRole.ADMIN}


def _not_found(detail: str = "Distributor not found") -> HTTPException:
    return HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=detail)


def _forbidden() -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
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


@router.get("", response_model=DistributorList)
async def list_distributors(
    organization_id: uuid.UUID,
    current_user: CurrentUser,
    session: DBSession,
    search: str | None = Query(default=None, max_length=120),
    distributor_type: DistributorType | None = Query(
        default=None, alias="type"
    ),
    location: str | None = Query(default=None, max_length=120),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=10, ge=1, le=100),
) -> DistributorList:
    await _require_organization_access(
        session, organization_id, current_user.id
    )

    items, total, locations = await distributor_service.list_distributors(
        session,
        organization_id,
        search=search,
        distributor_type=distributor_type,
        location=location,
        page=page,
        page_size=page_size,
    )

    return DistributorList(
        items=[DistributorRead.model_validate(item) for item in items],
        total=total,
        page=page,
        page_size=page_size,
        pages=distributor_service.page_count(total, page_size),
        locations=locations,
    )


@router.post(
    "",
    response_model=DistributorRead,
    status_code=status.HTTP_201_CREATED,
)
async def create_distributor(
    organization_id: uuid.UUID,
    payload: DistributorCreate,
    current_user: CurrentUser,
    session: DBSession,
) -> DistributorRead:
    await _require_organization_access(
        session, organization_id, current_user.id, roles=_MANAGER_ROLES
    )

    try:
        distributor = await distributor_service.create_distributor(
            session, organization_id, payload
        )
    except distributor_service.DistributorCodeGenerationError:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=(
                "We could not assign a distributor ID. Please try again."
            ),
        ) from None

    return DistributorRead.model_validate(distributor)


@router.get("/{distributor_id}", response_model=DistributorRead)
async def get_distributor(
    organization_id: uuid.UUID,
    distributor_id: uuid.UUID,
    current_user: CurrentUser,
    session: DBSession,
) -> DistributorRead:
    await _require_organization_access(
        session, organization_id, current_user.id
    )

    try:
        distributor = await distributor_service.get_distributor(
            session, organization_id, distributor_id
        )
    except distributor_service.DistributorNotFoundError:
        raise _not_found() from None

    return DistributorRead.model_validate(distributor)


@router.patch("/{distributor_id}", response_model=DistributorRead)
async def update_distributor(
    organization_id: uuid.UUID,
    distributor_id: uuid.UUID,
    payload: DistributorUpdate,
    current_user: CurrentUser,
    session: DBSession,
) -> DistributorRead:
    await _require_organization_access(
        session, organization_id, current_user.id, roles=_MANAGER_ROLES
    )

    try:
        distributor = await distributor_service.update_distributor(
            session, organization_id, distributor_id, payload
        )
    except distributor_service.DistributorNotFoundError:
        raise _not_found() from None

    return DistributorRead.model_validate(distributor)


@router.delete(
    "/{distributor_id}", status_code=status.HTTP_204_NO_CONTENT
)
async def delete_distributor(
    organization_id: uuid.UUID,
    distributor_id: uuid.UUID,
    current_user: CurrentUser,
    session: DBSession,
) -> None:
    await _require_organization_access(
        session, organization_id, current_user.id, roles=_MANAGER_ROLES
    )

    try:
        await distributor_service.delete_distributor(
            session, organization_id, distributor_id
        )
    except distributor_service.DistributorNotFoundError:
        raise _not_found() from None
