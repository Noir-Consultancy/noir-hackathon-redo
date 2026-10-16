"""Player progress: XP, levels, cards and achievements (package 4).

Skeleton: in-memory store. Replace with Postgres (DATABASE_URL).
"""

import uuid
from dataclasses import dataclass, field

from app.models import Achievement, Card, Progress
from app.world import get_achievement_defs, get_card

XP_PER_LEVEL = 100


@dataclass
class _Player:
    id: str
    name: str
    xp: int = 0
    completed_quests: list[str] = field(default_factory=list)
    card_ids: list[str] = field(default_factory=list)
    achievement_ids: list[str] = field(default_factory=list)


_players: dict[str, _Player] = {}


def level_for(xp: int) -> int:
    return 1 + xp // XP_PER_LEVEL


def _to_progress(p: _Player) -> Progress:
    level = level_for(p.xp)
    achievements = {a.id: a for a in get_achievement_defs()}
    return Progress(
        player_id=p.id,
        name=p.name,
        xp=p.xp,
        level=level,
        xp_for_next_level=level * XP_PER_LEVEL,
        completed_quests=list(p.completed_quests),
        cards=[c for cid in p.card_ids if (c := get_card(cid))],
        achievements=[
            Achievement(**achievements[aid].model_dump(include=set(Achievement.model_fields)))
            for aid in p.achievement_ids
            if aid in achievements
        ],
    )


def get_or_create_player(name: str) -> Progress:
    player = next((p for p in _players.values() if p.name == name), None)
    if player is None:
        player = _Player(id=str(uuid.uuid4()), name=name)
        _players[player.id] = player
    return _to_progress(player)


def get_progress(player_id: str) -> Progress | None:
    player = _players.get(player_id)
    return _to_progress(player) if player else None


def complete_quest(
    player_id: str, quest_id: str, xp: int, card_id: str
) -> tuple[int, Card | None, list[Achievement], Progress]:
    """Award a passed quest. Returns (xp_awarded, new_card, new_achievements, progress)."""
    player = _players[player_id]
    if quest_id in player.completed_quests:
        return 0, None, [], _to_progress(player)
    player.xp += xp
    player.completed_quests.append(quest_id)
    player.card_ids.append(card_id)
    # TODO(package 4): evaluate achievement rules from data/world/achievements.yaml.
    new_achievements: list[Achievement] = []
    for a in get_achievement_defs():
        if a.id == "first-quest" and a.id not in player.achievement_ids:
            player.achievement_ids.append(a.id)
            new_achievements.append(
                Achievement(**a.model_dump(include=set(Achievement.model_fields)))
            )
    return xp, get_card(card_id), new_achievements, _to_progress(player)
