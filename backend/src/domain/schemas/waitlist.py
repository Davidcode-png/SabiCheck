from enum import Enum

from pydantic import BaseModel, EmailStr, Field


class WaitlistRole(str, Enum):
    """How the person expects to use SabiCheck."""

    CONSUMER = "consumer"
    MANUFACTURER = "manufacturer"
    PARTNER = "partner"
    OTHER = "other"


class WaitlistCreate(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    email: EmailStr
    role: WaitlistRole = WaitlistRole.CONSUMER


class WaitlistJoined(BaseModel):
    message: str


__all__ = ["WaitlistCreate", "WaitlistJoined", "WaitlistRole"]
