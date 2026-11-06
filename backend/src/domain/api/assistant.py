import uuid

from fastapi import APIRouter, HTTPException, status

from src.core.db.dependencies import CurrentUser, DBSession
from src.domain.schemas.assistant import AssistantAnswer, AssistantAskRequest
from src.domain.services import assistant as assistant_service
from src.domain.services import organization as organization_service

router = APIRouter(
    prefix="/organizations/{organization_id}/assistant",
    tags=["assistant"],
)


@router.post("", response_model=AssistantAnswer)
async def ask_workspace_assistant(
    organization_id: uuid.UUID,
    payload: AssistantAskRequest,
    current_user: CurrentUser,
    session: DBSession,
) -> AssistantAnswer:
    """Answer a chat question about one workspace.

    The assistant is read-only and scoped to the organisation. It never changes
    data and never issues an authenticity verdict.
    """
    try:
        await organization_service.get_organization_for_user(
            session, organization_id, current_user.id
        )
    except organization_service.OrganizationNotFoundError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Organization not found",
        ) from None
    except organization_service.OrganizationPermissionError:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to view this organization",
        ) from None

    try:
        return await assistant_service.ask_assistant(
            session, organization_id, payload
        )
    except assistant_service.AssistantOrganizationNotFoundError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Organization not found",
        ) from None
    except assistant_service.AssistantNotConfiguredError:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=(
                "The workspace assistant is not configured. Add "
                "GEMINI_API_KEY to the backend environment."
            ),
        ) from None
    except assistant_service.AssistantUnavailableError:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=(
                "The workspace assistant is temporarily unavailable. Please "
                "try again."
            ),
        ) from None
    except assistant_service.AssistantInvalidResponseError:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=(
                "The workspace assistant returned an unusable answer. Please "
                "try again."
            ),
        ) from None
