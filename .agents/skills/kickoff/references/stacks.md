# Stack defaults

Pick the simplest option that serves the team's learning goals. Use current stable or
LTS versions, agreed in step 3. Every service:

- lives in `services/<name>/` with its own dependency files (no shared root lockfile),
- has a `Dockerfile` (small, non-root where easy, exposes one port),
- reads all config from environment variables (see `.env.example`),
- exposes `GET /health` → `200 {"status":"ok"}` (workers/consumers: a tiny HTTP health
  server or a compose healthcheck command),
- has a `README.md` with: run locally, run tests, environment variables,
- has one trivial test and a linter and formatter configured, so the quality gates
  (test, lint, format check) work from the start,
- pins the agreed language version and commits its lock file, with a Dockerfile base
  image of the same version:

| Stack | Pin version | Lock file |
|---|---|---|
| Python | `.python-version` + `requires-python` | `uv.lock` |
| JS/TS | `.nvmrc` (fnm/nvm read it) + `engines` | `package-lock.json` |
| Java | Gradle/Maven toolchain | Gradle/Maven wrapper |
| .NET | `global.json` + `TargetFramework` | `packages.lock.json` (optional) |

Port convention: assign each service its own host port starting at `8000` (8000, 8001,
…). Avoid `8080`/`8081` (Kafka UI uses `8081`), `8090` (Swagger UI), `5432`, `9092`, `11434` and `11435`.

## Python (default for AI/agent services)

- Tooling: `uv` (`uv init --app`, `uv add …`), `pytest`, `ruff`.
- `.gitignore`: already covered by the template's Python block.
- Quality gates: `uv run pytest`, `uv run ruff check`, `uv run ruff format --check`.
- HTTP API: FastAPI + uvicorn. Agent frameworks: LangChain/LangGraph, CrewAI, Google ADK,
  NeMo Agent Toolkit – only if chosen in step 3.
- Kafka: `confluent-kafka`. Postgres: `psycopg[binary]` (+ `pgvector` if needed).
- RAG: embeddings via the same OpenAI client (`client.embeddings.create(model=EMBEDDING_MODEL, …)`)
  stored in pgvector.
- LLM: `openai` client with `base_url=LLM_BASE_URL`, `api_key=LLM_API_KEY`,
  `model=LLM_MODEL`.

```dockerfile
# Use the Python version pinned in .python-version.
FROM ghcr.io/astral-sh/uv:python3.13-bookworm-slim
WORKDIR /app
COPY pyproject.toml uv.lock ./
RUN uv sync --frozen --no-dev --no-install-project
COPY . .
RUN uv sync --frozen --no-dev
EXPOSE 8000
CMD ["uv", "run", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

## JavaScript / TypeScript

- Backend: Node LTS + Express (Fastify or NestJS if the team prefers), TypeScript via
  `tsx` for dev. Tests: `vitest`.
- Quality gates: `vitest run`, plus Biome (`biome check`) for lint and format.
- `.gitignore`: `node_modules/`, `dist/`, `.next/` (Next.js), `coverage/`, `*.tsbuildinfo`.
- Frontend: Vite + React (or plain HTML/JS for the simplest UI). Use Next.js when the
  team wants a fullstack TypeScript app with UI and API in one component. In dev, use
  Vite's proxy to reach APIs; in compose, serve the built app with a small static
  server or nginx.
- Kafka: `kafkajs`. LLM: `openai` npm package with `baseURL`, or Vercel AI SDK for
  agents and streaming UIs.

## Java

- Spring Boot (Web, Actuator for `/actuator/health`, Spring Kafka, Spring AI if LLM).
  Generate with start.spring.io (`curl https://start.spring.io/starter.zip …`) or Gradle.
- Dockerfile: multi-stage (Gradle/Maven build → `eclipse-temurin:<pinned version>-jre`).
- Note: map the health path in compose/README since it is `/actuator/health`.
- Quality gates: `./gradlew check` (or `./mvnw verify`), with Spotless for formatting.
- `.gitignore`: `build/`, `.gradle/` (Gradle) or `target/` (Maven). Keep the wrapper JAR.
- Agents: LangChain4j or Spring AI.

## .NET

- ASP.NET Core minimal API (`dotnet new web`), health checks via `MapHealthChecks("/health")`.
- Kafka: `Confluent.Kafka`. LLM: `OpenAI` NuGet package with custom endpoint. Agents:
  Microsoft Agent Framework.
- Dockerfile: multi-stage (`mcr.microsoft.com/dotnet/sdk` → `aspnet`).
- Quality gates: `dotnet test`, `dotnet format --verify-no-changes`.
- `.gitignore`: `bin/`, `obj/`, `TestResults/`.

## Compose wiring

- Copy infra services from `starter/compose/*.yaml` verbatim, including healthchecks
  and volumes.
- Team service template:

```yaml
  <name>:
    build: ./services/<name>
    env_file: .env
    environment:              # container-internal addresses override .env
      KAFKA_BOOTSTRAP_SERVERS: kafka:19092
      DATABASE_URL: postgresql://app:app@postgres:5432/app
      LLM_BASE_URL: ${LLM_BASE_URL_CONTAINER:-http://host.containers.internal:11434/v1}
    extra_hosts:
      - "host.docker.internal:host-gateway"   # lets Docker on Linux reach host Ollama
    ports:
      - "8000:8000"
    depends_on:
      kafka:
        condition: service_healthy
```

- Only include `environment`, `extra_hosts` and `depends_on` entries the service needs.
- When an LLM runs natively on the host, add `LLM_BASE_URL_CONTAINER` to `.env.example`
  (Podman: `http://host.containers.internal:11434/v1`, Docker:
  `http://host.docker.internal:11434/v1`).
- Validate with `podman compose config` / `docker compose config`.
