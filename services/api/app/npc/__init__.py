"""Mentor agents (package 3): a LangGraph agent per mentor with session memory."""

import re

from langgraph.checkpoint.memory import InMemorySaver
from langgraph.prebuilt import create_react_agent

from app.llm import get_chat_model
from app.models import ChatReply
from app.world import MentorDef

RULES = """
Regler:
- Svara alltid på svenska, kort (högst 3–4 meningar) och i din roll.
- Håll dig till dina ämnen: {topics}. Leds samtalet bort, styr vänligt tillbaka.
- Spelaren är en erfaren utvecklare: inga nybörjarförklaringar av programmering.
- Hitta inte på fakta. Är du osäker, säg det.
"""

_THINK = re.compile(r"<think>.*?</think>", re.DOTALL)

# Session memory: lost on restart. Threads are keyed by player and mentor.
_checkpointer = InMemorySaver()
_agents: dict[str, object] = {}


def system_prompt(mentor: MentorDef) -> str:
    return mentor.persona.strip() + "\n" + RULES.format(topics=", ".join(mentor.topics))


def _agent(mentor: MentorDef):
    if mentor.id not in _agents:
        _agents[mentor.id] = create_react_agent(
            get_chat_model(),
            tools=[],  # TODO(#9): get_player_progress, offer_quest, lookup_card
            prompt=system_prompt(mentor),
            checkpointer=_checkpointer,
        )
    return _agents[mentor.id]


def chat(mentor: MentorDef, player_id: str, message: str) -> ChatReply:
    if not message.strip():
        return ChatReply(reply=mentor.greeting, offered_quest_id=None)
    config = {"configurable": {"thread_id": f"{player_id}:{mentor.id}"}}
    result = _agent(mentor).invoke({"messages": [("user", message)]}, config)
    reply = _THINK.sub("", result["messages"][-1].text).strip()
    # Until offer_quest exists (#9), offer the mentor's quest on every reply.
    return ChatReply(reply=reply, offered_quest_id=mentor.quest_id)
