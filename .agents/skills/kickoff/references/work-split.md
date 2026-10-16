# Work packages

Goal: each worker (a person, or a pair on one computer) can build for ~2 hours with
minimal waiting and minimal merge conflicts.

## How to split

1. **One package per worker.** The number of packages equals the number of computers
   coding at the same time (step 1). Never more.
2. **Cut along the interfaces.** Each package owns one side of an API, a Kafka topic, an
   agent/tool, a module or a UI, with clear owned paths (`services/<name>/`, a module
   directory inside a service, `frontend/` …). If two packages must edit the same
   files, re-cut.
3. **Packages follow the architecture from step 3, not the other way round.** Modules
   within one backend make good packages. Don't add services to get more packages.
   Prefer vertical slices or modules over tightly coupled layers. A frontend/backend
   split is fine when the API between them is small and stable.
4. **Every package can start immediately** – consumers work against stubs returning the
   examples from the contract or data model; producers build the real thing.
5. **The skeleton is the thin path.** Scaffolding (step 6) gives every package a thin
   end-to-end path: stubbed endpoints, a minimal UI and the wiring. The first task is
   the first real feature on top of it, so it doesn't overlap the skeleton. MVP tasks
   before stretch tasks. Keep each task to about one feature, small enough for one
   small PR.
6. **Spread the glue.** Small cross-cutting work (compose wiring, synthetic data) goes
   into the package that is closest to it – don't create a package that is only glue.

## Typical shapes

| Workers | Shape |
|---|---|
| 2 | Backend (API, data, AI) · frontend. Or one vertical slice each. |
| 3 | Two backend modules (e.g. ingest and processing/AI, or data/API and AI) · frontend. |
| 4 | Three backend modules or slices · frontend, if the idea has them. Otherwise suggest **2 pairs** and 2 packages (then workers = 2). |

## Presenting the split

Show a table: package · owns (paths) · provides/consumes (interfaces) · first task. Do not
put names in it – the team decides who takes which package. If asked for a suggestion,
match packages to the wishes from step 3.

## Shared files

`compose.yaml`, `.env.example`, `AGENTS.md`, `docs/contract/`, root README: small separate
commits, merged quickly, announced to the team. Contract changes need the ok of at least
the producer and consumer.

## Red flags – re-cut if

- a package has no task that can start before another finishes,
- two packages own the same directory,
- any package's MVP needs more than ~2 hours,
- nobody is responsible for wiring the main flow together end to end.
