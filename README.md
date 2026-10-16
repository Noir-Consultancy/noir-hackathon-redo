# Kunskapsriket

Ett utforskande 2D-RPG där seniora systemutvecklare lär sig AI-koncept och moderna
arbetssätt genom att prata med AI-mentorer, klara quests och samla kunskapskort. Byggt av
Emma, Daniel, Robert och Oskar på NOIRs höstkonferens 2026.

## Kör
```bash
cp .env.example .env
docker compose up -d --build   # starta (eller: podman compose …)
docker compose down            # stoppa
```

Spelet: http://localhost:8000 · API-dokumentation: http://localhost:8001/docs

Mentorerna behöver en LLM: Ollama på datorn med en modell som klarar tool calling, eller
en molnnyckel. Se `.env.example`.

## Utveckla
Tester och quality gates, ett block per tjänst:
```bash
cd services/api
uv run pytest                 # tester
uv run ruff check             # linting
uv run ruff format --check    # formatering
```
```bash
cd services/web
npm test                      # tester (vitest)
npm run lint                  # linting och formatering (biome)
npm run build                 # typkontroll och bygge
```

## Dokumentation
- [Spec](docs/spec.md) · [Plan](docs/plan.md) · [Kontrakt](docs/contract/)
- [Konferensmaterial](konferens/)
