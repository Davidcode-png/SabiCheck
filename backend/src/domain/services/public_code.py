import re
import secrets
import uuid
from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.domain.models.distributor import Distributor
from src.domain.models.organization import Organization
from src.domain.models.product import Product
from src.domain.models.verification_code import (
    CodeCheck,
    CodeReport,
    VerificationCode,
    VerificationCodeStatus,
)
from src.domain.schemas.public_code import (
    CodeCheckRead,
    CodeReportCreate,
    PublicDistributorRead,
    PublicProductRead,
)
from src.domain.services import product as product_service

_REFERENCE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
_CODE_RE = re.compile(r"[^A-Z0-9]+")
MAX_REFERENCE_ATTEMPTS = 8


def normalize_code(value: str | None) -> str:
    """Normalise a typed code so spacing and punctuation do not matter."""
    if not value:
        return ""
    return _CODE_RE.sub("", value.upper())


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


def _no_match(code: str) -> CodeCheckRead:
    return CodeCheckRead(
        result="no_match",
        code=code,
        check_count=0,
        previous_scans=0,
        product=None,
    )


async def _product_read(
    session: AsyncSession,
    product: Product,
    organization: Organization | None,
    distributor: Distributor | None = None,
) -> PublicProductRead:
    image = await product_service.get_product_image(session, product)

    return PublicProductRead(
        id=product.id,
        name=product.name,
        brand_name=product.brand_name,
        sku=product.sku,
        pack_size=product.pack_size,
        unit=product.unit,
        packaging_type=(
            product.packaging_type.value if product.packaging_type else None
        ),
        reg_no=product.reg_no,
        batch_no=product.batch.batch_no if product.batch else None,
        manufacturer_name=(
            organization.name if organization else "Unknown manufacturer"
        ),
        image_url=image.file_url if image else None,
        distributor=(
            PublicDistributorRead(
                name=distributor.name,
                distributor_type=distributor.distributor_type,
                tracking_code=distributor.tracking_code,
                city=distributor.city,
                state=distributor.state,
            )
            if distributor is not None
            else None
        ),
    )


async def check_code(session: AsyncSession, raw_code: str) -> CodeCheckRead:
    """Look up a consumer code and record the check.

    - an unused code becomes ``verified`` on its first successful check;
    - a code checked before returns ``repeat`` and increments its scan count;
    - a missing or already-used code returns ``no_match``.
    """
    code = normalize_code(raw_code)

    # Stored codes are 16 characters at most; anything longer cannot match.
    if not code or len(code) > 16:
        return _no_match(code[:16])

    result = await session.execute(
        select(VerificationCode)
        .where(VerificationCode.code == code)
        .with_for_update(of=VerificationCode)
    )
    record = result.scalar_one_or_none()

    if record is None:
        return _no_match(code)

    now = _utcnow()

    if record.status == VerificationCodeStatus.USED:
        # The code belongs to this organization, so a lookup is still useful
        # activity even though the consumer sees "no match".
        session.add(
            CodeCheck(
                verification_code_id=record.id,
                organization_id=record.organization_id,
                product_id=record.product_id,
                distributor_id=record.distributor_id,
                result="no_match",
                checked_at=now,
            )
        )
        await session.flush()
        return _no_match(code)

    previous_scans = 0

    if record.status == VerificationCodeStatus.UNUSED:
        record.status = VerificationCodeStatus.VERIFIED
        record.status_changed_at = now
        record.first_checked_at = now
        record.check_count = 1
        record.last_checked_at = now
        outcome = "match"
    else:
        record.check_count = (record.check_count or 0) + 1
        if record.first_checked_at is None:
            record.first_checked_at = now
        record.last_checked_at = now
        previous_scans = max(record.check_count - 1, 0)
        outcome = "repeat"

    session.add(
        CodeCheck(
            verification_code_id=record.id,
            organization_id=record.organization_id,
            product_id=record.product_id,
            distributor_id=record.distributor_id,
            result=outcome,
            checked_at=now,
        )
    )

    await session.flush()

    product = await session.get(Product, record.product_id)
    organization = await session.get(Organization, record.organization_id)

    return CodeCheckRead(
        result=outcome,
        code=record.code,
        check_count=record.check_count,
        previous_scans=previous_scans,
        product=(
            await _product_read(
                session, product, organization, record.distributor
            )
            if product is not None
            else None
        ),
    )


async def _reference_exists(
    session: AsyncSession, reference: str
) -> bool:
    result = await session.execute(
        select(CodeReport.id).where(CodeReport.reference == reference)
    )
    return result.scalar_one_or_none() is not None


async def _report_reference(session: AsyncSession) -> str:
    for _ in range(MAX_REFERENCE_ATTEMPTS):
        reference = "SCRPT" + "".join(
            secrets.choice(_REFERENCE_ALPHABET) for _ in range(5)
        )
        if not await _reference_exists(session, reference):
            return reference

    raise RuntimeError("Could not generate a unique report reference")


async def create_report(
    session: AsyncSession, data: CodeReportCreate
) -> CodeReport:
    """Store a consumer concern and flag the matching code as reported."""
    code = normalize_code(data.code)[:16]
    record: VerificationCode | None = None
    product: Product | None = None
    organization: Organization | None = None

    if code:
        result = await session.execute(
            select(VerificationCode)
            .where(VerificationCode.code == code)
            .with_for_update(of=VerificationCode)
        )
        record = result.scalar_one_or_none()

    if record is not None:
        product = await session.get(Product, record.product_id)
        organization = await session.get(
            Organization, record.organization_id
        )

        if record.status != VerificationCodeStatus.REPORTED:
            record.status = VerificationCodeStatus.REPORTED
            record.status_changed_at = _utcnow()

    product_name = (data.product_name or "").strip() or None

    if product_name is None and product is not None:
        product_name = (
            f"{product.brand_name} {product.name}".strip()
            if product.brand_name
            else product.name
        )

    report = CodeReport(
        reference=await _report_reference(session),
        code=code or data.code.strip().upper(),
        verification_code_id=record.id if record else None,
        product_id=product.id if product else None,
        organization_id=organization.id if organization else None,
        product_name=product_name,
        concern=data.concern,
        description=(data.description or "").strip() or None,
        purchase_location=(data.purchase_location or "").strip() or None,
        purchase_date=data.purchase_date,
        status="received",
    )
    session.add(report)
    await session.flush()

    return report
