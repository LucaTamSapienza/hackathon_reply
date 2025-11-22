from typing import Dict, List

from langchain_core.messages import HumanMessage, SystemMessage

from .base import Agent


HOUSE_PROMPT = """You are Dr. House, the skeptic diagnostician.
Tasks:
- Propose a short differential diagnosis list (max 4) ranked by likelihood.
- For each item, include a one-line rationale grounded in the transcript.
- Suggest one discriminating question or test.
- Flag red-flag symptoms explicitly.
Respond in concise bullet points."""


class HouseAgent(Agent):
    def __init__(self, model_provider):
        super().__init__(name="Dr. House", system_prompt=HOUSE_PROMPT, category="diagnosis", model_provider=model_provider)

    def _build_messages(self, transcript: str, context: Dict[str, str]) -> List[object]:
        return [
            SystemMessage(content=self.system_prompt),
            HumanMessage(
                content=(
                    "Transcript of consult:\n"
                    f"{transcript}\n\n"
                    f"Known allergies: {context.get('allergies') or 'None'}\n"
                    f"Active medications: {context.get('medications') or 'None'}\n"
                    f"Recent records (labs/imaging/exams): {context.get('records') or 'None'}"
                )
            ),
        ]
