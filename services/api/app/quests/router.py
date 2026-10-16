from fastapi import APIRouter, HTTPException

from app import progress, quests
from app.models import AttemptRequest, AttemptResult
from app.world import get_quest

router = APIRouter(tags=["quests"])


@router.post("/quests/{quest_id}/attempt")
def attempt(quest_id: str, body: AttemptRequest) -> AttemptResult:
    quest = get_quest(quest_id)
    if quest is None:
        raise HTTPException(404, f"Unknown quest: {quest_id}")
    current = progress.get_progress(body.player_id)
    if current is None:
        raise HTTPException(404, f"Unknown player: {body.player_id}")

    judgement = quests.judge(quest, body.answer)
    if not judgement.passed:
        return AttemptResult(
            passed=False,
            feedback=judgement.feedback,
            xp_awarded=0,
            new_card=None,
            new_achievements=[],
            progress=current,
        )
    xp, card, achievements, updated = progress.complete_quest(
        body.player_id, quest.id, quest.xp, quest.card_id
    )
    return AttemptResult(
        passed=True,
        feedback=judgement.feedback,
        xp_awarded=xp,
        new_card=card,
        new_achievements=achievements,
        progress=updated,
    )
