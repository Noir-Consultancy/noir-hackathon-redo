# oskar-03: Zonnamn och markering över mentorer (#3)

**Mål:** spelaren ser tydligt vilken zon hen går in i, och vilka mentorer som har en quest kvar.

## Approach
- **Zonbanner:** när spelaren går in i en ny zon (och vid start) visas zonens namn och
  ämne stort mitt på skärmen: tonar in 300 ms, syns 1,5 s, tonar ut 500 ms. De fasta
  namnen i zonhörnen tas bort. Zon-lookup från tile-position bryts ut ur `mapgen.ts`.
- **Markörer:** "!" (gul) över mentorer vars quest inte är klarad, "✓" (grön) när den är
  klarad, med en lätt studs. Spelet hämtar `GET /players/{id}` (`getProgress()` i
  `src/api/client.ts`) när spelaren är redo och när en dialog stängs; vid fel behålls
  markörerna. `UiState` sparar `playerId` från `player:ready`.

## Filer
`src/game/WorldScene.ts`, `src/game/uiState.ts`, `src/game/index.ts`,
`src/game/mapgen.ts`, `src/game/markers.ts` + test (allt under `services/web/`).

## Kontrakt
Ingen ändring. Använder befintliga `player:ready`, `ui:modal-close` och `GET /players/{id}`.

## Test
- `npm test`: zon-lookup, markörval.
- `npm run lint && npm run build`.
- Manuellt: gå genom dörrarna (banner), klara en quest och stäng dialogen ("!" → "✓").
