# emma-01: Quest i dialogen (#4)

## Mål
När en mentor erbjuder sin quest ska spelaren kunna läsa uppgiften, svara, få feedback
och försöka igen – direkt i dialogen, utan att tappa chatten.

## Upplägg (alternativ B: fast questruta)
- Dialogen får en questruta under chattloggen, dold tills mentorn erbjuder en quest.
- `ChatReply.offered_quest_id` → slå upp questen i `World.quests` (hämtas en gång med
  `getWorld()` och cachas i UI:t).
- Rutan visar titel, `task` och XP, ett textfält och knappen "Skicka svar".
- `attemptQuest()` → visa `feedback`:
  - Underkänt: feedback + svaret ligger kvar så spelaren kan ändra och försöka igen.
  - Godkänt: "Klarad ✓", feedback och en rad "+50 XP · Nytt kort: …". HUD uppdateras
    med `progress`. Fullständiga belöningsnotiser kommer i #5.
- Redan klarad quest (finns i `completed_quests`): rutan visas direkt när dialogen öppnas,
  markerad "Klarad ✓" utan svarsfält. Samlad lista över klarade quests hör hemma i
  codex-vyn (#6).
- Chatten fungerar som vanligt bredvid rutan.

## Filer
- `services/web/src/ui/index.ts` – questruta, attempt-flöde, spara senaste `Progress`.
- `services/web/src/ui/ui.css` – stil för questrutan.
- Eventuellt `services/web/src/ui/quest.ts` om index.ts blir för stor.

## Kontrakt
Använder `GET /world`, `POST /npcs/{id}/chat` (`offered_quest_id`),
`POST /quests/{id}/attempt`. Inga ändringar.

## Test
- Manuellt: gå till Ada, chatta tills questen erbjuds (stubben erbjuder direkt), svara
  kort (< 5 ord, underkänt) och sedan längre (godkänt). Öppna dialogen igen → "Klarad ✓".
- Kvalitetsgrindar: `npm test && npm run lint && npm run build`.
