"""Quest judging (package 4). Skeleton: a stub judge; replace with an LLM judge."""

from pydantic import BaseModel

from app.world import QuestDef


class Judgement(BaseModel):
    passed: bool
    feedback: str


def judge(quest: QuestDef, answer: str) -> Judgement:
    # TODO(package 4): LLM judge with structured output, using quest.criteria.
    if len(answer.split()) >= 5:
        return Judgement(passed=True, feedback="(stub) Godkänt! Bra resonerat.")
    return Judgement(passed=False, feedback="(stub) Inte än – utveckla ditt svar lite mer.")
