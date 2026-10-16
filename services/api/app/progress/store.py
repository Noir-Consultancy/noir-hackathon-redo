"""Player storage: Postgres via SQLAlchemy, plus an in-memory store for tests."""

from collections.abc import Callable
from dataclasses import dataclass, field
from typing import Protocol

from sqlalchemy import String, create_engine, select
from sqlalchemy.dialects.postgresql import ARRAY
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import DeclarativeBase, Mapped, Session, mapped_column


@dataclass
class PlayerRecord:
    id: str
    name: str
    xp: int = 0
    completed_quests: list[str] = field(default_factory=list)
    card_ids: list[str] = field(default_factory=list)
    achievement_ids: list[str] = field(default_factory=list)


class PlayerStore(Protocol):
    def init(self) -> None:
        """Prepare storage (e.g. create tables). Called once at app startup."""

    def get(self, player_id: str) -> PlayerRecord | None: ...
    def get_by_name(self, name: str) -> PlayerRecord | None: ...

    def create(self, player: PlayerRecord) -> PlayerRecord:
        """Insert the player, or return the existing one if the name is taken."""

    def update(self, player_id: str, change: Callable[[PlayerRecord], None]) -> PlayerRecord | None:
        """Apply `change` to the player atomically and save. None if the player is unknown."""


class InMemoryPlayerStore:
    def __init__(self) -> None:
        self._players: dict[str, PlayerRecord] = {}

    def init(self) -> None:
        pass

    def get(self, player_id: str) -> PlayerRecord | None:
        return self._players.get(player_id)

    def get_by_name(self, name: str) -> PlayerRecord | None:
        return next((p for p in self._players.values() if p.name == name), None)

    def create(self, player: PlayerRecord) -> PlayerRecord:
        existing = self.get_by_name(player.name)
        if existing:
            return existing
        self._players[player.id] = player
        return player

    def update(self, player_id: str, change: Callable[[PlayerRecord], None]) -> PlayerRecord | None:
        player = self._players.get(player_id)
        if player:
            change(player)
        return player


class _Base(DeclarativeBase):
    pass


class _PlayerRow(_Base):
    __tablename__ = "players"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    name: Mapped[str] = mapped_column(String, unique=True)
    xp: Mapped[int] = mapped_column(default=0)
    completed_quests: Mapped[list[str]] = mapped_column(ARRAY(String), default=list)
    card_ids: Mapped[list[str]] = mapped_column(ARRAY(String), default=list)
    achievement_ids: Mapped[list[str]] = mapped_column(ARRAY(String), default=list)


def _to_record(row: _PlayerRow) -> PlayerRecord:
    return PlayerRecord(
        id=row.id,
        name=row.name,
        xp=row.xp,
        completed_quests=list(row.completed_quests),
        card_ids=list(row.card_ids),
        achievement_ids=list(row.achievement_ids),
    )


class SqlPlayerStore:
    """Postgres store. Call init() once at startup to create the players table."""

    def __init__(self, database_url: str) -> None:
        url = database_url.replace("postgresql://", "postgresql+psycopg://", 1)
        self._engine = create_engine(url, pool_pre_ping=True)

    def init(self) -> None:
        _Base.metadata.create_all(self._engine)

    def _session(self) -> Session:
        return Session(self._engine, expire_on_commit=False)

    def get(self, player_id: str) -> PlayerRecord | None:
        with self._session() as s:
            row = s.get(_PlayerRow, player_id)
            return _to_record(row) if row else None

    def get_by_name(self, name: str) -> PlayerRecord | None:
        with self._session() as s:
            row = s.scalars(select(_PlayerRow).where(_PlayerRow.name == name)).first()
            return _to_record(row) if row else None

    def create(self, player: PlayerRecord) -> PlayerRecord:
        try:
            with self._session() as s, s.begin():
                s.add(_PlayerRow(id=player.id, name=player.name, xp=player.xp))
        except IntegrityError:
            # Another request created the same name first: use that player.
            existing = self.get_by_name(player.name)
            if existing is None:
                raise
            return existing
        return player

    def update(self, player_id: str, change: Callable[[PlayerRecord], None]) -> PlayerRecord | None:
        with self._session() as s, s.begin():
            # Row lock so concurrent updates of the same player are serialized.
            row = s.get(_PlayerRow, player_id, with_for_update=True)
            if row is None:
                return None
            player = _to_record(row)
            change(player)
            row.xp = player.xp
            row.completed_quests = list(player.completed_quests)
            row.card_ids = list(player.card_ids)
            row.achievement_ids = list(player.achievement_ids)
            return player
