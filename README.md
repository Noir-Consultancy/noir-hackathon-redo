# NOIRs höstkonferens 2026 – Hackathon

Hackathon med kodagenter – **fredag 16 oktober 2026**.

Under ett eftermiddagspass har vi hackathon där vi bygger något nyttigt kring
**kompetensutveckling** i små team. Samtidigt fortsätter vi att lära oss arbeta med
kodagenter som Claude Code och Codex, som en självklar del av teamet.

## Mål

- **Erfarenhet av kodagenter.** Planera, bygga och samarbeta i team med AI-driven utveckling.
- **Bygg något användbart** för NOIR och för oss själva.
- **Stärk profilen.** Prova tekniker, språk och ramverk som efterfrågas på marknaden.
- **Ha kul tillsammans!**

## Kom igång

### Före konferensen

1. **Gör förberedelserna** för [macOS](konferens/0-forberedelser-mac.md) eller
   [Linux](konferens/0-forberedelser-linux.md).
2. **Läs** [uppgiften](konferens/1-uppgift.md), [tekniklistan](konferens/2-teknik.md) och
   [samarbete](konferens/3-samarbete.md).

### På plats

En person i teamet sätter upp teamets repo medan resten av teamet följer med.

1. **Skapa repot.** Öppna [konferensrepot](https://github.com/Noir-Consultancy/noir-konferens-ht26/tree/main)
   och välj *Use this template*. Välj `Noir-Consultancy` som ägare, ge repot ett namn och
   tryck på *Create repository*. Steget är klart när teamets repo finns i organisationen.
2. **Ge teamet åtkomst.** Lägg till teamkamraterna med skrivrättighet under
   *Settings → Collaborators and teams*. Alla bör redan vara med i organisationen efter
   förberedelserna. Saknar någon åtkomst så säger ni till, så fixar vi det på plats.
   Steget är klart när alla i teamet kan öppna repot.
3. **Klona och starta agenten.** Klona repot, gå in i mappen och starta kodagenten, till
   exempel med `claude`.
4. **Planera, gärna med kickoff.** Vi rekommenderar att ni skriver `/kickoff` och
   diskuterar frågorna tillsammans. Skillen hjälper er att välja idé, teknik och
   arbetsfördelning och sätter upp ett skelett som pushas till `main`. Ni kan också
   planera själva från början, se [uppgiften](konferens/1-uppgift.md#så-kommer-ni-igång).
   Steget är klart när grunden ligger på `main`, alla har klonat repot och alla vet vad
   de börjar med.

Stöter du på problem, eller är något i instruktionerna oklart eller fungerar inte? Skriv
gärna i `#tech-ai` på Slack så att vi kan åtgärda det.

## Schema

Totalt tre timmar med tre team. Pauser tar var och en när det passar under
utvecklingspassen.

| Pass | Tid | Innehåll |
|---|---|---|
| Intro | 5 min | Mål och upplägg |
| Planering | 30 min | Välj idé, teknik och arbetsfördelning, gärna med kickoff |
| Avstämning 1 | 5 min | Alla team berättar kort vad de bygger |
| Utveckling 1 | 60 min | Bygg! |
| Avstämning 2 | 5 min | Alla team berättar kort om läget, hinder, hur de ska integrera och om planen behöver krympas |
| Utveckling 2 | 60 min | Integrera allas delar till en fungerande helhet på `main` |
| Presentation | 15 min | Ca 3 minuter per team med kort sammanfattning och gärna en snabb demo |

En idé är att fördjupa oss och följa upp projekten på ett kommande **Unplugged**, om
intresse finns.

## Grupper

Teamen är blandade med avsikt, eftersom olika erfarenhet och specialiteter gör att alla
lär sig av varandra.

| Team | Medlemmar | Teamets repo |
|---|---|---|
| Team 1 | Daniel Millevik, Robert Jansson, Emma Rangert, Oskar Olsson | – |
| Team 2 | Bo Sandevind, Leo Wentzel, Daniel Figueroa, Jakob Hamilton | – |
| Team 3 | Jonas Öhrn, Magnus Jonnerby, Andreas Messing | – |

När teamet har skapat sitt repo får ni gärna lägga in länken i tabellen via en PR till
konferensrepot.

## Material

Dokumenten är numrerade i den ordning vi föreslår att du läser dem.

| # | När | Dokument | Innehåll |
|---|---|---|---|
| 0 | Före konferensen | Förberedelser för [macOS](konferens/0-forberedelser-mac.md) eller [Linux](konferens/0-forberedelser-linux.md) | Installationer och konton att fixa innan konferensen |
| 1 | Före eller på plats | [Uppgift](konferens/1-uppgift.md) | Grunduppgift, idébank och presentation |
| 2 | Före eller på plats | [Tekniklista](konferens/2-teknik.md) | Tekniker att välja bland, med användning och för- och nackdelar |
| 3 | Före eller på plats | [Samarbete](konferens/3-samarbete.md) | Hur vi delar upp arbetet och samarbetar med kodagenter |
| 4 | Bonus | [Kodagenter](konferens/4-kodagenter.md) | Begrepp som skills och subagenter, vad som finns i repot och länkar för att lära dig mer |
| 5 | Bonus | [Tips för kodagenter](konferens/5-tips-kodagenter.md) | Arbetssätt och tips |

<details>
<summary>Repots struktur</summary>

```
konferens/        Konferensmaterial (svenska)
starter/compose/  Färdiga compose-snuttar (Kafka, Postgres, Ollama)
starter/data/     Exempeldata: konsultprofiler, förfrågningar, jobbannonser
.agents/skills/   Exempel på skills: kickoff och create-pr
.claude/          Länkar till skills och code-reviewer-agenten för Claude Code
.codex/           code-reviewer-agenten för Codex
AGENTS.md         Instruktioner till kodagenten (CLAUDE.md pekar hit)
```

</details>
