import uuid
from datetime import datetime
from typing import Literal

from pydantic import BaseModel


VerificationResult = Literal["match", "repeat"]
VerificationSort = Literal["latest", "oldest"]


class VerificationAttemptRead(BaseModel):
    id: uuid.UUID
    code: str
    product_id: uuid.UUID
    product_name: str | None
    result: VerificationResult
    location: str | None
    distributor_name: str | None
    distributor_tracking_code: str | None
    checked_at: datetime


class VerificationProductOption(BaseModel):
    id: uuid.UUID
    name: str


class VerificationAttemptCounts(BaseModel):
    all: int = 0
    matches: int = 0
    repeats: int = 0


class VerificationAttemptList(BaseModel):
    items: list[VerificationAttemptRead]
    total: int
    page: int
    page_size: int
    pages: int
    counts: VerificationAttemptCounts
    products: list[VerificationProductOption]
    locations: list[str]
