from fastapi import APIRouter, HTTPException

from app import npc
from app.models import ChatReply, ChatRequest
from app.progress import get_progress
from app.world import get_mentor

router = APIRouter(tags=["npc"])


@router.post("/npcs/{npc_id}/chat")
def chat(npc_id: str, body: ChatRequest) -> ChatReply:
    mentor = get_mentor(npc_id)
    if mentor is None:
        raise HTTPException(404, f"Unknown mentor: {npc_id}")
    if get_progress(body.player_id) is None:
        raise HTTPException(404, f"Unknown player: {body.player_id}")
    return npc.chat(mentor, body.player_id, body.message)
