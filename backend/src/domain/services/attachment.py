import logging
import uuid
from collections.abc import Sequence

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from starlette.datastructures import UploadFile

from src.core.models import BaseModel
from src.core.storage import StoredFile, delete_file, upload_file
from src.domain.models.attachment import FileAttachment

logger = logging.getLogger(__name__)

MAX_FILES_PER_UPLOAD = 10


class AttachmentNotFoundError(Exception):
    pass


def entity_type_for(entity: BaseModel) -> str:
    """The table name stored in ``FileAttachment.entity_type``."""
    table_name = getattr(type(entity), "__tablename__", None)
    if not table_name:
        raise ValueError("Attachments require a model with __tablename__")
    return table_name


async def list_attachments(
    session: AsyncSession, entity: BaseModel
) -> list[FileAttachment]:
    result = await session.execute(
        select(FileAttachment)
        .where(
            FileAttachment.entity_type == entity_type_for(entity),
            FileAttachment.entity_id == entity.id,
        )
        .order_by(FileAttachment.created_at)
    )
    return list(result.scalars().all())


async def upload_attachments(
    session: AsyncSession,
    entity: BaseModel,
    files: Sequence[UploadFile],
    *,
    uploaded_by_id: uuid.UUID | None,
    folder: str,
) -> list[FileAttachment]:
    if not files:
        raise ValueError("At least one file is required")

    stored: list[StoredFile] = []

    try:
        for file in files:
            stored.append(await upload_file(file, folder=folder))

        attachments = [
            FileAttachment(
                file_name=item.file_name,
                file_url=item.file_url,
                public_id=item.public_id,
                resource_type=item.resource_type,
                file_format=item.file_format,
                content_type=item.content_type,
                file_size=item.file_size,
                entity_type=entity_type_for(entity),
                entity_id=entity.id,
                uploaded_by_id=uploaded_by_id,
            )
            for item in stored
        ]

        session.add_all(attachments)
        await session.flush()
    except Exception:
        # Remove files that made it to Cloudinary but not to the database.
        for item in stored:
            try:
                await delete_file(item.public_id, item.resource_type)
            except Exception:  # noqa: BLE001 - cleanup must not mask the error
                logger.warning("Could not remove orphaned file %s", item.public_id)
        raise

    return attachments


async def delete_attachment(
    session: AsyncSession, entity: BaseModel, attachment_id: uuid.UUID
) -> None:
    attachment = await session.get(FileAttachment, attachment_id)

    if (
        attachment is None
        or attachment.entity_type != entity_type_for(entity)
        or attachment.entity_id != entity.id
    ):
        raise AttachmentNotFoundError

    try:
        await delete_file(attachment.public_id, attachment.resource_type)
    except Exception:  # noqa: BLE001 - keep the row removable if storage is down
        logger.warning("Could not remove file %s", attachment.public_id)

    await session.delete(attachment)
    await session.flush()
