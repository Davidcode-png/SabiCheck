import uuid
from datetime import datetime, time, timedelta, timezone

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from src.domain.models.distributor import Distributor
from src.domain.models.product import Product, ProductBatch
from src.domain.models.verification_code import (
    CodeCheck,
    CodeReport,
    VerificationCode,
    VerificationCodeStatus,
)
from src.domain.schemas.overview import (
    MostReportedDistributor,
    MostReportedProduct,
    OrganizationOverviewRead,
    VerificationTrendPoint,
)

# The overview chart shows a fortnight of daily check activity.
TREND_DAYS = 16

# Each ranking card shows the three most-reported entries.
RANKING_LIMIT = 3

# Nigeria does not observe daylight saving, so a fixed UTC+1 offset is exact.
WAT = timezone(timedelta(hours=1), name="WAT")


def _product_detail(pack_size: str | None, sku: str) -> str:
    """Build the product card's secondary line, for example ``500 g · SKU``."""
    return " · ".join(part for part in (pack_size, sku) if part)


def _distributor_detail(
    city: str | None, state: str | None, tracking_code: str
) -> str:
    """Build the distributor card's secondary line, for example ``Ikeja, Lagos · DST-008``."""
    location = ", ".join(part for part in (city, state) if part)
    return " · ".join(part for part in (location, tracking_code) if part)


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


async def _most_reported_products(
    session: AsyncSession, organization_id: uuid.UUID
) -> list[MostReportedProduct]:
    """Rank products by consumer reports on their verification codes.

    The product is resolved through the report's verification code. Reports
    that were submitted without a matching code have no product to attribute,
    so they are excluded rather than grouped under a guessed name.
    """
    resolved_product_id = func.coalesce(
        CodeReport.product_id, VerificationCode.product_id
    )
    report_count = func.count(CodeReport.id)

    result = await session.execute(
        select(
            Product.id,
            Product.name,
            Product.pack_size,
            Product.sku,
            report_count.label("reports"),
        )
        .select_from(CodeReport)
        .join(
            VerificationCode,
            VerificationCode.id == CodeReport.verification_code_id,
            isouter=True,
        )
        .join(Product, Product.id == resolved_product_id)
        .where(
            CodeReport.organization_id == organization_id,
            Product.organization_id == organization_id,
        )
        .group_by(Product.id, Product.name, Product.pack_size, Product.sku)
        .order_by(report_count.desc(), Product.name.asc())
        .limit(RANKING_LIMIT)
    )

    return [
        MostReportedProduct(
            id=row.id,
            name=row.name,
            detail=_product_detail(row.pack_size, row.sku),
            reports=row.reports,
        )
        for row in result.all()
    ]


async def _most_reported_distributors(
    session: AsyncSession, organization_id: uuid.UUID
) -> list[MostReportedDistributor]:
    """Rank distributors by reports on codes linked to them.

    A report may carry its own distributor from triage; otherwise the
    distributor currently assigned to the report's verification code is used.
    Reports whose code has no distributor are excluded.
    """
    resolved_distributor_id = func.coalesce(
        CodeReport.distributor_id, VerificationCode.distributor_id
    )
    report_count = func.count(CodeReport.id)

    result = await session.execute(
        select(
            Distributor.id,
            Distributor.name,
            Distributor.city,
            Distributor.state,
            Distributor.tracking_code,
            report_count.label("reports"),
        )
        .select_from(CodeReport)
        .join(
            VerificationCode,
            VerificationCode.id == CodeReport.verification_code_id,
            isouter=True,
        )
        .join(Distributor, Distributor.id == resolved_distributor_id)
        .where(
            CodeReport.organization_id == organization_id,
            Distributor.organization_id == organization_id,
        )
        .group_by(
            Distributor.id,
            Distributor.name,
            Distributor.city,
            Distributor.state,
            Distributor.tracking_code,
        )
        .order_by(report_count.desc(), Distributor.name.asc())
        .limit(RANKING_LIMIT)
    )

    return [
        MostReportedDistributor(
            id=row.id,
            name=row.name,
            detail=_distributor_detail(
                row.city, row.state, row.tracking_code
            ),
            reports=row.reports,
        )
        for row in result.all()
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
        most_reported_products=await _most_reported_products(
            session, organization_id
        ),
        most_reported_distributors=await _most_reported_distributors(
            session, organization_id
        ),
    )
