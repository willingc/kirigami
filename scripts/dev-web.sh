#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
API_HOST="${KIRIGAMI_API_HOST:-127.0.0.1}"
API_PORT="${KIRIGAMI_API_PORT:-8000}"
WEB_HOST="${KIRIGAMI_WEB_HOST:-127.0.0.1}"
WEB_PORT="${KIRIGAMI_WEB_PORT:-3000}"
PYTHON_VERSION="${KIRIGAMI_PYTHON_VERSION:-3.13}"
OPEN_BROWSER="${KIRIGAMI_OPEN_BROWSER:-1}"

cleanup() {
  if [[ -n "${API_PID:-}" ]]; then
    kill "$API_PID" >/dev/null 2>&1 || true
  fi
}
trap cleanup EXIT

open_browser_when_ready() {
  if [[ "$OPEN_BROWSER" =~ ^(0|false|no)$ ]]; then
    return
  fi

  local url="http://localhost:${WEB_PORT}"
  (
    if command -v curl >/dev/null 2>&1; then
      for _ in $(seq 1 60); do
        if curl -fsS "http://${WEB_HOST}:${WEB_PORT}" >/dev/null 2>&1; then
          break
        fi
        sleep 1
      done
    else
      sleep 3
    fi

    if [[ "${OSTYPE:-}" == darwin* ]]; then
      open "$url" >/dev/null 2>&1 || true
    elif command -v xdg-open >/dev/null 2>&1; then
      xdg-open "$url" >/dev/null 2>&1 || true
    fi
  ) &
}

cd "$ROOT_DIR"
uv run --python "$PYTHON_VERSION" python -m kirigami migrate

uv run --python "$PYTHON_VERSION" uvicorn kirigami.api:app \
  --host "$API_HOST" \
  --port "$API_PORT" \
  --reload &
API_PID=$!

cd "$ROOT_DIR/apps/web"
open_browser_when_ready

NEXT_PUBLIC_API_BASE_URL="http://${API_HOST}:${API_PORT}" \
KIRIGAMI_API_BASE_URL="http://${API_HOST}:${API_PORT}" \
npm run dev -- --hostname "$WEB_HOST" --port "$WEB_PORT"
