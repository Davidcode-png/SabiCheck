import uuid
from datetime import date, datetime

from pydantic import BaseModel, ConfigDict

from src.domain.models.verification_code import CodeReportStatus, ConcernType

ReportStatus = CodeReportStatus


class ReportReviewerRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    first_name: str
    last_name: str
    email: str


class ReportDistributorRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    name: str
    tracking_code: str
    city: str | None
    state: str | None


class ConsumerReportRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    reference: str
    code: str
    product_id: uuid.UUID | None
    product_name: str | None
    concern: ConcernType
    description: str | None
    purchase_location: str | None
    purchase_date: date | None
    status: ReportStatus
    reviewer: ReportReviewerRead | None
    distributor: ReportDistributorRead | None
    reviewed_at: datetime | None
    created_at: datetime
    updated_at: datetime


class ConsumerReportList(BaseModel):
    items: list[ConsumerReportRead]
    total: int
    page: int
    page_size: int
    pages: int
    locations: list[str]


class ConsumerReportUpdate(BaseModel):
    """Owner/Admin triage changes for a single case."""

    status: ReportStatus | None = None
    reviewer_id: uuid.UUID | None = None
    distributor_id: uuid.UUID | None = None
