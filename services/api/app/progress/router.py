from fastapi import APIRouter, HTTPException

from app.models import CreatePlayer, Progress
from app.progress import get_or_create_player, get_progress

router = APIRouter(tags=["players"])


@router.post("/players")
def create_player(body: CreatePlayer) -> Progress:
    return get_or_create_player(body.name.strip())


@router.get("/players/{player_id}")
def player(player_id: str) -> Progress:
    progress = get_progress(player_id)
    if progress is None:
        raise HTTPException(404, f"Unknown player: {player_id}")
    return progress
