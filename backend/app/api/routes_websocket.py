from pathlib import Path
from uuid import uuid4

from fastapi import APIRouter, Depends, WebSocket, WebSocketDisconnect
from sqlmodel import Session

from ..agents.orchestrator import Orchestrator
from ..config import get_settings
from ..db import get_session
from ..schemas import AgentOutputRead, TranscriptIn
from ..services import audio
from ..services.consultation import append_transcript_and_run_agents

router = APIRouter(prefix="/ws", tags=["websocket"])
settings = get_settings()
orchestrator = Orchestrator(settings=settings)


@router.websocket("/consultation/{consultation_id}")
async def websocket_consultation(
    websocket: WebSocket,
    consultation_id: int,
    session: Session = Depends(get_session),
):
    await websocket.accept()
    
    # Create a temporary directory for this session's audio chunks if needed
    storage_dir = Path(settings.storage_path)
    storage_dir.mkdir(parents=True, exist_ok=True)

    try:
        while True:
            # Receive audio bytes
            data = await websocket.receive_bytes()
            
            # Save chunk to disk (Whisper needs a file usually)
            # In a production real-time system, we'd use a streaming STT service (Deepgram, etc.)
            # For this MVP, we save the chunk, transcribe it, and delete it.
            chunk_path = storage_dir / f"ws_chunk_{uuid4().hex}.wav"
            with chunk_path.open("wb") as f:
                f.write(data)
            
            try:
                # Transcribe
                transcript_text = audio.transcribe_audio(chunk_path, settings)
                
                if transcript_text.strip():
                    # Run agents
                    transcript = TranscriptIn(text=transcript_text, speaker="patient")
                    outputs = append_transcript_and_run_agents(session, consultation_id, transcript, orchestrator)
                    
                    # Send back results
                    response = {
                        "type": "insight",
                        "transcript": transcript_text,
                        "outputs": [AgentOutputRead.model_validate(o).model_dump() for o in outputs]
                    }
                    await websocket.send_json(response)
                else:
                    # Send keepalive or ack
                    await websocket.send_json({"type": "ack", "message": "No speech detected"})

            except Exception as e:
                await websocket.send_json({"type": "error", "message": str(e)})
            finally:
                # Cleanup chunk
                if chunk_path.exists():
                    chunk_path.unlink()

    except WebSocketDisconnect:
        print(f"Client disconnected from consultation {consultation_id}")
