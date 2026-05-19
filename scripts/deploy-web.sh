#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
API_HOST="${KIRIGAMI_API_HOST:-127.0.0.1}"
API_PORT="${KIRIGAMI_API_PORT:-8000}"
WEB_HOST="${KIRIGAMI_WEB_HOST:-127.0.0.1}"
WEB_PORT="${KIRIGAMI_WEB_PORT:-3000}"
CADDY_ADDR="${KIRIGAMI_CADDY_ADDR:-:8443}"
PYTHON_VERSION="${KIRIGAMI_PYTHON_VERSION:-3.13}"
if [[ "$CADDY_ADDR" == :* ]]; then
  CADDY_DISPLAY_ADDR="0.0.0.0${CADDY_ADDR}"
else
  CADDY_DISPLAY_ADDR="$CADDY_ADDR"
fi

cleanup() {
  if [[ -n "${CADDY_PID:-}" ]]; then
    kill "$CADDY_PID" >/dev/null 2>&1 || true
  fi
  if [[ -n "${WEB_PID:-}" ]]; then
    kill "$WEB_PID" >/dev/null 2>&1 || true
  fi
  if [[ -n "${API_PID:-}" ]]; then
    kill "$API_PID" >/dev/null 2>&1 || true
  fi
}
trap cleanup EXIT INT TERM

if ! command -v caddy >/dev/null 2>&1; then
  echo "caddy is required for mise run deploy. Install it first, then rerun this task." >&2
  exit 127
fi

cd "$ROOT_DIR"

uv run --python "$PYTHON_VERSION" --extra web uvicorn kirigami.api:app \
  --app-dir src \
  --host "$API_HOST" \
  --port "$API_PORT" &
API_PID=$!

NEXT_PUBLIC_API_BASE_URL="" npm run build --prefix apps/web

NEXT_PUBLIC_API_BASE_URL="" \
KIRIGAMI_API_BASE_URL="http://${API_HOST}:${API_PORT}" \
npm run start --prefix apps/web -- --hostname "$WEB_HOST" --port "$WEB_PORT" &
WEB_PID=$!

KIRIGAMI_CADDY_ADDR="$CADDY_ADDR" \
KIRIGAMI_API_UPSTREAM="${API_HOST}:${API_PORT}" \
KIRIGAMI_WEB_UPSTREAM="${WEB_HOST}:${WEB_PORT}" \
caddy run --config "$ROOT_DIR/Caddyfile" --adapter caddyfile &
CADDY_PID=$!

echo "Kirigami deploy is running at https://${CADDY_DISPLAY_ADDR}"
echo "Backend:  http://${API_HOST}:${API_PORT}"
echo "Frontend: http://${WEB_HOST}:${WEB_PORT}"

while true; do
  if ! kill -0 "$API_PID" >/dev/null 2>&1; then
    wait "$API_PID"
    exit $?
  fi
  if ! kill -0 "$WEB_PID" >/dev/null 2>&1; then
    wait "$WEB_PID"
    exit $?
  fi
  if ! kill -0 "$CADDY_PID" >/dev/null 2>&1; then
    wait "$CADDY_PID"
    exit $?
  fi
  sleep 1
done
