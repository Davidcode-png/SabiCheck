from fastapi import APIRouter, status

from src.core.db.dependencies import DBSession
from src.domain.schemas.waitlist import (
    WaitlistCreate,
    WaitlistJoined,
)
from src.domain.services import waitlist as waitlist_service

router = APIRouter(prefix="/public", tags=["public"])


@router.post(
    "/waitlist",
    response_model=WaitlistJoined,
    status_code=status.HTTP_201_CREATED,
)
async def join_waitlist(
    payload: WaitlistCreate, session: DBSession
) -> WaitlistJoined:
    """Join the SabiCheck early-access waitlist."""
    await waitlist_service.join_waitlist(session, payload)
    return WaitlistJoined(message="You're on the list.")
