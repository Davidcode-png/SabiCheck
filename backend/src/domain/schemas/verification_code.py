import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from src.domain.models.distributor import DistributorType
from src.domain.models.verification_code import (
    CodeOrderStatus,
    CodePaymentMethod,
    VerificationCodeStatus,
)


class VerificationCodeDistributor(BaseModel):
    """The distributor a code was released through."""

    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    name: str
    tracking_code: str
    distributor_type: DistributorType
    city: str | None
    state: str | None


class VerificationCodeOrderCreate(BaseModel):
    quantity: int = Field(ge=1, le=50_000)
    payment_method: CodePaymentMethod


class VerificationCodeOrderRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    reference: str
    product_id: uuid.UUID
    batch_id: uuid.UUID | None
    batch_no: str | None
    quantity: int
    unit_price_kobo: int
    service_fee_kobo: int
    total_amount_kobo: int
    payment_method: CodePaymentMethod
    status: CodeOrderStatus
    paid_at: datetime | None
    created_at: datetime


class VerificationCodeRead(BaseModel):
    id: uuid.UUID
    code: str
    product_id: uuid.UUID
    batch_id: uuid.UUID | None
    batch_no: str | None
    order_id: uuid.UUID | None
    distributor_id: uuid.UUID | None
    distributor: VerificationCodeDistributor | None
    status: VerificationCodeStatus
    status_changed_at: datetime | None
    created_at: datetime


class VerificationCodeUpdate(BaseModel):
    """Owner/Admin change to a code's status or distributor."""

    status: VerificationCodeStatus | None = None
    distributor_id: uuid.UUID | None = None


class VerificationCodeStatusCounts(BaseModel):
    total: int = 0
    unused: int = 0
    verified: int = 0
    used: int = 0
    reported: int = 0


class VerificationCodeList(BaseModel):
    items: list[VerificationCodeRead]
    total: int
    page: int
    page_size: int
    pages: int
    status_counts: VerificationCodeStatusCounts


class VerificationCodeSummary(BaseModel):
    total: int
    unused: int
    verified: int
    used: int
    reported: int
    batch_no: str | None
    manufacturer_prefix: str


class VerificationCodeOrderCreateResponse(BaseModel):
    order: VerificationCodeOrderRead
    codes_generated: int
