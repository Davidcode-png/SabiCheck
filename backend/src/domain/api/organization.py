import uuid
from typing import Annotated

from fastapi import APIRouter, File, HTTPException, UploadFile, status

from src.core.config import settings
from src.core.db.dependencies import CurrentUser, DBSession
from src.core.storage import (
    InvalidFileError,
    StorageNotConfiguredError,
    StorageUploadError,
)
from src.domain.models.attachment import FileAttachment
from src.domain.models.organization import (
    Organization,
    OrganizationRole,
    OrganizationUser,
)
from src.domain.schemas.attachment import FileAttachmentRead
from src.domain.schemas.organization import (
    OrganizationBase,
    OrganizationCreate,
    OrganizationMemberRead,
    OrganizationRead,
    OrganizationUpdate,
)
from src.domain.services import attachment as attachment_service
from src.domain.services import organization as organization_service

router = APIRouter(prefix="/organizations", tags=["organizations"])

_MANAGER_ROLES = {OrganizationRole.OWNER, OrganizationRole.ADMIN}


def _not_found() -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail="Organization not found",
    )


def _forbidden() -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="You do not have permission to manage this organization",
    )


def _to_read(
    organization: Organization,
    role: OrganizationRole,
    attachments: list[FileAttachment],
) -> OrganizationRead:
    return OrganizationRead(
        **OrganizationBase.model_validate(organization).model_dump(),
        id=organization.id,
        reference_number=organization.reference_number,
        role=role,
        created_at=organization.created_at,
        updated_at=organization.updated_at,
        attachments=[
            FileAttachmentRead.model_validate(attachment)
            for attachment in attachments
        ],
    )


async def _organization_with_access(
    session: DBSession,
    organization_id: uuid.UUID,
    user_id: uuid.UUID,
    *,
    roles: set[OrganizationRole] | None = None,
) -> tuple[Organization, OrganizationUser]:
    try:
        return await organization_service.get_organization_for_user(
            session, organization_id, user_id, roles=roles
        )
    except organization_service.OrganizationNotFoundError:
        raise _not_found() from None
    except organization_service.OrganizationPermissionError:
        raise _forbidden() from None


@router.post(
    "",
    response_model=OrganizationRead,
    status_code=status.HTTP_201_CREATED,
)
async def create_organization(
    payload: OrganizationCreate,
    current_user: CurrentUser,
    session: DBSession,
) -> OrganizationRead:
    try:
        organization = await organization_service.create_organization(
            session, payload, current_user
        )
    except organization_service.OrganizationReferenceConflictError:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="That reference number is already in use",
        ) from None

    return _to_read(organization, OrganizationRole.OWNER, [])


@router.get("", response_model=list[OrganizationRead])
async def list_organizations(
    current_user: CurrentUser, session: DBSession
) -> list[OrganizationRead]:
    memberships = await organization_service.list_organizations(
        session, current_user.id
    )

    organizations = []
    for organization, membership in memberships:
        attachments = await attachment_service.list_attachments(
            session, organization
        )
        organizations.append(_to_read(organization, membership.role, attachments))

    return organizations


@router.get("/{organization_id}", response_model=OrganizationRead)
async def get_organization(
    organization_id: uuid.UUID,
    current_user: CurrentUser,
    session: DBSession,
) -> OrganizationRead:
    organization, membership = await _organization_with_access(
        session, organization_id, current_user.id
    )
    attachments = await attachment_service.list_attachments(session, organization)

    return _to_read(organization, membership.role, attachments)


@router.patch("/{organization_id}", response_model=OrganizationRead)
async def update_organization(
    organization_id: uuid.UUID,
    payload: OrganizationUpdate,
    current_user: CurrentUser,
    session: DBSession,
) -> OrganizationRead:
    organization, membership = await _organization_with_access(
        session, organization_id, current_user.id, roles=_MANAGER_ROLES
    )
    organization = await organization_service.update_organization(
        session, organization, payload
    )
    attachments = await attachment_service.list_attachments(session, organization)

    return _to_read(organization, membership.role, attachments)


@router.get(
    "/{organization_id}/members",
    response_model=list[OrganizationMemberRead],
)
async def list_organization_members(
    organization_id: uuid.UUID,
    current_user: CurrentUser,
    session: DBSession,
) -> list[OrganizationMemberRead]:
    await _organization_with_access(session, organization_id, current_user.id)
    members = await organization_service.list_members(session, organization_id)

    return [
        OrganizationMemberRead(
            id=membership.id,
            user_id=user.id,
            full_name=f"{user.first_name} {user.last_name}".strip(),
            email=user.email,
            role=membership.role,
            joined_at=membership.created_at,
        )
        for membership, user in members
    ]


@router.post(
    "/{organization_id}/documents",
    response_model=list[FileAttachmentRead],
    status_code=status.HTTP_201_CREATED,
)
async def upload_organization_documents(
    organization_id: uuid.UUID,
    current_user: CurrentUser,
    session: DBSession,
    files: Annotated[
        list[UploadFile],
        File(description="Supporting documents: PDF, PNG, or JPG up to 10MB each"),
    ],
) -> list[FileAttachmentRead]:
    organization, _ = await _organization_with_access(
        session, organization_id, current_user.id, roles=_MANAGER_ROLES
    )

    if len(files) > attachment_service.MAX_FILES_PER_UPLOAD:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "Upload at most "
                f"{attachment_service.MAX_FILES_PER_UPLOAD} files at once"
            ),
        )

    if not files:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Upload at least one file",
        )

    try:
        attachments = await attachment_service.upload_attachments(
            session,
            organization,
            files,
            uploaded_by_id=current_user.id,
            folder=f"{settings.CLOUDINARY_UPLOAD_FOLDER}/{organization.id}",
        )
    except InvalidFileError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)
        ) from None
    except StorageNotConfiguredError:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="File storage is not configured",
        ) from None
    except StorageUploadError:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="The document could not be uploaded. Please try again.",
        ) from None

    return [
        FileAttachmentRead.model_validate(attachment)
        for attachment in attachments
    ]


@router.delete(
    "/{organization_id}/documents/{attachment_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def delete_organization_document(
    organization_id: uuid.UUID,
    attachment_id: uuid.UUID,
    current_user: CurrentUser,
    session: DBSession,
) -> None:
    organization, _ = await _organization_with_access(
        session, organization_id, current_user.id, roles=_MANAGER_ROLES
    )

    try:
        await attachment_service.delete_attachment(
            session, organization, attachment_id
        )
    except attachment_service.AttachmentNotFoundError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found",
        ) from None
