# api

FastAPI-backend för Kunskapsriket. Kontrakt: [`docs/contract/`](../../docs/contract/).

| Modul | Paket | Ansvar |
|---|---|---|
| `app/world/` | 3 | Laddar `data/world/*.yaml`, `GET /world` |
| `app/npc/` | 3 | Mentoragenter (LangGraph), `POST /npcs/{id}/chat` |
| `app/quests/` | 4 | Bedömning av quests, `POST /quests/{id}/attempt` |
| `app/progress/` | 4 | Spelare, XP, kort, achievements, `POST /players`, `GET /players/{id}` |
| `app/models.py`, `app/llm.py`, `app/main.py` | delade | Kontraktsmodeller, LLM-klient, koppling – små separata commits |

Skelettet svarar med stubbar: chatten och bedömningen är inte AI än, och spelare sparas i minnet.

## Kör lokalt
```bash
uv sync
set -a; source ../../.env; set +a      # valfritt: läs in LLM_* m.m.
uv run uvicorn app.main:app --reload --port 8001
```
API-dokumentation: http://localhost:8001/docs

## Tester och quality gates
```bash
uv run pytest
uv run ruff check
uv run ruff format --check
```

## Miljövariabler
| Variabel | Standard | Beskrivning |
|---|---|---|
| `WORLD_DIR` | `<repo>/data/world` | Världsinnehållet (`/data/world` i containern) |
| `DATABASE_URL` | `postgresql://app:app@localhost:5432/app` | Postgres för spelarframsteg |
| `LLM_BASE_URL` | `http://localhost:11434/v1` | OpenAI-kompatibelt API |
| `LLM_MODEL` | `qwen3.6:27b-coding-mxfp8` | Modellnamn |
| `LLM_API_KEY` | `ollama` | API-nyckel (godtycklig för Ollama) |
