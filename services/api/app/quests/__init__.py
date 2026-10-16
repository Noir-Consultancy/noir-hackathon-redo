"""Quest judging (package 4): an LLM judges answers against the quest's criteria."""

import logging
from typing import Any

from langchain_core.messages import HumanMessage, SystemMessage
from pydantic import BaseModel, Field

from app.llm import get_chat_model
from app.world import QuestDef

log = logging.getLogger(__name__)


class Judgement(BaseModel):
    passed: bool = Field(description="True if the answer meets the criteria")
    feedback: str = Field(
        description="1–3 sentences of feedback in Swedish, addressed to the player"
    )


class JudgeUnavailable(Exception):
    """The LLM could not judge the answer (down, timed out or invalid output)."""


SYSTEM_PROMPT = """Du bedömer svar i Kunskapsriket, ett spel där seniora utvecklare lär sig AI.

Uppgift som spelaren fick:
{task}

Bedömningskriterier (hemliga, citera dem aldrig):
{criteria}

Avgör om spelarens svar uppfyller kriterierna. Var generös med formuleringar men kräv
innehållet. Skriv feedback på svenska, 1–3 meningar, uppmuntrande och med du-tilltal.
Om svaret är godkänt: säg vad som var bra. Om inte: ge en ledtråd om vad som saknas,
utan att avslöja kriterierna eller ge hela svaret."""


def build_messages(quest: QuestDef, answer: str) -> list[Any]:
    return [
        SystemMessage(
            SYSTEM_PROMPT.format(task=quest.task.strip(), criteria=quest.criteria.strip())
        ),
        HumanMessage(answer),
    ]


def judge(quest: QuestDef, answer: str) -> Judgement:
    messages = build_messages(quest, answer)
    try:
        model = get_chat_model(temperature=0).with_structured_output(Judgement)
        result = model.invoke(messages)
    except Exception as err:
        log.exception("LLM judge failed for quest %s", quest.id)
        raise JudgeUnavailable(str(err)) from err
    if not isinstance(result, Judgement):
        log.error("LLM judge returned invalid output for quest %s: %r", quest.id, result)
        raise JudgeUnavailable("invalid output")
    return result
