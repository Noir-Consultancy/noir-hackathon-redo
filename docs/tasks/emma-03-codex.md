# emma-03: Codex-vy (#6)

## Mål
Spelaren ser sin samling av kunskapskort, badges och klarade quests på ett ställe, och
ser vad som återstår att upptäcka.

## Upplägg (rutnät med kort)
- `C` öppnar och stänger codexen, `Esc` stänger. Inte när en annan modal är öppen, när
  man skriver i ett textfält eller innan spelaren är redo. Skickar `ui:modal-open`/`-close`.
- **Kort:** rutnät med alla kort från `World.cards`, ett per mentor i mentorns färg.
  - Upplåst (finns i `Progress.cards`): mentorns namn och kortets titel. Klick visar
    hela kortet under rutnätet: sammanfattning, när det passar, fallgropar.
  - Ej upplåst: "???".
  - Räknare i rubriken: "1/3 kort".
- **Badges:** alla achievements från `World.achievements`; upplåsta med 🏅 och titel,
  övriga utgråade med beskrivningen som ledtråd.
- **Quests:** klarade quests (`Progress.completed_quests`) med ✓ och titel.
- Använder senaste `Progress` som UI:t redan har (uppdateras via HUD:en).

## Filer
- `services/web/src/ui/codex.ts` – vyn och en ren funktion `codexCards(world, progress)`.
- `services/web/src/ui/codex.test.ts` – test för `codexCards`.
- `services/web/src/ui/index.ts` – tangenten `C` och modal-hantering.
- `services/web/src/ui/controls.ts` – kontrollrad som fälls ihop till "? Kontroller" efter 30 s.
- `services/web/src/ui/ui.css` – stilar.

## Kontrakt
Använder `GET /world` och `Progress`. Inga ändringar.

## Test
- Manuellt: ny spelare → `C` visar 0/3 och bara "???". Klara Adas quest → 1/3, Adas kort
  går att klicka upp, "Första questen!" och questen syns.
- Kvalitetsgrindar: `npm test && npm run lint && npm run build`.
