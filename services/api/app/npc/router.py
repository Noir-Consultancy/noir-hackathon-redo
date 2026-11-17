from fastapi import APIRouter, HTTPException

from app import npc
from app.models import ChatReply, ChatRequest, Remark, RemarkRequest
from app.progress import get_progress
from app.world import MentorDef, get_mentor

router = APIRouter(tags=["npc"])


def _mentor_for(npc_id: str, player_id: str) -> MentorDef:
    mentor = get_mentor(npc_id)
    if mentor is None:
        raise HTTPException(404, f"Unknown mentor: {npc_id}")
    if get_progress(player_id) is None:
        raise HTTPException(404, f"Unknown player: {player_id}")
    return mentor


@router.post("/npcs/{npc_id}/chat")
def chat(npc_id: str, body: ChatRequest) -> ChatReply:
    return npc.chat(_mentor_for(npc_id, body.player_id), body.player_id, body.message)


@router.post("/npcs/{npc_id}/remark")
def remark(npc_id: str, body: RemarkRequest) -> Remark:
    return npc.remark(_mentor_for(npc_id, body.player_id), body.player_id)
