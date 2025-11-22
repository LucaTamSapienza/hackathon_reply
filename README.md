# Pocket Council Backend

FastAPI backend skeleton for the multi-agent medical assistant described in `pocket_council_concept.md`. It ingests audio or text transcripts, runs persona agents (Scribe, Dr. House, Guardian), stores context (patients, meds, docs), and returns insights.

## Quickstart
1. Create a virtualenv inside `backend/` and install deps:
   ```bash
   cd backend
   python -m venv .venv && source .venv/bin/activate
   pip install -r requirements.txt
   ```
2. Export your OpenAI key (optional but needed for real LLM/STT):
   ```bash
   export OPENAI_API_KEY=sk-...
   ```
3. Run the API:
   ```bash
   uvicorn app.main:app --reload
   ```

## Core Endpoints
- `POST /patients` – create a patient (optionally include medications).
- `POST /consultations` – start a consult (with `patient_id` or inline patient payload).
- `POST /consultations/{id}/transcript` – push text; returns agent insights.
- `POST /consultations/{id}/audio` – upload audio; auto-transcribes then runs agents.
- `GET /consultations/{id}/insights` – list all agent outputs for the consult.
- `POST /consultations/{id}/close` – close out the session.
- `POST /documents/patients/{patient_id}` – attach reports/drug lists; stored locally.
- `POST /records/patients/{patient_id}` – send structured medical records (blood panels, imaging, exam notes).
- `GET /records/patients/{patient_id}` – list stored medical records.

## Notes
- Uses SQLite under `backend/storage/app.db` (relative to the `backend/` folder); change `database_url` in `app/config.py` or `.env`.
- Agents run via LangChain + OpenAI when `OPENAI_API_KEY` is set; otherwise they fall back to offline summaries.
- Uploaded audio/docs are saved under `backend/storage/uploads/` (git-ignored).
