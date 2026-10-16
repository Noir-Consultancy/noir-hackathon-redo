# robert-02: Verktyg för mentoragenten (#9)

Bygger på robert-01 (`robert/mentor-agent`), som inte är mergad än.

## Mål
Mentorn kan se spelarens framsteg, erbjuda sin quest när samtalet är moget och hänvisa
till kunskapskort spelaren har låst upp.

## Upplägg
- Tre LangChain-verktyg i `app/npc/tools.py`. Spelare och mentor kommer från agentens
  `config` (`configurable.player_id`, `mentor_id`), inte från LLM:en.
- `get_player_progress()`: nivå, XP, klarade quests (titlar), korttitlar, via `get_progress()`.
- `offer_quest()`: returnerar mentorns quest-`task`. Om questen redan är klarad: säger det
  och erbjuder inget. Verktyget returnerar quest-id som artefakt (`content_and_artifact`);
  `chat()` sätter `offered_quest_id` bara i svaret där verktyget erbjöd questen.
- `lookup_card(topic)`: söker bara bland spelarens upplåsta kort (titel och sammanfattning,
  enkel ordmatchning). Inget träff: "inget kort".
- Reserv: har questen inte erbjudits efter 3 spelarmeddelanden i tråden och den inte är
  klarad, sätts `offered_quest_id` ändå (en gång per tråd).
- Systemprompten får en rad om när verktygen ska användas.

## Filer
- `services/api/app/npc/tools.py` (ny), `services/api/app/npc/__init__.py`.
- `services/api/tests/conftest.py`, `services/api/tests/test_npc.py`.

## Kontrakt
Implementerar verktygen i `docs/contract/interfaces.md` enligt tabellen. Använder
`get_progress()`, `get_quest()`, `get_mentor()`. Inga kontraktsändringar.

## Test
- `uv run pytest`: verktygen anropas direkt (klarad/ej klarad quest, upplåst/låst kort);
  fejkad modell som anropar `offer_quest` sätter `offered_quest_id`; reserven efter 3
  meddelanden.
- Manuellt mot `qwen3:8b`: chatta med Ada tills hon erbjuder questen.
