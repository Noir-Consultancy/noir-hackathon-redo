# Interna gränssnitt

Gränssnitt inom en tjänst, mellan paket som delar den.

## web: event bus (paket 1 ↔ paket 2)

`services/web/src/events.ts` exporterar en `bus` (Phasers `EventEmitter`). Händelser och
payloads är typade i samma fil.

| Händelse | Från → till | Payload | När |
|---|---|---|---|
| `player:ready` | UI → spel | `{ playerId: string }` | Spelaren har angett namn, spelet kan ta emot input |
| `npc:interact` | spel → UI | `{ npcId: string }` | Spelaren tryckte `E` nära en mentor |
| `ui:modal-open` | UI → spel | `{}` | Dialog eller codex öppnas, spelet pausar rörelse och tangenter |
| `ui:modal-close` | UI → spel | `{}` | Dialog eller codex stängs, spelet fortsätter |

Världsdata hämtas av spelet med `getWorld()` från `services/web/src/api/client.ts`
(paket 2 äger klienten, paket 1 använder den).

## api: Python-moduler (paket 3 ↔ paket 4)

```python
# app/world (paket 3) – laddar data/world/*.yaml en gång
def get_world() -> World: ...            # publikt innehåll, samma som GET /world
def get_mentor(mentor_id: str) -> MentorDef | None: ...   # inkl. persona, topics
def get_quest(quest_id: str) -> QuestDef | None: ...      # inkl. criteria
def get_card(card_id: str) -> Card | None: ...
def get_achievement_defs() -> list[AchievementDef]: ...   # inkl. rule

# app/progress (paket 4)
def get_progress(player_id: str) -> Progress | None: ...  # samma som GET /players/{id}
```

Mentoragentens verktyg (paket 3) bygger på dessa:

| Verktyg | Beskrivning | Returnerar |
|---|---|---|
| `get_player_progress()` | Vad spelaren klarat och vilka kort hen har | nivå, klarade quests, korttitlar |
| `offer_quest()` | Erbjud mentorns quest när samtalet är moget | questens `task`; sätter `offered_quest_id` i svaret |
| `lookup_card(topic)` | Hämta ett kunskapskort att hänvisa till | kortets titel och sammanfattning, eller "inget kort" |

Spelaren och mentorn är bundna i agentens state, så verktygen tar inga id:n från LLM:en.
