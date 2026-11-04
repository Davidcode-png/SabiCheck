from enum import Enum
import uuid

from sqlalchemy import (
    Enum as SQLEnum,
    ForeignKey,
    String,
    Text,
    UniqueConstraint,
    UUID,
)
from sqlalchemy.orm import Mapped, mapped_column

from src.core.models import BaseModel


class Industry(str, Enum):
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


class RegistrationType(str, Enum):
    LLC = "LLC"
    PLC = "PLC"
    PARTNERSHIP = "Partnership"
    SOLE_PROPRIETORSHIP = "Sole Proprietorship"
    NGO = "NGO"
    UNKNOWN = "Unknown"


class OrganizationRole(str, Enum):
    OWNER = "Owner"
    ADMIN = "Admin"
    MEMBER = "Member"


class Organization(BaseModel):
    __tablename__ = "organizations"

    name: Mapped[str] = mapped_column(String(length=255), nullable=False)
    registration_type: Mapped[RegistrationType] = mapped_column(
        SQLEnum(RegistrationType), nullable=False, default=RegistrationType.UNKNOWN
    )
    registration_code: Mapped[str] = mapped_column(String(length=255), nullable=False)
    industry_type: Mapped[Industry] = mapped_column(
        SQLEnum(Industry), nullable=False, default=Industry.OTHER
    )
    website: Mapped[str | None] = mapped_column(String(length=255), nullable=True)
    state: Mapped[str] = mapped_column(String(length=255), nullable=False)
    country: Mapped[str] = mapped_column(String(length=255), nullable=False)
    address: Mapped[str] = mapped_column(String(length=512), nullable=False)
    contact_person_full_name: Mapped[str] = mapped_column(
        String(length=255), nullable=False
    )
    business_email: Mapped[str] = mapped_column(String(length=255), nullable=False)
    phone_no: Mapped[str] = mapped_column(String(length=32), nullable=False)
    registration_details: Mapped[str | None] = mapped_column(Text(), nullable=True)
    reference_number: Mapped[str] = mapped_column(
        String(length=64), nullable=False, unique=True, index=True
    )
    manufacturer_prefix: Mapped[str] = mapped_column(
        String(length=3), nullable=False, default="ORG"
    )

    def __repr__(self):
        return f"<Organization {self.name}>"


class OrganizationUser(BaseModel):
    """Membership linking a user to an organization with a role."""

    __tablename__ = "organization_users"
    __table_args__ = (
        UniqueConstraint(
            "user_id",
            "organization_id",
            name="uq_organization_users_user_organization",
        ),
    )

    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), index=True
    )
    organization_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("organizations.id", ondelete="CASCADE"),
        index=True,
    )
    role: Mapped[OrganizationRole] = mapped_column(
        SQLEnum(OrganizationRole), nullable=False, default=OrganizationRole.MEMBER
    )

    def __repr__(self):
        return f"<OrganizationUser user={self.user_id} org={self.organization_id}>"
