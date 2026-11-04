import uuid
from datetime import date, datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

from src.domain.models.distributor import DistributorType
from src.domain.models.verification_code import ConcernType


class CodeCheckRequest(BaseModel):
    code: str = Field(min_length=1, max_length=64)


class PublicDistributorRead(BaseModel):
    """Where a consumer can expect to have bought the product."""

    name: str
    distributor_type: DistributorType
    tracking_code: str
    city: str | None
    state: str | None


class PublicProductRead(BaseModel):
    id: uuid.UUID
    name: str
    brand_name: str | None
    sku: str
    pack_size: str | None
    unit: str | None
    packaging_type: str | None
    reg_no: str
    batch_no: str | None
    manufacturer_name: str
    image_url: str | None
    distributor: PublicDistributorRead | None


class CodeCheckRead(BaseModel):
    result: Literal["match", "no_match", "repeat"]
    code: str
    check_count: int
    previous_scans: int
    product: PublicProductRead | None


class CodeReportCreate(BaseModel):
    code: str = Field(min_length=1, max_length=64)
    concern: ConcernType
    product_name: str | None = Field(default=None, max_length=512)
    description: str | None = Field(default=None, max_length=5000)
    purchase_location: str | None = Field(default=None, max_length=255)
    purchase_date: date | None = None


class CodeReportRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    reference: str
    code: str
    concern: ConcernType
    product_name: str | None
    created_at: datetime
