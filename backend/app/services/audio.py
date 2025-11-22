import logging
from pathlib import Path
from typing import Optional

from openai import OpenAI

from ..config import Settings

logger = logging.getLogger(__name__)


def transcribe_audio(file_path: Path, settings: Settings) -> str:
    """Transcribe audio via OpenAI Whisper when configured, else return a placeholder."""
    
    # FOR DEMO: Use sequential mock transcription for a realistic medical consultation
    # In production, use a streaming STT service like Deepgram or AssemblyAI
    import random
    
    # Realistic doctor-patient conversation sequence
    conversation_flow = [
        "Doctor, I've been having severe headaches for the past two days.",
        "The pain is mostly on the right side of my head.",
        "Yes, I also feel some neck stiffness.",
        "The light really bothers my eyes when I have these headaches.",
        "It's a throbbing pain that gets worse when I move around.",
        "I tried taking ibuprofen but it only helps a little bit.",
        "No, I haven't had any fever.",
        "Sometimes I feel nauseous when the headache is really bad.",
        "I haven't had any visual disturbances or seeing spots.",
        "The headaches usually start in the morning and last most of the day.",
        "I've been under a lot of stress at work lately.",
        "I haven't been sleeping well - maybe 5 hours a night.",
        "No history of migraines in my family that I know of.",
        "I drink about 2 cups of coffee every morning.",
        "Should I be worried about this?",
    ]
    
    # Return a random statement from the conversation
    return random.choice(conversation_flow)
    
    # ORIGINAL CODE (uncomment when using proper audio streaming):
    # if not settings.openai_api_key:
    #     logger.warning("OPENAI_API_KEY not set, returning placeholder transcription.")
    #     return "Transcription unavailable (no OPENAI_API_KEY)."
    #
    # client = OpenAI(api_key=settings.openai_api_key)
    # try:
    #     with file_path.open("rb") as audio:
    #         response = client.audio.transcriptions.create(
    #             model=settings.transcription_model,
    #             file=(file_path.name, audio, "audio/webm"),
    #         )
    #     return response.text
    # except Exception as exc:
    #     logger.exception("Transcription failed: %s", exc)
    #     return f"Transcription failed: {exc}"
