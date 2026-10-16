import pytest

from app import progress
from app.world import get_quest


@pytest.fixture
def quest():
    q = get_quest("q-ada-1")
    assert q is not None
    return q


def test_same_name_returns_same_player():
    first = progress.get_or_create_player("Ada")
    again = progress.get_or_create_player("Ada")
    other = progress.get_or_create_player("Bob")
    assert first.player_id == again.player_id != other.player_id


def test_new_player_starts_at_level_one():
    p = progress.get_or_create_player("Ny")
    assert (p.xp, p.level, p.xp_for_next_level) == (0, 1, progress.XP_PER_LEVEL)
    assert p.completed_quests == p.cards == p.achievements == []


def test_unknown_player_has_no_progress():
    assert progress.get_progress("does-not-exist") is None


def test_complete_quest_awards_xp_card_and_first_achievement(quest):
    pid = progress.get_or_create_player("Testa").player_id
    xp, card, achievements, updated = progress.complete_quest(pid, quest.id, 150, quest.card_id)
    assert xp == 150
    assert card is not None and card.id == quest.card_id
    assert [a.id for a in achievements] == ["first-quest"]
    assert (updated.xp, updated.level) == (150, 2)
    assert progress.get_progress(pid) == updated


def test_quest_is_only_awarded_once(quest):
    pid = progress.get_or_create_player("Testa").player_id
    progress.complete_quest(pid, quest.id, quest.xp, quest.card_id)
    xp, card, achievements, updated = progress.complete_quest(
        pid, quest.id, quest.xp, quest.card_id
    )
    assert (xp, card, achievements) == (0, None, [])
    assert updated.xp == quest.xp
    assert updated.completed_quests == [quest.id]


def test_complete_quest_for_unknown_player_raises(quest):
    with pytest.raises(KeyError):
        progress.complete_quest("does-not-exist", quest.id, quest.xp, quest.card_id)
