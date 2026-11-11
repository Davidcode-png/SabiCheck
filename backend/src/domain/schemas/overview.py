import uuid
from datetime import date

from pydantic import BaseModel, ConfigDict


class VerificationTrendPoint(BaseModel):
    """Checks recorded on one calendar day (WAT)."""

    date: date
    count: int


class MostReportedProduct(BaseModel):
    """A product ranked by the number of consumer reports on its codes."""

    id: uuid.UUID
    name: str
    detail: str
    reports: int


class MostReportedDistributor(BaseModel):
    """A distributor ranked by reports on codes linked to it."""

    id: uuid.UUID
    name: str
    detail: str
    reports: int


class OrganizationOverviewRead(BaseModel):
    """Aggregate counts shown on the workspace overview."""

    model_config = ConfigDict(from_attributes=True)

    total_products: int
    active_batches: int
    codes_purchased: int
    codes_applied: int
    matched_records: int
    repeat_code_alerts: int
    consumer_reports: int
    verification_trend: list[VerificationTrendPoint]
    most_reported_products: list[MostReportedProduct]
    most_reported_distributors: list[MostReportedDistributor]
