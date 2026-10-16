"""App wiring. Keep thin: each package registers its own router."""

from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from fastapi import FastAPI

from app import progress
from app.npc.router import router as npc_router
from app.progress.router import router as progress_router
from app.quests.router import router as quests_router
from app.world.router import router as world_router


@asynccontextmanager
async def lifespan(_: FastAPI) -> AsyncIterator[None]:
    progress.init_store()
    yield


app = FastAPI(title="Kunskapsriket API", version="0.1.0", lifespan=lifespan)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


app.include_router(world_router)
app.include_router(npc_router)
app.include_router(progress_router)
app.include_router(quests_router)
