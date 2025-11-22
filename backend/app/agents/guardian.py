from typing import Dict, List

from langchain_core.messages import HumanMessage, SystemMessage

from .base import Agent


GUARDIAN_PROMPT = """You are The Guardian, the safety officer.
Focus on:
- Allergy conflicts.
- Drug-drug interactions.
- Contraindications based on history.
- Missing safety labs or vitals.
Respond with a short list of alerts (max 3) or 'No safety concerns detected'. Keep it actionable."""


class GuardianAgent(Agent):
    def __init__(self, model_provider):
        super().__init__(name="Guardian", system_prompt=GUARDIAN_PROMPT, category="alert", model_provider=model_provider)

    def _build_messages(self, transcript: str, context: Dict[str, str]) -> List[object]:
        return [
            SystemMessage(content=self.system_prompt),
            HumanMessage(
                content=(
                    f"Transcript:\n{transcript}\n\n"
                    f"Allergies: {context.get('allergies') or 'None'}\n"
                    f"Medications: {context.get('medications') or 'None'}\n"
                    f"History: {context.get('history') or 'None'}\n"
                    f"Recent records (labs/imaging/exams): {context.get('records') or 'None'}"
                )
            ),
        ]
