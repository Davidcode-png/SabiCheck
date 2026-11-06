import io
from dataclasses import dataclass

import cloudinary
import cloudinary.uploader
from starlette.concurrency import run_in_threadpool
from starlette.datastructures import UploadFile

from src.core.config import settings

MAX_FILE_SIZE = 10 * 1024 * 1024
ALLOWED_CONTENT_TYPES = {
    "application/pdf": "pdf",
    "image/png": "png",
    "image/jpeg": "jpg",
}


class StorageNotConfiguredError(Exception):
    """Cloudinary credentials are missing."""


class InvalidFileError(Exception):
    """The uploaded file is empty, too large, or of an unsupported type."""


class StorageUploadError(Exception):
    """Cloudinary rejected or failed the upload."""


@dataclass(frozen=True)
class StoredFile:
    file_name: str
    file_url: str
    public_id: str
    resource_type: str
    file_format: str | None
    content_type: str
    file_size: int


def _ensure_configured() -> None:
    if not (
        settings.CLOUDINARY_CLOUD_NAME
        and settings.CLOUDINARY_API_KEY
        and settings.CLOUDINARY_API_SECRET
    ):
        raise StorageNotConfiguredError

    cloudinary.config(
        cloud_name=settings.CLOUDINARY_CLOUD_NAME,
        api_key=settings.CLOUDINARY_API_KEY,
        api_secret=settings.CLOUDINARY_API_SECRET,
        secure=True,
    )


def _upload(content: bytes, filename: str, extension: str, folder: str) -> dict:
    try:
        return cloudinary.uploader.upload(
            io.BytesIO(content),
            folder=folder,
            resource_type="auto",
            use_filename=True,
            unique_filename=True,
            filename=filename,
            format=extension,
        )
    except Exception as exc:
        print("THIS IS THE ERROR", exc)
        raise StorageUploadError(str(exc)) from exc


async def upload_file(upload: UploadFile, *, folder: str) -> StoredFile:
    """Read an upload and push it to Cloudinary on a worker thread."""
    content_type = (upload.content_type or "").lower()
    extension = ALLOWED_CONTENT_TYPES.get(content_type)
    if extension is None:
        raise InvalidFileError("Upload a PDF, PNG, or JPG file.")

    content = await upload.read()
    if not content:
        raise InvalidFileError("The uploaded file is empty.")
    if len(content) > MAX_FILE_SIZE:
        raise InvalidFileError("Files must be 10MB or smaller.")

    _ensure_configured()

    filename = upload.filename or f"document.{extension}"

    result = await run_in_threadpool(
        _upload, content, filename, extension, folder
    )

    return StoredFile(
        file_name=filename,
        file_url=result["secure_url"],
        public_id=result["public_id"],
        resource_type=result.get("resource_type", "image"),
        file_format=result.get("format"),
        content_type=content_type,
        file_size=result.get("bytes", len(content)),
    )


def _destroy(public_id: str, resource_type: str) -> None:
    try:
        cloudinary.uploader.destroy(public_id, resource_type=resource_type)
    except Exception:
        # A failed remote delete must not block removing the database row.
        pass


async def delete_file(public_id: str, resource_type: str) -> None:
    _ensure_configured()
    await run_in_threadpool(_destroy, public_id, resource_type)
