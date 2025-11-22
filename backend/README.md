# Backend Notes

Reference for the Pocket Council multi-agent backend (FastAPI + LangChain/OpenAI + SQLite).

## Layout
- `app/main.py` – FastAPI app wiring and router registration.
- `app/api/` – HTTP routes (`consultations`, `patients`, `documents`, `records`, `health`).
- `app/models.py` – SQLModel ORM tables (patients, meds, consultations, transcripts, agent outputs, documents, medical records).
- `app/agents/` – Persona definitions (Scribe, Dr. House, Guardian) and orchestrator.
- `app/services/` – Domain helpers for consultation flow, transcription, document storage, and medical records.
- `storage/` – SQLite DB and uploaded files (git-ignored).

## Running
```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
# choose DB: Postgres via docker compose (recommended) or default SQLite
# Postgres:
#   docker compose up -d db
#   export DATABASE_URL="postgresql+psycopg://pcouncil:pcouncil@localhost:5432/pcouncil"
# SQLite (default): do nothing
export OPENAI_API_KEY=sk-...   # needed for real LLM/STT; optional for offline fallback
uvicorn app.main:app --reload
```

## Agent Flow
1. Client starts a consult via `POST /consultations`.
2. For each transcript or audio upload:
   - Audio is saved under `storage/uploads/` and transcribed (OpenAI Whisper when available).
   - Transcript chunk is persisted, the orchestrator builds a combined transcript plus patient context (allergies, meds, docs, structured records).
   - Agents run in sequence and write `AgentOutput` rows (`note`, `diagnosis`, `alert`); Scribe output is stored as the consult summary.
3. Client pulls `GET /consultations/{id}/insights` or closes the consult.

## Extending
- Swap the DB: set `database_url` in `.env` (e.g., `postgresql+psycopg://...`) and rerun.
- Add agents: create a new class in `app/agents/`, then append it in `Orchestrator.agents`.
- Authentication: add FastAPI dependencies/middleware and secure the routers.
- Streaming: replace the `/audio` endpoint with a WebSocket that calls `append_transcript_and_run_agents` per chunk.
