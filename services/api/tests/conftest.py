import pytest

from app import progress
from app.progress.store import InMemoryPlayerStore


@pytest.fixture(autouse=True)
def in_memory_store():
    """Tests never touch Postgres: each test gets a fresh in-memory player store."""
    progress.set_store(InMemoryPlayerStore())
    yield
    progress.set_store(None)
