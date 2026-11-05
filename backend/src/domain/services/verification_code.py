import math
import secrets
import uuid
from datetime import datetime, timezone

from sqlalchemy import func, select
from sqlalchemy.dialects.postgresql import insert as pg_insert
from sqlalchemy.ext.asyncio import AsyncSession

from src.domain.models.distributor import Distributor
from src.domain.models.organization import Organization
from src.domain.models.product import Product
from src.domain.models.verification_code import (
    CodeOrderStatus,
    VerificationCode,
    VerificationCodeOrder,
    VerificationCodeStatus,
)
from src.domain.schemas.verification_code import (
    VerificationCodeOrderCreate,
    VerificationCodeStatusCounts,
    VerificationCodeUpdate,
)

UNIT_PRICE_KOBO = 1_000
SERVICE_FEE_KOBO = 5_000
MAX_CODES_PER_ORDER = 50_000
MAX_INSERT_ATTEMPTS = 200
INSERT_CHUNK_SIZE = 2_000


class ProductBatchRequiredError(Exception):
    """Raised when a product has no batch to attach codes to."""


class ManufacturerPrefixInvalidError(Exception):
    """Raised when the organization has no usable manufacturer prefix."""


class VerificationCodeNotFoundError(Exception):
    pass


class VerificationCodeDistributorNotFoundError(Exception):
    """Raised when a code is assigned to a distributor outside the workspace."""


class VerificationCodeGenerationError(Exception):
    pass


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


def _validate_prefix(organization: Organization) -> str:
    prefix = (organization.manufacturer_prefix or "").strip().upper()

    if len(prefix) != 3 or not prefix.isalnum():
        raise ManufacturerPrefixInvalidError

    return prefix


def _order_reference() -> str:
    return (
        f"VC-{datetime.now(timezone.utc):%Y%m%d}-"
        f"{uuid.uuid4().hex[:10].upper()}"
    )


async def _insert_codes(
    session: AsyncSession,
    order: VerificationCodeOrder,
    prefix: str,
    quantity: int,
) -> int:
    """Insert unique codes in chunks, retrying any collisions.

    PostgreSQL's ``ON CONFLICT DO NOTHING`` makes concurrent purchases safe:
    if two requests generate the same random code, only one row is inserted and
    the other request generates a replacement.
    """
    inserted = 0
    attempts = 0

    while inserted < quantity and attempts < MAX_INSERT_ATTEMPTS:
        attempts += 1
        needed = min(quantity - inserted, INSERT_CHUNK_SIZE)
        codes: set[str] = set()

        while len(codes) < needed:
            codes.add(f"{prefix}{secrets.randbelow(100_000_000):08d}")

        values = [
            {
                "id": uuid.uuid4(),
                "code": code,
                "organization_id": order.organization_id,
                "product_id": order.product_id,
                "batch_id": order.batch_id,
                "order_id": order.id,
                "status": VerificationCodeStatus.UNUSED,
            }
            for code in codes
        ]

        statement = (
            pg_insert(VerificationCode)
            .values(values)
            .on_conflict_do_nothing(index_elements=["code"])
        )
        result = await session.execute(statement)
        inserted += result.rowcount or 0

    if inserted < quantity:
        raise VerificationCodeGenerationError

    return inserted


async def create_order(
    session: AsyncSession,
    organization: Organization,
    product: Product,
    data: VerificationCodeOrderCreate,
) -> tuple[VerificationCodeOrder, int]:
    if product.batch_id is None:
        raise ProductBatchRequiredError

    prefix = _validate_prefix(organization)
    unit_price = UNIT_PRICE_KOBO
    service_fee = SERVICE_FEE_KOBO

    order = VerificationCodeOrder(
        reference=_order_reference(),
        organization_id=organization.id,
        product_id=product.id,
        batch_id=product.batch_id,
        quantity=data.quantity,
        unit_price_kobo=unit_price,
        service_fee_kobo=service_fee,
        total_amount_kobo=unit_price * data.quantity + service_fee,
        payment_method=data.payment_method,
        # Payments are simulated for now; a Paystack webhook will mark real
        # orders as paid later.
        status=CodeOrderStatus.PAID,
        paid_at=_utcnow(),
    )
    session.add(order)
    await session.flush()

    generated = await _insert_codes(session, order, prefix, data.quantity)

    return order, generated


async def list_orders(
    session: AsyncSession, product_id: uuid.UUID, limit: int = 50
) -> list[VerificationCodeOrder]:
    result = await session.execute(
        select(VerificationCodeOrder)
        .where(VerificationCodeOrder.product_id == product_id)
        .order_by(VerificationCodeOrder.created_at.desc())
        .limit(limit)
    )
    return list(result.scalars().unique().all())


async def _status_counts(
    session: AsyncSession, product_id: uuid.UUID
) -> VerificationCodeStatusCounts:
    result = await session.execute(
        select(VerificationCode.status, func.count())
        .where(VerificationCode.product_id == product_id)
        .group_by(VerificationCode.status)
    )

    counts = VerificationCodeStatusCounts()

    for status, count in result.all():
        if status == VerificationCodeStatus.UNUSED:
            counts.unused = count
        elif status == VerificationCodeStatus.VERIFIED:
            counts.verified = count
        elif status == VerificationCodeStatus.USED:
            counts.used = count
        elif status == VerificationCodeStatus.REPORTED:
            counts.reported = count

    counts.total = (
        counts.unused + counts.verified + counts.used + counts.reported
    )
    return counts


async def list_codes(
    session: AsyncSession,
    product_id: uuid.UUID,
    *,
    status: VerificationCodeStatus | None = None,
    search: str | None = None,
    page: int = 1,
    page_size: int = 50,
) -> tuple[list[VerificationCode], int, VerificationCodeStatusCounts]:
    filters = [VerificationCode.product_id == product_id]

    if status is not None:
        filters.append(VerificationCode.status == status)

    if search and search.strip():
        filters.append(
            VerificationCode.code.ilike(f"%{search.strip().upper()}%")
        )

    total_result = await session.execute(
        select(func.count()).select_from(VerificationCode).where(*filters)
    )
    total = total_result.scalar_one()

    result = await session.execute(
        select(VerificationCode)
        .where(*filters)
        .order_by(VerificationCode.created_at.desc(), VerificationCode.code)
        .offset((page - 1) * page_size)
        .limit(page_size)
    )
    codes = list(result.scalars().unique().all())
    counts = await _status_counts(session, product_id)

    return codes, total, counts


async def export_codes(
    session: AsyncSession,
    product_id: uuid.UUID,
    *,
    status: VerificationCodeStatus | None = None,
    search: str | None = None,
) -> list[VerificationCode]:
    """Return every code matching the current filters, ordered for printing."""
    filters = [VerificationCode.product_id == product_id]

    if status is not None:
        filters.append(VerificationCode.status == status)

    if search and search.strip():
        filters.append(
            VerificationCode.code.ilike(f"%{search.strip().upper()}%")
        )

    result = await session.execute(
        select(VerificationCode)
        .where(*filters)
        .order_by(VerificationCode.code)
    )
    return list(result.scalars().unique().all())


async def get_summary(
    session: AsyncSession,
    product: Product,
    manufacturer_prefix: str,
) -> tuple[VerificationCodeStatusCounts, str | None, str]:
    counts = await _status_counts(session, product.id)
    batch_no = product.batch.batch_no if product.batch else None
    return counts, batch_no, manufacturer_prefix


async def get_code(
    session: AsyncSession,
    product_id: uuid.UUID,
    code_id: uuid.UUID,
) -> VerificationCode:
    result = await session.execute(
        select(VerificationCode).where(
            VerificationCode.id == code_id,
            VerificationCode.product_id == product_id,
        )
    )
    code = result.scalar_one_or_none()

    if code is None:
        raise VerificationCodeNotFoundError

    return code


async def _validate_distributor(
    session: AsyncSession,
    organization_id: uuid.UUID,
    distributor_id: uuid.UUID,
) -> None:
    result = await session.execute(
        select(Distributor.id).where(
            Distributor.id == distributor_id,
            Distributor.organization_id == organization_id,
        )
    )

    if result.scalar_one_or_none() is None:
        raise VerificationCodeDistributorNotFoundError


async def update_code(
    session: AsyncSession,
    organization_id: uuid.UUID,
    product_id: uuid.UUID,
    code_id: uuid.UUID,
    data: VerificationCodeUpdate,
) -> VerificationCode:
    """Update a code's status and/or the distributor it was released through."""
    code = await get_code(session, product_id, code_id)
    changes = data.model_dump(exclude_unset=True)

    status = changes.get("status")
    if status is not None and code.status != status:
        code.status = status
        code.status_changed_at = _utcnow()

    if "distributor_id" in changes:
        distributor_id = changes["distributor_id"]

        if distributor_id is not None:
            await _validate_distributor(
                session, organization_id, distributor_id
            )

        code.distributor_id = distributor_id

    await session.flush()
    # Re-query so the joined distributor relationship reflects the assignment
    # that was just written instead of the value cached on the instance.
    result = await session.execute(
        select(VerificationCode)
        .where(VerificationCode.id == code.id)
        .execution_options(populate_existing=True)
    )
    return result.scalar_one()


async def bulk_assign_distributor(
    session: AsyncSession,
    organization_id: uuid.UUID,
    product_id: uuid.UUID,
    code_ids: list[uuid.UUID],
    distributor_id: uuid.UUID | None,
) -> list[VerificationCode]:
    """Assign many codes to one distributor, or clear their distributor.

    Every selected code must belong to the product and organization; a partial
    match is rejected so the caller never believes more codes were updated than
    actually were.
    """
    if distributor_id is not None:
        await _validate_distributor(session, organization_id, distributor_id)

    unique_ids = list(dict.fromkeys(code_ids))

    result = await session.execute(
        select(VerificationCode).where(
            VerificationCode.id.in_(unique_ids),
            VerificationCode.product_id == product_id,
            VerificationCode.organization_id == organization_id,
        )
    )
    codes = list(result.scalars().unique().all())

    if len(codes) != len(unique_ids):
        raise VerificationCodeNotFoundError

    for code in codes:
        code.distributor_id = distributor_id

    await session.flush()

    # Re-query so the joined distributor relationship reflects the new
    # assignment instead of the value cached on each instance.
    refreshed = await session.execute(
        select(VerificationCode)
        .where(VerificationCode.id.in_(unique_ids))
        .execution_options(populate_existing=True)
    )
    return list(refreshed.scalars().unique().all())


def page_count(total: int, page_size: int) -> int:
    return max(1, math.ceil(total / page_size))
