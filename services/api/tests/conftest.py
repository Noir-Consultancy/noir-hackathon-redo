from typing import Any

import pytest
from langchain_core.language_models import BaseChatModel
from langchain_core.messages import AIMessage, BaseMessage, HumanMessage, SystemMessage
from langchain_core.outputs import ChatGeneration, ChatResult

from app import npc, progress, quests
from app.progress.store import InMemoryPlayerStore

# A user message containing a keyword makes the fake model call that tool first.
TOOL_TRIGGERS = {"quest": ("offer_quest", {}), "kort": ("lookup_card", {"topic": "granska"})}


class EchoChatModel(BaseChatModel):
    """Replies with the number of user messages seen, so tests can check memory."""

    seen: list[list[BaseMessage]] = []

    @property
    def _llm_type(self) -> str:
        return "echo"

    def bind_tools(self, tools, **kwargs):
        return self

    def _generate(self, messages, stop=None, run_manager=None, **kwargs):
        self.seen.append(messages)
        last = messages[-1]
        if isinstance(last, HumanMessage):
            for word, (name, args) in TOOL_TRIGGERS.items():
                if word in last.text.lower():
                    call = {"name": name, "args": args, "id": f"call-{len(self.seen)}"}
                    return _result(AIMessage(content="", tool_calls=[call]))
        users = sum(isinstance(m, HumanMessage) for m in messages)
        system = next((m.text for m in messages if isinstance(m, SystemMessage)), "")
        tool = f"|tool:{last.text}" if last.type == "tool" else ""
        return _result(AIMessage(content=f"<think>hmm</think>svar {users}|{system[:20]}{tool}"))


def _result(message: AIMessage) -> ChatResult:
    return ChatResult(generations=[ChatGeneration(message=message)])


@pytest.fixture(autouse=True)
def fake_llm(monkeypatch):
    model = EchoChatModel(seen=[])
    monkeypatch.setattr(npc, "get_chat_model", lambda: model)
    npc._agents.clear()
    npc._offered.clear()
    yield model
    npc._agents.clear()


class FakeJudgeModel:
    """Stands in for the judge LLM: returns `result` (or raises it) and records the prompts."""

    def __init__(self) -> None:
        self.result: Any = quests.Judgement(passed=True, feedback="Bra jobbat!")
        self.calls: list[list[Any]] = []

    def with_structured_output(self, schema: Any) -> "FakeJudgeModel":
        return self

    def invoke(self, messages: list[Any]) -> Any:
        self.calls.append(messages)
        if isinstance(self.result, Exception):
            raise self.result
        return self.result


@pytest.fixture(autouse=True)
def in_memory_store():
    """Tests never touch Postgres: each test gets a fresh in-memory player store."""
    progress.set_store(InMemoryPlayerStore())
    yield
    progress.set_store(None)


@pytest.fixture(autouse=True)
def judge_model(monkeypatch):
    """Tests never call an LLM: the quest judge uses a fake model."""
    model = FakeJudgeModel()
    monkeypatch.setattr(quests, "get_chat_model", lambda **_: model)
    return model
