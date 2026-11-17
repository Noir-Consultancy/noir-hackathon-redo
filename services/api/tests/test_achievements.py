import pytest

from app import progress
from app.progress.achievements import is_earned
from app.progress.store import PlayerRecord
from app.world import get_achievement_defs, get_quest, get_world


def _player(quests: list[str] = (), cards: list[str] = (), xp: int = 0) -> PlayerRecord:
    return PlayerRecord(
        id="p", name="p", xp=xp, completed_quests=list(quests), card_ids=list(cards)
    )


def test_quests_completed():
    rule = {"type": "quests_completed", "count": 2}
    assert not is_earned(rule, _player(["q-ada-1"]), 1)
    assert is_earned(rule, _player(["q-ada-1", "q-karl-1"]), 1)


def test_level_reached():
    rule = {"type": "level_reached", "level": 2}
    assert not is_earned(rule, _player(), 1)
    assert is_earned(rule, _player(), 2)


def test_zone_completed():
    rule = {"type": "zone_completed", "zone_id": "agentbyn"}
    assert not is_earned(rule, _player(["q-karl-1"]), 1)
    assert is_earned(rule, _player(["q-ada-1"]), 1)


def test_zone_without_quests_is_never_completed():
    assert not is_earned({"type": "zone_completed", "zone_id": "no-such-zone"}, _player(), 1)


def test_cards_collected():
    rule = {"type": "cards_collected"}
    all_cards = [c.id for c in get_world().cards]
    assert not is_earned(rule, _player(cards=all_cards[:-1]), 1)
    assert is_earned(rule, _player(cards=all_cards), 1)


def test_unknown_rule_type_raises():
    with pytest.raises(ValueError):
        is_earned({"type": "nope"}, _player(), 1)


def test_all_rules_in_yaml_are_valid():
    for a in get_achievement_defs():
        is_earned(a.rule, _player(), 1)


def test_badges_unlock_as_player_completes_all_quests():
    pid = progress.get_or_create_player("Samlaren").player_id
    unlocked = []
    for qid in ["q-ada-1", "q-karl-1", "q-vera-1", "q-oracle-1", "q-ada-1"]:
        q = get_quest(qid)
        _, _, new, _ = progress.complete_quest(pid, q.id, q.xp, q.card_id)
        unlocked.append(sorted(a.id for a in new))
    assert unlocked == [
        ["agentbyns-hjalte", "first-quest"],
        ["level-2"],
        [],
        ["all-cards", "orakelfallaren"],
        [],
    ]
    assert len(progress.get_progress(pid).achievements) == 5
