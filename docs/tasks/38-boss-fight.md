# #38 Bossfight: fånga den hallucinerande NPC:n

## Mål

En boss, "Den Självsäkre Orakelbotten", håller en kort föreläsning med 5 påståenden om
ämnen från zonerna. Två av dem är subtilt fel. Spelaren kryssar i vilka som är fel och
motiverar varför. Klarar spelaren det får hen mer XP än för en vanlig quest, ett eget kort
och en achievement. Bossen är öppen direkt, utan låsning.

## Upplägg

- **Bossen är en NPC i `mentors.yaml`** med egen persona: överdrivet självsäker och
  retsam. I chatten försvarar den sina påståenden och erkänner inte felen. Befintlig
  NPC-agent och quest-erbjudande återanvänds.
- **Egen zon**: `rag-biblioteket` delas på mitten och den högra halvan blir
  "Orakelns arena" (x 20–40, y 15–30). Då fungerar achievementen med den befintliga
  regeln `zone_completed` och ingen ny regeltyp behövs. Emmas nivålås (#35) sätter
  RAG-biblioteket till nivå 2. Arenan får standardvärdet 1, alltså öppen direkt, och
  nås via dörren från Prompttornet. Kartan bygger väggar och dörrar från zonerna, så
  ingen spelkod behöver ändras. Arenan får tills vidare samma marktema som Agentbyn,
  eftersom temana cyklar.
- **Questen** (`q-oracle-1`, `kind: boss`, 150 XP) har de publika påståendena i
  `statements` och de felaktigas index i det server-only fältet `wrong_statements`.
  `criteria` beskriver varför de är fel.
- **Bedömning i två steg**:
  1. Deterministiskt: de ikryssade påståendena måste vara exakt `wrong_statements`. Om
     inte blir det underkänt med en kort ledtråd utan LLM-anrop, t.ex. "Du har missat
     ett fel" eller "Något du kryssade i stämmer faktiskt".
  2. LLM: motiveringen bedöms mot `criteria` med den befintliga `judge()`, och
     påståendena skickas med i uppgiften.
- Spelaren får försöka flera gånger (fungerar redan så).
- **UI**: `questBox` visar en kryssruta per påstående när `kind === "boss"` och skickar
  med `selected_statements`. Övriga quests ser ut som förut.

## Kontraktsändring (separat commit, meddela teamet)

- `Quest.kind`: lägg till `boss`.
- `Quest.statements?: string[]`: valfritt och publikt, finns bara för `boss`.
- `AttemptRequest.selected_statements?: int[]`: valfritt, 0-baserade index.
- Server-only i YAML: `wrong_statements` (som `criteria`).

Berör `docs/contract/{openapi.yaml,models.md}`, `services/api/app/models.py` och
`services/web/src/api/types.ts`.

## Filer

- `data/world/{zones,mentors,quests,cards,achievements}.yaml`: boss, zon, quest, kort
  ("Granska AI-svar") och achievement ("Orakelfällaren").
- `services/api/app/world/__init__.py`: `QuestDef.wrong_statements`.
- `services/api/app/quests/__init__.py` och `router.py`: bossbedömning.
- `services/web/src/ui/quest.ts` och `ui.css`: kryssrutor.
- `services/web/src/api/client.ts`: `attemptQuest` tar valfria `selected_statements`.

## Test

- api: urvalet stämmer inte → underkänt utan LLM-anrop. Urvalet stämmer → `judge`
  anropas. `wrong_statements` läcker inte i `/world`.
- web: `questBox` renderar kryssrutor för `boss` och skickar valda index.
- Manuellt: gå till Orakelbotten, be om utmaningen, kryssa och motivera, och kontrollera
  XP, kort och achievement.
