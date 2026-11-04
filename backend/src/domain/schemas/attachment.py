import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict


class FileAttachmentRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    file_name: str
    file_url: str
    public_id: str
    resource_type: str
    file_format: str | None
    content_type: str | None
    file_size: int | None
    entity_type: str
    entity_id: uuid.UUID
    created_at: datetime
