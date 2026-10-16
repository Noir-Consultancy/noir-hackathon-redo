# 4. Kodagenter: begrepp och verktyg i repot

> [!TIP]
> **Bonus.** För dig som är ny på kodagenter eller vill reda ut begreppen. Exemplen gäller
> Claude Code, men Codex fungerar på liknande sätt. Varje begrepp länkar till mer läsning.

## Begreppen i korthet

**Kodagent.** En AI-assistent som arbetar i din terminal och ditt repo. Den läser koden,
planerar, ändrar filer och kör kommandon som tester, och du styr med vanliga
instruktioner. Läs mer: [How Claude Code works](https://code.claude.com/docs/en/how-claude-code-works).

**Kontext.** Allt agenten har framför sig i en session: dina meddelanden, filerna den har
läst och resultatet av kommandon den har kört. Kontexten är begränsad, och när den blir
full blir svaren sämre och varje anrop dyrare. Rensa med `/clear` när du byter uppgift.
Läs mer: [Explore the context window](https://code.claude.com/docs/en/context-window).

**Instruktionsfil (`AGENTS.md`).** En fil som agenten läser automatiskt i början av
varje session, med det som alla agenter i projektet ska veta: kommandon, konventioner
och beslut. Claude Code läser `CLAUDE.md`, som i det här repot bara pekar på `AGENTS.md`.
Läs mer: [Claude Code memory](https://code.claude.com/docs/en/memory),
[agents.md](https://agents.md) och [AGENTS.md i Codex](https://developers.openai.com/codex/guides/agents-md).

**Plan mode.** Agenten läser och föreslår en plan utan att ändra något. Du växlar med
`Shift+Tab` i Claude Code. Läs mer: [Common workflows](https://code.claude.com/docs/en/common-workflows).

**Behörigheter.** Agenten frågar innan den kör kommandon eller ändrar filer, och du
godkänner eller nekar. Läs mer: [Configure permissions](https://code.claude.com/docs/en/permissions).

**Kommandon.** Inbyggda kommandon som börjar med `/`, till exempel `/clear`, `/model` och
`/usage`. Skills kan också startas så, till exempel `/kickoff`. Läs mer:
[Commands](https://code.claude.com/docs/en/commands).

**Skill.** En mapp med instruktioner (`SKILL.md`) och ibland skript för ett återkommande
arbetsflöde. Agenten läser in den när du startar den med `/namn` eller när den ser att
den passar uppgiften. Skillen körs i din konversation, så du följer varje steg. Läs mer:
[Skills i Claude Code](https://code.claude.com/docs/en/skills),
[Equipping agents with Agent Skills](https://www.anthropic.com/engineering/equipping-agents-for-the-real-world-with-agent-skills),
[Skills i Codex](https://developers.openai.com/codex/skills) och kursen
[Introduction to agent skills](https://anthropic.skilljar.com/introduction-to-agent-skills).

**Subagent.** En separat agent med egna instruktioner, egen kontext och ofta en
billigare modell. Din agent ger den en avgränsad uppgift och får bara tillbaka
resultatet, så att din egen kontext inte fylls. Läs mer:
[Subagents i Claude Code](https://code.claude.com/docs/en/sub-agents) och
[Subagents i Codex](https://developers.openai.com/codex/subagents).

**MCP (Model Context Protocol).** En standard för att koppla agenten till externa
verktyg och data, till exempel GitHub, en databas eller dokumentation. Läs mer:
[MCP i Claude Code](https://code.claude.com/docs/en/mcp),
[modelcontextprotocol.io](https://modelcontextprotocol.io) och kursen
[Introduction to Model Context Protocol](https://anthropic.skilljar.com/introduction-to-model-context-protocol).

**Hooks.** Skript som körs automatiskt vid vissa händelser, till exempel en formaterare
efter varje filändring. Överkurs under hackathonet. Läs mer:
[Hooks](https://code.claude.com/docs/en/hooks-guide).

## Skill eller subagent?

| | Skill | Subagent |
|---|---|---|
| **Vad** | Instruktioner för ett arbetsflöde | En separat agent |
| **Kontext** | Körs i din konversation | Egen kontext, du ser bara resultatet |
| **Startas** | Med `/namn` eller när agenten ser att den passar | När du ber om den eller när agenten lämnar över en uppgift |
| **Passar för** | Steg du vill följa och svara på, som kickoff eller att skapa en PR | Avgränsade uppgifter som annars fyller kontexten, som granskning eller sökning |

## Skills och agenter i repot

Repot innehåller några **exempel** på hur man kan effektivisera teamarbetet med agenter:

| Exempel | Vad det gör | Starta (Claude Code) | Starta (Codex) |
|---|---|---|---|
| `kickoff` (skill) | Tar teamet från idé till pushat skelett med arbetspaket och, om ni vill, ett kontrakt. Rekommenderas men är valfri. Tar bort mallmaterialet och sig själv när den är klar | `/kickoff` eller *"kör kickoff"* | `$kickoff` eller *"kör kickoff"* |
| `create-pr` (skill) | Liten PR med kort beskrivning och teamet som granskare. Frågar innan den pushar | `/create-pr` eller *"skapa PR"* | `$create-pr` eller *"skapa PR"* |
| `code-reviewer` (subagent) | Granskar din gren innan PR, eller en teamkamrats PR, och kör teamets quality gates. Hittar buggar, inkonsekvenser, onödig komplexitet och avvikelser från kontrakt och plan, och rapporterar dem som *blockers* och *nits* | `@"code-reviewer (agent)"` eller *"låt code-reviewer granska"* | *"låt code_reviewer granska"* |

Skills ligger i `.agents/skills/` (länkade från `.claude/skills/`), subagenter i
`.claude/agents/` respektive `.codex/agents/`. Subagenter syns inte i `/`-menyn, men du
kan lista dem med `/agents`. Lägger du till en ny agent under en pågående session kan
Claude Code behöva startas om.

> [!NOTE]
> Vi har testat exemplen med Claude Code. Codex-varianterna borde fungera men är
> inte testade. Codex-varianten av `code-reviewer` körs skrivskyddat och granskar därför
> bara koden utan att köra quality gates.

De är tänkta som utgångspunkt, inte regler. **Ändra dem** så att de passar ert sätt att
jobba, och **skapa egna** när ni märker att ni gör samma sak flera gånger, till exempel
att starta och testa hela flödet eller generera testdata. Be er kodagent hjälpa till:
*"Skapa en skill som …"*.

## Läs mer

- [Best practices för Claude Code](https://code.claude.com/docs/en/best-practices) från
  Anthropic, med arbetsflöden från konfiguration till parallella sessioner.
- [Claude Code in Action](https://anthropic.skilljar.com/claude-code-in-action), en gratis
  kurs från Anthropic Academy.
- [Dokumentationen för Codex](https://developers.openai.com/codex) om du använder Codex.
- [Tips för kodagenter](5-tips-kodagenter.md) med arbetssätt för hackathonet.
