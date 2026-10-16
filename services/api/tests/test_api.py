from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_health():
    assert client.get("/health").json() == {"status": "ok"}


def test_world_has_mentors():
    world = client.get("/world").json()
    assert world["mentors"]
    assert "persona" not in world["mentors"][0]


def test_main_flow_with_stubs():
    player = client.post("/players", json={"name": "Testa"}).json()
    pid = player["player_id"]
    mentor = client.get("/world").json()["mentors"][0]

    reply = client.post(f"/npcs/{mentor['id']}/chat", json={"player_id": pid, "message": "Hej"})
    assert reply.json()["offered_quest_id"] == mentor["quest_id"]

    answer = "Jag kollar tester, scope och säkerhet noga."
    result = client.post(
        f"/quests/{mentor['quest_id']}/attempt", json={"player_id": pid, "answer": answer}
    ).json()
    assert result["passed"] is True
    assert result["progress"]["xp"] == result["xp_awarded"] > 0
