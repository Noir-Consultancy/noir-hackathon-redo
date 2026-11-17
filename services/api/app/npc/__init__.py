"""Mentor agents (package 3): a LangGraph agent per mentor with session memory."""

import logging
import re

from langchain.agents import create_agent
from langchain_core.messages import HumanMessage, SystemMessage, ToolMessage
from langgraph.checkpoint.memory import InMemorySaver

from app.llm import get_chat_model
from app.models import ChatReply, Remark
from app.npc.tools import TOOLS, quest_done
from app.progress import get_progress
from app.world import MentorDef

log = logging.getLogger(__name__)

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
_remarked: set[str] = set()  # "player:mentor:card" the mentor has commented on

REMARK_PROMPT = """
Spelaren går förbi dig. Säg spontant något kort som knyter an till det hen nyss lärt sig
och leder vidare till dina ämnen: {topics}. Ge en ny vinkel, ställ gärna en fråga.

Spelaren har lärt sig: {cards}
Knyt an till kortet "{title}": {summary}

Regler: på svenska, i din roll, högst 2 korta meningar (under 30 ord), du-tilltal.
Hitta inte på något om spelaren utöver korten ovan. Skriv bara repliken.

Exempel på bra repliker (härma stilen, inte innehållet):
- "Du lärde dig om kontextfönster hos Karl – visste du att RAG är ett sätt att hålla det litet?"
- "Granska AI-kod, sa du? Då vet du redan hälften av det jag tänkte fråga dig om agenter."
- "Hm, du ser ut som någon som just förstått embeddings. Har du funderat på vad som händer när
  frågan är nästan rätt men inte riktigt?"
"""


def system_prompt(mentor: MentorDef) -> str:
    return mentor.persona.strip() + "\n" + RULES.format(topics=", ".join(mentor.topics))


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


def remark(mentor: MentorDef, player_id: str) -> Remark:
    """A short remark on the player's newest card this mentor hasn't commented on yet."""
    progress = get_progress(player_id)
    cards = progress.cards if progress else []
    new = [c for c in cards if f"{player_id}:{mentor.id}:{c.id}" not in _remarked]
    if not new:
        return Remark(remark=None)
    card = new[-1]
    prompt = REMARK_PROMPT.format(
        topics=", ".join(mentor.topics),
        cards=", ".join(c.title for c in cards),
        title=card.title,
        summary=card.summary.strip(),
    )
    try:
        reply = get_chat_model().invoke(
            [SystemMessage(mentor.persona.strip() + "\n" + prompt), HumanMessage("(går förbi)")]
        )
    except Exception:
        log.exception("Remark failed for mentor %s", mentor.id)
        return Remark(remark=None)
    _remarked.add(f"{player_id}:{mentor.id}:{card.id}")
    return Remark(remark=_THINK.sub("", reply.text).strip() or None)
