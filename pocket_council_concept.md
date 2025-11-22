# Pocket Council: The AI Medical Board
## *A Mobile-First Multi-Agent Companion for Doctors*

### 1. The Core Philosophy
**"Augmented Intelligence, Not Replacement"**
Pocket Council is designed to sit on the desk between the doctor and the patient. It does not try to be the doctor; it acts as a silent, high-powered support team that handles the cognitive heavy lifting (memory, research, safety checks, documentation) so the doctor can focus on the human connection.

### 2. The Problem: "The Lonely Physician"
Modern doctors are overwhelmed. In a 15-minute consult, they must:
*   **Listen** with empathy.
*   **Recall** complex medical knowledge.
*   **Cross-check** drug interactions (Safety).
*   **Type** detailed legal notes (Documentation).

This leads to **Decision Fatigue**, **Burnout** (2:1 admin-to-care ratio), and **Diagnostic Errors**.

### 3. The Solution: A Multi-Agent System
Instead of one general AI, we deploy a "Council" of specialized agents that run in parallel, listening to the live consultation.

#### **The Agents (The Council)**

| Agent Name | Role | Responsibility |
| :--- | :--- | :--- |
| **📝 The Scribe** | *Secretary* | Listens silently. Filters small talk. Extracts medical entities (Symptoms, Meds, History). Drafts the final SOAP note. |
| **🕵️ Dr. House** | *Diagnostician* | The skeptic. It listens for symptoms and maintains a live "Differential Diagnosis" list. It flags rare conditions or outliers the doctor might miss due to anchoring bias. |
| **🛡️ The Guardian** | *Safety Officer* | The risk manager. It watches for "Danger Keywords" (Allergies, Contraindications). If the doctor mentions a drug, it instantly checks it against the patient's history. |
| **📚 Dr. Watson** | *Researcher* | The librarian. Fetches guidelines, dosage charts, or clinical trials on demand (e.g., "What's the pediatric dose for Amoxicillin?"). |

### 4. The User Experience (Mobile-First)
The app is designed as a **"Heads-Up Display"** for medicine.

*   **Platform:** Mobile Web (Next.js). Optimized for phones/tablets.
*   **Visual Style:** Dark mode, glassmorphism, high contrast.
*   **Interaction:**
    1.  **Tap "Start Consult":** The phone listens.
    2.  **Live Feed:** As the patient speaks, key info (e.g., "Chest pain", "Radiating to arm") is highlighted.
    3.  **Agent Cards:**
        *   *Insight:* Dr. House slides in a card: *"Risk of Aortic Dissection? Check BP in both arms."*
        *   *Alert:* The Guardian flashes red: *"Patient on Warfarin. Avoid NSAIDs."*
    4.  **Tap "Finish":** A perfect SOAP note is generated instantly for the Electronic Health Record (EHR).

### 5. Technical Architecture

*   **Frontend:** Next.js (React) + Tailwind CSS.
    *   Real-time WebSocket connection for streaming audio/text.
    *   Mobile-responsive UI components.
*   **Backend:** Python (FastAPI).
    *   **Orchestrator:** Manages the "Council". Receives transcript chunks and dispatches them to agents.
    *   **Agent Runtime:** OpenAI API (GPT-4o) with specialized system prompts for each persona.
    *   **Environment:** Python `.venv` for dependency management.

### 6. Why This Wins Hackathons
1.  **Architecture:** Demonstrates advanced "Agentic Workflow" (agents checking agents).
2.  **UX:** Solves a real problem (burnout) with a beautiful, non-intrusive interface.
3.  **Safety:** Shows AI as a safety net, addressing the "Hallucination" fear in healthcare.
