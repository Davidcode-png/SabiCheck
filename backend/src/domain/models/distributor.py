from enum import Enum
import uuid

from sqlalchemy import (
    UUID,
    Enum as SQLEnum,
    ForeignKey,
    Integer,
    String,
    UniqueConstraint,
)
from sqlalchemy.orm import Mapped, mapped_column

from src.core.models import BaseModel


class DistributorType(str, Enum):
    PHARMACY = "Pharmacy"
    RETAILER = "Retailer"
    WHOLESALER = "Wholesaler"
    SUPERMARKET = "Supermarket"


class Distributor(BaseModel):
    """A business that moves an organization's products to consumers."""

    __tablename__ = "distributors"
    __table_args__ = (
        UniqueConstraint(
            "organization_id",
            "tracking_code",
            name="uq_distributors_organization_tracking_code",
        ),
    )

    name: Mapped[str] = mapped_column(
        String(length=255), nullable=False, index=True
    )
    tracking_code: Mapped[str] = mapped_column(
        String(length=32), nullable=False, index=True
    )
    distributor_type: Mapped[DistributorType] = mapped_column(
        SQLEnum(DistributorType), nullable=False
    )
    contact_name: Mapped[str | None] = mapped_column(
        String(length=255), nullable=True
    )
    phone: Mapped[str] = mapped_column(String(length=32), nullable=False)
    email: Mapped[str | None] = mapped_column(
        String(length=255), nullable=True
    )
    address: Mapped[str | None] = mapped_column(
        String(length=512), nullable=True
    )
    city: Mapped[str | None] = mapped_column(
        String(length=120), nullable=True, index=True
    )
    state: Mapped[str | None] = mapped_column(
        String(length=120), nullable=True
    )
    total_supplies: Mapped[int] = mapped_column(
        Integer(), nullable=False, default=0, server_default="0"
    )
    organization_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("organizations.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    def __repr__(self):
        return f"<Distributor {self.name}>"
