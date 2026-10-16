from fastapi import APIRouter

from app.models import World
from app.world import get_world

router = APIRouter(tags=["world"])


@router.get("/world")
def world() -> World:
    return get_world()
