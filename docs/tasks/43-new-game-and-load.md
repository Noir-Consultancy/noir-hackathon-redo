# 43: Nytt spel och ladda sparning

## Mål
Spelaren kan börja om med ett nytt spel och fortsätta en tidigare sparning, utan att
rensa webbläsardata.

## Upplägg (alternativ A: startmeny med sparningar på enheten)
- **Sparningar på enheten:** utöver nuvarande `kunskapsriket.playerId` sparas en lista
  `kunskapsriket.saves` med `{ player_id, name }`, senast spelad först (max 8). Ren logik i
  `ui/saves.ts` (läsa, minnas, glömma) så att den kan testas.
- **Vid start:**
  - Finns en aktuell spelare → spelet startar direkt, som i dag.
  - Annars, finns sparningar → **startmeny**: "Fortsätt som Emma · nivå 2" för varje
    sparning (nivån hämtas med `GET /players/{id}`; sparningar som inte längre finns tas
    bort ur listan) och knappen "Nytt spel".
  - Inga sparningar → namnrutan direkt.
- **Nytt spel:** namnrutan, med "Tillbaka" om det finns sparningar. Ett befintligt namn
  fortsätter den sparningen (som i dag, `POST /players`).
- **Meny i HUD:en:** knappen "Meny" glömmer aktuell spelare och laddar om sidan, så att
  startmenyn visas och spelvärlden nollställs.
- Ingen kontraktsändring. Riktiga sparningar på servern (flera spel per namn, mellan
  enheter) blir i så fall en egen issue.

## Filer
- `services/web/src/ui/saves.ts` + `saves.test.ts` – sparningslistan.
- `services/web/src/ui/index.ts` – startflöde, startmeny, namnruta med "Tillbaka".
- `services/web/src/ui/hud.ts` – knappen "Meny".
- `services/web/src/ui/ui.css` – stilar.

## Kontrakt
Använder `POST /players` och `GET /players/{id}`. Inga ändringar.

## Test
- Enhetstester för `saves.ts`.
- Manuellt: spela som "Emma", tryck "Meny" → startmeny med Emma. "Nytt spel" som "Test"
  → ny spelare på nivå 1. "Meny" igen → båda i listan, Test överst. Välj Emma → hennes
  framsteg finns kvar.
