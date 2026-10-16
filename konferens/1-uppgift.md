# 1. Uppgiften

Bygg en liten men fungerande lösning på ett verkligt problem tillsammans med ditt team,
inom området **kompetensutveckling/kompetensplattform**. Gör det med **kodagenter som en
del av teamet**.

Det viktiga är inte att bli klar. Det viktiga är att *lära sig* arbeta med kodagenter
tillsammans och prova nya tekniker som har hög efterfrågan på marknaden. Det vi bygger
kan tillsammans bli början på en intern **kompetensplattform** som vi kan jobba vidare
med efter konferensen.

## Grunduppgift

Det enda som är obligatoriskt:

1. **Uppgiften är att skapa grunden till en kompetensplattform.** Välj funktionalitet
   som ni i teamet tycker är användbar, samtidigt som ni får användning av och lär er nya
   tekniker som marknaden och våra kunder efterfrågar. Läs mer om idéer i
   [Idébank](#idébank) eller kom på något eget!
2. **Bygg med kodagent.** Alla i teamet använder en kodagent (Claude Code, Codex eller
   liknande) för att planera, skriva och granska kod.
3. **Samarbeta som team.** Dela upp arbetet så att ni kan jobba parallellt. Hur ni
   håller ihop delarna, till exempel med ett kontrakt i förväg, bestämmer ni själva.
   Läs mer i [samarbete](3-samarbete.md).
4. **Berätta om det.** I slutet berättar varje team kort vad ni byggt och lärt er. Visa
   gärna en kort demo om ni har något som fungerar.

Allt annat är valfritt. Materialet, idébanken och skillsen finns som hjälp och
snabbstart, inte som måsten. Att använda gen-AI, lokala modeller eller bygga en agent
*i* lösningen uppmuntras men är inget krav.

## Så kommer ni igång

En i teamet skapar teamets repo från mallen och ger resten av teamet åtkomst, enligt
stegen under [Kom igång](../README.md#kom-igång). Sedan planerar ni tillsammans. Det finns
två vägar, och vi rekommenderar den första.

### Med kickoff (rekommenderas)

Starta kodagenten i repot och kör **kickoff**-skillen, till exempel med `/kickoff` i
Claude Code. En person kör och hela teamet diskuterar. Skillen visar först sina steg, och
ni godkänner varje steg innan den går vidare:

1. **Idé och krav**: MVP och huvudflöde som går att bygga på ca 2 timmar
2. **Arkitektur och teknik** utifrån vad ni vill lära er
3. **Arbetspaket**, lika många som ni har datorer. Ni bestämmer själva vem som tar vilket
4. **Kontrakt** för gränssnitten mellan paketen, om ni vill
5. **Skelett** som startar, med `compose.yaml`, `docs/plan.md` och `AGENTS.md`
6. **Städning** av mallmaterial och **push** till `main`, först efter ert ok

Fördelen är att ni på ca 30 minuter går från idé till en gemensam grund som alla kan
börja bygga parallellt på direkt. Planen skrivs ner, så att allas agenter
och verktygen `create-pr` och `code-reviewer` utgår från samma överenskommelser.

### Utan kickoff

Vill ni hellre planera från början själva går det också bra. Diskutera idé, teknik och
uppdelning tillsammans och ta hjälp av kodagenten där det passar. Kom ändå överens om
vem som gör vad och skriv ner det, till exempel i `docs/plan.md` och
`AGENTS.md`, så att allas agenter vet vad som gäller. Pusha en gemensam grund till `main`
innan ni börjar på egna grenar.

## Idébank

Välj en idé, kombinera flera eller kör på en egen. Varje idé har en **MVP** (rimligt på
ca 2 timmar) och **utbyggnader** för den som hinner mer.

### 1. Kompetensgap och utvecklingsförslag

Hjälp konsulter att se vad uppdrag och marknad efterfrågar jämfört med vad de kan, och
föreslå vad de kan lära sig härnäst.

- **MVP:** läs in en konsultprofil och några förfrågningar eller jobbannonser från
  [`starter/data/`](https://github.com/Noir-Consultancy/noir-konferens-ht26/tree/main/starter/data)
  och visa efterfrågade kompetenser som personen saknar eller har lite erfarenhet av,
  med förslag på vad man kan lära sig och varför.
- **Utbyggnader:** kompetensmatris för hela teamet (vanligaste luckorna), ta hänsyn till
  vad personen själv vill lära sig, trender från marknadsradarn (idé 3), förslag på
  kurser/certifieringar, semantisk sökning/RAG, enkel webbvy.
- **Passar ihop med:** gen-AI, embeddings/vektordatabas, FastAPI, Postgres (pgvector).

### 2. AI-studiekompis och quiz-agent

En interaktiv agent som hjälper dig plugga ett ämne: ställer frågor, ger förklaringar,
anpassar nivån och håller koll på framsteg.

- **MVP:** välj ämne och nivå → agenten genererar frågor, bedömer svar och förklarar.
- **Utbyggnader:** spara framsteg, repetition av svaga områden, verktyg (till exempel kör kod
  för att rätta svar), flera agenter (frågeställare + granskare), chattgränssnitt.
- **Passar ihop med:** agentramverk (LangChain/LangGraph, CrewAI, ADK), lokala modeller,
  webbgränssnitt.

### 3. Marknadsradar

Samla in uppdragsförfrågningar eller jobbannonser, extrahera efterfrågade tekniker och
visa trender över tid.

- **MVP:** en producent som publicerar jobbannonserna från [`starter/data/`](https://github.com/Noir-Consultancy/noir-konferens-ht26/tree/main/starter/data)
  på Kafka, en konsument som extraherar tekniker (med regler eller LLM) och ett API eller
  en vy med topplistan.
- **Utbyggnader:** event sourcing av trenddata, flera konsumenter (till exempel notiser när en
  teknik ökar), jämförelse mot teamets kompetensgap (idé 1), dashboard.
- **Passar ihop med:** Kafka, eventdriven arkitektur, gen-AI för extraktion, Postgres.

### 4. Övningsgenerator

Mindre interaktiv än idé 2: skapar **kompletta praktiska övningar** och/eller
**läsmaterial** utifrån användarens val av ämne, nivå, språk och tidsåtgång.

- **MVP:** formulär eller CLI med val → genererar en övning (beskrivning, startkod,
  testfall, lösningsförslag) eller en läsguide som Markdown.
- **Utbyggnader:** generera ett färdigt övningsrepo, validera att testerna faktiskt går
  att köra, bibliotek med sparade övningar, betyg/feedback.
- **Passar ihop med:** gen-AI, agentiska arbetsflöden (generera → validera → förbättra),
  CI/CD för att testa genererade övningar.

### Egen idé

Helt okej! Tumregler:

- Det ska gå att bygga något som fungerar på ca 2 timmar.
- Det ska gå att dela upp i delar som teamet kan jobba med parallellt.
- Gärna något som kan vara till nytta för NOIR eller er själva.

## Data

Använd **påhittad (syntetisk) data**. I mallens
[`starter/data/`](https://github.com/Noir-Consultancy/noir-konferens-ht26/tree/main/starter/data)
finns färdig exempeldata som ni kan använda eller anpassa: sex konsultprofiler (JSON, Markdown och
några som PDF), uppdragsförfrågningar, jobbannonser och en kompetenstaxonomi. Behöver ni
något annat kan kodagenten generera mer i samma stil. Kopiera det ni väljer till `data/`
i ert repo, vilket kickoff gör åt er. Vill du kan du också använda **din egen profil**.

> [!WARNING]
> Checka inte in personuppgifter i repot, och skicka inte känslig data till
> molnmodellers gratisnivåer.

## Presentation

Kort, ca **3 minuter per team**:

1. **Vad** byggde ni och varför? En mening räcker.
2. **Visa gärna** det som fungerar, om ni har något att visa.
3. **Lärdom:** en sak ni lärde er om att arbeta med kodagenter i team.
