# 3. Samarbete i team med kodagenter

En kodagent gör varje person snabbare, men fyra personer med var sin agent kan också
skapa kaos snabbare. Här beskriver vi ett arbetssätt som vi föreslår. Det är **ett
förslag, inte ett krav**. Hittar ert team ett sätt som fungerar bättre så kör på det, och
berätta gärna om det på presentationen!

## Flödet i korthet

```
Planering, gärna med kickoff (en kör, alla diskuterar)
  → arbetspaket (+ kontrakt om ni vill) och skelett
  → skelettet pushas till main
    → var och en (eller varje par) bygger på egen gren
      → små PR:er → merge till main ofta
        → presentation
```

Agenten kan föreslå hur arbetet delas upp, men **ni bestämmer själva vem som gör vad**.
Den gemensamma grunden pushas till `main` *innan* någon skapar
sin gren.

## Kontrakt, om ni vill

Ett kontrakt beskriver gränssnitten mellan delarna i förväg, så att ni kan jobba
parallellt mot stubbar utan att vänta på varandra. Det tar dock tid att skriva och
ändras ofta när ni väl börjar bygga. Ni kan också komma igång direkt och bestämma
gränssnitten med den som äger dem när de behövs.

Väljer ni ett kontrakt ligger det i `docs/contract/` och kan innehålla:

| Typ | Exempel | Format |
|---|---|---|
| API mellan tjänster | `GET /matches?request_id=…` | OpenAPI (`openapi.yaml`) |
| Events på Kafka | `job-ads.published`, `skills.extracted` | Tabell per topic i `events.md` |
| Delad datamodell | `ConsultantProfile`, `Exercise` | Tabell i `models.md` |
| Agentverktyg | `search_profiles(query) -> list[Profile]` | Signatur och beskrivning |

Tumregler:

- **Håll det litet.** Bara det som korsar gränsen mellan två personers delar.
- **Stubba det du väntar på.** Behöver du ett API som någon annan bygger? Be din agent
  skapa en stub utifrån kontraktet och byt sedan till det riktiga.
- **Ändra det inte i smyg.** Ändringar görs i en egen liten commit, och du säger till de
  som berörs. Det gäller även din kodagent, och `AGENTS.md` instruerar den om det.

## Dela upp arbetet

Målet är att var och en ska kunna jobba **så självständigt som möjligt**, med **tydligt
ägarskap** över filer och mappar.

Vi föreslår **lika många arbetspaket som ni har datorer** som kodar samtidigt (ett par
på en dator räknas som en). Varje paket äger egna mappar och sina gränssnitt mot de
andra.

**Föredra vertikala skivor eller tydliga moduler** framför uppdelning i tätt kopplade
lager. Ett paket kan mycket väl vara en modul i samma backend, så det behövs inte en
tjänst per person. Uppdelningen frontend/backend fungerar ofta bra, men om båda hela
tiden måste ändra samma API blir det mycket väntan. Exempel:

| Idé | Möjlig uppdelning (3–4 personer) |
|---|---|
| Kompetensgap | profilimport och datamodell · gap-analys och utvecklingsförslag (LLM eller embeddings) · webbvy · tester och utvärdering av förslagen |
| Studiekompis | agent och verktyg · frågebank och generering · chattgränssnitt · lagring av framsteg |
| Marknadsradar | producent (annonser till Kafka) · extraktionskonsument · trend-API eller dashboard · normalisering mot kompetenstaxonomin |
| Övningsgenerator | generering av övning · validering (kör tester) · UI/CLI · lagring av övningar |

**Delade filer** som `compose.yaml`, `.env.example`, `AGENTS.md` och beroendefiler som
`pyproject.toml` eller `package.json` skapar lätt konflikter. Låt helst varje tjänst ha egna
beroendefiler i `services/<namn>/`, och gör ändringar i delade filer som små, separata
commits som mergas snabbt.

> [!TIP]
> **Alternativ: parprogrammering.** Är ni fyra och det är svårt att hitta fyra oberoende
> delar? Jobba två och två på en dator per par och turas om att styra agenten. Hur ni
> delar upp det bestämmer ni själva. Det är ett bra sätt att lära av varandras sätt att
> prompta.

## Git-flöde

- **Grenar och commits:** en gren per uppgift, `<namn>/<ämne>` från en färsk `main`, till
  exempel `anna/matching-api`. Små commits med
  [Conventional Commits](https://www.conventionalcommits.org): `feat(api): add match endpoint`.
- **Håll dig uppdaterad:** hämta in `main` ofta med
  `git fetch origin && git merge origin/main`. Merge i stället för rebase gör att
  konflikter bara behöver lösas en gång och att ingen force-push behövs.
- **Granska innan PR:** låt `code-reviewer`-agenten granska din gren och åtgärda
  åtminstone alla *blockers* innan du skapar PR:en. Den kan också granska en
  teamkamrats PR: *"låt code-reviewer granska PR #12"*.
- **Små PR:er:** skillen `create-pr` skapar en PR med kort beskrivning och teamkamraterna
  som granskare. Utan GitHub CLI ger den i stället en länk och en färdig text att
  klistra in. Merga med en vanlig merge (*Create a merge commit*), så att de små
  commitsen finns kvar i `main`.
- **Agenten frågar innan den pushar.** `AGENTS.md` säger åt den att bara committa
  lokalt och aldrig pusha eller merga utan ditt ok.
- **Säg till** i teamet när du mergat något, och sikta på att `main` alltid fungerar,
  särskilt före avstämningarna.

## Tänk på när ni använder kodagenter i team

- **Ge agenten sammanhanget.** Den läser `AGENTS.md` automatiskt. Hänvisa till
  `docs/plan.md` och `docs/contract/` i dina promptar: *"Jag äger tjänsten `matcher`,
  se docs/plan.md. Implementera endpointen enligt docs/contract/openapi.yaml."*
- **Planera varje funktion.** Innan agenten börjar på en ny funktion skriver den en
  kort plan i `docs/tasks/<namn>-<NN>-<ämne>.md` som du godkänner. Planen länkas sedan från
  PR:en, så att teamet kan se hur och varför något byggdes.
- **Håll agenten i din del av repot.** Be den inte "fixa" saker i andras tjänster, utan
  säg till ägaren i stället.
- **Uppdatera `AGENTS.md`** när teamet beslutar något som alla agenter behöver veta, till
  exempel en konvention eller ett kommando. Gör det gärna som en liten commit i den PR
  du redan jobbar på.

## Skills och agenter att bygga vidare på

Repot innehåller exempel på skills och en subagent för kickoff, PR:er och granskning. Ni
får gärna ändra dem och skapa egna, se
[kodagenter: begrepp och verktyg](4-kodagenter.md#skills-och-agenter-i-repot).
