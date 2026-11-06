import uuid
from datetime import date, datetime

from pydantic import BaseModel, ConfigDict

from src.domain.models.verification_code import (
    CodeReportStatus,
    ConcernType,
    ReportPriority,
    TriageConfidence,
)

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


class ReportTriageRead(BaseModel):
    """The stored AI suggestion for a consumer report.

    This is advisory only. The reviewer's own priority, status, reviewer, and
    distributor stay on the report itself.
    """

    summary: str
    suggested_concern: ConcernType | None
    priority: ReportPriority
    priority_reason: str | None
    duplicate_reference: str | None
    suggested_next_step: str | None
    flags: list[str]
    confidence: TriageConfidence
    model: str
    prompt_version: str | None
    generated_at: datetime


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
    priority: ReportPriority
    reviewer: ReportReviewerRead | None
    distributor: ReportDistributorRead | None
    reviewed_at: datetime | None
    ai_triage: ReportTriageRead | None = None
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
    priority: ReportPriority | None = None
    reviewer_id: uuid.UUID | None = None
    distributor_id: uuid.UUID | None = None
