from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    environment: str = "local"
    app_name: str = "Pocket Council Backend"

    # Storage
    database_url: str = "sqlite:///./storage/app.db"
    storage_path: str = "storage/uploads"

    # LLM / speech-to-text
    openai_api_key: str | None = None
    model_name: str = "gpt-4o-mini"
    transcription_model: str = "whisper-1"

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


@lru_cache
def get_settings() -> Settings:
    return Settings()
