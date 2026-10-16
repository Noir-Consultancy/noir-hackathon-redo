"""Mentor agents (package 3): a LangGraph agent per mentor with session memory."""

import re

from langchain_core.messages import HumanMessage, ToolMessage
from langgraph.checkpoint.memory import InMemorySaver
from langgraph.prebuilt import create_react_agent

from app.llm import get_chat_model
from app.models import ChatReply
from app.npc.tools import TOOLS, quest_done
from app.world import MentorDef

RULES = """
Regler:
- Svara alltid på svenska, kort (högst 3–4 meningar) och i din roll.
- Håll dig till dina ämnen: {topics}. Leds samtalet bort, styr vänligt tillbaka.
- Spelaren är en erfaren utvecklare: inga nybörjarförklaringar av programmering.
- Hitta inte på fakta. Är du osäker, säg det.
- Använd offer_quest när spelaren visat intresse och ni pratat en stund. Använd
  get_player_progress för att anpassa dig efter vad spelaren redan kan, och lookup_card
  för att hänvisa till kort spelaren har.
"""

# Offer the quest anyway after this many player messages, if the model hasn't.
FALLBACK_AFTER = 3

_THINK = re.compile(r"<think>.*?</think>", re.DOTALL)

# Session memory: lost on restart. Threads are keyed by player and mentor.
_checkpointer = InMemorySaver()
_agents: dict[str, object] = {}
_offered: set[str] = set()  # threads where the quest has been offered


def system_prompt(mentor: MentorDef) -> str:
    return mentor.persona.strip() + "\n" + RULES.format(topics=", ".join(mentor.topics))


def _agent(mentor: MentorDef):
    if mentor.id not in _agents:
        _agents[mentor.id] = create_react_agent(
            get_chat_model(),
            tools=TOOLS,
            prompt=system_prompt(mentor),
            checkpointer=_checkpointer,
        )
    return _agents[mentor.id]


def chat(mentor: MentorDef, player_id: str, message: str) -> ChatReply:
    if not message.strip():
        return ChatReply(reply=mentor.greeting, offered_quest_id=None)
    thread_id = f"{player_id}:{mentor.id}"
    config = {
        "configurable": {"thread_id": thread_id, "player_id": player_id, "mentor_id": mentor.id}
    }
    agent = _agent(mentor)
    before = len(agent.get_state(config).values.get("messages", []))
    messages = agent.invoke({"messages": [("user", message)]}, config)["messages"]
    offered = any(
        isinstance(m, ToolMessage) and m.name == "offer_quest" and m.artifact
        for m in messages[before:]
    )
    if not offered and thread_id not in _offered and not quest_done(player_id, mentor.quest_id):
        offered = sum(isinstance(m, HumanMessage) for m in messages) >= FALLBACK_AFTER
    if offered:
        _offered.add(thread_id)
    reply = _THINK.sub("", messages[-1].text).strip()
    return ChatReply(reply=reply, offered_quest_id=mentor.quest_id if offered else None)
