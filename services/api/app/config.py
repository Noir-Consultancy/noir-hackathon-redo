"""Configuration from environment variables (see .env.example in the repo root)."""

import os
from pathlib import Path

# Locally: <repo>/data/world (app/ -> api/ -> services/ -> repo). In the container: WORLD_DIR.
WORLD_DIR = Path(
    os.environ.get("WORLD_DIR") or Path(__file__).resolve().parents[3] / "data" / "world"
)
DATABASE_URL = os.environ.get("DATABASE_URL", "postgresql://app:app@localhost:5432/app")
LLM_BASE_URL = os.environ.get("LLM_BASE_URL", "http://localhost:11434/v1")
LLM_MODEL = os.environ.get("LLM_MODEL", "qwen3.6:27b-coding-mxfp8")
LLM_API_KEY = os.environ.get("LLM_API_KEY", "ollama")
