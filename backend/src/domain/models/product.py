from enum import Enum
import datetime
import uuid

from sqlalchemy import (
    UUID,
    Boolean,
    DateTime,
    ForeignKey,
    String,
    Text,
    UniqueConstraint,
    Enum as SQLEnum,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from src.core.models import BaseModel


class ProductCategory(str, Enum):
    ELECTRONICS = "Electronics"
    COMPUTERS = "Computers"
    GAMES = "Games"
    HOME_GOODS = "Home Goods"
    TOYS = "Toys"
    CLOTHING = "Clothing"
    BEAUTY = "Beauty"
    FOOD = "Food"
    HEALTH = "Health"
    HOUSEHOLD = "Household"
    SPORTS = "Sports"
    OTHER = "Other"


class VerificationChannel(str, Enum):
    QR = "QR"
    USSD = "USSD"


class ReportEvent(str, Enum):
    FIRSTCHECK = "FirstCheck"
    REPEATCHECK = "RepeatCheck"
    LOOKUP = "Lookup"


class PackageType(str, Enum):
    BOX = "Box"
    PACK = "Pack"
    SEALED_POUCH = "Sealed Pouch"
    OTHER = "Other"


class ProductBatch(BaseModel):
    """A production batch that products can be linked to.

    Batches belong to an organization so batch numbers stay scoped to the
    workspace that created them.
    """

    __tablename__ = "product_batches"
    __table_args__ = (
        UniqueConstraint(
            "organization_id",
            "batch_no",
            name="uq_product_batches_organization_batch_no",
        ),
    )

    batch_no: Mapped[str] = mapped_column(
        String(length=255), nullable=False, index=True
    )
    organization_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("organizations.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    production_date: Mapped[datetime.datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    is_active: Mapped[bool] = mapped_column(
        Boolean(), nullable=False, default=True
    )

    def __repr__(self):
        return f"<ProductBatch {self.batch_no}>"


class Product(BaseModel):
    __tablename__ = "products"
    __table_args__ = (
        UniqueConstraint(
            "organization_id", "sku", name="uq_products_organization_sku"
        ),
    )

    name: Mapped[str] = mapped_column(String(length=255), nullable=False)
    sku: Mapped[str] = mapped_column(String(length=255), nullable=False, index=True)
    brand_name: Mapped[str | None] = mapped_column(
        String(length=255), nullable=True
    )
    category: Mapped[ProductCategory] = mapped_column(
        SQLEnum(ProductCategory), nullable=False, default=ProductCategory.OTHER
    )
    batch_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("product_batches.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    description: Mapped[str] = mapped_column(Text(), nullable=False)
    packaging_type: Mapped[PackageType | None] = mapped_column(
        SQLEnum(PackageType), nullable=True
    )
    unit: Mapped[str | None] = mapped_column(String(length=32), nullable=True)
    pack_size: Mapped[str | None] = mapped_column(
        String(length=64), nullable=True
    )
    reg_no: Mapped[str] = mapped_column(String(length=255), nullable=False)
    barcode: Mapped[str | None] = mapped_column(String(length=64), nullable=True)
    organization_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("organizations.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    batch: Mapped[ProductBatch | None] = relationship(lazy="joined")

    def __repr__(self):
        return f"<Product {self.name}>"


class ProductVerification(BaseModel):
    __tablename__ = "product_verifications"
    product_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("products.id")
    )
    verification_channel: Mapped[VerificationChannel] = mapped_column(
        SQLEnum(VerificationChannel), nullable=False
    )
    address: Mapped[str] = mapped_column(String(length=255), nullable=False)
    event: Mapped[ReportEvent] = mapped_column(SQLEnum(ReportEvent), nullable=False)
