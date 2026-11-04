import math
import uuid

from sqlalchemy import func, or_, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from src.domain.models.distributor import Distributor, DistributorType
from src.domain.schemas.distributor import DistributorCreate, DistributorUpdate

MAX_CODE_ATTEMPTS = 5
CODE_PREFIX = "DST"


class DistributorNotFoundError(Exception):
    pass


class DistributorCodeGenerationError(Exception):
    """Raised when a unique tracking code could not be allocated."""


def page_count(total: int, page_size: int) -> int:
    if total <= 0:
        return 1
    return max(1, math.ceil(total / page_size))


async def _next_tracking_code(
    session: AsyncSession, organization_id: uuid.UUID
) -> str:
    result = await session.execute(
        select(Distributor.tracking_code).where(
            Distributor.organization_id == organization_id,
            Distributor.tracking_code.like(f"{CODE_PREFIX}%"),
        )
    )

    highest = 0
    for (code,) in result.all():
        suffix = code[len(CODE_PREFIX) :]
        if suffix.isdigit():
            highest = max(highest, int(suffix))

    return f"{CODE_PREFIX}{highest + 1:04d}"


async def create_distributor(
    session: AsyncSession,
    organization_id: uuid.UUID,
    data: DistributorCreate,
) -> Distributor:
    payload = data.model_dump()

    for _ in range(MAX_CODE_ATTEMPTS):
        distributor = Distributor(
            organization_id=organization_id,
            tracking_code=await _next_tracking_code(
                session, organization_id
            ),
            **payload,
        )

        try:
            async with session.begin_nested():
                session.add(distributor)
                await session.flush()
        except IntegrityError:
            if distributor in session:
                session.expunge(distributor)
            continue

        return distributor

    raise DistributorCodeGenerationError


async def list_locations(
    session: AsyncSession, organization_id: uuid.UUID
) -> list[str]:
    result = await session.execute(
        select(Distributor.city)
        .where(
            Distributor.organization_id == organization_id,
            Distributor.city.is_not(None),
            Distributor.city != "",
        )
        .distinct()
        .order_by(Distributor.city)
    )

    return [city for (city,) in result.all() if city]


async def list_distributors(
    session: AsyncSession,
    organization_id: uuid.UUID,
    *,
    search: str | None = None,
    distributor_type: DistributorType | None = None,
    location: str | None = None,
    page: int = 1,
    page_size: int = 10,
) -> tuple[list[Distributor], int, list[str]]:
    filters = [Distributor.organization_id == organization_id]

    if search and search.strip():
        term = f"%{search.strip()}%"
        filters.append(
            or_(
                Distributor.name.ilike(term),
                Distributor.tracking_code.ilike(term),
                Distributor.contact_name.ilike(term),
                Distributor.phone.ilike(term),
            )
        )

    if distributor_type is not None:
        filters.append(Distributor.distributor_type == distributor_type)

    if location and location.strip():
        filters.append(Distributor.city == location.strip())

    total = (
        await session.scalar(
            select(func.count(Distributor.id)).where(*filters)
        )
        or 0
    )

    result = await session.execute(
        select(Distributor)
        .where(*filters)
        .order_by(
            Distributor.created_at.desc(), Distributor.name.asc()
        )
        .offset((page - 1) * page_size)
        .limit(page_size)
    )

    items = list(result.scalars().unique().all())
    locations = await list_locations(session, organization_id)

    return items, total, locations


async def get_distributor(
    session: AsyncSession,
    organization_id: uuid.UUID,
    distributor_id: uuid.UUID,
) -> Distributor:
    result = await session.execute(
        select(Distributor).where(
            Distributor.id == distributor_id,
            Distributor.organization_id == organization_id,
        )
    )
    distributor = result.scalar_one_or_none()

    if distributor is None:
        raise DistributorNotFoundError

    return distributor


async def update_distributor(
    session: AsyncSession,
    organization_id: uuid.UUID,
    distributor_id: uuid.UUID,
    data: DistributorUpdate,
) -> Distributor:
    distributor = await get_distributor(
        session, organization_id, distributor_id
    )

    changes = data.model_dump(exclude_unset=True)

    # These fields are required on the model, so a null must not clear them.
    for required_field in ("name", "distributor_type", "phone"):
        if changes.get(required_field) is None:
            changes.pop(required_field, None)

    for field, value in changes.items():
        setattr(distributor, field, value)

    await session.flush()
    # ``updated_at`` is generated by the database on update; reload it so the
    # response can be serialised without a lazy load.
    await session.refresh(distributor)
    return distributor


async def delete_distributor(
    session: AsyncSession,
    organization_id: uuid.UUID,
    distributor_id: uuid.UUID,
) -> None:
    distributor = await get_distributor(
        session, organization_id, distributor_id
    )
    await session.delete(distributor)
