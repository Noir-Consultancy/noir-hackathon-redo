# Plan och arbetsfördelning

Spec: [spec.md](spec.md) · Kontrakt: [contract/](contract/)

## Team
| Namn | GitHub | Paket | Gren |
|---|---|---|---|
| Oskar | @skrlssn | 1. Spelvärld | `oskar/<ämne>`, t.ex. `oskar/tilemap` |
| Emma | @emra | 2. UI och HUD | `emma/<ämne>`, t.ex. `emma/quest-dialog` |
| Robert | @robertocus | 3. Mentoragenter | `robert/<ämne>`, t.ex. `robert/mentor-agent` |
| Daniel | @DMillevik | 4. Quests och progression | `daniel/<ämne>`, t.ex. `daniel/postgres-progress` |

## Arbetspaket
| Paket | Äger (sökvägar) | Levererar | Använder |
|---|---|---|---|
| 1. Spelvärld | `services/web/src/game/` | Phaser-scen, `npc:interact` | `getWorld()`, `player:ready`, `ui:modal-*` |
| 2. UI och HUD | `services/web/src/ui/`, `services/web/src/api/` | Namn, HUD, dialog, quests, codex, API-klient; `player:ready`, `ui:modal-*` | `npc:interact`, alla endpoints |
| 3. Mentoragenter | `services/api/app/npc/`, `services/api/app/world/`, `data/world/zones.yaml`, `data/world/mentors.yaml` | `GET /world`, `POST /npcs/{id}/chat`, `get_world()`/`get_quest()`… | `get_progress()`, LLM |
| 4. Quests och progression | `services/api/app/quests/`, `services/api/app/progress/`, `data/world/quests.yaml`, `cards.yaml`, `achievements.yaml` | `POST /players`, `GET /players/{id}`, `POST /quests/{id}/attempt`, `get_progress()` | `get_quest()`, `get_card()`, LLM, Postgres |

## Uppgifter

### 1. Spelvärld (Oskar)
0. Skelett (klart): zoner som färgade rektanglar, mentorer från `/world`, piltangenter,
   kamera, `E` nära mentor skickar `npc:interact`, pausar vid `ui:modal-open`.
1. [MVP] (#1) Tilekarta med väggar/hinder och kollision (Phaser tilemap; färgade tiles eller ett gratis tileset, t.ex. Kenney).
2. [MVP] (#2) Sprites för spelare och mentorer med enkel gånganimation i fyra riktningar.
3. [MVP] (#3) Visa zonnamn när man går in i en zon, och en "!" över mentorer man inte pratat med.
4. [Utbyggnad] Låsta zoner (kräver nivå), minikarta, ljud.

### 2. UI och HUD (Emma) – ansvarar för att huvudflödet fungerar hela vägen
0. Skelett (klart): namninmatning, HUD-rad, dialogpanel med chatt mot `/npcs/{id}/chat`, `Esc` stänger.
1. [MVP] (#4) Quest i dialogen: visa erbjuden quest (`offered_quest_id` → `task` från `/world`), svarsformulär, feedback, försök igen.
2. [MVP] (#5) Belöningar: HUD med XP-bar och nivå, notis vid nytt kort, achievement och level up.
3. [MVP] (#6) Codex-vy (`C`): alla kort från `/world`, upplåsta med innehåll, övriga som "???", plus achievements.
4. [MVP] (#7) "Ada tänker…"-indikator och felmeddelanden när LLM:en är långsam eller nere.
5. [Utbyggnad] Markdown i dialogen, animationer vid level up.

### 3. Mentoragenter (Robert)
0. Skelett (klart): `/world` från YAML, chattstubb med hälsning och `offered_quest_id`, `get_chat_model()` i `app/llm.py`.
1. [MVP] (#8) LangGraph-agent med persona och minne under sessionen (checkpointer, tråd per spelare och mentor) som ersätter stubben.
2. [MVP] (#9) Verktyg: `get_player_progress`, `offer_quest` (sätter `offered_quest_id`), `lookup_card`.
3. [MVP] (#10) Finslipa personas och prompter mot den lokala modellen (korta svar, håller sig till ämnet, anpassat för seniora utvecklare).
4. [Utbyggnad] Fjärde mentorn Smeden Mo (Verktygssmedjan; quest och kort med Daniel), Postgres-checkpointer för minne mellan sessioner, mentorer som hänvisar till varandra.

### 4. Quests och progression (Daniel)
0. Skelett (klart): spelare i minnet, stubbedömning (≥ 5 ord = godkänt), XP och nivå, kort, `first-quest`.
1. [MVP] (#11) Spelare och framsteg i Postgres (`DATABASE_URL`, tabeller skapas vid start).
2. [MVP] (#12) LLM-bedömning med strukturerad output (`passed`, `feedback`) mot questens `criteria`.
3. [MVP] (#13) Achievement-regler från `achievements.yaml` (`quests_completed`, `zone_completed`, `level_reached`).
4. [Utbyggnad] Fler quests per mentor, zoner som låses upp med nivå (med Oskar), quests i flera steg.

## Delade filer
`compose.yaml`, `.env.example`, `AGENTS.md`, `docs/`, `services/api/app/main.py`,
`services/api/app/models.py`, `services/api/app/llm.py`, `services/web/src/main.ts`,
`services/web/src/events.ts`: ändras i små separata commits, mergas snabbt, säg till i
teamet. Kontraktsändringar (`docs/contract/`, `models.py`, `events.ts`, `api/types.ts`)
kräver ok från de berörda paketägarna.

## Integration
- Före avstämning 2: Roberts mentoragent (task 1) och Daniels LLM-bedömning (task 2) på
  `main`; Emmas quest-dialog (task 1) fungerar mot dem.
- Mot slutet: hela huvudflödet från `main` med riktig LLM: gå till Ada, prata, klara
  questen, se XP, kort och badge i HUD och codex.

## Kända problem
- LLM-anropen är inte verifierade vid kickoff (Ollama körde inte). Alla behöver en
  lokal modell med tool calling eller en molnnyckel, se `.env.example`. – Robert, Daniel
- `LLM_BASE_URL_CONTAINER` är satt för Docker. Podman-användare byter till
  `http://host.containers.internal:11434/v1` i sin `.env`.
- Vite varnar för stor chunk (Phaser). Ofarligt.
