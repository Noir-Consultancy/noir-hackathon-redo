from app import npc
from app.npc.tools import get_player_progress, lookup_card, offer_quest
from app.progress import complete_quest, get_or_create_player
from app.world import get_mentor, get_quest


def _player(name: str) -> str:
    return get_or_create_player(name).player_id


def _config(player_id: str, mentor_id: str = "ada") -> dict:
    return {"configurable": {"player_id": player_id, "mentor_id": mentor_id}}


def _complete(player_id: str, quest_id: str) -> None:
    q = get_quest(quest_id)
    complete_quest(player_id, q.id, q.xp, q.card_id)


def test_empty_message_gives_greeting_without_llm(fake_llm):
    ada = get_mentor("ada")
    reply = npc.chat(ada, _player("greet"), "  ")
    assert reply.reply == ada.greeting
    assert fake_llm.seen == []


def test_reply_uses_persona_and_strips_thinking():
    ada = get_mentor("ada")
    reply = npc.chat(ada, _player("persona"), "Hej")
    assert reply.reply == f"svar 1|{npc.system_prompt(ada)[:20]}"
    assert "kodagenter" in npc.system_prompt(ada)
    assert reply.offered_quest_id is None


def test_memory_per_player_and_mentor():
    ada, karl = get_mentor("ada"), get_mentor("karl")
    p1, p2 = _player("mem-1"), _player("mem-2")
    npc.chat(ada, p1, "Hej")
    assert npc.chat(ada, p1, "Igen").reply.startswith("svar 2")
    assert npc.chat(ada, p2, "Hej").reply.startswith("svar 1")
    assert npc.chat(karl, p1, "Hej").reply.startswith("svar 1")


def test_offer_quest_tool_sets_offered_quest_id_only_that_turn():
    ada = get_mentor("ada")
    pid = _player("offer")
    reply = npc.chat(ada, pid, "Har du en quest?")
    assert reply.offered_quest_id == "q-ada-1"
    assert get_quest("q-ada-1").task in reply.reply
    assert npc.chat(ada, pid, "Tack").offered_quest_id is None


def test_offer_quest_when_already_done():
    pid = _player("done")
    _complete(pid, "q-ada-1")
    content, artifact = offer_quest.func(_config(pid))
    assert artifact is None and "redan klarat" in content
    assert npc.chat(get_mentor("ada"), pid, "Har du en quest?").offered_quest_id is None


def test_fallback_offers_quest_once_after_three_messages():
    ada = get_mentor("ada")
    pid = _player("fallback")
    offered = [npc.chat(ada, pid, f"Fråga {i}").offered_quest_id for i in range(5)]
    assert offered == [None, None, "q-ada-1", None, None]


def test_get_player_progress():
    pid = _player("Prog")
    assert "nivå 1" in get_player_progress.func(_config(pid))
    _complete(pid, "q-ada-1")
    text = get_player_progress.func(_config(pid))
    assert "Granska agentens kod" in text and "Granska AI-genererad kod" in text


def test_lookup_card_only_unlocked():
    pid = _player("cards")
    assert lookup_card.func("granska kod", _config(pid)) == "Inget kort."
    _complete(pid, "q-ada-1")
    assert lookup_card.func("granska kod", _config(pid)).startswith("Granska AI-genererad kod:")
    assert lookup_card.func("fotboll", _config(pid)) == "Inget kort."
