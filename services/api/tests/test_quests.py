from fastapi.testclient import TestClient

from app import progress, quests
from app.main import app
from app.world import get_quest

client = TestClient(app)


def _attempt(answer: str = "Jag kollar tester och scope."):
    pid = progress.get_or_create_player("Testa").player_id
    return pid, client.post("/quests/q-ada-1/attempt", json={"player_id": pid, "answer": answer})


def test_prompt_contains_task_criteria_and_answer(judge_model):
    quest = get_quest("q-ada-1")
    quests.judge(quest, "Mitt svar")
    system, human = judge_model.calls[0]
    assert quest.task.strip() in system.content
    assert quest.criteria.strip() in system.content
    assert human.content == "Mitt svar"


def test_passed_judgement_awards_quest(judge_model):
    judge_model.result = quests.Judgement(passed=True, feedback="Snyggt!")
    _, res = _attempt()
    body = res.json()
    assert res.status_code == 200
    assert (body["passed"], body["feedback"]) == (True, "Snyggt!")
    assert body["xp_awarded"] > 0


def test_failed_judgement_gives_feedback_and_no_xp(judge_model):
    judge_model.result = quests.Judgement(passed=False, feedback="Tänk på tester.")
    pid, res = _attempt()
    body = res.json()
    assert (body["passed"], body["feedback"], body["xp_awarded"]) == (False, "Tänk på tester.", 0)
    assert progress.get_progress(pid).completed_quests == []


def test_llm_error_returns_503_and_no_progress(judge_model):
    judge_model.result = ConnectionError("ollama down")
    pid, res = _attempt()
    assert res.status_code == 503
    assert progress.get_progress(pid).xp == 0


def test_invalid_llm_output_returns_503(judge_model):
    judge_model.result = None
    _, res = _attempt()
    assert res.status_code == 503


def _boss_attempt(selected: list[int]):
    pid = progress.get_or_create_player("Bosstest").player_id
    body = {"player_id": pid, "selected_statements": selected}
    return pid, client.post("/quests/q-oracle-1/attempt", json=body)


def test_boss_wrong_selection_fails_with_same_hint(judge_model):
    feedback = set()
    for selected in ([1], [3], [1, 3, 0], [0], []):
        pid, res = _boss_attempt(selected)
        body = res.json()
        assert (res.status_code, body["passed"], body["xp_awarded"]) == (200, False, 0)
        assert progress.get_progress(pid).completed_quests == []
        feedback.add(body["feedback"])
    assert feedback == {quests.BOSS_FAILED}
    assert judge_model.calls == []


def test_boss_right_selection_passes_and_explains_each_statement(judge_model):
    pid, res = _boss_attempt([3, 1])
    body = res.json()
    assert body["passed"] is True and body["xp_awarded"] == 150
    quest = get_quest("q-oracle-1")
    assert all(e.strip() in body["feedback"] for e in quest.explanations)
    assert "2. Fel:" in body["feedback"] and "1. Stämmer:" in body["feedback"]
    assert "q-oracle-1" in progress.get_progress(pid).completed_quests
    assert judge_model.calls == []


def test_answer_still_required_for_other_quests(judge_model):
    _, res = _attempt("   ")
    assert res.status_code == 422
    assert judge_model.calls == []


def test_negative_statement_index_is_rejected():
    _, res = _boss_attempt([-1])
    assert res.status_code == 422


def test_boss_quest_is_public_without_answers():
    quest = next(q for q in client.get("/world").json()["quests"] if q["id"] == "q-oracle-1")
    assert quest["kind"] == "boss" and len(quest["statements"]) == 5
    assert not {"wrong_statements", "explanations", "criteria"} & quest.keys()


def test_quest_content_is_consistent():
    for q in client.get("/world").json()["quests"]:
        quest = get_quest(q["id"])
        if quest.kind == "boss":
            assert quest.wrong_statements
            assert all(0 <= i < len(quest.statements) for i in quest.wrong_statements)
            assert len(quest.explanations) == len(quest.statements)
        else:
            assert quest.criteria.strip() and not quest.statements
