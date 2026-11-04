from enum import Enum
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict


class EnvironmentType(str, Enum):
    LOCAL = "local"
    DEVELOPMENT = "development"
    PRODUCTION = "production"


class Settings(BaseSettings):
    app_name: str = "SabiCheck"
    app_version: str = "1.0.0"
    debug: bool = True
    BACKEND_CORS_ORIGINS: str
    DATABASE_URL_SYNC: str
    DATABASE_URL_ASYNC: str
    model_config = SettingsConfigDict(
        env_ignore_empty=True,
        extra="ignore",
        env_file_encoding="utf-8",
        env_file=str(Path(__file__).parent.parent.parent.joinpath(".env")),
        populate_by_name=True,
    )
    environment: EnvironmentType = EnvironmentType.LOCAL
    SECRET_KEY: str  # no default, must come from env
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 5
    # SeaweedFS S3 object storage
    S3_ENDPOINT_URL: str = "http://seaweed:8333"
    S3_ACCESS_KEY: str = "admin"
    S3_SECRET_KEY: str = "admin12345"
    S3_BUCKET: str = "edu-resources"
    S3_REGION: str = "us-east-1"
    # Cloudinary file storage (supporting documents)
    CLOUDINARY_CLOUD_NAME: str = ""
    CLOUDINARY_API_KEY: str = ""
    CLOUDINARY_API_SECRET: str = ""
    CLOUDINARY_UPLOAD_FOLDER: str = "sabicheck/organizations"
    # Gemini API
    GEMINI_API_KEY: str = ""
    GEMINI_MODEL: str = "gemini-3.5-flash"
    GEMINI_EMBED_MODEL: str = "gemini-embedding-001"
    EMBED_DIMS: int = 768
    SUMMARY_MAX_CHARS: int = 60000
    ASK_TOP_K: int = 8
    # NAFDAC Greenbook snapshot
    GREENBOOK_BASE_URL: str = "https://greenbook.nafdac.gov.ng/"
    GREENBOOK_REQUEST_TIMEOUT_SECONDS: float = 30.0
    GREENBOOK_REQUEST_DELAY_SECONDS: float = 1.0
    GREENBOOK_SYNC_ENABLED: bool = True
    GREENBOOK_SYNC_ON_STARTUP: bool = False
    GREENBOOK_SYNC_INTERVAL_HOURS: int = 24
    GREENBOOK_SYNC_LIMIT: int = 40
    GREENBOOK_SYNC_PAGE_SIZE: int = 40

    @property
    def cors_origins(self) -> list[str]:
        """Split the comma-separated CORS setting into a list of origins."""
        return [
            origin.strip()
            for origin in self.BACKEND_CORS_ORIGINS.split(",")
            if origin.strip()
        ]
