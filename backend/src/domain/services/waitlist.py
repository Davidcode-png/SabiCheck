from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from src.domain.models.waitlist import WaitlistSignup
from src.domain.schemas.waitlist import WaitlistCreate


async def _find_by_email(
    session: AsyncSession, email: str
) -> WaitlistSignup | None:
    result = await session.execute(
        select(WaitlistSignup).where(WaitlistSignup.email == email)
    )
    return result.scalar_one_or_none()


async def join_waitlist(
    session: AsyncSession, data: WaitlistCreate
) -> WaitlistSignup:
    """Record a waitlist signup, tolerating repeat submissions.

    Signing up twice with the same email returns the existing row instead of
    raising, so the landing page can always show the same success state.
    """
    email = data.email.strip().lower()

    existing = await _find_by_email(session, email)
    if existing is not None:
        return existing

    signup = WaitlistSignup(
        name=data.name.strip(),
        email=email,
        role=data.role.value,
    )
    session.add(signup)

    try:
        await session.flush()
    except IntegrityError:
        # Another request inserted the same email between our lookup and flush.
        await session.rollback()
        existing = await _find_by_email(session, email)
        if existing is None:
            raise
        return existing

    return signup
