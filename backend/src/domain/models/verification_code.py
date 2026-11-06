from enum import Enum
import datetime
import uuid

from sqlalchemy import (
    JSON,
    Date,
    DateTime,
    Enum as SQLEnum,
    ForeignKey,
    Integer,
    String,
    Text,
    UUID,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from src.core.models import BaseModel
from src.domain.models.distributor import Distributor
from src.domain.models.product import Product, ProductBatch
from src.domain.models.user import User


class VerificationCodeStatus(str, Enum):
    UNUSED = "unused"
    VERIFIED = "verified"
    USED = "used"
    REPORTED = "reported"


class CodeReportStatus(str, Enum):
    """Triage state of a consumer report inside the workspace."""

    RECEIVED = "received"
    UNDER_REVIEW = "under_review"
    REFERRED = "referred"


class ConcernType(str, Enum):
    SUSPECTED_COUNTERFEIT = "Suspected counterfeit"
    UNMATCHED_CODE = "Unmatched code"
    DAMAGED_PACKAGING = "Damaged packaging"
    CODE_ALREADY_USED = "Code has already been used"
    UNUSUAL_APPEARANCE = "Unusual appearance or smell"
    ILLNESS = "Illness"
    EXPIRED = "Expired"
    OTHER = "Other concern"


class ReportPriority(str, Enum):
    """How urgently the review team should handle a consumer report."""

    LOW = "low"
    NORMAL = "normal"
    URGENT = "urgent"


class TriageConfidence(str, Enum):
    """How much evidence the AI suggestion is based on."""

    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"


class CodePaymentMethod(str, Enum):
    CARD = "Card"
    BANK_TRANSFER = "Bank Transfer"


class CodeOrderStatus(str, Enum):
    PENDING = "pending"
    PAID = "paid"
    FAILED = "failed"


class VerificationCodeOrder(BaseModel):
    """A simulated purchase of a quantity of verification codes.

    The order keeps the price snapshot so historical orders are unaffected by
    later price changes.
    """

    __tablename__ = "verification_code_orders"

    reference: Mapped[str] = mapped_column(
        String(length=64), nullable=False, unique=True, index=True
    )
    organization_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("organizations.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    product_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("products.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    batch_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("product_batches.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    quantity: Mapped[int] = mapped_column(Integer(), nullable=False)
    unit_price_kobo: Mapped[int] = mapped_column(Integer(), nullable=False)
    service_fee_kobo: Mapped[int] = mapped_column(Integer(), nullable=False)
    total_amount_kobo: Mapped[int] = mapped_column(Integer(), nullable=False)
    payment_method: Mapped[CodePaymentMethod] = mapped_column(
        SQLEnum(CodePaymentMethod), nullable=False
    )
    status: Mapped[CodeOrderStatus] = mapped_column(
        SQLEnum(CodeOrderStatus),
        nullable=False,
        default=CodeOrderStatus.PENDING,
        index=True,
    )
    paid_at: Mapped[datetime.datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    batch: Mapped[ProductBatch | None] = relationship(lazy="joined")

    def __repr__(self):
        return f"<VerificationCodeOrder {self.reference}>"


class VerificationCode(BaseModel):
    """A single unique verification code printed on a product unit."""

    __tablename__ = "verification_codes"

    code: Mapped[str] = mapped_column(
        String(length=16), nullable=False, unique=True, index=True
    )
    organization_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("organizations.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    product_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("products.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    batch_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("product_batches.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    order_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("verification_code_orders.id", ondelete="CASCADE"),
        nullable=True,
        index=True,
    )
    distributor_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("distributors.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    status: Mapped[VerificationCodeStatus] = mapped_column(
        SQLEnum(VerificationCodeStatus),
        nullable=False,
        default=VerificationCodeStatus.UNUSED,
        index=True,
    )
    status_changed_at: Mapped[datetime.datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    check_count: Mapped[int] = mapped_column(
        Integer(), nullable=False, default=0, server_default="0"
    )
    first_checked_at: Mapped[datetime.datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    last_checked_at: Mapped[datetime.datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    batch: Mapped[ProductBatch | None] = relationship(lazy="joined")
    distributor: Mapped[Distributor | None] = relationship(lazy="joined")

    def __repr__(self):
        return f"<VerificationCode {self.code}>"


class CodeCheck(BaseModel):
    """One recorded check of a verification code.

    Kept as an append-only event log so the workspace can chart check activity
    over time. ``VerificationCode.check_count`` remains the fast per-code total.
    """

    __tablename__ = "code_checks"

    verification_code_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("verification_codes.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    organization_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("organizations.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    product_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("products.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    distributor_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("distributors.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    result: Mapped[str] = mapped_column(String(length=16), nullable=False)
    checked_at: Mapped[datetime.datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        index=True,
    )

    verification_code: Mapped[VerificationCode] = relationship(lazy="joined")
    product: Mapped[Product] = relationship(lazy="joined")
    distributor: Mapped[Distributor | None] = relationship(lazy="joined")

    def __repr__(self):
        return f"<CodeCheck {self.verification_code_id} {self.result}>"


class CodeReport(BaseModel):
    """A consumer concern submitted against a product code.

    Reports are kept even when the code does not exist in the registry so the
    team can review unmatched-code complaints.
    """

    __tablename__ = "code_reports"

    reference: Mapped[str] = mapped_column(
        String(length=32), nullable=False, unique=True, index=True
    )
    code: Mapped[str] = mapped_column(
        String(length=16), nullable=False, index=True
    )
    verification_code_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("verification_codes.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    product_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("products.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    organization_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("organizations.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    product_name: Mapped[str | None] = mapped_column(
        String(length=512), nullable=True
    )
    concern: Mapped[ConcernType] = mapped_column(
        SQLEnum(ConcernType), nullable=False, index=True
    )
    description: Mapped[str | None] = mapped_column(Text(), nullable=True)
    purchase_location: Mapped[str | None] = mapped_column(
        String(length=255), nullable=True
    )
    purchase_date: Mapped[datetime.date | None] = mapped_column(
        Date(), nullable=True
    )
    status: Mapped[str] = mapped_column(
        String(length=32),
        nullable=False,
        default=CodeReportStatus.RECEIVED.value,
        index=True,
    )
    reviewer_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    distributor_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("distributors.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    reviewed_at: Mapped[datetime.datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    priority: Mapped[str] = mapped_column(
        String(length=16),
        nullable=False,
        default=ReportPriority.NORMAL.value,
        server_default=ReportPriority.NORMAL.value,
        index=True,
    )
    # AI triage suggestion. Kept separate from the human-owned fields above so
    # the dashboard can always show what the model proposed versus what the
    # reviewer actually chose.
    ai_summary: Mapped[str | None] = mapped_column(Text(), nullable=True)
    ai_suggested_concern: Mapped[str | None] = mapped_column(
        String(length=64), nullable=True
    )
    ai_priority: Mapped[str | None] = mapped_column(
        String(length=16), nullable=True
    )
    ai_priority_reason: Mapped[str | None] = mapped_column(
        Text(), nullable=True
    )
    ai_next_step: Mapped[str | None] = mapped_column(Text(), nullable=True)
    ai_duplicate_reference: Mapped[str | None] = mapped_column(
        String(length=32), nullable=True
    )
    ai_flags: Mapped[list[str] | None] = mapped_column(JSON(), nullable=True)
    ai_confidence: Mapped[str | None] = mapped_column(
        String(length=16), nullable=True
    )
    ai_model: Mapped[str | None] = mapped_column(
        String(length=64), nullable=True
    )
    ai_prompt_version: Mapped[str | None] = mapped_column(
        String(length=32), nullable=True
    )
    ai_generated_at: Mapped[datetime.datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    reviewer: Mapped[User | None] = relationship(lazy="joined")
    distributor: Mapped[Distributor | None] = relationship(lazy="joined")

    @property
    def ai_triage(self) -> dict | None:
        """Shape the stored suggestion for the API response."""
        if self.ai_generated_at is None:
            return None

        return {
            "summary": self.ai_summary or "",
            "suggested_concern": self.ai_suggested_concern,
            "priority": self.ai_priority or ReportPriority.NORMAL.value,
            "priority_reason": self.ai_priority_reason,
            "duplicate_reference": self.ai_duplicate_reference,
            "suggested_next_step": self.ai_next_step,
            "flags": self.ai_flags or [],
            "confidence": self.ai_confidence or TriageConfidence.LOW.value,
            "model": self.ai_model or "",
            "prompt_version": self.ai_prompt_version,
            "generated_at": self.ai_generated_at,
        }

    def __repr__(self):
        return f"<CodeReport {self.reference}>"
