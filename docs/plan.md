# Plan och status

Spec: [spec.md](spec.md) · Kontrakt: [contract/](contract/)

Uppgifter finns som GitHub issues. Vem som helst kan skapa, uppdatera och ta en issue
(tilldela dig själv). Arbetssättet beskrivs i `AGENTS.md`.

## Delar
Under MVP:n ägde var och en en del. Nu kan alla jobba överallt; tabellen visar hur delarna
hänger ihop.

| Del | Sökvägar | Levererar | Använder |
|---|---|---|---|
| 1. Spelvärld | `services/web/src/game/` | Phaser-scen, `npc:interact` | `getWorld()`, `player:ready`, `ui:modal-*` |
| 2. UI och HUD | `services/web/src/ui/`, `services/web/src/api/` | Namn, HUD, dialog, quests, codex, API-klient; `player:ready`, `ui:modal-*` | `npc:interact`, alla endpoints |
| 3. Mentoragenter | `services/api/app/npc/`, `services/api/app/world/`, `data/world/zones.yaml`, `data/world/mentors.yaml` | `GET /world`, `POST /npcs/{id}/chat`, `get_world()`/`get_quest()`… | `get_progress()`, LLM |
| 4. Quests och progression | `services/api/app/quests/`, `services/api/app/progress/`, `data/world/quests.yaml`, `cards.yaml`, `achievements.yaml` | `POST /players`, `GET /players/{id}`, `POST /quests/{id}/attempt`, `get_progress()` | `get_quest()`, `get_card()`, LLM, Postgres |

## MVP-uppgifter
Fördelningen under hackathonet. Alla MVP-uppgifter är klara; utbyggnaderna kan bli issues.

### 1. Spelvärld (Oskar)
0. Skelett (klart): zoner som färgade rektanglar, mentorer från `/world`, piltangenter,
   kamera, `E` nära mentor skickar `npc:interact`, pausar vid `ui:modal-open`.
1. [MVP, klar] (#1) Tilekarta med väggar/hinder och kollision (Phaser tilemap; färgade tiles eller ett gratis tileset, t.ex. Kenney).
2. [MVP, klar] (#2) Sprites för spelare och mentorer med enkel gånganimation i fyra riktningar.
3. [MVP, klar] (#3) Visa zonnamn när man går in i en zon, och en "!" över mentorer man inte pratat med.
4. [Utbyggnad] Låsta zoner (kräver nivå), minikarta, ljud.

### 2. UI och HUD (Emma) – ansvarar för att huvudflödet fungerar hela vägen
0. Skelett (klart): namninmatning, HUD-rad, dialogpanel med chatt mot `/npcs/{id}/chat`, `Esc` stänger.
1. [MVP, klar] (#4) Quest i dialogen: visa erbjuden quest (`offered_quest_id` → `task` från `/world`), svarsformulär, feedback, försök igen.
2. [MVP, klar] (#5) Belöningar: HUD med XP-bar och nivå, notis vid nytt kort, achievement och level up.
3. [MVP, klar] (#6) Codex-vy (`C`): alla kort från `/world`, upplåsta med innehåll, övriga som "???", plus achievements.
4. [MVP, klar] (#7) "Ada tänker…"-indikator och felmeddelanden när LLM:en är långsam eller nere.
5. [Utbyggnad] Markdown i dialogen, animationer vid level up.

### 3. Mentoragenter (Robert)
0. Skelett (klart): `/world` från YAML, chattstubb med hälsning och `offered_quest_id`, `get_chat_model()` i `app/llm.py`.
1. [MVP, klar] (#8) LangGraph-agent med persona och minne under sessionen (checkpointer, tråd per spelare och mentor) som ersätter stubben.
2. [MVP, klar] (#9) Verktyg: `get_player_progress`, `offer_quest` (sätter `offered_quest_id`), `lookup_card`.
3. [MVP, klar] (#10) Finslipa personas och prompter mot den lokala modellen (korta svar, håller sig till ämnet, anpassat för seniora utvecklare).
4. [Utbyggnad] Fjärde mentorn Smeden Mo (Verktygssmedjan; quest och kort med Daniel), Postgres-checkpointer för minne mellan sessioner, mentorer som hänvisar till varandra.

### 4. Quests och progression (Daniel)
0. Skelett (klart): spelare i minnet, stubbedömning (≥ 5 ord = godkänt), XP och nivå, kort, `first-quest`.
1. [MVP, klar] (#11) Spelare och framsteg i Postgres (`DATABASE_URL`, tabeller skapas vid start).
2. [MVP, klar] (#12) LLM-bedömning med strukturerad output (`passed`, `feedback`) mot questens `criteria`.
3. [MVP, klar] (#13) Achievement-regler från `achievements.yaml` (`quests_completed`, `zone_completed`, `level_reached`).
4. [Utbyggnad] Fler quests per mentor, zoner som låses upp med nivå (med Oskar), quests i flera steg.

## Status
MVP:n är klar: hela huvudflödet fungerar från `main` med riktig LLM (gå till en mentor,
prata, klara questen, se XP, kort och badge i HUD och codex). Nästa steg är
utbyggnaderna ovan och i [spec.md](spec.md).

## Kända problem
- `LLM_BASE_URL_CONTAINER` är satt för Docker. Fungerar det inte med Podman, byt till
  `http://host.containers.internal:11434/v1` i din `.env`.
- Med en liten modell (`qwen3.5:9b`) stämmer mentorns text ibland inte med questrutan,
  och modellen anropar sällan `offer_quest` själv. Nyckelord och reserv täcker upp; en
  större modell följer reglerna bättre.
- Ett LLM-anrop som misslyckas lämnar spelarens meddelande i mentorns minne utan svar.
- En mentortur med flera långsamma LLM-anrop kan överskrida nginx `proxy_read_timeout`
  (300 s).
- Mentorernas minne finns bara i api:ts minne och försvinner vid omstart.
- Vite varnar för stor chunk (Phaser). Ofarligt.
