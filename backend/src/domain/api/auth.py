import uuid

from fastapi import APIRouter, HTTPException, status

from src.core.config import settings
from src.core.db.dependencies import CurrentUser, DBSession
from src.core.security import create_access_token, create_refresh_token, decode_token
from src.domain.schemas.user import (
    RefreshTokenRequest,
    TokenPair,
    UserCreate,
    UserLogin,
    UserRead,
)
from src.domain.services import auth as auth_service

router = APIRouter(prefix="/auth", tags=["auth"])


def _unauthorized(detail: str = "Could not validate credentials") -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail=detail,
        headers={"WWW-Authenticate": "Bearer"},
    )


def _token_pair(user_id: uuid.UUID) -> TokenPair:
    subject = str(user_id)
    return TokenPair(
        access_token=create_access_token(subject),
        refresh_token=create_refresh_token(subject),
        expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
    )


@router.post(
    "/register",
    response_model=TokenPair,
    status_code=status.HTTP_201_CREATED,
)
async def register(payload: UserCreate, session: DBSession) -> TokenPair:
    try:
        user = await auth_service.create_user(session, payload)
    except auth_service.EmailAlreadyRegisteredError:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email is already registered",
        ) from None

    return _token_pair(user.id)


@router.post("/login", response_model=TokenPair)
async def login(payload: UserLogin, session: DBSession) -> TokenPair:
    user = await auth_service.authenticate_user(
        session, payload.email, payload.password
    )
    if user is None:
        raise _unauthorized("Incorrect email or password") from None

    return _token_pair(user.id)


@router.post("/refresh", response_model=TokenPair)
async def refresh(payload: RefreshTokenRequest, session: DBSession) -> TokenPair:
    try:
        user_id = uuid.UUID(decode_token(payload.refresh_token, "refresh"))
    except ValueError:
        raise _unauthorized() from None

    user = await auth_service.get_user_by_id(session, user_id)
    if user is None or not user.is_active:
        raise _unauthorized() from None

    return _token_pair(user.id)


@router.get("/me", response_model=UserRead)
async def read_me(current_user: CurrentUser) -> UserRead:
    return UserRead.model_validate(current_user)
