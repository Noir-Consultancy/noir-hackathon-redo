import pytest
from langchain_core.language_models import BaseChatModel
from langchain_core.messages import AIMessage, BaseMessage, HumanMessage, SystemMessage
from langchain_core.outputs import ChatGeneration, ChatResult

from app import npc


class EchoChatModel(BaseChatModel):
    """Replies with the number of user messages seen, so tests can check memory."""

    seen: list[list[BaseMessage]] = []

    @property
    def _llm_type(self) -> str:
        return "echo"

    def _generate(self, messages, stop=None, run_manager=None, **kwargs):
        self.seen.append(messages)
        users = sum(isinstance(m, HumanMessage) for m in messages)
        system = next((m.text for m in messages if isinstance(m, SystemMessage)), "")
        text = f"<think>hmm</think>svar {users}|{system[:20]}"
        return ChatResult(generations=[ChatGeneration(message=AIMessage(content=text))])


@pytest.fixture(autouse=True)
def fake_llm(monkeypatch):
    model = EchoChatModel(seen=[])
    monkeypatch.setattr(npc, "get_chat_model", lambda: model)
    npc._agents.clear()
    yield model
    npc._agents.clear()
