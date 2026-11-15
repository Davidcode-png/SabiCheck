from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column

from src.core.models import BaseModel


class WaitlistSignup(BaseModel):
    """One landing-page waitlist signup.

    The email is stored lower-cased and unique so repeat submissions are
    idempotent instead of creating duplicate rows.
    """

    __tablename__ = "waitlist_signups"

    name: Mapped[str] = mapped_column(String(length=255), nullable=False)
    email: Mapped[str] = mapped_column(
        String(length=320), nullable=False, unique=True, index=True
    )
    role: Mapped[str] = mapped_column(
        String(length=32), nullable=False, default="consumer"
    )

    def __repr__(self):
        return f"<WaitlistSignup {self.email}>"
