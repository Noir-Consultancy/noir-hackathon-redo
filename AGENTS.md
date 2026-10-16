# AGENTS.md

Instructions for coding agents (Claude Code, Codex, etc.) working in this repository.

## Context

This repository is Kunskapsriket, a team project built by four people during the
hackathon at NOIR's autumn conference 2026, in about two hours of development time,
using coding agents throughout. See the Project section below.

- Conference material (Swedish) lives in `konferens/`. Read it for context; do not modify it.
- World content (zones, mentors, quests, cards, achievements) lives in `data/world/`.

## Team rules

Agreed by the team. If the user wants to change one, say it's a team rule and offer to
draft a proposal (e.g. a small PR to `AGENTS.md`) instead of changing it.

### Scope, packages and contract

- **Time-boxed.** Prefer the simplest thing that works. Avoid gold-plating, premature
  abstractions and large refactors.
- **Own package.** Each member owns specific services or modules (see `docs/plan.md`).
  Edit only your own package. For a change elsewhere, ask its owner. Stub what you
  depend on instead of waiting. Shared files (`compose.yaml`, `.env.example`, `docs/`)
  are the exception: change them in small separate commits and tell the team.
- **Contract, if the team has one.** Interfaces between components (APIs, event
  schemas, shared data models) may be defined in `docs/contract/`. If so, implement
  against it and don't change it silently: agree changes with the affected teammates
  and commit them separately. Without a contract, agree interfaces with their owner as
  you go.

### Configuration and LLM access

- **Configuration via environment.** Never hardcode secrets or endpoints. Add new
  variables to `.env.example` with a safe default or placeholder. Never commit `.env`.
- **LLM access.** By default, talk to models through an OpenAI-compatible API configured
  by `LLM_BASE_URL`, `LLM_MODEL` and `LLM_API_KEY`, so the runtime (Ollama, other local
  runtimes, Gemini, etc.) can be swapped without code changes. If the chosen framework
  or SDK uses its own provider settings instead, configure those via environment
  variables too and document them in `.env.example`.

### Versions and dependencies

Everyone needs the tools and versions under *Project → Setup*. Use the pinned versions
and commit lock files. Adding a dependency to your own package (e.g. a test library) is fine; mention it
in the PR. Raise it with the team only when it affects others: changing a pinned runtime
or framework version, changing or removing something others use, or editing shared
files.

### Containers

Each service lives in `services/<name>/` with its own `Dockerfile` and is wired into the
root `compose.yaml`. Compose files must work with both Podman and Docker (do not use
`include:`). Local LLMs run natively on the host rather than in a container, on every
OS. Containers reach them via `host.containers.internal` (Podman) or
`host.docker.internal` (Docker).

### Language

Code, identifiers, commit messages and agent instructions in English. User-facing text
and team docs may be in Swedish.

### Quality gates

Before committing, run the project's tests, linter and formatter (commands under
*Project → Commands*) and fix what fails. If a gate is missing for code you add, suggest
adding it.

### Git

- Branch per task: `<name>/<short-topic>`, e.g. `anna/quiz-api`.
- All work goes through branches and PRs.
- **Ask before pushing.** Commit locally as you go, but never run `git push` (or merge a
  PR) without the user's explicit ok in the current conversation. Say which branch it
  goes to. This applies especially to pushes to `main`.
- Small, cohesive commits using Conventional Commits:
  `feat(api): add quiz endpoint`, `fix(ui): handle empty results`, `docs: update contract`.
- Bring `main` into your branch often with `git fetch origin && git merge origin/main`.
  Prefer merge over rebase, so conflicts are resolved once and no force-push is needed.
- Never rewrite history on or force-push to `main`.
- Keep PRs small: one task per PR. Suggest opening one (see the `create-pr` skill) when
  a task is done. PRs are merged with a regular merge commit (not squash).
- Start the next task on a new branch from an updated `main`, or from the previous task
  branch if its PR isn't merged yet and you need its changes (say so in the PR, and
  merge `origin/main` once it is).

## Personal defaults

Each member may adjust these. Apply the user's changes for the session and, if they
want, save them in one gitignored file: `CLAUDE.local.md` (Claude Code loads it) or
`AGENTS.local.md` (read it if present). Never put personal preferences in shared files.
Personal preferences may tighten team rules, not loosen them. When the user corrects the same thing
twice, suggest saving it.

### Session start

Once the Project section is filled in, start every session (new, or after `/clear`)
like this, before any planning or code. The user leads; skip anything they wave off.

1. **Who.** Identify the user from `git config user.name` and `user.email`,
   `gh api user -q .login` (if available) and the branch name, matched against the team
   table. If there is no clear match, ask in one line.
2. **Current state.** Check quietly, where present: current branch and uncommitted
   changes, the user's latest task plan in `docs/tasks/`, their open and recently merged
   PRs (`gh pr list --author @me --state all`, if available), their tasks in
   `docs/plan.md` and what is new on `origin/main` that affects them. In a first session
   (no preferences file, branch or task plan of theirs yet), also check the tools and
   versions under *Project → Setup*; later, only when something fails.
3. **Briefing** (≤ 6 lines, user's language): the project in one sentence the first
   time; their package; where they are now. In a first session, add each setup blocker
   or version mismatch with a fix or workaround (install nothing without the user's ok),
   and one line on the defaults: branch per task, a short plan per feature, PR when
   done; say if you want to work differently.
4. **Next step.** Show their open tasks in order and ask what they want to do: the next task,
   something else, or an idea of their own. Don't pick for them.

### Communication

- **The user leads.** They decide direction, scope and when to move on. For creative or
  open choices (what to build next, what a feature should do or look like, UX, prompts,
  approach), ask for the user's ideas first, or offer two or three genuinely different
  alternatives and let them choose or combine. Mark your recommendation if you have one,
  but don't present it as the default path. For routine choices (naming, lint fixes,
  following the agreed plan), just proceed. If the user would rather have you propose,
  do that.
- **Brief.** Short bullets, no long recaps. Offer more detail rather than giving it unasked.
- **Transparent.** Before a larger step, say in one line what you will do and why;
  afterwards, what changed and what's next.
- **Help when things seem unclear.** If the user seems unsure or something is ambiguous,
  don't guess: offer the help that fits, e.g. an explanation, a clarifying question, an
  example or a few alternatives. One at a time, not everything at once.

### Task workflow

1. **Pick** a task with the user: the next one from their part of `docs/plan.md`, or an
   idea of their own. Check that it is about one feature (one small PR); if larger,
   propose splitting it first. Then create its branch `<name>/<short-topic>`.
2. **Plan.** Ask how the user sees the task first (goal, what it should do or look
   like), then fill in the approach together. For a feature, write a short plan in
   `docs/tasks/<name>-<NN>-<topic>.md` (`NN` = 01, 02 … per member): goal, approach,
   files, contract parts used or changed, how to test. Bug fixes and small tweaks don't
   need one. Get the user's ok before building.
3. **Build** in small commits. Keep the plan updated if the
   approach changes.
4. **PR** when the task is done: open it and link the plan, if there is one.
5. **Next task.** When the user's planned tasks are done, ask whether the user has an
   idea of their own; otherwise offer one or two candidates, e.g. from *Utbyggnader* or
   *Utanför scope* in `docs/spec.md`, *Kända problem* in `docs/plan.md` or integration
   gaps. Agree on one and continue from step 1; no need to add it to `docs/plan.md`.
   Anything that changes another package or the shared scope needs the team's ok.

## Skills and agents

These are examples. The team may change them or add new ones for recurring tasks.
- `create-pr` skill (`.agents/skills/create-pr/`): small PR with teammates as reviewers.
- `code-reviewer` subagent (`.claude/agents/`, `.codex/agents/`): reviews the current
  branch before a PR is opened, or a teammate's PR by number, and runs the quality gates
  on checked-out code. It reports blockers and nits, including deviations from contract
  and plan. Present all its findings to the user. When reviewing an existing PR, offer to
  post some or all of them as a PR comment (`gh pr comment`), and post only after the
  user agrees.

## Project

**Kunskapsriket** – an exploratory 2D RPG where senior developers learn AI concepts and
modern ways of working by talking to AI mentor agents, completing quests and collecting
knowledge cards. Spec: `docs/spec.md` · Plan and ownership: `docs/plan.md` · Contract:
`docs/contract/` · Tasks: GitHub issues #1–#13.

### Team
| Name | GitHub | Owns |
|---|---|---|
| Oskar | @skrlssn | 1. Game world: `services/web/src/game/` |
| Emma | @emra | 2. UI and HUD: `services/web/src/ui/`, `services/web/src/api/` |
| Robert | @robertocus | 3. Mentor agents: `services/api/app/npc/`, `services/api/app/world/`, `data/world/zones.yaml`, `data/world/mentors.yaml` |
| Daniel | @DMillevik | 4. Quests and progression: `services/api/app/quests/`, `services/api/app/progress/`, `data/world/quests.yaml`, `cards.yaml`, `achievements.yaml` |

### Components
| Service | Path | Stack | Port |
|---|---|---|---|
| web | services/web | TypeScript, Vite, Phaser 3 (nginx in compose, proxies `/api` → api) | 8000 |
| api | services/api | Python 3.13, FastAPI, LangGraph, langchain-openai | 8001 |
| postgres | (image) | PostgreSQL 18 (pgvector image) | 5432 |

### Setup
Tools and versions every member needs: Python 3.13 via uv, Node 24 LTS, Docker or Podman
with compose, and an LLM: Ollama on the host with a chat model that supports tool
calling (`ollama pull <model>`, set `LLM_MODEL`), or a cloud key (see `.env.example`).
Versions are pinned in `services/api/.python-version` and `services/web/.nvmrc`. Then
`cp .env.example .env` (Podman users: set `LLM_BASE_URL_CONTAINER` to
`http://host.containers.internal:11434/v1`).

### Commands
- Start everything: `docker compose up -d --build` (or `podman compose …`), open http://localhost:8000
- Stop everything: `docker compose down` (or `podman compose …`)
- Run a service locally: see `services/<name>/README.md` (api: `uv run uvicorn app.main:app --reload --port 8001`, web: `npm run dev`)
- Quality gates (run before committing):
  - api: `cd services/api && uv run pytest && uv run ruff check && uv run ruff format --check`
  - web: `cd services/web && npm test && npm run lint && npm run build`

### Conventions
- JSON fields in `snake_case`; content ids are slugs (`ada`, `q-ada-1`), player ids UUIDs.
- World content lives in `data/world/*.yaml`; server-only fields (`persona`, `criteria`,
  `rule`) are never sent to the client.
- Game and UI talk only via the bus in `services/web/src/events.ts`.
- User-facing text (game, mentors) in Swedish.
