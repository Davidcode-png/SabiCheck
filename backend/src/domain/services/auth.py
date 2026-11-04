import uuid

from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession
from starlette.concurrency import run_in_threadpool

from src.core.security import hash_password, verify_password
from src.domain.models.user import User
from src.domain.schemas.user import UserCreate


class EmailAlreadyRegisteredError(Exception):
    pass


async def get_user_by_email(session: AsyncSession, email: str) -> User | None:
    result = await session.execute(
        select(User).where(User.email == email.strip().lower())
    )
    return result.scalar_one_or_none()


async def get_user_by_id(session: AsyncSession, user_id: uuid.UUID) -> User | None:
    return await session.get(User, user_id)


async def create_user(session: AsyncSession, data: UserCreate) -> User:
    email = data.email.strip().lower()

    if await get_user_by_email(session, email):
        raise EmailAlreadyRegisteredError

    user = User(
        email=email,
        first_name=data.first_name.strip(),
        last_name=data.last_name.strip(),
        password=await run_in_threadpool(hash_password, data.password),
    )
    session.add(user)
    try:
        await session.flush()
    except IntegrityError:
        await session.rollback()
        raise EmailAlreadyRegisteredError from None

    return user


async def authenticate_user(
    session: AsyncSession, email: str, password: str
) -> User | None:
    user = await get_user_by_email(session, email)
    if user is None or not user.is_active:
        return None
    if not await run_in_threadpool(verify_password, password, user.password):
        return None
    return user
