import uuid
from datetime import date, datetime

from pydantic import BaseModel, ConfigDict


class GreenbookProductRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    greenbook_product_id: int
    product_name: str
    nrn: str | None
    status: str | None
    approval_date: date | None
    expiry_date: date | None
    applicant_name: str | None
    ingredient_name: str | None
    form: str | None
    route: str | None
    strength: str | None
    pack_size: str | None
    product_category: str | None
    first_seen_at: datetime
    last_seen_at: datetime
    last_synced_at: datetime


class GreenbookProductList(BaseModel):
    items: list[GreenbookProductRead]
    total: int
    limit: int
    offset: int


class GreenbookSyncRunRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    status: str
    source_url: str
    requested_limit: int
    page_size: int
    fetched_count: int
    inserted_count: int
    updated_count: int
    started_at: datetime
    finished_at: datetime | None
    error_message: str | None


class GreenbookStatusRead(BaseModel):
    total_products: int
    latest_sync: GreenbookSyncRunRead | None
