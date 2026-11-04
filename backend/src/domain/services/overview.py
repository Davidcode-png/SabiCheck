import uuid
from datetime import datetime, time, timedelta, timezone

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from src.domain.models.product import Product, ProductBatch
from src.domain.models.verification_code import (
    CodeCheck,
    VerificationCode,
    VerificationCodeStatus,
)
from src.domain.schemas.overview import (
    OrganizationOverviewRead,
    VerificationTrendPoint,
)

# The overview chart shows a fortnight of daily check activity.
TREND_DAYS = 16

# Nigeria does not observe daylight saving, so a fixed UTC+1 offset is exact.
WAT = timezone(timedelta(hours=1), name="WAT")


async def _verification_trend(
    session: AsyncSession, organization_id: uuid.UUID
) -> list[VerificationTrendPoint]:
    """Return one point per day for the last ``TREND_DAYS`` days in WAT."""
    today = datetime.now(WAT).date()
    first_day = today - timedelta(days=TREND_DAYS - 1)
    first_moment = datetime.combine(first_day, time.min, tzinfo=WAT)

    # Group in the database using the same WAT calendar the dashboard uses.
    day = func.date(func.timezone("Africa/Lagos", CodeCheck.checked_at))
    result = await session.execute(
        select(day.label("day"), func.count(CodeCheck.id))
        .where(
            CodeCheck.organization_id == organization_id,
            CodeCheck.checked_at >= first_moment.astimezone(timezone.utc),
        )
        .group_by(day)
    )
    counts = {row[0]: row[1] for row in result.all()}

    return [
        VerificationTrendPoint(
            date=first_day + timedelta(days=offset),
            count=counts.get(first_day + timedelta(days=offset), 0),
        )
        for offset in range(TREND_DAYS)
    ]


async def get_overview(
    session: AsyncSession, organization_id: uuid.UUID
) -> OrganizationOverviewRead:
    """Return the live overview counts for one organization.

    Codes are counted from the verification-code records themselves:
    ``codes_purchased`` is every generated code, while applied, matched and
    reported map to the ``used``, ``verified`` and ``reported`` statuses.
    """
    product_count = await session.scalar(
        select(func.count(Product.id)).where(
            Product.organization_id == organization_id
        )
    )
    active_batch_count = await session.scalar(
        select(func.count(ProductBatch.id)).where(
            ProductBatch.organization_id == organization_id,
            ProductBatch.is_active.is_(True),
        )
    )

    code_counts = await session.execute(
        select(
            func.count(VerificationCode.id),
            func.count(VerificationCode.id).filter(
                VerificationCode.status == VerificationCodeStatus.USED
            ),
            func.count(VerificationCode.id).filter(
                VerificationCode.status == VerificationCodeStatus.VERIFIED
            ),
            func.count(VerificationCode.id).filter(
                VerificationCode.status == VerificationCodeStatus.REPORTED
            ),
        ).where(VerificationCode.organization_id == organization_id)
    )
    purchased, applied, matched, reported = code_counts.one()

    return OrganizationOverviewRead(
        total_products=product_count or 0,
        active_batches=active_batch_count or 0,
        codes_purchased=purchased or 0,
        codes_applied=applied or 0,
        matched_records=matched or 0,
        consumer_reports=reported or 0,
        verification_trend=await _verification_trend(
            session, organization_id
        ),
    )
