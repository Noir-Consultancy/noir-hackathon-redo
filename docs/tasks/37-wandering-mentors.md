# 37: Mentorer vandrar runt och kommenterar spontant (#37)

## Mål
Världen känns levande: mentorerna går runt i sin zon, och när spelaren kommer nära säger
de något kort och nytt som bygger på det spelaren redan lärt sig.

## Flöde
1. Varje mentor går långsamt till en slumpad fri ruta i sin zon, väntar några sekunder
   och väljer en ny.
2. Är spelaren nära, eller är en dialog öppen, stannar mentorn och vänder sig mot
   spelaren.
3. När spelaren kommer nära en mentor (högst var 30:e sekund per mentor) frågar spelet api:t efter
   en kommentar. Medan den laddas visar mentorn en bubbla med "…". Sedan byts den mot
   kommentaren (eller försvinner om det inte finns någon). Den står kvar så länge
   spelaren är nära och försvinner 3 s efter att hen gått. Har spelaren redan gått visas
   den en kort lästid.
4. `E` öppnar dialogen som vanligt, och kommentaren släpps.

## Angreppssätt
- **api** (`app/npc`): ny funktion `remark(mentor, player_id)`. Ett enkelt LLM-anrop (inte
  agenten) med mentorns persona och en slumpad vinkel med eget exempel: fråga, tips,
  teaser för mentorns quest eller koppling till kortet. Spelarens kort och vem som lärt
  ut dem är bakgrund. En mening, högst 15 ord, på svenska, i roll.
- **Frekvens:** en ny kommentar vid varje närmande, högst var 30:e sekund per mentor
  (styrs i spelet). Ingen cache eller bokföring på servern. Misslyckas LLM-anropet
  loggas det och svaret blir `null`.
- Kommentaren sparas inte i chattens minne i första versionen.
- **web** (`WorldScene.ts`): mentorerna får dynamiska, orörliga kroppar så att de kan
  röra sig men inte knuffas. Namn och questmarkör följer med. Rutvalet görs i en ren
  hjälpfunktion i `game/wander.ts`: bara öppna rutor (alla grannar fria) inom zonens
  `bounds`, så en mentor som stannar aldrig blockerar en passage eller dörr.
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
- api, med falsk modell: varje anrop ger en ny kommentar; utan kort hoppas kortvinkeln
  över; misslyckat eller tomt LLM-svar ger `null`; okänd mentor/spelare ger 404.
- web: `wander.ts` väljer bara fria rutor inom zonen och aldrig en dörr.
- Manuellt: mentorerna går runt, stannar när man närmar sig, "…" visas medan det laddar,
  en ny kommentar visas vid varje närmande efter 30 s (även om man gått därifrån), `E`
  fungerar även när mentorn rört sig.
