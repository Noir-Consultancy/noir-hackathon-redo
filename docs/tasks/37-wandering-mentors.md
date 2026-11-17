# 37: Mentorer vandrar runt och kommenterar spontant (#37)

## Mål
Världen känns levande: mentorerna går runt i sin zon, och när spelaren kommer nära säger
de något kort och nytt som bygger på det spelaren redan lärt sig.

## Flöde
1. Varje mentor går långsamt till en slumpad fri ruta i sin zon, väntar några sekunder
   och väljer en ny.
2. Är spelaren nära, eller är en dialog öppen, stannar mentorn och vänder sig mot
   spelaren.
3. Första gången spelaren kommer nära en mentor (per närmande) frågar spelet api:t efter
   en kommentar. Medan den laddas visar mentorn en bubbla med "…". Sedan byts den mot
   kommentaren (eller försvinner om det inte finns någon) och visas i några sekunder,
   även om spelaren hunnit gå därifrån.
4. `E` öppnar dialogen som vanligt.

## Angreppssätt
- **api** (`app/npc`): ny funktion `remark(mentor, player_id)`. Ett enkelt LLM-anrop (inte
  agenten) med mentorns persona, ämnen, spelarens kort (titel och sammanfattning) och
  2–3 exempel på bra kommentarer i prompten. Högst 2 meningar, på svenska, i roll.
- **Frekvens:** en kommentar per mentor och nytt kort. Servern minns vilka kort varje
  mentor redan kommenterat för spelaren (i minnet, som `_offered`). Inga nya kort ger
  `null` utan LLM-anrop. Misslyckas LLM-anropet loggas det och svaret blir `null`.
- Kommentaren sparas inte i chattens minne i första versionen.
- **web** (`WorldScene.ts`): mentorerna får dynamiska, orörliga kroppar så att de kan
  röra sig men inte knuffas. Namn och questmarkör följer med. Rutvalet görs i en ren
  hjälpfunktion i `game/wander.ts` (fri ruta inom zonens `bounds`, inte i en dörr).
- Pratbubblan ritas i spelet (Phaser-text med bakgrund), inte i UI:t. Spelet anropar
  api:t direkt via `client.ts`, som det redan gör med `getProgress`.

## Filer
- `services/api/app/npc/__init__.py`, `services/api/app/npc/router.py`, `services/api/app/models.py`
- `services/api/tests/test_npc.py`
- `services/web/src/game/WorldScene.ts`, `services/web/src/game/wander.ts` (+ test)
- `services/web/src/api/client.ts`, `services/web/src/api/types.ts`

## Kontrakt
Ny endpoint, bakåtkompatibel (egen commit, berättas för teamet):
- `POST /npcs/{npc_id}/remark` med `{ "player_id": "<uuid>" }` → `{ "remark": string | null }`
- `openapi.yaml`, `models.md`, `models.py`, `types.ts`. Inga nya händelser på bussen.

## Test
- api, med falsk modell: inga kort ger `null` utan LLM-anrop; nytt kort ger en kommentar;
  samma kort igen ger `null`; okänd mentor/spelare ger 404.
- web: `wander.ts` väljer bara fria rutor inom zonen och aldrig en dörr.
- Manuellt: mentorerna går runt, stannar när man närmar sig, "…" visas medan det laddar,
  kommentaren visas en gång per nytt kort (även om man gått därifrån), `E` fungerar även när mentorn rört sig.
