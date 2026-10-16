---
name: kickoff
description: Kick off a team project at NOIR's conference hackathon – team and idea, requirements, architecture and stack, work packages, data model and optional contract, scaffold, clean-up and push. Use when the team starts a new project from this template, when the user says "kickoff"/"kör kickoff", or when AGENTS.md has no Project section yet.
---

# Kickoff

Take a team of 2–4 people from an empty template repo to a pushed, runnable skeleton with
a shared plan – **in ~30 minutes**. One person (the driver) runs this; the team discusses
and answers together.

## Ground rules

- **Talk in the team's language** (usually Swedish); write team docs in it too. Code,
  identifiers and commit messages in English. If the team asks for another language
  (e.g. via the skill arguments), use it for the questions, the chat and the team docs,
  and translate the Swedish example wording and templates accordingly.
- **Keep it short.** Ask only the questions in
  [references/questions.md](references/questions.md). Otherwise *propose* and let the
  team say "ok" or adjust. Use a structured question tool (e.g. AskUserQuestion) for questions with real
  options, except in step 1, which is one plain chat message.
- **Summarize before every decision.** The team approves from the chat, not by reading
  files. Before each question, give a short summary of what you propose, the key
  choices and how they serve the idea. Link the files for later reading.
- **Answer options.** Use the question tool only when there are at least two real
  choices, since it rejects a question with a single option. A plain approval goes in
  the chat as text instead, e.g. "Ser det bra ut? Svara ok, eller skriv vad ni vill
  ändra." The tool always adds a free-text answer, so don't add an option that only says
  "adjust" or "write in Other".
- **Timebox.** If the team hesitates, propose a decision.
- **The team decides who does what.** The agent proposes the *split* into work packages;
  the team chooses who takes which. Suggest an assignment only if asked.
- **Skeleton, not features.** Scaffolding produces services that start, answer a health
  check and return stub data – features are built afterwards.
- **Commit as you go.** When a step is approved, commit its files locally with a
  Conventional Commit. Approved adjustments later become new commits. Push once, in
  step 9, and only after the team explicitly says yes.
- **Resume, don't restart.** If earlier work exists, continue from the first unfinished
  step: `docs/spec.md` with only the requirements means step 3, with *Teknik* step 4;
  `docs/contract/models.md` means step 5 is done, `compose.yaml` step 6 and
  `docs/plan.md` step 7. Ask again for step-1 answers you can't find in the files.
- Read when needed: `konferens/1-uppgift.md` (idea bank, rules), `konferens/2-teknik.md`,
  `starter/compose/`, `starter/data/README.md`.

## Steps

| # | Step | Team input |
|---|---|---|
| 0 | Overview and tools | ok on the steps |
| 1 | Team and idea | **answers** in one reply |
| 2 | Requirements | ok / adjust, until approved |
| 3 | Architecture and stack | ok / adjust, until approved |
| 4 | Work packages | **ok on the split** |
| 5 | Data model and contract (optional) | **contract or not**, then ok |
| 6 | Scaffold | discuss who does what meanwhile |
| 7 | Assign and document | **who takes which package** |
| 8 | Clean up template material | ok / adjust |
| 9 | Wrap up and push | final ok |

### 0. Overview and tools

Start by showing the team, concisely, what you will do, so everyone knows what is going
on. A numbered list with one short line per step, in the team's language, e.g.:

1. Team och idé: ni svarar på några snabba frågor.
2. Krav: ni väljer vinkel på idén, sedan MVP och huvudflöde. Jag föreslår, ni justerar tills det känns rätt.
3. Arkitektur och teknik, inklusive vad ni vill lära er eller undvika.
4. Arbetspaket: lika många som ni har datorer.
5. Datamodell och, om ni vill, ett kontrakt för gränssnitten mellan paketen.
6. Skelett: tjänster, `compose.yaml`, `.env.example`, `.gitignore` och data.
7. Vem gör vad, plus `docs/plan.md`, `AGENTS.md` och README.
8. Städning: tar bort mallmaterial som `starter/` och kickoff-skillen.
9. Sammanfattning och push till `main`, först efter ert ok.

Add one line: you commit locally after each approved step and push only in step 9. Ask
for an ok on the steps before continuing (see references/questions.md).

Then run `scripts/check-prereqs.sh` (in this skill's directory) from the repo root.
Report only blockers in one or two lines. Don't fix machines now.

### 1. Team and idea

Ask the step-1 questions in references/questions.md together, in one plain chat message
with numbered questions, so the team answers everything in one reply: members with
GitHub usernames, number of workers (computers coding at the same time) and idea. Don't
split them between chat text and the question tool, since a free-text question easily
gets lost next to a tool question. If the team gives no GitHub usernames, accept that
and write `TBD` where they go.

### 2. Requirements

Settle *what* to build before *how*. First, show two or three angles on the chosen idea,
one line each, that differ in how users interact with it or what it focuses on (e.g. a
chat vs. a dashboard), not in who the users are. Let the team pick or combine them
(see references/questions.md). Skip the angles if the team already described an angle
of its own.

Then present, in one compact message, the chosen angle as you understand it, adapted
from the idea bank or the team's own idea:
- **Problem and users** – one sentence. Unless the team's own idea says otherwise, users
  are NOIR's consultants (software engineers) themselves. Keep the
  competence-development angle.
- **MVP** – what should work after ~2 hours of parallel work (3–5 bullets).
- **Main user flow** – 3–4 steps.
- **Out of scope and stretch goals** – tempting things to skip, and what to add if time
  allows.

An idea from the idea bank is a starting point, not a fixed spec. Push back on an MVP
that the workers can't build in parallel in ~2 hours. Invite changes (see
references/questions.md), apply them and show the updated version until the team
approves. Then write the requirements part of `docs/spec.md` (template in
[references/templates.md](references/templates.md)) and commit it.

### 3. Architecture and stack

Propose in one compact message:
- **Architecture** – a table of components (responsibility, language/framework, port)
  and one line on how a request or event flows through them in the main user flow. Start
  from that flow and choose the fewest components that serve it: usually one backend
  with modules inside, plus a frontend if users work in a browser. Add a separate
  service only for a concrete reason (another language or runtime, an independent
  pipeline step such as a Kafka consumer, or the team wants to learn microservices).
  Never add services just to match the number of workers – work packages can be modules
  within one component.
- **Stack details** – infra from `starter/compose/` (only what the MVP needs), AI usage if
  any (optional – local model by default). Defaults in
  [references/stacks.md](references/stacks.md).
- **Versions** – one version per language runtime and main framework (current stable or
  LTS), preferably one the members already have installed (step 0 output). Everyone
  uses the same versions; pin them during scaffolding.
- **Data** – check whether the synthetic data in `starter/data/` (consultant profiles,
  assignment requests, job ads, skill taxonomy) fits the idea. Use or adapt it, or plan
  to generate more data in the same style. A member's own profile is ok if they
  volunteer.

Then ask about the team's tech wishes, now that a concrete proposal is on the table,
with concrete alternatives to the proposal (see references/questions.md). Apply changes
until the team approves, then add the technology, architecture and data parts of
`docs/spec.md`, including the team's wishes, and commit. Nothing is scaffolded before this step is approved.

### 4. Work packages

Propose **exactly as many work packages as workers** (see
[references/work-split.md](references/work-split.md)), using the component and interface
names from step 3 without detailed schemas. For each: name, owned paths, interfaces it
provides/consumes, MVP tasks in order, stretch tasks. Show them as a table. If you
suggest pairs instead (e.g. 4 people as 2 pairs), say clearly that this changes the
number of workers and packages.

**Wait for an explicit ok on the split** before continuing; don't start the contract or
scaffolding in the same message. Ask the team to decide among themselves who takes
which package while you write the data model (and contract, if wanted) and scaffold.

### 5. Data model and contract (optional)

A contract lets everyone build in parallel against stubs, but takes time to write and
often drifts once the team starts building. Explain this in two lines and ask whether
the team wants one now (see references/questions.md). Recommend it when work packages
meet at an API, a Kafka topic or a shared model.

- **No contract:** write only the shared data model in `docs/contract/models.md`.
  Summarize the main models in the chat (one line each), get an ok, commit it and
  continue with step 6. In step 7, note in `docs/plan.md` that interfaces are agreed
  between owners as they go.
- **Contract:** write the shared data model and `docs/contract/` (templates in
  [references/templates.md](references/templates.md)), summarize and commit as below.

The contract covers only what crosses boundaries between the approved work packages:
HTTP APIs (`openapi.yaml`), Kafka topics (`events.md`), shared models (`models.md`),
module interfaces or agent tool signatures. Concrete fields, types and one example each.

Then summarize in the chat, without pasting the files:
1. One sentence on what the contract is: the agreed interfaces between the parts, so
   everyone can build in parallel against stubs.
2. The main models with their key fields (one line each).
3. A short table of endpoints, events or functions: what, between which components,
   and its role in the main flow.
4. The main user flow mapped to the calls, e.g. "Sök Kafka → `GET /api/resources?q=kafka`".
5. Two or three decisions worth a second look (ids, errors, pagination, naming).

Optionally offer a visual view of `openapi.yaml` (don't wait for it):
- with a container runtime:
  `podman run --rm -p 8090:8080 -e SWAGGER_JSON=/spec/openapi.yaml -v "$PWD/docs/contract:/spec:ro,Z" docker.io/swaggerapi/swagger-ui`
  and open http://localhost:8090 (or `docker run …`);
- otherwise paste the file into https://editor.swagger.io or use the IDE's OpenAPI
  preview;
- after scaffolding, FastAPI services also show their API at `/docs`.

Get an ok and commit the contract.

### 6. Scaffold

Build the walking skeleton (details in references/stacks.md):
- `services/<name>/` per component: minimal project, `Dockerfile`, `GET /health`,
  config from env, stubbed endpoints (from the contract if there is one), one trivial
  test, linter and formatter (quality gates), short README.
- Root `compose.yaml`: copy needed infra from `starter/compose/*.yaml` and add the team's
  services. No `include:`.
- Pin the agreed versions (see references/stacks.md) and commit lock files.
- `.env.example` with all variables; `cp .env.example .env` if missing.
- `.gitignore`: add the dependency, build and cache folders of the chosen stacks (see
  references/stacks.md) and check that `git status` shows no generated files.
- Data: copy the files the team chose from `starter/data/` into `data/` (same layout,
  since `starter/` is removed in step 8), and generate anything extra there.
- Quick verification (keep it short): `compose config`; if the runtime works, build, start
  and hit each health endpoint. Note failures in `docs/plan.md` under "Kända problem"
  instead of overrunning the timebox.
Parallelize per service (e.g. subagents) when available. Commit the skeleton in a few
cohesive commits, e.g. one per component plus one for compose and env.

### 7. Assign and document

Ask who takes which package (required). If the team asks for a suggestion, propose one.
Then write and commit:
- `docs/plan.md` – team table (name, GitHub handle or `TBD`, package, branch
  `<name>/<topic>`), packages with tasks, shared files, integration milestones, and
  without a contract a note that interfaces are agreed between owners as they go.
  Start each package's tasks with task 0 for what the skeleton already provides, marked
  done. Drop tasks the skeleton fully covers and rewrite partly covered ones as the
  remaining work, so task 1 is the first real feature.
- `AGENTS.md` – replace the `## Project` placeholder (template in references/templates.md),
  including the team table with GitHub handles or `TBD` (used by `create-pr` to add
  reviewers), the setup every member needs and the quality-gate commands.
- `README.md` – short project README with the commands to start, stop and run the
  quality gates, for the team's chosen tools; keep a link to `konferens/`.

### 8. Clean up template material

Remove what only served the template, so teammates and their agents see only the
project. Show the list below, adapted to what exists, and get an ok before deleting.
Delete the kickoff skill last, right before the commit, since you still follow it in
step 9:
- `starter/`: the needed compose snippets are already in `compose.yaml` and the chosen
  data is in `data/`.
- The kickoff skill: `.agents/skills/kickoff/` and the `.claude/skills/kickoff` link.
- `AGENTS.md`:
  - rewrite *Context* for the project (no template, `starter/` or kickoff references);
  - remove the kickoff exception under *Team rules → Git*;
  - remove the `kickoff` line under *Skills and agents*.
- `.env.example`: variables for infrastructure or providers the project doesn't use.
- `.gitignore`: the organizer block (`.claude/plans/`) and blocks for stacks the project
  doesn't use. Keep the secrets, Claude Code and OS sections.

Keep `konferens/` (schedule and material for the day; its links to `starter/` point to
the template repo on GitHub), `create-pr`, `code-reviewer` and everything under
*Project*. Check that nothing else refers to removed paths, e.g. with
`git grep -n -e starter/ -e kickoff -- ':!konferens'`, then commit the clean-up on its
own, e.g. `chore: remove template material after kickoff`, so it is easy to revert.

### 9. Wrap up and push

1. Summarize what was done in at most ~8 short lines: what you build, the components,
   the contract if any, where the data is, what was verified and what was cleaned up.
2. Run `git branch --show-current` and `git remote get-url origin`, then ask in one
   question for final adjustments or an ok to push, naming the branch and the remote
   (see references/questions.md). Commit approved adjustments as new commits and ask
   again. If the branch isn't `main`, or `origin` is the template repo itself
   (`Noir-Consultancy/noir-konferens-ht26` in SSH or HTTPS form), warn clearly and offer
   instead not to push, or to push to a separate branch. If there is no `origin`, ask for
   the team repo URL or skip the push. Never push the kickoff result to the template's
   `main`.
3. Push only after a clear yes, then remind the driver to check that every member has
   write access to the repo (*Settings → Collaborators and teams*). If someone can't be added, ask the organizers.
4. End with a **numbered** list of next steps, one short line each:
   1. Everyone: `git pull`, install what's missing from *Project → Setup* in
      `AGENTS.md` (their agent can check), then start their agent in the repo: it
      briefs them on their part and where they are, and helps create their branch.
   2. One line per member: name, branch and first task (task 1 in `docs/plan.md`).
      Each feature starts with a short plan in `docs/tasks/`.
   3. If any GitHub username is `TBD`: add it to `docs/plan.md` and `AGENTS.md`, since
      `create-pr` uses them to add reviewers.
   4. `create-pr` and `code-reviewer` are examples to adapt, or create new skills for
      recurring tasks.
