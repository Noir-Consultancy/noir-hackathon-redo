#!/usr/bin/env bash
# Checks the tools needed for the conference hackathon. Never fails hard:
# prints one line per check (OK / MISSING / WARN) so the agent can summarize.
# Usage: run from the repo root: .agents/skills/kickoff/scripts/check-prereqs.sh

ok()   { printf '%-8s %s\n' "OK" "$*"; }
miss() { printf '%-8s %s\n' "MISSING" "$*"; }
warn() { printf '%-8s %s\n' "WARN" "$*"; }
has()  { command -v "$1" >/dev/null 2>&1; }

echo "== Required"

if has git; then ok "git $(git --version | awk '{print $3}')"; else miss "git"; fi

if git remote get-url origin >/dev/null 2>&1; then
  ok "git remote origin: $(git remote get-url origin)"
else
  warn "no git remote 'origin' – create the team repo from the template first"
fi

echo "== Container runtime (needed to run compose)"

runtime=""
if has podman; then
  runtime=podman
  if podman info >/dev/null 2>&1; then ok "podman (running)"; else warn "podman installed but not running (podman machine start)"; fi
elif has docker; then
  runtime=docker
  if docker info >/dev/null 2>&1; then ok "docker (running)"; else warn "docker installed but daemon not running"; fi
else
  miss "container runtime (podman or docker)"
fi
if [ -n "$runtime" ]; then
  if $runtime compose version >/dev/null 2>&1; then ok "$runtime compose"; else miss "$runtime compose (compose provider)"; fi
fi

echo "== GitHub CLI (optional, used by create-pr)"

if has gh; then
  if gh auth status >/dev/null 2>&1; then ok "gh (logged in)"; else warn "gh installed but not logged in (gh auth login)"; fi
else
  warn "gh (GitHub CLI) not found – PRs can be created on github.com instead"
fi

echo "== LLM (optional)"

base_url="${LLM_BASE_URL:-}"
if [ -z "$base_url" ] && [ -f .env ]; then
  base_url="$(grep -E '^LLM_BASE_URL=' .env | tail -n1 | cut -d= -f2- | tr -d "\"'")"
fi
base_url="${base_url:-http://localhost:11434/v1}"
if has curl && curl -fsS --max-time 3 "${base_url%/}/models" >/dev/null 2>&1; then
  ok "LLM endpoint reachable: $base_url"
else
  warn "LLM endpoint not reachable: $base_url (fine if the team uses no AI or a cloud key)"
fi
if has ollama; then ok "ollama installed"; fi

echo "== Language tooling (install what the chosen stack needs)"

if has uv; then ok "uv $(uv --version 2>/dev/null | awk '{print $2}')"; else warn "uv (Python) not found"; fi
if has node; then ok "node $(node --version)"; else warn "node not found"; fi
# macOS ships a /usr/bin/java stub without a JDK, so check that java actually runs.
if has java && java -version >/dev/null 2>&1; then ok "java $(java -version 2>&1 | head -n1 | awk -F'"' '{print $2}')"; else warn "java (JDK) not found"; fi
if has dotnet; then ok "dotnet $(dotnet --version 2>/dev/null)"; else warn "dotnet not found"; fi

exit 0
