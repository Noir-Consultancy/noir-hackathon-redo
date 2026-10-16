from typing import Any

import pytest

from app import progress, quests
from app.progress.store import InMemoryPlayerStore


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
