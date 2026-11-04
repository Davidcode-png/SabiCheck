import math
import uuid

from sqlalchemy import and_, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import aliased

from src.domain.models.distributor import Distributor
from src.domain.models.product import Product
from src.domain.models.verification_code import CodeCheck, VerificationCode
from src.domain.schemas.verification import (
    VerificationAttemptCounts,
    VerificationAttemptList,
    VerificationAttemptRead,
    VerificationProductOption,
    VerificationResult,
    VerificationSort,
)

# Unmatched lookups are deliberately excluded from the verification register.
VISIBLE_RESULTS = ("match", "repeat")


def page_count(total: int, page_size: int) -> int:
    if total <= 0:
        return 1
    return max(1, math.ceil(total / page_size))


def _filters(
    organization_id: uuid.UUID,
    *,
    search: str | None = None,
    product_id: uuid.UUID | None = None,
    location: str | None = None,
    result: VerificationResult | None = None,
) -> list:
    filters = [
        CodeCheck.organization_id == organization_id,
        CodeCheck.result.in_(VISIBLE_RESULTS),
    ]

    if search and search.strip():
        term = f"%{search.strip()}%"
        filters.append(
            or_(
                CodeCheck.verification_code.has(
                    VerificationCode.code.ilike(term)
                ),
                CodeCheck.product.has(Product.name.ilike(term)),
                CodeCheck.product.has(Product.brand_name.ilike(term)),
            )
        )

    if product_id is not None:
        filters.append(CodeCheck.product_id == product_id)

    if location and location.strip():
        place = location.strip()
        matches_place = or_(
            Distributor.city == place,
            Distributor.state == place,
        )
        filters.append(
            or_(
                # A check keeps the distributor it was recorded against.
                and_(
                    CodeCheck.distributor_id.is_not(None),
                    CodeCheck.distributor.has(matches_place),
                ),
                # Older checks fall back to the code's current assignment.
                and_(
                    CodeCheck.distributor_id.is_(None),
                    CodeCheck.verification_code.has(
                        VerificationCode.distributor.has(matches_place)
                    ),
                ),
            )
        )

    if result is not None:
        filters.append(CodeCheck.result == result)

    return filters


def _distributor_for(check: CodeCheck) -> Distributor | None:
    """Prefer the snapshot taken at check time, then the code's assignment."""
    if check.distributor is not None:
        return check.distributor
    if check.verification_code is not None:
        return check.verification_code.distributor
    return None


def _to_read(check: CodeCheck) -> VerificationAttemptRead:
    distributor = _distributor_for(check)
    product = check.product

    return VerificationAttemptRead(
        id=check.id,
        code=check.verification_code.code,
        product_id=check.product_id,
        product_name=(
            product.name if product is not None else None
        ),
        result=check.result,  # type: ignore[arg-type]
        location=(
            distributor.city or distributor.state
            if distributor is not None
            else None
        ),
        distributor_name=(
            distributor.name if distributor is not None else None
        ),
        distributor_tracking_code=(
            distributor.tracking_code if distributor is not None else None
        ),
        checked_at=check.checked_at,
    )


async def _counts(
    session: AsyncSession, filters: list
) -> VerificationAttemptCounts:
    result = await session.execute(
        select(CodeCheck.result, func.count(CodeCheck.id))
        .where(*filters)
        .group_by(CodeCheck.result)
    )

    counts = VerificationAttemptCounts()
    for value, count in result.all():
        if value == "match":
            counts.matches = count
        elif value == "repeat":
            counts.repeats = count

    counts.all = counts.matches + counts.repeats
    return counts


async def _products(
    session: AsyncSession, organization_id: uuid.UUID
) -> list[VerificationProductOption]:
    result = await session.execute(
        select(Product.id, Product.name)
        .join(CodeCheck, CodeCheck.product_id == Product.id)
        .where(
            CodeCheck.organization_id == organization_id,
            CodeCheck.result.in_(VISIBLE_RESULTS),
        )
        .distinct()
        .order_by(Product.name)
    )

    return [
        VerificationProductOption(id=product_id, name=name)
        for product_id, name in result.all()
    ]


async def _locations(
    session: AsyncSession, organization_id: uuid.UUID
) -> list[str]:
    check_distributor = aliased(Distributor)
    code_distributor = aliased(Distributor)

    result = await session.execute(
        select(
            CodeCheck.distributor_id,
            check_distributor.city,
            check_distributor.state,
            code_distributor.city,
            code_distributor.state,
        )
        .select_from(CodeCheck)
        .join(
            VerificationCode,
            VerificationCode.id == CodeCheck.verification_code_id,
        )
        .outerjoin(
            check_distributor,
            check_distributor.id == CodeCheck.distributor_id,
        )
        .outerjoin(
            code_distributor,
            code_distributor.id == VerificationCode.distributor_id,
        )
        .where(
            CodeCheck.organization_id == organization_id,
            CodeCheck.result.in_(VISIBLE_RESULTS),
        )
        .distinct()
    )

    places: set[str] = set()
    for (
        snapshot_id,
        snapshot_city,
        snapshot_state,
        code_city,
        code_state,
    ) in result.all():
        city, state = (
            (snapshot_city, snapshot_state)
            if snapshot_id is not None
            else (code_city, code_state)
        )
        place = (city or "").strip() or (state or "").strip()
        if place:
            places.add(place)

    return sorted(places, key=str.casefold)


async def list_attempts(
    session: AsyncSession,
    organization_id: uuid.UUID,
    *,
    search: str | None = None,
    product_id: uuid.UUID | None = None,
    location: str | None = None,
    result: VerificationResult | None = None,
    sort: VerificationSort = "latest",
    page: int = 1,
    page_size: int = 50,
) -> VerificationAttemptList:
    filters = _filters(
        organization_id,
        search=search,
        product_id=product_id,
        location=location,
        result=result,
    )

    total = (
        await session.scalar(
            select(func.count(CodeCheck.id))
            .select_from(CodeCheck)
            .where(*filters)
        )
        or 0
    )

    order = (
        CodeCheck.checked_at.asc()
        if sort == "oldest"
        else CodeCheck.checked_at.desc()
    )

    rows = await session.execute(
        select(CodeCheck)
        .where(*filters)
        .order_by(order, CodeCheck.id.asc())
        .offset((page - 1) * page_size)
        .limit(page_size)
    )

    return VerificationAttemptList(
        items=[_to_read(check) for check in rows.scalars().unique().all()],
        total=total,
        page=page,
        page_size=page_size,
        pages=page_count(total, page_size),
        counts=await _counts(
            session,
            _filters(
                organization_id,
                search=search,
                product_id=product_id,
                location=location,
            ),
        ),
        products=await _products(session, organization_id),
        locations=await _locations(session, organization_id),
    )
