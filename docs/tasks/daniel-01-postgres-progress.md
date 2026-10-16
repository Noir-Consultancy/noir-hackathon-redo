# daniel-01: Spelare och framsteg i Postgres (#11)

## Mål
Spelare och framsteg överlever omstart av api:t. Samma namn loggar in på samma spelare.
API och publika funktioner (`get_or_create_player`, `get_progress`, `complete_quest`)
oförändrade.

## Angreppssätt
- SQLAlchemy 2.0 (ORM) ovanpå psycopg, `DATABASE_URL` från `app/config.py`
  (`postgresql://` skrivs om till `postgresql+psycopg://`).
- En tabell `players`: `id` (uuid-text, PK), `name` (unik), `xp`, samt `ARRAY(text)`-kolumner
  `completed_quests`, `card_ids`, `achievement_ids`.
- Liten lagringsgräns i `app/progress/store.py`: `PlayerStore`-protokoll med
  `SqlPlayerStore` (Postgres) och `InMemoryPlayerStore` (tester).
- Tabellen skapas med `create_all` första gången lagret används (lat), så `main.py`
  (delad fil) inte behöver ändras och import inte kräver databas.
- Logiken (XP, nivå, kort, achievements) stannar i `app/progress/__init__.py`.

## Filer
- `services/api/app/progress/store.py` (ny), `app/progress/__init__.py`
- `services/api/pyproject.toml`, `uv.lock` (ny beroende: `sqlalchemy`)
- `services/api/tests/conftest.py` (ny): byter till in-memory-lagret i alla tester
- `services/api/tests/test_progress.py` (ny)

## Kontrakt
Inga ändringar. `get_progress()` och endpoints oförändrade.

## Test
- Enhetstester mot `InMemoryPlayerStore` (ingen databas): skapa/återanvänd spelare, XP och
  nivå, quest belönas en gång, okänd spelare.
- Manuellt: `podman compose up -d --build`, skapa spelare och klara quest, starta om
  `api`, kontrollera att `GET /players/{id}` ger samma framsteg.
- Senare (ej nu): integrationstester med Testcontainers.
