import uuid

from sqlalchemy import Boolean, String, UUID
from sqlalchemy.orm import Mapped, mapped_column
from src.core.models import BaseModel


class User(BaseModel):
    __tablename__ = "users"
    first_name: Mapped[str] = mapped_column(String(length=255), nullable=False)
    last_name: Mapped[str] = mapped_column(String(length=255), nullable=False)
    email: Mapped[str] = mapped_column(
        String(length=255), nullable=False, unique=True, index=True
    )
    password: Mapped[str] = mapped_column(String(length=255), nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean(), default=True)
    is_superuser: Mapped[bool] = mapped_column(Boolean(), default=False)
    is_verified: Mapped[bool] = mapped_column(Boolean(), default=False)
