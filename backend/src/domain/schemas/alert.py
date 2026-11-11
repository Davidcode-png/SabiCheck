import uuid
from datetime import datetime
from enum import Enum

from pydantic import BaseModel, ConfigDict


class AlertEventType(str, Enum):
    """The only two signals shown in the alerts feed."""

    REPEAT_CODE = "repeat_code"
    CONSUMER_REPORT = "consumer_report"


class AlertStatus(str, Enum):
    """Workspace-facing review state of an alert.

    Consumer reports use their triage status directly. Repeat-code alerts
    derive their state from the verification code lifecycle because they are a
    read-only signal rather than a case with its own workflow.
    """

    NEEDS_REVIEW = "needs-review"
    IN_REVIEW = "in-review"
    REVIEWED = "reviewed"


class AlertDistributorRead(BaseModel):
    """Distribution context for the code behind an alert."""

    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    name: str
    tracking_code: str
    city: str | None
    state: str | None


class AlertRead(BaseModel):
    """One repeat-code or consumer-report event in the alerts feed."""

    id: str
    event_type: AlertEventType
    source_id: uuid.UUID
    reference: str | None
    product_id: uuid.UUID | None
    product_name: str | None
    pack_size: str | None
    code: str
    note: str
    distributor: AlertDistributorRead | None
    recorded_at: datetime
    status: AlertStatus


class AlertList(BaseModel):
    items: list[AlertRead]
    total: int
    page: int
    page_size: int
    pages: int


__all__ = [
    "AlertDistributorRead",
    "AlertEventType",
    "AlertList",
    "AlertRead",
    "AlertStatus",
]
