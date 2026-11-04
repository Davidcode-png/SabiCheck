import datetime

from sqlalchemy import Date, DateTime, Integer, String, Text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column

from src.core.models import BaseModel


class GreenbookProduct(BaseModel):
    """A product record copied from the NAFDAC Greenbook.

    The Greenbook's own ``product_id`` is kept as the stable external key so
    repeated syncs can update the same row instead of duplicating products.
    """

    __tablename__ = "nafdac_greenbook_products"

    greenbook_product_id: Mapped[int] = mapped_column(
        Integer, nullable=False, unique=True, index=True
    )
    product_name: Mapped[str] = mapped_column(
        String(length=512), nullable=False
    )
    normalized_name: Mapped[str] = mapped_column(
        String(length=512), nullable=False, index=True
    )
    nrn: Mapped[str | None] = mapped_column(
        String(length=64), nullable=True, index=True
    )
    normalized_nrn: Mapped[str | None] = mapped_column(
        String(length=64), nullable=True, index=True
    )
    status: Mapped[str | None] = mapped_column(
        String(length=64), nullable=True, index=True
    )
    approval_date: Mapped[datetime.date | None] = mapped_column(
        Date, nullable=True
    )
    expiry_date: Mapped[datetime.date | None] = mapped_column(
        Date, nullable=True
    )
    applicant_name: Mapped[str | None] = mapped_column(
        String(length=512), nullable=True
    )
    ingredient_name: Mapped[str | None] = mapped_column(
        String(length=512), nullable=True
    )
    form: Mapped[str | None] = mapped_column(String(length=128), nullable=True)
    route: Mapped[str | None] = mapped_column(
        String(length=128), nullable=True
    )
    strength: Mapped[str | None] = mapped_column(
        String(length=255), nullable=True
    )
    pack_size: Mapped[str | None] = mapped_column(
        String(length=255), nullable=True
    )
    product_category: Mapped[str | None] = mapped_column(
        String(length=128), nullable=True
    )
    product_category_id: Mapped[int | None] = mapped_column(
        Integer, nullable=True
    )
    applicant_id: Mapped[int | None] = mapped_column(Integer, nullable=True)
    ingredient_id: Mapped[int | None] = mapped_column(Integer, nullable=True)
    manufacturer_id: Mapped[int | None] = mapped_column(Integer, nullable=True)
    greenbook_created_at: Mapped[datetime.datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    greenbook_updated_at: Mapped[datetime.datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    raw_payload: Mapped[dict] = mapped_column(JSONB, nullable=False)
    first_seen_at: Mapped[datetime.datetime] = mapped_column(
        DateTime(timezone=True), nullable=False
    )
    last_seen_at: Mapped[datetime.datetime] = mapped_column(
        DateTime(timezone=True), nullable=False
    )
    last_synced_at: Mapped[datetime.datetime] = mapped_column(
        DateTime(timezone=True), nullable=False
    )

    def __repr__(self):
        return f"<GreenbookProduct {self.nrn} {self.product_name}>"


class GreenbookSyncRun(BaseModel):
    """Audit record for one scrape of the Greenbook."""

    __tablename__ = "nafdac_greenbook_sync_runs"

    status: Mapped[str] = mapped_column(
        String(length=32), nullable=False, index=True
    )
    source_url: Mapped[str] = mapped_column(String(length=512), nullable=False)
    requested_limit: Mapped[int] = mapped_column(Integer, nullable=False)
    page_size: Mapped[int] = mapped_column(Integer, nullable=False)
    fetched_count: Mapped[int] = mapped_column(
        Integer, nullable=False, default=0
    )
    inserted_count: Mapped[int] = mapped_column(
        Integer, nullable=False, default=0
    )
    updated_count: Mapped[int] = mapped_column(
        Integer, nullable=False, default=0
    )
    started_at: Mapped[datetime.datetime] = mapped_column(
        DateTime(timezone=True), nullable=False
    )
    finished_at: Mapped[datetime.datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    error_message: Mapped[str | None] = mapped_column(Text, nullable=True)

    def __repr__(self):
        return f"<GreenbookSyncRun {self.status} {self.fetched_count}>"
