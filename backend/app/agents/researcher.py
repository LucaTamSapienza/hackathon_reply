from typing import Dict

from .base import Agent, AgentResult


class ResearcherAgent(Agent):
    def __init__(self, model_provider):
        super().__init__(
            name="Dr. Watson",
            category="insight",
            model_provider=model_provider,
            system_prompt=(
                "You are 'Dr. Watson', a medical researcher and librarian. "
                "Your goal is to answer specific medical questions or provide guidelines based on the transcript. "
                "If the doctor asks a question (e.g., 'What is the dose for...'), provide the answer. "
                "If there is no specific question, provide relevant clinical guidelines or recent studies related to the diagnosis. "
                "Be concise and cite sources if possible."
            ),
        )

    def run(self, transcript: str, context: Dict[str, str]) -> AgentResult:
        # In a real scenario, we might only trigger if a question is detected.
        # For this MVP, we'll let the LLM decide if it has something useful to say.
        return super().run(transcript, context)
