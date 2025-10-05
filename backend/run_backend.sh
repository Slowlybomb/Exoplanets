#!/usr/bin/env bash
set -euo pipefail

# Resolve project root (one level up from this script)
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

cd "$PROJECT_ROOT"

if [[ -z "${VIRTUAL_ENV:-}" && -f ".venv/bin/activate" ]]; then
  echo "Activating project virtual environment (.venv)" >&2
  # shellcheck disable=SC1091
  source .venv/bin/activate
fi

export FLASK_APP="backend.app:app"
export FLASK_RUN_HOST="${FLASK_RUN_HOST:-0.0.0.0}"
export FLASK_RUN_PORT="${FLASK_RUN_PORT:-5000}"

exec flask run "$@"
