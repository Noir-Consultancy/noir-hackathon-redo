"""Player progress: XP, levels, cards and achievements (package 4).

Players are stored in Postgres (DATABASE_URL); tests swap in an in-memory store.
"""

import uuid

from app.config import DATABASE_URL
from app.models import Achievement, Card, Progress
from app.progress.store import PlayerRecord, PlayerStore, SqlPlayerStore
from app.world import get_achievement_defs, get_card

XP_PER_LEVEL = 100

_store: PlayerStore | None = None


def get_store() -> PlayerStore:
    global _store
    if _store is None:
        _store = SqlPlayerStore(DATABASE_URL)
    return _store


def set_store(store: PlayerStore | None) -> None:
    global _store
    _store = store


def init_store() -> None:
    """Create storage (tables) at app startup."""
    get_store().init()


def level_for(xp: int) -> int:
    return 1 + xp // XP_PER_LEVEL


def _to_progress(p: PlayerRecord) -> Progress:
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
    store = get_store()
    player = store.get_by_name(name) or store.create(PlayerRecord(id=str(uuid.uuid4()), name=name))
    return _to_progress(player)


def get_progress(player_id: str) -> Progress | None:
    player = get_store().get(player_id)
    return _to_progress(player) if player else None


def complete_quest(
    player_id: str, quest_id: str, xp: int, card_id: str
) -> tuple[int, Card | None, list[Achievement], Progress]:
    """Award a passed quest. Returns (xp_awarded, new_card, new_achievements, progress)."""
    awarded = 0
    new_achievements: list[Achievement] = []

    def award(player: PlayerRecord) -> None:
        nonlocal awarded
        if quest_id in player.completed_quests:
            return
        awarded = xp
        player.xp += xp
        player.completed_quests.append(quest_id)
        player.card_ids.append(card_id)
        # TODO(package 4): evaluate achievement rules from data/world/achievements.yaml.
        for a in get_achievement_defs():
            if a.id == "first-quest" and a.id not in player.achievement_ids:
                player.achievement_ids.append(a.id)
                new_achievements.append(
                    Achievement(**a.model_dump(include=set(Achievement.model_fields)))
                )

    player = get_store().update(player_id, award)
    if player is None:
        raise KeyError(f"Unknown player: {player_id}")
    card = get_card(card_id) if awarded else None
    return awarded, card, new_achievements, _to_progress(player)
