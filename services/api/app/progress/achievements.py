"""Achievement rules from data/world/achievements.yaml."""

from typing import Any

from app.progress.store import PlayerRecord
from app.world import get_mentor, get_world


def _zone_quests(zone_id: str) -> set[str]:
    return {
        q.id for q in get_world().quests if (m := get_mentor(q.mentor_id)) and m.zone_id == zone_id
    }


def is_earned(rule: dict[str, Any], player: PlayerRecord, level: int) -> bool:
    match rule.get("type"):
        case "quests_completed":
            return len(player.completed_quests) >= rule["count"]
        case "level_reached":
            return level >= rule["level"]
        case "zone_completed":
            quests = _zone_quests(rule["zone_id"])
            return bool(quests) and quests <= set(player.completed_quests)
        case "cards_collected":
            return {c.id for c in get_world().cards} <= set(player.card_ids)
        case other:
            raise ValueError(f"Unknown achievement rule type: {other}")
