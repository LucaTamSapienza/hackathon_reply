from typing import Dict, List

try:
    from langchain_openai import ChatOpenAI
except Exception:  # noqa: BLE001
    ChatOpenAI = None

from ..config import Settings
from .base import AgentResult
from .guardian import GuardianAgent
from .house import HouseAgent
from .scribe import ScribeAgent


class Orchestrator:
    def __init__(self, settings: Settings):
        self.settings = settings
        self.agents = [
            ScribeAgent(self._model_provider),
            HouseAgent(self._model_provider),
            GuardianAgent(self._model_provider),
        ]

    def _model_provider(self):
        if not self.settings.openai_api_key or ChatOpenAI is None:
            return None
        return ChatOpenAI(
            api_key=self.settings.openai_api_key,
            model=self.settings.model_name,
            temperature=0.1,
        )

    def run(self, transcript: str, context: Dict[str, str]) -> List[AgentResult]:
        results: List[AgentResult] = []
        for agent in self.agents:
            results.append(agent.run(transcript, context))
        return results
