# 35: Zoner som låses upp med nivå

## Mål
Progressionen får ett mål: vissa zoner öppnas först när spelaren nått en viss nivå.

## Upplägg
- **Kontrakt:** `Zone.required_level` (heltal, standard 1 = öppen). Bakåtkompatibelt.
- **Data:** `rag-biblioteket` kräver nivå 2 (tre quests à 50 XP ger max nivå 2).
- **Spel:** grindar med 🔒 på dörrarna in till låsta zoner (`lockedDoors` i
  `game/locks.ts`). Går man mot dem visas "🔒 RAG-biblioteket öppnas på nivå 2". Nivån
  hämtas med markörerna när en dialog stängs; grindarna tonas bort vid ny nivå.
- **UI:** level up-bannern får en rad per zon som öppnas ("🔓 RAG-biblioteket är
  upplåst!"); codexen visar "🔒 Kräver nivå 2" på kort från låsta zoner.
- Ingen spärr på servern.

## Filer
`services/api/app/models.py`, `services/web/src/api/types.ts`, `docs/contract/`,
`data/world/zones.yaml`, `services/web/src/game/locks.ts` (+ test),
`services/web/src/game/WorldScene.ts`, `services/web/src/ui/hud.ts`, `codex.ts`,
`index.ts`, `ui.css` (+ tester).

## Test
Ny spelare: dörrarna ner till RAG-biblioteket är stängda och visar ledtråden. `C` visar
Veras kort som "Kräver nivå 2". Klara Ada och Karl → bannern "⬆ Nivå 2! 🔓
RAG-biblioteket är upplåst!", grindarna försvinner när dialogen stängs.
