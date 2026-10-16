"""Mentor agents (package 3). Skeleton: a stub reply; replace with a LangGraph agent."""

from app.models import ChatReply
from app.world import MentorDef


def chat(mentor: MentorDef, player_id: str, message: str) -> ChatReply:
    # TODO(package 3): LangGraph agent with persona, checkpointer memory per
    # (player_id, mentor.id) and the tools in docs/contract/interfaces.md.
    if not message.strip():
        return ChatReply(reply=mentor.greeting, offered_quest_id=None)
    return ChatReply(
        reply=f'(stub) {mentor.name} funderar på "{message}"… Vill du prova en quest?',
        offered_quest_id=mentor.quest_id,
    )
