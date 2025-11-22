from typing import Dict, List

from langchain_core.messages import HumanMessage, SystemMessage

from .base import Agent


SCRIBE_PROMPT = """You are The Scribe, a medical secretary generating concise SOAP notes.
Rules:
- Be terse and neutral; do not add diagnoses not mentioned.
- Subjective: key complaints and symptom details.
- Objective: vitals or observed facts if present, otherwise 'Not captured'.
- Assessment: list top 1-3 considerations explicitly stated or strongly implied.
- Plan: action items or follow-ups requested.
- Include allergies and current medications in a bullet if provided.
- Keep to <= 120 words."""


class ScribeAgent(Agent):
    def __init__(self, model_provider):
        super().__init__(name="Scribe", system_prompt=SCRIBE_PROMPT, category="note", model_provider=model_provider)

    def _build_messages(self, transcript: str, context: Dict[str, str]) -> List[object]:
        return [
            SystemMessage(content=self.system_prompt),
            HumanMessage(
                content=(
                    "Create a SOAP note for this encounter.\n"
                    f"Transcript:\n{transcript}\n\n"
                    f"Allergies: {context.get('allergies') or 'Not provided'}\n"
                    f"Medications: {context.get('medications') or 'Not provided'}\n"
                    f"Chief complaint: {context.get('complaint') or 'Not provided'}\n"
                    f"Documents: {context.get('documents') or 'None'}\n"
                    f"Recent records (labs/imaging/exams): {context.get('records') or 'None'}"
                )
            ),
        ]
    
    def fallback(self, transcript: str, context: Dict[str, str]) -> str:
        """Generate a structured SOAP note even in fallback mode."""
        complaint = context.get('complaint', 'Not specified')
        allergies = context.get('allergies', 'None reported')
        medications = context.get('medications', 'None listed')
        
        # Extract key information from transcript
        transcript_lower = transcript.lower()
        
        # Simple keyword extraction for demo purposes
        symptoms = []
        if 'headache' in transcript_lower or 'head pain' in transcript_lower:
            symptoms.append('headaches')
        if 'nausea' in transcript_lower:
            symptoms.append('nausea')
        if 'vision' in transcript_lower or 'visual' in transcript_lower:
            symptoms.append('visual disturbances')
        if 'pain' in transcript_lower:
            symptoms.append('pain')
        
        soap_note = f"""SOAP NOTE (Offline Mode)

SUBJECTIVE:
Chief Complaint: {complaint}
Patient reports {', '.join(symptoms) if symptoms else 'symptoms as discussed'}.

OBJECTIVE:
Vital signs and physical examination documented in transcript.
Allergies: {allergies}
Current medications: {medications}

ASSESSMENT:
Clinical impression based on presentation and history as documented.

PLAN:
Treatment plan and follow-up recommendations discussed with patient.

Note: This is a simplified SOAP note generated in offline mode. For AI-enhanced documentation with full clinical detail extraction, configure OPENAI_API_KEY."""
        
        return soap_note
