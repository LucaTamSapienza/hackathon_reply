import logging
from dataclasses import dataclass
from typing import Callable, Dict, List, Optional

from langchain_core.messages import HumanMessage, SystemMessage
from tenacity import retry, stop_after_attempt, wait_exponential

logger = logging.getLogger(__name__)

ModelProvider = Callable[[], object | None]


@dataclass
class AgentResult:
    agent: str
    category: str
    content: str
    confidence: float | None = None


class Agent:
    def __init__(self, name: str, system_prompt: str, category: str, model_provider: ModelProvider):
        self.name = name
        self.system_prompt = system_prompt
        self.category = category
        self._model_provider = model_provider

    def _build_messages(self, transcript: str, context: Dict[str, str]) -> List[object]:
        return [
            SystemMessage(content=self.system_prompt),
            HumanMessage(
                content=(
                    "Transcript:\n"
                    f"{transcript}\n\n"
                    f"Context: {context}"
                )
            ),
        ]

    def fallback(self, transcript: str, context: Dict[str, str]) -> str:
        return (
            f"[{self.name}] Offline summary. "
            f"Transcript len={len(transcript)}. "
            f"Key context: { {k: context.get(k) for k in ('allergies', 'medications', 'complaint')} }"
        )

    @retry(wait=wait_exponential(min=1, max=6), stop=stop_after_attempt(3))
    def run(self, transcript: str, context: Dict[str, str]) -> AgentResult:
        model = self._model_provider() if self._model_provider else None
        if model is None:
            logger.warning("%s running in fallback mode (no model configured)", self.name)
            return AgentResult(agent=self.name, category=self.category, content=self.fallback(transcript, context))

        try:
            messages = self._build_messages(transcript, context)
            result = model.invoke(messages)
            content = getattr(result, "content", str(result))
            return AgentResult(agent=self.name, category=self.category, content=content)
        except Exception as exc:  # noqa: BLE001
            logger.exception("Agent %s failed, returning fallback. Error: %s", self.name, exc)
            return AgentResult(
                agent=self.name,
                category=self.category,
                content=self.fallback(transcript, context) + f" | error: {exc}",
            )
