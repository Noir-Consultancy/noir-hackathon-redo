# oskar-02: Sprites och gånganimation (#2)

**Mål:** spelaren blir NOIR-maskoten med gånganimation i fyra riktningar, och mentorerna
får riktiga figurer i samma stil som kartan.

## Approach
- **Spelare:** `public/assets/player/player.png` (48×64, 16×16-rutor; rader ner, vänster,
  höger, upp; kolumner stilla, steg A, steg B). Animation per riktning
  steg A → stilla → steg B → stilla i 8 fps. Står man still visas stillbilden i senaste
  riktningen. Kollisionskroppen är mindre än bilden och sitter vid fötterna, så att man
  går smidigt genom dörrar.
- **Mentorer:** Kenney Tiny Dungeon (CC0) i `public/assets/tiny-dungeon/`. Ada =
  gråhårig veteran, Kontext-Karl = trollkarl, Vera = lärd i kåpa; okända id:n får en
  figur via hash. Andas lätt (±1 px) och vänder sig mot spelaren när hen är nära.
- Logik som går att testa (riktning, bildrutor, val av figur) ligger i `src/game/sprites.ts`.

## Filer
`src/game/sprites.ts`, `src/game/sprites.test.ts`, `src/game/WorldScene.ts`,
`public/assets/player/`, `public/assets/tiny-dungeon/` (allt under `services/web/`).

## Kontrakt
Ingen ändring. Kopplingen mentor-id → figur ligger i spelkoden. Ett `sprite`-fält i
`mentors.yaml` kan bli en senare uppgift (Roberts fil, kontraktsändring).

## Test
- `npm test`: riktning från hastighet, bildrutor per riktning, fallback-figur för okända mentorer.
- `npm run lint && npm run build`.
- Manuellt: gå i alla fyra riktningar, stå still, gå nära varje mentor, gå genom dörrarna.
