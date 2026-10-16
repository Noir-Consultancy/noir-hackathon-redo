# Questions

These are the only questions to ask. Everything else is proposed by the agent and
confirmed with "ok". Swedish wording suggestions in quotes.

Use the question tool only for questions with at least two real options, since it
rejects a question with a single option. A plain approval is asked as text in the chat,
and the team answers "ok" or writes what to change. The tool always adds a free-text
answer, so never add a separate "adjust" option.

## Step 0 – Overview

After the numbered list of steps, ask as text: "Ser stegen bra ut? Svara ok så kör vi."

## Step 1 – Team and idea (one plain chat message)

Ask all three as numbered questions in one chat message, not with the question tool, so
the team answers everything in one reply:

1. "Vilka är med i teamet? Skriv namn och GitHub-användarnamn." Handles are used for PR
   reviewers, e.g. `Anna Andersson @anna-a, Erik Ek @erik-e`. Without them, write `TBD`.
2. "Hur många datorer kommer att koda samtidigt? (2, 3 eller 4)" Pairs on one computer
   count as one. Decides the number of work packages.
3. "Vilken idé vill ni bygga?" List the four ideas from `konferens/1-uppgift.md`, one
   line each, and add "eller beskriv en egen idé".

## Step 2 – Requirements

First: "Vilken vinkel vill ni ta?" Use the question tool with multiple choice allowed
(to combine) and the two or three angles as options. Don't mark one as recommended,
since the choice is the team's.

After the proposal, ask as text: "Vill ni ändra eller lägga till något i idén eller
kraven innan vi går vidare till arkitektur och teknik?" Apply changes and ask again until
the team says ok.

## Step 3 – Architecture and stack

After the first proposal: "Något ni vill lära er, använda eller undvika? Vill ni ändra
arkitektur eller stack?" Use the question tool with multiple choice allowed, the proposal
as the first option ("Ok, kör på förslaget") and one to three concrete alternatives that
fit the idea, e.g. "Utan Kafka", "Java/Spring istället för Python", "Lägg till Postgres",
"Agent med ADK". After applying changes, show the updated proposal and ask as text until
the team says ok: "Något mer att ändra? Svara ok eller skriv vad."

## Step 4 – Work packages

Ask as text and wait for the answer before continuing: "Passar uppdelningen? Svara ok
innan jag går vidare. Bestäm gärna sinsemellan vem som tar vilket paket medan jag
skriver datamodellen (och kontraktet, om ni vill) och sätter upp skelettet."

## Step 5 – Data model and contract (optional)

First: "Vill ni skriva ett kontrakt för gränssnitten nu, eller komma igång direkt och
bestämma dem under vägen?" Options: "Ja, ett litet kontrakt" · "Nej, bara datamodellen".
Put the one you recommend first.

With a contract, summarize (see SKILL.md), then: "Stämmer datamodellen och kontraktet?"
Options: Ok · "Visa API:t i Swagger UI först" (container or editor.swagger.io, see
SKILL.md).

Without a contract, summarize the models, then ask as text: "Stämmer datamodellen? Svara
ok eller skriv vad ni vill ändra."

## Step 7 – Assign

| # | Question | Required | Notes |
|---|---|---|---|
| 1 | "Vem tar vilket paket?" | **Yes** | If the team asks, propose an assignment based on the wishes from step 3. |
| 2 | "Vill ni att jag skapar GitHub-issues för uppgifterna?" | No | Options: ja · nej (default nej). |

## Step 8 – Clean up

"Jag tar bort mallmaterial som inte behövs längre: <lista>. Okej?" Options:
"Ok, ta bort allt" · "Behåll `starter/`".

## Step 9 – Wrap up

After the summary: "Vill ni justera något, eller ska jag pusha `main` till
`<origin-url>` nu?" Options: "Pusha `main` till `<repo>`" · "Vänta, vi vill justera".
Push only on a clear yes; after adjustments, ask again.

If the branch isn't `main` or `origin` is the template repo, first explain the problem in
one sentence, e.g. "`origin` pekar på mallrepot, inte ert teamrepo." or "Ni står på
`<gren>`, inte `main`." Options: "Pusha inte" · "Pusha till en egen gren" (e.g.
`kickoff/skeleton`). If there is no `origin`, ask as text for the team repo URL.
