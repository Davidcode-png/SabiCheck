from datetime import date

from pydantic import BaseModel, ConfigDict


class VerificationTrendPoint(BaseModel):
    """Checks recorded on one calendar day (WAT)."""

    date: date
    count: int


class OrganizationOverviewRead(BaseModel):
    """Aggregate counts shown on the workspace overview."""

    model_config = ConfigDict(from_attributes=True)

    total_products: int
    active_batches: int
    codes_purchased: int
    codes_applied: int
    matched_records: int
    consumer_reports: int
    verification_trend: list[VerificationTrendPoint]
