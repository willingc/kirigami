#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DOCKERD_LOG="${KIRIGAMI_DOCKERD_LOG:-/tmp/kirigami-dockerd.log}"
DOCKER_DATA_ROOT="${KIRIGAMI_DOCKER_DATA_ROOT:-/opt/kirigami-docker}"
DOCKER_EXEC_ROOT="${KIRIGAMI_DOCKER_EXEC_ROOT:-/run/kirigami-docker-exec}"
DOCKER_HOST="${DOCKER_HOST:-unix:///run/kirigami-docker.sock}"
DOCKER_SOCKET="${DOCKER_HOST#unix://}"

export DOCKER_HOST

cd "$ROOT_DIR"

if ! docker info >/dev/null 2>&1; then
  if ! command -v dockerd >/dev/null 2>&1; then
    echo "Docker daemon is not running and dockerd is not on PATH." >&2
    echo "Enter the Nix shell first: nix develop" >&2
    exit 127
  fi

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

echo "Docker host: $DOCKER_HOST"
echo "Docker data root: $DOCKER_DATA_ROOT"

export COMPOSE_PARALLEL_LIMIT="${COMPOSE_PARALLEL_LIMIT:-1}"

docker compose build backend
docker compose build frontend
docker compose build caddy
docker compose up -d --build
