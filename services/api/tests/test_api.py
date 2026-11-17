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

    reply = client.post(
        f"/npcs/{mentor['id']}/chat", json={"player_id": pid, "message": "Hej, har du en quest?"}
    )
    assert reply.json()["offered_quest_id"] == mentor["quest_id"]

    answer = "Jag kollar tester, scope och säkerhet noga."
    result = client.post(
        f"/quests/{mentor['quest_id']}/attempt", json={"player_id": pid, "answer": answer}
    ).json()
    assert result["passed"] is True
    assert result["progress"]["xp"] == result["xp_awarded"] > 0


def test_remark_unknown_mentor_or_player():
    player = client.post("/players", json={"name": "Remarka"}).json()
    assert (
        client.post("/npcs/nobody/remark", json={"player_id": player["player_id"]}).status_code
        == 404
    )
    assert client.post("/npcs/ada/remark", json={"player_id": "missing"}).status_code == 404
    reply = client.post("/npcs/ada/remark", json={"player_id": player["player_id"]})
    assert isinstance(reply.json()["remark"], str)
