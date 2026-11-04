from enum import Enum
import uuid
import datetime

from sqlalchemy import UUID, DateTime, ForeignKey, Integer, String, Enum as SQLEnum
from sqlalchemy.orm import relationship, mapped_column, Mapped
from src.core.models import BaseModel



class Report(BaseModel):
    __tablename__ = "reports"
    case_code: Mapped[str] = mapped_column(String(length=255), nullable=False)
    product_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("products.id")
    )
    distributor_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("distributors.id")
    )
    description: Mapped[str] = mapped_column(String(length=255), nullable=False)
    