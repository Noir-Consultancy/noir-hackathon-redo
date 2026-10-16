from app import npc
from app.world import get_mentor


def test_empty_message_gives_greeting_without_llm(fake_llm):
    ada = get_mentor("ada")
    reply = npc.chat(ada, "p-greet", "  ")
    assert reply.reply == ada.greeting
    assert fake_llm.seen == []


def test_reply_uses_persona_and_strips_thinking():
    ada = get_mentor("ada")
    reply = npc.chat(ada, "p-persona", "Hej")
    assert reply.reply == f"svar 1|{npc.system_prompt(ada)[:20]}"
    assert "kodagenter" in npc.system_prompt(ada)
    assert reply.offered_quest_id == ada.quest_id


def test_memory_per_player_and_mentor():
    ada, karl = get_mentor("ada"), get_mentor("karl")
    npc.chat(ada, "p-mem-1", "Hej")
    assert npc.chat(ada, "p-mem-1", "Igen").reply.startswith("svar 2")
    assert npc.chat(ada, "p-mem-2", "Hej").reply.startswith("svar 1")
    assert npc.chat(karl, "p-mem-1", "Hej").reply.startswith("svar 1")
