"""Configuration from environment variables (see .env.example in the repo root)."""

import os
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[3]

WORLD_DIR = Path(os.environ.get("WORLD_DIR", REPO_ROOT / "data" / "world"))
DATABASE_URL = os.environ.get("DATABASE_URL", "postgresql://app:app@localhost:5432/app")
LLM_BASE_URL = os.environ.get("LLM_BASE_URL", "http://localhost:11434/v1")
LLM_MODEL = os.environ.get("LLM_MODEL", "qwen3.6:27b-coding-mxfp8")
LLM_API_KEY = os.environ.get("LLM_API_KEY", "ollama")
