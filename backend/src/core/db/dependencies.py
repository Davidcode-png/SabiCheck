import logging
import uuid
from collections.abc import AsyncGenerator
from typing import Annotated

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.security import decode_token
from src.domain.models.user import User

logger = logging.getLogger(__name__)

bearer_scheme = HTTPBearer(auto_error=False)


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    from src.core.db.base import AsyncSessionLocal

    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


DBSession = Annotated[AsyncSession, Depends(get_db)]
AsyncDbSession = DBSession


async def get_current_user(
    session: DBSession,
    credentials: Annotated[
        HTTPAuthorizationCredentials | None, Depends(bearer_scheme)
    ],
) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    if credentials is None:
        raise credentials_exception

    try:
        user_id = uuid.UUID(decode_token(credentials.credentials, "access"))
    except ValueError:
        raise credentials_exception from None

    user = await session.get(User, user_id)
    if user is None or not user.is_active:
        raise credentials_exception

    return user


CurrentUser = Annotated[User, Depends(get_current_user)]


async def check_db_connection() -> bool:
    logger.info("Checking database connection...")
    from src.core.db.base import async_engine

    try:
        async with async_engine.connect() as conn:
            logger.info("Database connection established successfully.")
            await conn.close()
            return True
    except Exception as e:
        logger.error(f"Database connection failed., {e}")
        # raise e
        return False
