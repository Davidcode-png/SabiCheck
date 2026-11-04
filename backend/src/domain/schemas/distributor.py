import re
import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field, field_validator

from src.domain.models.distributor import DistributorType

_EMAIL_PATTERN = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


def _clean_text(value: object) -> object:
    if isinstance(value, str):
        cleaned = value.strip()
        return cleaned or None
    return value


class DistributorCreate(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    distributor_type: DistributorType
    contact_name: str | None = Field(default=None, max_length=255)
    phone: str = Field(min_length=7, max_length=32)
    email: str | None = Field(default=None, max_length=255)
    address: str | None = Field(default=None, max_length=512)
    city: str | None = Field(default=None, max_length=120)
    state: str | None = Field(default=None, max_length=120)

    @field_validator(
        "name",
        "contact_name",
        "phone",
        "email",
        "address",
        "city",
        "state",
        mode="before",
    )
    @classmethod
    def strip_text(cls, value: object) -> object:
        return _clean_text(value)

    @field_validator("phone")
    @classmethod
    def validate_phone(cls, value: str) -> str:
        digits = re.sub(r"\D", "", value)
        if not 7 <= len(digits) <= 15:
            raise ValueError("Enter a valid phone number.")
        return value

    @field_validator("email")
    @classmethod
    def validate_email(cls, value: str | None) -> str | None:
        if value is None:
            return None
        if not _EMAIL_PATTERN.match(value):
            raise ValueError("Enter a valid email address.")
        return value.lower()


class DistributorUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=255)
    distributor_type: DistributorType | None = None
    contact_name: str | None = Field(default=None, max_length=255)
    phone: str | None = Field(default=None, min_length=7, max_length=32)
    email: str | None = Field(default=None, max_length=255)
    address: str | None = Field(default=None, max_length=512)
    city: str | None = Field(default=None, max_length=120)
    state: str | None = Field(default=None, max_length=120)

    @field_validator(
        "name",
        "contact_name",
        "phone",
        "email",
        "address",
        "city",
        "state",
        mode="before",
    )
    @classmethod
    def strip_text(cls, value: object) -> object:
        return _clean_text(value)

    @field_validator("phone")
    @classmethod
    def validate_phone(cls, value: str | None) -> str | None:
        if value is None:
            return None
        digits = re.sub(r"\D", "", value)
        if not 7 <= len(digits) <= 15:
            raise ValueError("Enter a valid phone number.")
        return value

    @field_validator("email")
    @classmethod
    def validate_email(cls, value: str | None) -> str | None:
        if value is None:
            return None
        if not _EMAIL_PATTERN.match(value):
            raise ValueError("Enter a valid email address.")
        return value.lower()


class DistributorRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    name: str
    tracking_code: str
    distributor_type: DistributorType
    contact_name: str | None
    phone: str
    email: str | None
    address: str | None
    city: str | None
    state: str | None
    total_supplies: int
    organization_id: uuid.UUID
    created_at: datetime
    updated_at: datetime


class DistributorList(BaseModel):
    items: list[DistributorRead]
    total: int
    page: int
    page_size: int
    pages: int
    locations: list[str]
