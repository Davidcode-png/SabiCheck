from functools import lru_cache
from src.core.settings import Settings


@lru_cache(maxsize=1)
def _get_settings() -> Settings:
    return Settings()


settings = _get_settings()
