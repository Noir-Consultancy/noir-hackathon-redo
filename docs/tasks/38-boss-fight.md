# #38 Bossfight: fånga den hallucinerande NPC:n

## Mål

En boss, "Den Självsäkre Orakelbotten", håller en kort föreläsning med 5 påståenden om
ämnen från zonerna. Två av dem är subtilt fel. Spelaren kryssar i vilka som är fel, utan
fritext. Vid rätt svar förklaras varför varje påstående stämmer eller är fel. Spelaren
får mer XP än för en vanlig quest, ett eget kort och en achievement. Bossen är öppen
direkt, utan låsning.

## Upplägg

- **Bossen är en NPC i `mentors.yaml`** med egen persona: överdrivet självsäker och
  retsam. I chatten försvarar den sina påståenden och erkänner inte felen. Befintlig
  NPC-agent och quest-erbjudande återanvänds. Påståendena (men inte vilka som är fel)
  läggs i bossens systemprompt, så att den återger samma föreläsning som questrutan.
- **Egen zon**: `rag-biblioteket` delas på mitten och den högra halvan blir
  "Orakelns arena" (x 20–40, y 15–30). Då fungerar achievementen med den befintliga
  regeln `zone_completed` och ingen ny regeltyp behövs. Emmas nivålås (#35) sätter
  RAG-biblioteket till nivå 2. Arenan får standardvärdet 1, alltså öppen direkt, och
  nås via dörren från Prompttornet. Kartan bygger väggar och dörrar från zonerna, så
  ingen spelkod behöver ändras. Arenan får tills vidare samma marktema som Agentbyn,
  eftersom temana cyklar.
- **Questen** (`q-oracle-1`, `kind: boss`, 150 XP) har de publika påståendena i
  `statements`. De felaktigas index (`wrong_statements`) och en förklaring per
  påstående (`explanations`) ligger bara på servern.
- **Bedömning utan LLM**: de ikryssade påståendena måste vara exakt `wrong_statements`.
  Fel ger alltid samma ledtråd, så att spelaren inte kan pröva sig fram med ett kryss i
  taget. Rätt ger förklaringarna i `feedback`.
- Spelaren får försöka flera gånger (fungerar redan så).
- **UI**: `questBox` visar en kryssruta per påstående när `kind === "boss"` och skickar
  `selected_statements`, utan textruta. Övriga quests ser ut som förut.

## Kontraktsändring (separat commit, meddela teamet)

- `Quest.kind`: lägg till `boss`.
- `Quest.statements: string[]`: publikt, tom lista för andra quests än `boss`.
- `AttemptRequest.selected_statements?: int[]`: valfritt, 0-baserade index (högst 20).
- `AttemptRequest.answer`: valfritt för `boss`, krävs för övriga quests.
- Server-only i YAML: `wrong_statements` och `explanations` (som `criteria`).

Berör `docs/contract/{openapi.yaml,models.md}`, `services/api/app/models.py` och
`services/web/src/api/types.ts`.

## Filer

- `data/world/{zones,mentors,quests,cards,achievements}.yaml`: boss, zon, quest, kort
  ("Granska AI-svar") och achievement ("Orakelfällaren").
- `services/api/app/world/__init__.py`: `QuestDef.wrong_statements` och `explanations`.
- `services/api/app/quests/__init__.py` och `router.py`: bossbedömning.
- `services/api/app/npc/__init__.py`: föreläsningen i bossens systemprompt.
- `services/web/src/ui/quest.ts` och `ui.css`: kryssrutor.
- `services/web/src/api/client.ts`: `attemptQuest` tar valfria `selected_statements`.

## Test

- api: fel urval ger underkänt med samma ledtråd. Rätt urval ger godkänt med en
  förklaring per påstående. Inget av dem anropar LLM:en. `wrong_statements` och
  `explanations` läcker inte i `/world`, och bossens prompt saknar svaren.
- web: inget DOM-test för kryssrutorna, eftersom webbtesterna körs utan DOM.
- Manuellt: gå till Orakelbotten, be om föreläsningen och utmaningen, kryssa och
  kontrollera förklaringarna, XP, kort och achievement.
