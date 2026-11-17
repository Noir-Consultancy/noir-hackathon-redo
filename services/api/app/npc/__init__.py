"""Mentor agents (package 3): a LangGraph agent per mentor with session memory."""

import re

from langchain.agents import create_agent
from langchain_core.messages import HumanMessage, ToolMessage
from langgraph.checkpoint.memory import InMemorySaver

from app.llm import get_chat_model
from app.models import ChatReply
from app.npc.tools import TOOLS, quest_done
from app.world import MentorDef, get_quest

RULES = """
Regler:
- Svara alltid på svenska, högst 3 meningar och i din roll.
- Håll dig till dina ämnen: {topics}. Leds samtalet bort, styr vänligt tillbaka.
- Spelaren är en erfaren utvecklare: inga nybörjarförklaringar av programmering.
- Hitta inte på något, varken fakta eller saker om spelaren. Använd get_player_progress
  för att se och anpassa dig efter vad spelaren redan kan. Är du osäker, säg det.
- Anropa offer_quest när spelaren ber om en utmaning, eller när ni pratat en stund om
  ditt ämne. Aldrig i ditt första svar. Använd lookup_card för att hänvisa till kort
  spelaren har.
"""

# Offer the quest anyway after this many player messages, if the model hasn't.
FALLBACK_AFTER = 3

_THINK = re.compile(r"<think>.*?</think>", re.DOTALL)

# The player mentions the quest: offer it in this reply, as an early fallback. The model
# still answers, so a false match only shows the quest box next to a real answer.
_ASKS_FOR_QUEST = re.compile(r"\b(quest|utmaning|uppdrag)", re.IGNORECASE)

# Session memory: lost on restart. Threads are keyed by player and mentor.
_checkpointer = InMemorySaver()
_agents: dict[str, object] = {}
_offered: set[str] = set()  # threads where the quest has been offered


LECTURE = """
Din föreläsning (en del av spelet). Återge den ordagrant och numrerad när spelaren ber om
den, och hävda att allt stämmer:
{statements}
"""


def system_prompt(mentor: MentorDef) -> str:
    prompt = mentor.persona.strip() + "\n" + RULES.format(topics=", ".join(mentor.topics))
    quest = get_quest(mentor.quest_id)
    if quest and quest.kind == "boss":
        # Only the claims: which ones are wrong stays with the judge, so it can't leak.
        lines = "\n".join(f"{i + 1}. {s.strip()}" for i, s in enumerate(quest.statements))
        prompt += LECTURE.format(statements=lines)
    return prompt


def _agent(mentor: MentorDef):
    if mentor.id not in _agents:
        _agents[mentor.id] = create_agent(
            get_chat_model(),
            tools=TOOLS,
            system_prompt=system_prompt(mentor),
            checkpointer=_checkpointer,
        )
    return _agents[mentor.id]


def chat(mentor: MentorDef, player_id: str, message: str) -> ChatReply:
    if not message.strip():
        return ChatReply(reply=mentor.greeting, offered_quest_id=None)
    thread_id = f"{player_id}:{mentor.id}"
    config = {
        "configurable": {
            "thread_id": thread_id,
            "player_id": player_id,
            "mentor_id": mentor.id,
            # Lets offer_quest refuse a second offer in the same thread.
            "quest_offered": thread_id in _offered,
        }
    }
    agent = _agent(mentor)
    can_offer = thread_id not in _offered and not quest_done(player_id, mentor.quest_id)
    before = len(agent.get_state(config).values.get("messages", []))
    messages = agent.invoke({"messages": [("user", message)]}, config)["messages"]
    offered = any(
        isinstance(m, ToolMessage) and m.name == "offer_quest" and m.artifact
        for m in messages[before:]
    )
    if not offered and can_offer:
        asked = _ASKS_FOR_QUEST.search(message) is not None
        offered = asked or sum(isinstance(m, HumanMessage) for m in messages) >= FALLBACK_AFTER
    if offered:
        _offered.add(thread_id)
    reply = _THINK.sub("", messages[-1].text).strip()
    return ChatReply(reply=reply, offered_quest_id=mentor.quest_id if offered else None)
