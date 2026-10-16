"""Mentor agent tools (docs/contract/interfaces.md).

Player and mentor come from the agent's config, never from the LLM.
"""

import re

from langchain_core.runnables import RunnableConfig
from langchain_core.tools import tool

from app.progress import get_progress
from app.world import get_mentor, get_quest


def _ids(config: RunnableConfig) -> tuple[str, str]:
    c = config["configurable"]
    return c["player_id"], c["mentor_id"]


def quest_done(player_id: str, quest_id: str) -> bool:
    progress = get_progress(player_id)
    return progress is not None and quest_id in progress.completed_quests


@tool
def get_player_progress(config: RunnableConfig) -> str:
    """Vad spelaren har klarat: nivå, XP, klarade quests och upplåsta kunskapskort."""
    player_id, _ = _ids(config)
    p = get_progress(player_id)
    if p is None:
        return "Okänd spelare."
    quests = [q.title for qid in p.completed_quests if (q := get_quest(qid))]
    return (
        f"{p.name}: nivå {p.level}, {p.xp} XP. "
        f"Klarade quests: {', '.join(quests) or 'inga'}. "
        f"Kort: {', '.join(c.title for c in p.cards) or 'inga'}."
    )


@tool(response_format="content_and_artifact")
def offer_quest(config: RunnableConfig) -> tuple[str, str | None]:
    """Erbjud spelaren din quest när samtalet är moget. Returnerar uppgiften."""
    player_id, mentor_id = _ids(config)
    quest = get_quest(get_mentor(mentor_id).quest_id)
    if quest_done(player_id, quest.id):
        return f'Spelaren har redan klarat "{quest.title}". Erbjud inget.', None
    return (
        f'Quest "{quest.title}" visas för spelaren. Uppgift: {quest.task} '
        "Presentera uppgiften kort med egna ord. Svara inte på den åt spelaren."
    ), quest.id


@tool
def lookup_card(topic: str, config: RunnableConfig) -> str:
    """Hitta ett kunskapskort spelaren har låst upp om ett ämne, att hänvisa till."""
    player_id, _ = _ids(config)
    p = get_progress(player_id)
    words = [w for w in re.findall(r"\w+", topic.lower()) if len(w) >= 3]
    for card in p.cards if p else []:
        text = f"{card.title} {card.summary}".lower()
        if any(w in text for w in words):
            return f"{card.title}: {card.summary.strip()}"
    return "Inget kort."


TOOLS = [get_player_progress, offer_quest, lookup_card]
