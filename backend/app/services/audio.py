import logging
from pathlib import Path
from typing import Optional

from openai import OpenAI

from ..config import Settings

logger = logging.getLogger(__name__)


def transcribe_audio(file_path: Path, settings: Settings) -> str:
    """Transcribe audio via OpenAI Whisper when configured, else return a placeholder."""
    if not settings.openai_api_key:
        logger.warning("OPENAI_API_KEY not set, returning placeholder transcription.")
        return "Transcription unavailable (no OPENAI_API_KEY)."

    client = OpenAI(api_key=settings.openai_api_key)
    try:
        with file_path.open("rb") as audio:
            response = client.audio.transcriptions.create(
                model=settings.transcription_model,
                file=audio,
            )
        return response.text
    except Exception as exc:  # noqa: BLE001
        logger.exception("Transcription failed: %s", exc)
        return f"Transcription failed: {exc}"
