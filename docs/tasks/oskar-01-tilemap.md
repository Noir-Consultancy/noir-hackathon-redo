# oskar-01: Tilekarta med väggar och kollision (#1)

**Mål:** världen får en riktig tilekarta med väggar, dörrar mellan zonerna och hinder
som spelaren kolliderar med. Grund för #2 (sprites) och #3 (zonnamn).

## Approach
- **Tileset:** Kenney Tiny Town (CC0) i `services/web/public/assets/tiny-town/`, 16×16
  tiles skalade ×2 (`TILE = 32`). Tile-index samlas i `src/game/tiles.ts`, ett golvtema per zon.
- **Kartgenerering i kod** från `/world` (`src/game/mapgen.ts`, ren funktion):
  storlek från zonernas `bounds`, golv per zon, väggar runt kanten och mellan zoner, en
  3 tiles bred dörr mitt på varje delad gräns, deterministiska hinder (~5 %) som håller
  avstånd till mentorer, dörrar och spawn. Spawn mitt i första zonen.
- **WorldScene:** Phaser-tilemap med två lager (ground, walls), kollision mot väggar och
  mentorer. Zonnamn, `E`-interaktion och event bus som innan.

## Filer
`src/game/tiles.ts`, `src/game/mapgen.ts`, `src/game/mapgen.test.ts`,
`src/game/WorldScene.ts`, `public/assets/tiny-town/` (allt under `services/web/`).

## Kontrakt
Använder `GET /world` (`zones[].bounds`, `mentors[].position`). Ingen ändring.

## Test
- `npm test`: ytterkant är vägg, dörr mellan varje par angränsande zoner, mentorer och
  spawn på fria tiles, BFS från spawn når alla mentorer.
- `npm run lint && npm run build`.
- Manuellt i webbläsaren: väggar och hinder stoppar, dörrarna leder till alla zoner, `E` vid varje mentor.
