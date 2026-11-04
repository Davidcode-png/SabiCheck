import uuid

from sqlalchemy import UUID, ForeignKey, Index, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from src.core.models import BaseModel


class FileAttachment(BaseModel):
    """File stored in Cloudinary and linked to any model.

    The link is generic (like Django's ``GenericForeignKey``): ``entity_type``
    holds the owning table name and ``entity_id`` the owner's primary key.
    Because the target table varies, the pair is indexed instead of constrained.
    """

    __tablename__ = "file_attachments"
    __table_args__ = (
        Index("ix_file_attachments_entity", "entity_type", "entity_id"),
    )

    file_name: Mapped[str] = mapped_column(String(length=255), nullable=False)
    file_url: Mapped[str] = mapped_column(String(length=1024), nullable=False)
    public_id: Mapped[str] = mapped_column(
        String(length=512), nullable=False, unique=True
    )
    resource_type: Mapped[str] = mapped_column(
        String(length=32), nullable=False, default="auto"
    )
    file_format: Mapped[str | None] = mapped_column(
        String(length=32), nullable=True
    )
    content_type: Mapped[str | None] = mapped_column(
        String(length=128), nullable=True
    )
    file_size: Mapped[int | None] = mapped_column(Integer(), nullable=True)
    entity_type: Mapped[str] = mapped_column(
        String(length=64), nullable=False, index=True
    )
    entity_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), nullable=False, index=True
    )
    uploaded_by_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )

    def __repr__(self):
        return f"<FileAttachment {self.file_name}>"
