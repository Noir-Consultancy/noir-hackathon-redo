"""App wiring. Keep thin: each package registers its own router."""

from fastapi import FastAPI

from app.npc.router import router as npc_router
from app.progress.router import router as progress_router
from app.quests.router import router as quests_router
from app.world.router import router as world_router

app = FastAPI(title="Kunskapsriket API", version="0.1.0")


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


app.include_router(world_router)
app.include_router(npc_router)
app.include_router(progress_router)
app.include_router(quests_router)
