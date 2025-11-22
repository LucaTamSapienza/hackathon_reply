# Pocket Council - AI Medical Assistant

🏥 **Multi-agent medical documentation and diagnostic system for hackathons**

FastAPI backend with Next.js frontend featuring AI agents (Scribe, Dr. House, Guardian, Dr. Watson) that transform doctor-patient conversations into professional medical documentation with real-time diagnostic support.

---

## 🚀 **HACKATHON QUICK START**

### **Fastest Demo (30 seconds)**

```bash
# One-line setup
./setup_hackathon.sh

# Run standalone demo
cd backend
source .venv/bin/activate
python demo_scribe_agent.py
```

### **Full Stack Demo (2 minutes)**

**Terminal 1 - Backend:**
```bash
cd backend
source .venv/bin/activate
export OPENAI_API_KEY=sk-your-key-here  # Optional but recommended
uvicorn app.main:app --reload
```

**Terminal 2 - Frontend:**
```bash
cd pocket_council
npm run dev
```

**Open:** http://localhost:3000

---

## ✨ **What Makes This Special**

### **Hybrid AI Approach**
- **Scribe Agent**: Uses optimized mocked data for instant, reliable SOAP notes
- **Dr. House**: Real AI for intelligent differential diagnosis
- **Guardian**: Real AI for safety monitoring and drug interactions  
- **Dr. Watson**: Real AI for clinical guidelines and research

### **Key Features**
- 📋 **Automated SOAP Notes** - Professional medical documentation in seconds
- 🔍 **Differential Diagnosis** - AI-powered diagnostic suggestions
- ⚠️ **Safety Monitoring** - Real-time allergy and interaction checks
- 📚 **Clinical Guidelines** - Evidence-based recommendations
- 🎙️ **Voice Input** - Real-time transcription with Whisper
- 🎨 **Beautiful UI** - Modern glass morphism design

---

## 📁 **Project Structure**

```
hackathon_reply/
├── setup_hackathon.sh           # 🎯 One-click setup script
├── HACKATHON_DEMO_GUIDE.md      # 📖 Complete presentation guide
├── QUICK_REFERENCE.txt          # ⚡ Command cheat sheet
│
├── backend/                     # FastAPI + Multi-agent system
│   ├── demo_scribe_agent.py     # ⭐ Standalone demo with mocked data
│   ├── test_scribe_api.py       # 🧪 API integration test
│   ├── DEMO_SUMMARY.md          # 📄 Backend details
│   └── app/
│       ├── agents/              # AI agent implementations
│       │   ├── scribe.py        # SOAP note generator
│       │   ├── house.py         # Diagnostic agent
│       │   ├── guardian.py      # Safety checker
│       │   └── researcher.py    # Clinical guidelines
│       ├── api/                 # REST endpoints
│       └── services/            # Business logic
│
└── pocket_council/              # Next.js frontend
    ├── DEMO_GUIDE.md            # 🎨 Frontend demo guide
    └── src/
        ├── components/
        │   └── Homepage.js      # Main UI with agent cards
        └── hooks/
            └── useConsultation.js # WebSocket integration
```

---

## 🎬 **Demo Flow**

1. **Show Patient Card** - Sarah Johnson with medical history
2. **Click "Start Consult"** - SOAP note appears in 2 seconds (mocked)
3. **Speak or Wait** - Microphone input optional
4. **Watch AI Agents** - Dr. House, Guardian, and Watson appear with real AI insights
5. **Highlight Features** - Point out "AI POWERED" badges and beautiful UI

---

## 🎯 **For Judges**

### **Problem We Solve**
Doctors spend 2+ hours daily on documentation. We automate this while improving patient safety.

### **Our Solution**
Multi-agent AI system that:
- Generates professional SOAP notes automatically
- Provides diagnostic decision support
- Monitors for safety concerns
- Delivers evidence-based recommendations

### **Technical Highlights**
- Real-time WebSocket communication
- Hybrid mocked/AI approach for reliability
- Multi-agent architecture (easily extensible)
- Beautiful, modern UI with glass morphism
- Works with or without OpenAI (fallback mode)

---

## 🛠️ **Manual Setup**

If you prefer not to use the setup script:
## 🛠️ **Manual Setup**

If you prefer not to use the setup script:

### **Backend Setup**
1. Create a virtualenv inside `backend/` and install deps:
   ```bash
   cd backend
   python -m venv .venv && source .venv/bin/activate
   pip install -r requirements.txt
   ```
2. Choose your database:
   - **Dockerized Postgres (recommended for team use):**
     ```bash
     docker compose up -d db
     export DATABASE_URL="postgresql+psycopg://pcouncil:pcouncil@localhost:5432/pcouncil"
     ```
   - **Local SQLite (default, no setup):** do nothing; it uses `storage/app.db`.
3. Export your OpenAI key (optional but needed for real LLM/STT):
   ```bash
   export OPENAI_API_KEY=sk-...
   ```
4. Run the API:
   ```bash
   uvicorn app.main:app --reload
   ```

### **Frontend Setup**
```bash
cd pocket_council
npm install
npm run dev
```

---

## 📡 **API Endpoints**

- `POST /patients` – create a patient (optionally include medications).
- `POST /consultations` – start a consult (with `patient_id` or inline patient payload).
- `POST /consultations/{id}/transcript` – push text; returns agent insights.
- `POST /consultations/{id}/audio` – upload audio; auto-transcribes then runs agents.
- `GET /consultations/{id}/insights` – list all agent outputs for the consult.
- `POST /consultations/{id}/close` – close out the session.
- `POST /documents/patients/{patient_id}` – attach reports/drug lists; stored locally.
- `POST /records/patients/{patient_id}` – send structured medical records (blood panels, imaging, exam notes).
- `GET /records/patients/{patient_id}` – list stored medical records.

**API Docs:** http://localhost:8000/docs

---

## 🎤 **30-Second Pitch**

"Pocket Council transforms doctor-patient conversations into professional medical documentation in real-time using a multi-agent AI system. Our Scribe agent generates SOAP notes instantly, while Dr. House provides diagnostic insights, Guardian monitors safety, and Dr. Watson delivers evidence-based guidelines. This saves doctors hours daily while improving patient care quality."

---

## 📚 **Documentation**

- **[HACKATHON_DEMO_GUIDE.md](HACKATHON_DEMO_GUIDE.md)** - Complete presentation guide
- **[QUICK_REFERENCE.txt](QUICK_REFERENCE.txt)** - Command cheat sheet
- **[backend/DEMO_SUMMARY.md](backend/DEMO_SUMMARY.md)** - Backend implementation details
- **[pocket_council/DEMO_GUIDE.md](pocket_council/DEMO_GUIDE.md)** - Frontend demo guide

---

## 🐛 **Troubleshooting**

### SOAP note doesn't appear in frontend:
- Check browser console
- Verify backend is running
- SOAP note is mocked and should appear 2 seconds after clicking "Start Consult"

### AI agents don't respond:
- Set `OPENAI_API_KEY` environment variable
- Check backend terminal for errors
- Agents will use fallback mode without API key (still works!)

### Import errors:
```bash
cd backend
pip install -r requirements.txt
```

### Frontend won't start:
```bash
cd pocket_council
rm -rf .next node_modules
npm install
npm run dev
```

---

## 🎨 **Technologies Used**

### Backend
- **FastAPI** - Modern Python web framework
- **LangChain** - LLM orchestration
- **OpenAI GPT-4** - AI reasoning and analysis
- **Whisper** - Speech-to-text
- **SQLModel** - Database ORM
- **WebSockets** - Real-time communication

### Frontend
- **Next.js 16** - React framework
- **Tailwind CSS 4** - Styling
- **Lucide React** - Icons
- **Framer Motion** - Animations

---

## 🚀 **Future Enhancements**

- [ ] Add more specialized agents (Pharmacist, Radiologist)
- [ ] Integrate with EHR systems
- [ ] Mobile app version
- [ ] Voice commands for doctors
- [ ] Multi-language support
- [ ] Automated prescription generation

---

## 📝 **Notes**
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
