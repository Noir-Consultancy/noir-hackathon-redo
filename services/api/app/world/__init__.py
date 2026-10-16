"""World content loaded once from data/world/*.yaml (package 3: mentor agents).

Public functions are the module interface in docs/contract/interfaces.md.
"""

from functools import cache
from typing import Any

import yaml

from app import config
from app.models import Achievement, Card, CardSummary, Mentor, Quest, World, Zone


class MentorDef(Mentor):
    persona: str
    topics: list[str]
    greeting: str


class QuestDef(Quest):
    criteria: str


class AchievementDef(Achievement):
    rule: dict[str, Any]


def _load(name: str) -> list[dict[str, Any]]:
    with open(config.WORLD_DIR / f"{name}.yaml", encoding="utf-8") as f:
        return yaml.safe_load(f) or []


@cache
def _content() -> dict[str, list]:
    return {
        "zones": [Zone(**z) for z in _load("zones")],
        "mentors": [MentorDef(**m) for m in _load("mentors")],
        "quests": [QuestDef(**q) for q in _load("quests")],
        "cards": [Card(**c) for c in _load("cards")],
        "achievements": [AchievementDef(**a) for a in _load("achievements")],
    }


def get_world() -> World:
    c = _content()
    return World(
        zones=c["zones"],
        mentors=[Mentor(**m.model_dump(include=set(Mentor.model_fields))) for m in c["mentors"]],
        quests=[Quest(**q.model_dump(include=set(Quest.model_fields))) for q in c["quests"]],
        cards=[
            CardSummary(**card.model_dump(include=set(CardSummary.model_fields)))
            for card in c["cards"]
        ],
        achievements=[
            Achievement(**a.model_dump(include=set(Achievement.model_fields)))
            for a in c["achievements"]
        ],
    )


def get_mentor(mentor_id: str) -> MentorDef | None:
    return next((m for m in _content()["mentors"] if m.id == mentor_id), None)


def get_quest(quest_id: str) -> QuestDef | None:
    return next((q for q in _content()["quests"] if q.id == quest_id), None)


def get_card(card_id: str) -> Card | None:
    return next((c for c in _content()["cards"] if c.id == card_id), None)


def get_achievement_defs() -> list[AchievementDef]:
    return list(_content()["achievements"])
