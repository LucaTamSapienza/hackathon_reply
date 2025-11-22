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
from .researcher import ResearcherAgent


# Mocked SOAP note for the Scribe agent
MOCKED_SOAP_NOTE = """**SOAP Note**

**Subjective:** Patient reports severe, throbbing headaches on the right side, occurring suddenly in the afternoon for the past week. Associated symptoms include nausea, photophobia, and visual auras (zigzag lines) lasting 15 minutes before headaches. Family history of migraines noted. Increased stress and poor sleep (5 hours/night) reported.

**Objective:** BP 128/82, HR 76, Temp 98.6°F. Allergies: Penicillin (hives). Medications: Oral Contraceptive (Combined).

**Assessment:** 1. Migraine with aura 2. Stress-related headache triggers 3. Sleep deprivation

**Plan:** Prescribe sumatriptan 50mg for acute attacks, propranolol 40mg daily for prevention. Advise keeping a headache diary and improving sleep hygiene. Follow-up in 4 weeks."""


class Orchestrator:
    def __init__(self, settings: Settings):
        self.settings = settings
        # Note: ScribeAgent won't actually be used, we'll return mocked data
        self.agents = [
            HouseAgent(self._model_provider),
            GuardianAgent(self._model_provider),
            ResearcherAgent(self._model_provider),
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
        
        # ALWAYS return mocked SOAP note for Scribe (no API call)
        scribe_result = AgentResult(
            agent="Scribe",
            category="note",
            content=MOCKED_SOAP_NOTE,
            confidence=1.0
        )
        results.append(scribe_result)
        
        # Run OTHER agents with REAL AI on the mocked transcript/context
        for agent in self.agents:
            results.append(agent.run(transcript, context))
        
        return results
