# 5. Tips för kodagenter

> [!TIP]
> **Bonus.** Läs om du vill. Exemplen gäller Claude Code, men de flesta tipsen fungerar
> likadant i Codex och andra agenter.

## Arbetssätt

- **Planera först, koda sedan.** Be agenten föreslå en plan innan den skriver kod. I
  Claude Code finns *plan mode*, som du växlar till med `Shift+Tab`. Rätta planen, för
  det är mycket billigare än att rätta koden.
- **Små steg.** En avgränsad uppgift per prompt: *"Lägg till endpointen X enligt
  kontraktet, med ett test"*, inte *"bygg backend"*.
- **Ge sammanhang.** Peka på filer med `@` och filnamnet, till exempel *"Implementera
  endpointen enligt @docs/contract/openapi.yaml i @services/matcher/app/main.py"*. Ju mer
  precist, desto färre gissningar.
- **Be om tester och kör dem.** Låt agenten skriva ett test och köra det, så verifierar
  den sitt eget arbete.
- **Sätt upp linting och formatering** tillsammans med testerna. Då hittar agenten fel
  tidigt, koden formateras likadant för alla och teamet får gemensamma *quality gates*
  att köra före varje commit.
- **Granska diffen.** Läs vad agenten ändrat innan du committar. Du äger koden.
- **Inbyggd granskning.** Claude Code har också en inbyggd
  [`/code-review`](https://code.claude.com/docs/en/code-review), som letar buggar i din
  diff eller i en PR. Den är skild från repots `code-reviewer`, som även kontrollerar
  kontrakt, plan och quality gates.

  > [!WARNING]
  > `/code-review` förbrukar mer av din användning än en vanlig fråga. Varianten
  > `ultra` körs i molnet och kan kosta extra.
- **Avbryt tidigt.** Är agenten på väg åt fel håll så tryck `Esc` och styr om, i stället
  för att vänta ut den.
- **Committa ofta.** Små commits gör det lätt att backa när ett experiment inte fungerar.
- **Ställ en sidofråga** med `/btw` utan att avbryta det agenten håller på med. Svaret
  bygger på det som redan finns i konversationen och hamnar inte i historiken.

## Hushålla med användningen

Ett Pro-abonnemang bör räcka för hackathonet om man är lite sparsam:

- **Rensa kontexten** när du byter uppgift: `/clear`. En lång konversation gör varje
  nytt anrop dyrare. `/compact` sammanfattar om du vill behålla tråden.
- **Välj modell efter uppgift** med `/model`. En snabbare och billigare modell räcker
  ofta för enkla ändringar, så spara den största modellen till svåra problem och planering.
- **Undvik att läsa in allt.** Be inte agenten "läsa hela repot", utan peka på de filer
  som behövs.
- **Kolla förbrukningen** med `/usage` (Claude Code).

## Instruktioner och återanvändning

- **Håll `AGENTS.md` kort** och uppdatera den när teamet beslutar något som alla agenter
  behöver veta, som ett kommando eller en konvention.
- **Gör om upprepningar till skills.** När ni gör samma sak flera gånger, be agenten
  skapa en skill för det.
- **Lämna över sökning och granskning till en subagent**, så att din huvudkonversation
  inte fylls.

Vad instruktionsfiler, skills och subagenter är, vilka som finns i repot och länkar för
att lära dig mer står i [kodagenter: begrepp och verktyg](4-kodagenter.md).

## Flera sessioner

- **En session per uppgift.** Kör du flera agenter parallellt, ge var och en en egen
  arbetskopia med `git worktree` (i Claude Code `claude --worktree`). Hur ni samarbetar
  i teamet står i [samarbete](3-samarbete.md).

## Säkerhet

- Lägg aldrig hemligheter i promptar, kod eller commits. Använd `.env`.
- Läs kommandon som agenten vill köra innan du godkänner dem, särskilt sådant som
  raderar, pushar eller installerar.
- Skicka inte känslig data till molnmodellers gratisnivåer.
