#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
API_HOST="${KIRIGAMI_API_HOST:-127.0.0.1}"
API_PORT="${KIRIGAMI_API_PORT:-8000}"
WEB_HOST="${KIRIGAMI_WEB_HOST:-127.0.0.1}"
WEB_PORT="${KIRIGAMI_WEB_PORT:-3000}"
PYTHON_VERSION="${KIRIGAMI_PYTHON_VERSION:-3.13}"

cleanup() {
  if [[ -n "${API_PID:-}" ]]; then
    kill "$API_PID" >/dev/null 2>&1 || true
  fi
}
trap cleanup EXIT

cd "$ROOT_DIR"
uv run --python "$PYTHON_VERSION" --extra web uvicorn kirigami.api:app \
  --app-dir src \
  --host "$API_HOST" \
  --port "$API_PORT" \
  --reload &
API_PID=$!

cd "$ROOT_DIR/apps/web"
NEXT_PUBLIC_API_BASE_URL="http://${API_HOST}:${API_PORT}" \
KIRIGAMI_API_BASE_URL="http://${API_HOST}:${API_PORT}" \
npm run dev -- --hostname "$WEB_HOST" --port "$WEB_PORT"
