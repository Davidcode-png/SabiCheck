import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from src.domain.models.product import PackageType, ProductCategory
from src.domain.schemas.attachment import FileAttachmentRead


class ProductBase(BaseModel):
    model_config = ConfigDict(from_attributes=True, str_strip_whitespace=True)

    name: str = Field(min_length=1, max_length=255)
    sku: str = Field(min_length=1, max_length=255)
    brand_name: str | None = Field(default=None, max_length=255)
    category: ProductCategory
    description: str = Field(min_length=1, max_length=10000)
    packaging_type: PackageType | None = None
    unit: str | None = Field(default=None, max_length=32)
    pack_size: str | None = Field(default=None, max_length=64)
    reg_no: str = Field(min_length=1, max_length=255)
    barcode: str | None = Field(default=None, pattern=r"^\d{8,14}$")


class ProductCreate(ProductBase):
    """A batch number is resolved to an organization batch when provided."""

    batch_no: str | None = Field(default=None, max_length=255)


class ProductRead(ProductBase):
    id: uuid.UUID
    organization_id: uuid.UUID
    batch_id: uuid.UUID | None
    batch_no: str | None
    image: FileAttachmentRead | None = None
    created_at: datetime
    updated_at: datetime
