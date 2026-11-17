from langchain_core.messages import AIMessage

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
    assert reply.reply == 'Då har jag en utmaning åt dig: "Granska agentens kod". Lycka till!'
    assert npc.chat(ada, pid, "Tack").offered_quest_id is None


def test_offer_quest_when_already_done():
    pid = _player("done")
    _complete(pid, "q-ada-1")
    content, artifact = offer_quest.func(_config(pid))
    assert artifact is None and "redan klarat" in content
    reply = npc.chat(get_mentor("ada"), pid, "Har du en quest?")
    assert reply.offered_quest_id is None and "redan klarat" in reply.reply


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


def test_asking_for_quest_offers_it_alongside_model_reply():
    ada = get_mentor("ada")
    pid = _player("asks")
    reply = npc.chat(ada, pid, "Har du någon utmaning åt mig?")
    assert reply.offered_quest_id == "q-ada-1"
    assert reply.reply.startswith("svar 1")
    assert npc.chat(ada, pid, "Tack").reply.startswith("svar 2")


def test_question_mentioning_challenges_is_still_answered():
    reply = npc.chat(get_mentor("ada"), _player("q"), "Vilka är de största utmaningarna?")
    assert reply.reply.startswith("svar 1")
    assert reply.offered_quest_id == "q-ada-1"


def test_quest_keywords_match_inflections():
    ada = get_mentor("ada")
    for i, message in enumerate(["Finns det ett uppdrag?", "Ge mig utmaningen", "QUEST!"]):
        assert npc.chat(ada, _player(f"kw-{i}"), message).offered_quest_id == "q-ada-1"


def test_other_words_do_not_offer_quest():
    ada = get_mentor("ada")
    for i, message in enumerate(["Jag har en uppgift på jobbet", "Vilket drag!"]):
        assert npc.chat(ada, _player(f"no-kw-{i}"), message).offered_quest_id is None


def test_asking_again_does_not_offer_quest_twice():
    ada = get_mentor("ada")
    pid = _player("twice")
    assert npc.chat(ada, pid, "Har du en utmaning?").offered_quest_id == "q-ada-1"
    assert npc.chat(ada, pid, "En utmaning till?").offered_quest_id is None


def test_asking_after_quest_is_done_does_not_offer_it():
    pid = _player("asks-done")
    _complete(pid, "q-ada-1")
    assert npc.chat(get_mentor("ada"), pid, "Har du en utmaning?").offered_quest_id is None


def test_offer_quest_tool_refuses_second_offer_in_thread():
    pid = _player("offered")
    config = {"configurable": {"player_id": pid, "mentor_id": "ada", "quest_offered": True}}
    content, artifact = offer_quest.func(config)
    assert artifact is None and "redan framme" in content


def test_model_offering_again_does_not_set_offered_quest_id():
    ada = get_mentor("ada")
    pid = _player("model-twice")
    assert npc.chat(ada, pid, "Har du en quest?").offered_quest_id == "q-ada-1"
    reply = npc.chat(ada, pid, "Har du en quest till?")
    assert reply.offered_quest_id is None and "redan framme" in reply.reply


def test_remark_without_cards_skips_the_card_angle(fake_llm, monkeypatch):
    monkeypatch.setattr(npc.random, "choice", lambda options: options[-1])
    reply = npc.remark(get_mentor("vera"), _player("remark-none")).remark
    assert reply.startswith("svar 1|Du är bibliotekarien")
    prompt = fake_llm.seen[0][0].text
    assert "inte lärt sig något" in prompt
    assert npc.REMARK_ANGLES["card"][0][:20] not in prompt


def test_remark_is_new_on_every_call(fake_llm):
    vera = get_mentor("vera")
    pid = _player("remark-again")
    _complete(pid, "q-karl-1")
    assert npc.remark(vera, pid).remark is not None
    assert npc.remark(vera, pid).remark is not None
    assert len(fake_llm.seen) == 2


def test_remark_skips_quest_teaser_when_quest_is_done(fake_llm, monkeypatch):
    seen: list[list[str]] = []
    monkeypatch.setattr(npc.random, "choice", lambda options: seen.append(options) or options[0])
    pid = _player("remark-done")
    _complete(pid, "q-vera-1")
    npc.remark(get_mentor("vera"), pid)
    assert "quest" not in seen[0] and "card" in seen[0]


def test_remark_llm_failure_is_none(fake_llm, monkeypatch):
    class Broken:
        def invoke(self, messages):
            raise TimeoutError("slow")

    monkeypatch.setattr(npc, "get_chat_model", lambda: Broken())
    assert npc.remark(get_mentor("vera"), _player("remark-fail")).remark is None


def test_remark_names_the_teacher(fake_llm, monkeypatch):
    monkeypatch.setattr(npc.random, "choice", lambda options: options[-1])
    pid = _player("remark-prompt")
    _complete(pid, "q-karl-1")
    npc.remark(get_mentor("vera"), pid)
    npc.remark(get_mentor("karl"), pid)
    vera_prompt, karl_prompt = (m[0].text for m in fake_llm.seen)
    assert "från Kontext-Karl" in vera_prompt and "från dig" in karl_prompt


def test_empty_remark_is_none(fake_llm, monkeypatch):
    class Thinking:
        def invoke(self, messages):
            return AIMessage(content="<think>hmm</think>  ")

    monkeypatch.setattr(npc, "get_chat_model", lambda: Thinking())
    assert npc.remark(get_mentor("vera"), _player("remark-empty")).remark is None


def test_boss_prompt_has_lecture_but_not_the_answers():
    prompt = npc.system_prompt(get_mentor("orakelbotten"))
    quest = get_quest("q-oracle-1")
    assert all(s.strip() in prompt for s in quest.statements)
    assert not any(e.strip() in prompt for e in quest.explanations)
    assert "Din föreläsning" not in npc.system_prompt(get_mentor("ada"))
