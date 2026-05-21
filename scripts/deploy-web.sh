#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DEFAULT_CADDY_ADDR="https://www.dpodoesnt.work"
DOCKERD_LOG="${KIRIGAMI_DOCKERD_LOG:-/tmp/kirigami-dockerd.log}"
DOCKER_DATA_ROOT="${KIRIGAMI_DOCKER_DATA_ROOT:-/opt/kirigami-docker}"
DOCKER_EXEC_ROOT="${KIRIGAMI_DOCKER_EXEC_ROOT:-/run/kirigami-docker-exec}"
DOCKER_FALLBACK_HOST="${KIRIGAMI_DOCKER_HOST:-unix:///run/kirigami-docker.sock}"

cd "$ROOT_DIR"

KIRIGAMI_CADDY_ADDR="${KIRIGAMI_DEPLOY_CADDY_ADDR:-$DEFAULT_CADDY_ADDR}"
KIRIGAMI_API_BASE_URL="${KIRIGAMI_DEPLOY_API_BASE_URL:-http://backend:8000}"
NEXT_PUBLIC_API_BASE_URL="${KIRIGAMI_DEPLOY_NEXT_PUBLIC_API_BASE_URL:-}"
KIRIGAMI_API_UPSTREAM="${KIRIGAMI_API_UPSTREAM:-backend:8000}"
KIRIGAMI_WEB_UPSTREAM="${KIRIGAMI_WEB_UPSTREAM:-frontend:3000}"
KIRIGAMI_CORS_ORIGINS="${KIRIGAMI_CORS_ORIGINS:-http://localhost:3000,http://127.0.0.1:3000,https://localhost,https://127.0.0.1,https://www.dpodoesnt.work}"
KIRIGAMI_CORS_ORIGIN_REGEX="${KIRIGAMI_CORS_ORIGIN_REGEX:-https://(www\.dpodoesnt\.work|localhost|127\.0\.0\.1|0\.0\.0\.0|10\.\d+\.\d+\.\d+|172\.(1[6-9]|2\d|3[0-1])\.\d+\.\d+|192\.168\.\d+\.\d+)}"

export KIRIGAMI_CADDY_ADDR
export KIRIGAMI_API_BASE_URL
export NEXT_PUBLIC_API_BASE_URL
export KIRIGAMI_API_UPSTREAM
export KIRIGAMI_WEB_UPSTREAM
export KIRIGAMI_CORS_ORIGINS
export KIRIGAMI_CORS_ORIGIN_REGEX

if ! docker info >/dev/null 2>&1; then
  if ! command -v dockerd >/dev/null 2>&1; then
    echo "Docker daemon is not running and dockerd is not on PATH." >&2
    echo "Start Docker Desktop or enter an environment with dockerd available." >&2
    exit 127
  fi

  export DOCKER_HOST="$DOCKER_FALLBACK_HOST"
  DOCKER_SOCKET="${DOCKER_HOST#unix://}"

  if [[ -f /tmp/kirigami-dockerd-launch.pid ]]; then
    kill "$(cat /tmp/kirigami-dockerd-launch.pid)" >/dev/null 2>&1 || true
  fi

  mkdir -p "$DOCKER_DATA_ROOT" "$DOCKER_EXEC_ROOT" "$(dirname "$DOCKER_SOCKET")" "$(dirname "$DOCKERD_LOG")"
  rm -f "$DOCKER_SOCKET" /tmp/kirigami-dockerd.pid /tmp/kirigami-dockerd-launch.pid

  mkdir -p "$(dirname "$DOCKERD_LOG")"
  nohup dockerd \
    --host "$DOCKER_HOST" \
    --data-root "$DOCKER_DATA_ROOT" \
    --exec-root "$DOCKER_EXEC_ROOT" \
    --pidfile /tmp/kirigami-dockerd.pid \
    ${KIRIGAMI_DOCKERD_ARGS:-} \
    >"$DOCKERD_LOG" 2>&1 &
  echo $! > /tmp/kirigami-dockerd-launch.pid

  for _ in $(seq 1 60); do
    if docker info >/dev/null 2>&1; then
      break
    fi
    sleep 1
  done
fi

if ! docker info >/dev/null 2>&1; then
  echo "Docker daemon did not become ready. Log: $DOCKERD_LOG" >&2
  exit 1
fi

echo "Docker host: ${DOCKER_HOST:-$(docker context show)}"
if [[ -n "${DOCKER_HOST:-}" ]]; then
  echo "Docker data root: $DOCKER_DATA_ROOT"
fi

export COMPOSE_PARALLEL_LIMIT="${COMPOSE_PARALLEL_LIMIT:-1}"

docker compose build backend
docker compose build frontend
docker compose build caddy
docker compose up -d --build
