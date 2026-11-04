import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.domain.models.organization import (
    Organization,
    OrganizationRole,
    OrganizationUser,
)
from src.domain.models.user import User
from src.domain.schemas.organization import OrganizationCreate, OrganizationUpdate


class OrganizationNotFoundError(Exception):
    pass


class OrganizationPermissionError(Exception):
    pass


class OrganizationReferenceConflictError(Exception):
    pass


def _generate_reference_number() -> str:
    return f"SC-ORG-{uuid.uuid4().hex[:8].upper()}"


async def _reference_exists(session: AsyncSession, reference_number: str) -> bool:
    result = await session.execute(
        select(Organization.id).where(
            Organization.reference_number == reference_number
        )
    )
    return result.scalar_one_or_none() is not None


async def create_organization(
    session: AsyncSession, data: OrganizationCreate, owner: User
) -> Organization:
    """Create an organization and make the creator its owner."""
    reference_number = data.reference_number

    if reference_number:
        if await _reference_exists(session, reference_number):
            raise OrganizationReferenceConflictError
    else:
        reference_number = _generate_reference_number()
        while await _reference_exists(session, reference_number):
            reference_number = _generate_reference_number()

    organization = Organization(
        **data.model_dump(exclude={"reference_number"}),
        reference_number=reference_number,
    )
    session.add(organization)
    await session.flush()

    session.add(
        OrganizationUser(
            user_id=owner.id,
            organization_id=organization.id,
            role=OrganizationRole.OWNER,
        )
    )
    await session.flush()

    return organization


async def get_membership(
    session: AsyncSession, organization_id: uuid.UUID, user_id: uuid.UUID
) -> OrganizationUser | None:
    result = await session.execute(
        select(OrganizationUser).where(
            OrganizationUser.organization_id == organization_id,
            OrganizationUser.user_id == user_id,
        )
    )
    return result.scalar_one_or_none()


async def get_organization_for_user(
    session: AsyncSession,
    organization_id: uuid.UUID,
    user_id: uuid.UUID,
    *,
    roles: set[OrganizationRole] | None = None,
) -> tuple[Organization, OrganizationUser]:
    """Return the organization and membership, or raise if access is denied."""
    organization = await session.get(Organization, organization_id)
    membership = (
        await get_membership(session, organization_id, user_id)
        if organization
        else None
    )

    # Non-members get a 404 so organization IDs cannot be probed.
    if organization is None or membership is None:
        raise OrganizationNotFoundError
    if roles is not None and membership.role not in roles:
        raise OrganizationPermissionError

    return organization, membership


async def list_organizations(
    session: AsyncSession, user_id: uuid.UUID
) -> list[tuple[Organization, OrganizationUser]]:
    result = await session.execute(
        select(Organization, OrganizationUser)
        .join(
            OrganizationUser,
            OrganizationUser.organization_id == Organization.id,
        )
        .where(OrganizationUser.user_id == user_id)
        .order_by(Organization.created_at.desc())
    )
    return list(result.all())


async def update_organization(
    session: AsyncSession,
    organization: Organization,
    data: OrganizationUpdate,
) -> Organization:
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(organization, field, value)

    await session.flush()
    # ``updated_at`` is set with ``onupdate`` on the server, so reload it.
    await session.refresh(organization)
    return organization


async def list_members(
    session: AsyncSession, organization_id: uuid.UUID
) -> list[tuple[OrganizationUser, User]]:
    result = await session.execute(
        select(OrganizationUser, User)
        .join(User, User.id == OrganizationUser.user_id)
        .where(OrganizationUser.organization_id == organization_id)
        .order_by(OrganizationUser.created_at)
    )
    return list(result.all())
