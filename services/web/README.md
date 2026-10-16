# web

Phaser-spelet och UI-overlayn för Kunskapsriket. Kontrakt: [`docs/contract/`](../../docs/contract/).

| Mapp | Paket | Ansvar |
|---|---|---|
| `src/game/` | 1 | Phaser-scen: karta, zoner, rörelse, mentorer, `E` för att prata |
| `src/ui/`, `src/api/` | 2 | Namn, HUD, dialogpanel, quests, codex; API-klient |
| `src/events.ts`, `src/main.ts` | delade | Event bus och koppling – små separata commits |

Spelet och UI:t pratar bara via `bus` i `src/events.ts` (se `docs/contract/interfaces.md`).

## Kör lokalt
Kräver att api körs på http://localhost:8001.
```bash
npm install
npm run dev          # http://localhost:8000, /api proxas till api
```

## Tester och quality gates
```bash
npm test             # vitest
npm run lint         # biome check (lint + format)
npm run build        # typkontroll + bygg
```

## Miljövariabler
| Variabel | Standard | Beskrivning |
|---|---|---|
| `API_URL` | `http://localhost:8001` | Vart Vite-proxyn skickar `/api` (bara dev) |
| `VITE_API_BASE` | `/api` | Bas-URL för API-anrop från webbläsaren |
