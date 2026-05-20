#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DEFAULT_CADDY_ADDR="https://www.dpodoesnt.work"
CERT_DIR="${KIRIGAMI_CERT_DIR:-$ROOT_DIR/deploy/certs}"
TLS_CERT_FILE="${KIRIGAMI_TLS_CERT_FILE:-$CERT_DIR/kirigami.crt}"
TLS_KEY_FILE="${KIRIGAMI_TLS_KEY_FILE:-$CERT_DIR/kirigami.key}"
DOCKERD_LOG="${KIRIGAMI_DOCKERD_LOG:-/tmp/kirigami-dockerd.log}"
DOCKER_DATA_ROOT="${KIRIGAMI_DOCKER_DATA_ROOT:-/opt/kirigami-docker}"
DOCKER_EXEC_ROOT="${KIRIGAMI_DOCKER_EXEC_ROOT:-/run/kirigami-docker-exec}"
DOCKER_HOST="${DOCKER_HOST:-unix:///run/kirigami-docker.sock}"
DOCKER_SOCKET="${DOCKER_HOST#unix://}"

export DOCKER_HOST

cd "$ROOT_DIR"

env_file_value() {
  local name="$1"
  if [[ -f .env ]]; then
    awk -F= -v name="$name" '$1 == name { sub(/^[^=]*=/, ""); print; exit }' .env
  fi
}

cert_host() {
  local raw="${KIRIGAMI_CADDY_ADDR:-$(env_file_value KIRIGAMI_CADDY_ADDR)}"
  raw="${raw:-$DEFAULT_CADDY_ADDR}"
  raw="${raw#http://}"
  raw="${raw#https://}"
  raw="${raw%%/*}"
  raw="${raw%%:*}"
  raw="${raw:-${DEFAULT_CADDY_ADDR#https://}}"
  printf '%s' "$raw"
}

cert_san() {
  local san="${KIRIGAMI_TLS_CERT_SAN:-IP:127.0.0.1,DNS:localhost}"
  local host
  host="$(cert_host)"
  if [[ -n "$host" && "$host" != "0.0.0.0" && "$host" != "*" ]]; then
    if [[ "$host" =~ ^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
      san="IP:$host,$san"
    else
      san="DNS:$host,$san"
    fi
  fi
  printf '%s' "$san"
}

cert_matches_host() {
  local host="$1"
  if [[ ! -f "$TLS_CERT_FILE" || -z "$host" || "$host" == "0.0.0.0" || "$host" == "*" ]]; then
    return 1
  fi

  if [[ "$host" =~ ^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
    openssl x509 -in "$TLS_CERT_FILE" -noout -ext subjectAltName 2>/dev/null | grep -Fq "IP Address:$host"
  else
    openssl x509 -in "$TLS_CERT_FILE" -noout -ext subjectAltName 2>/dev/null | grep -Fq "DNS:$host"
  fi
}

ensure_self_signed_cert() {
  local host
  host="$(cert_host)"

  if [[ -f "$TLS_CERT_FILE" && -f "$TLS_KEY_FILE" ]] && cert_matches_host "$host"; then
    return
  fi

  if ! command -v openssl >/dev/null 2>&1; then
    echo "OpenSSL is required to generate the Caddy self-signed certificate." >&2
    echo "Enter the Nix shell first: nix develop" >&2
    exit 127
  fi

  mkdir -p "$CERT_DIR"
  openssl req \
    -x509 \
    -newkey rsa:2048 \
    -sha256 \
    -days "${KIRIGAMI_TLS_CERT_DAYS:-825}" \
    -nodes \
    -keyout "$TLS_KEY_FILE" \
    -out "$TLS_CERT_FILE" \
    -subj "/CN=${KIRIGAMI_TLS_CERT_CN:-$host}" \
    -addext "subjectAltName=$(cert_san)"
  chmod 600 "$TLS_KEY_FILE"
  chmod 644 "$TLS_CERT_FILE"
}

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

ensure_self_signed_cert

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
