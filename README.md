# Pocket Council Backend

FastAPI backend skeleton for the multi-agent medical assistant described in `pocket_council_concept.md`. It ingests audio or text transcripts, runs persona agents (Scribe, Dr. House, Guardian), stores context (patients, meds, docs), and returns insights.

## Quickstart
1. Create a virtualenv inside `backend/` and install deps:
   ```bash
   cd backend
   python -m venv .venv && source .venv/bin/activate
   pip install -r requirements.txt
   ```
2. Create a `.env` in `backend/` (or export env vars) for secrets:
   ```bash
   cd backend
   cp .env.example .env   # edit with your keys
   ```
3. Choose your database:
   - **Dockerized Postgres (recommended for team use):**
     ```bash
     docker compose up -d db
     export DATABASE_URL="postgresql+psycopg://pcouncil:pcouncil@localhost:5432/pcouncil"
     ```
   - **Local SQLite (default, no setup):** do nothing; it uses `storage/app.db`.
4. Run the API:
   ```bash
   uvicorn app.main:app --reload
   ```

## Optional Next.js test client
- Location: `frontend/`
- Purpose: simple UI to create patients, start consultations, send text/audio to your backend, and view agent outputs.
- Setup:
  ```bash
  cd frontend
  npm install    # or pnpm/yarn
  npm run dev    # serves on http://localhost:3001
  ```
  In the UI, set Base URL to `http://127.0.0.1:8000` (or your backend URL), then flow through Create Patient → Start Consultation → Send Text / Record & Send Audio.

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


*** 

# Example workflow


# Start a consult:
 Client calls POST /consultations with patient_id (or inline patient payload). We create Consultation and persist any new Patient/Medication rows.

# Attach context: 
Client can POST docs (/documents/patients/{patient_id}) and structured medical records like labs/exams (/records/patients/{patient_id}) before or during the consult. All of these are tied to the patient in SQLite.

# Ingest speech or text:

## Text:
 POST /consultations/{id}/transcript with {speaker, text}.
## Audio:
POST /consultations/{id}/audio uploads a file → saved to storage/uploads/ → Whisper transcription (if OPENAI_API_KEY set) → same transcript path as text.
Each chunk becomes a TranscriptChunk row and updates the consult timestamp.
## Build agent context (in append_transcript_and_run_agents):

Fetch patient allergies/history, medications list, filenames of docs, and the 5 most recent MedicalRecord entries; create short summaries (data preview + text snippet).
Reconstruct the full transcript (ordered chunks).
Assemble a context dict passed to agents: allergies, history, medications, documents, records, complaint.
Run agents (sequential now, parallelizable later):

Orchestrator instantiates LangChain ChatOpenAI if OPENAI_API_KEY exists; otherwise None triggers offline fallbacks.
For each agent:
Scribe: Prompt tuned for SOAP; includes transcript + context + records, writes AgentOutput with category="note" and updates Consultation.summary.
Dr. House: Differential + rationale + discriminating question; sees transcript + meds/allergies + recent records.
Guardian: Safety checks for allergies/contraindications/interactions; includes history, meds, records.
Each result is stored as an AgentOutput row with agent name/category/content.
Retrieve results:

Client can poll GET /consultations/{id}/insights (all AgentOutput entries, most recent first).
GET /consultations/{id} shows status/summary.
POST /consultations/{id}/close marks it closed (optionally with a final summary).
Data access details:

All persistence is via SQLModel (SQLite by default at storage/app.db).
Uploaded docs are saved to storage/uploads/ with DB rows pointing to the file path.
Medical records store structured JSON (data) plus text (content_text), so labs can be key/value and imaging can be free text.
Context construction trims records to a short preview to keep prompts lean; adjust in _patient_context if you want full payloads.
Agents currently run one after another; you can parallelize in the orchestrator if needed.
Fallback behavior:

No OPENAI_API_KEY → agents return deterministic placeholder summaries; Whisper returns a placeholder transcription on audio.
Model errors are caught; we log and emit fallback content instead of failing the API.
