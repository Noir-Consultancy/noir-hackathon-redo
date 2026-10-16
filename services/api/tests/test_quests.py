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
