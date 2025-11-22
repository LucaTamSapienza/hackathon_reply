from pathlib import Path
from typing import List, Optional
from uuid import uuid4

from fastapi import APIRouter, Depends, File, UploadFile
from sqlmodel import Session

from ..agents.orchestrator import Orchestrator
from ..config import get_settings
from ..db import get_session
from ..schemas import (
    AgentOutputRead,
    ConsultationCreate,
    ConsultationRead,
    InsightBundle,
    TranscriptIn,
)
from ..services import audio
from ..services.consultation import (
    append_transcript_and_run_agents,
    close_consultation,
    create_consultation,
    get_consultation,
    list_agent_outputs,
)

router = APIRouter(prefix="/consultations", tags=["consultations"])
settings = get_settings()
orchestrator = Orchestrator(settings=settings)


@router.post("", response_model=ConsultationRead)
def start_consultation(
    payload: ConsultationCreate,
    session: Session = Depends(get_session),
):
    return create_consultation(session, payload)


@router.get("/{consultation_id}", response_model=ConsultationRead)
def get_consultation_detail(consultation_id: int, session: Session = Depends(get_session)):
    consultation = get_consultation(session, consultation_id)
    return consultation


@router.post("/{consultation_id}/transcript", response_model=InsightBundle)
def add_transcript(
    consultation_id: int,
    transcript: TranscriptIn,
    session: Session = Depends(get_session),
):
    outputs = append_transcript_and_run_agents(session, consultation_id, transcript, orchestrator)
    agent_payload = [AgentOutputRead.model_validate(o) for o in outputs]
    return InsightBundle(consultation_id=consultation_id, transcript=transcript.text, outputs=agent_payload)


@router.post("/{consultation_id}/audio", response_model=InsightBundle)
async def add_audio_chunk(
    consultation_id: int,
    file: UploadFile = File(...),
    session: Session = Depends(get_session),
):
    storage_dir = Path(settings.storage_path)
    storage_dir.mkdir(parents=True, exist_ok=True)

    suffix = Path(file.filename).suffix or ".wav"
    tmp_path = storage_dir / f"audio_{uuid4().hex}{suffix}"
    with tmp_path.open("wb") as buffer:
        buffer.write(await file.read())

    transcript_text = audio.transcribe_audio(tmp_path, settings)
    transcript = TranscriptIn(text=transcript_text, speaker="patient")
    outputs = append_transcript_and_run_agents(session, consultation_id, transcript, orchestrator)
    agent_payload = [AgentOutputRead.model_validate(o) for o in outputs]
    return InsightBundle(consultation_id=consultation_id, transcript=transcript_text, outputs=agent_payload)


@router.get("/{consultation_id}/insights", response_model=List[AgentOutputRead])
def get_insights(consultation_id: int, session: Session = Depends(get_session)):
    outputs = list_agent_outputs(session, consultation_id)
    return [AgentOutputRead.model_validate(o) for o in outputs]


@router.post("/{consultation_id}/close", response_model=ConsultationRead)
def close_consultation_endpoint(
    consultation_id: int,
    summary: Optional[str] = None,
    session: Session = Depends(get_session),
):
    consultation = close_consultation(session, consultation_id, summary)
    return consultation
