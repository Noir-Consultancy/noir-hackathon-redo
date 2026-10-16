# Datamodeller

Delade modeller mellan web och api. JSON-fält i `snake_case`. Innehåll (zoner, mentorer,
quests, kort, achievements) har läsbara slug-id:n och definieras i `data/world/*.yaml`.
Spelare har UUID. Positioner och storlekar anges i tiles (1 tile = 32 px).

API-schemana finns i [openapi.yaml](openapi.yaml). Här är fälten och reglerna i korthet.

## Innehåll (från `data/world/`)

| Modell | Fält | Exempel |
|---|---|---|
| **Zone** | `id`, `name`, `topic`, `bounds {x, y, w, h}`, `color` (hex) | `{"id": "agentbyn", "name": "Agentbyn", "topic": "Kodagenter", "bounds": {"x": 0, "y": 0, "w": 20, "h": 15}, "color": "#7fb069"}` |
| **Mentor** | `id`, `name`, `title`, `zone_id`, `position {x, y}`, `color`, `quest_id` | `{"id": "ada", "name": "Ada", "title": "Kodagentveteranen", "zone_id": "agentbyn", "position": {"x": 8, "y": 6}, "color": "#e07a5f", "quest_id": "q-ada-1"}` |
| **Quest** | `id`, `mentor_id`, `title`, `task`, `kind` (`explain` \| `solve` \| `choose`), `xp`, `card_id` | `{"id": "q-ada-1", "mentor_id": "ada", "title": "Granska agentens kod", "task": "Förklara tre saker du alltid kollar…", "kind": "explain", "xp": 50, "card_id": "c-review-ai-code"}` |
| **CardSummary** | `id`, `title`, `mentor_id` | `{"id": "c-review-ai-code", "title": "Granska AI-genererad kod", "mentor_id": "ada"}` |
| **Card** | `CardSummary` + `summary`, `when_to_use`, `pitfalls` | se openapi.yaml |
| **Achievement** | `id`, `title`, `description` | `{"id": "first-quest", "title": "Första questen!", "description": "Klara din första quest."}` |

Bara servern ser följande (de finns i YAML men skickas inte ut): mentorns `persona` och
`topics`, questens `criteria` (bedömningskriterier) och achievementens `rule`.

## Spelare

| Modell | Fält |
|---|---|
| **Progress** | `player_id` (UUID), `name`, `xp`, `level`, `xp_for_next_level`, `completed_quests` (quest-id:n), `cards` (upplåsta `Card`), `achievements` (upplåsta `Achievement`) |

- Nivå: `level = 1 + xp // 100`, `xp_for_next_level = level * 100`.
- `POST /players` med ett namn som redan finns returnerar den spelaren (ingen inloggning).
- En quest ger XP bara första gången den klaras.
