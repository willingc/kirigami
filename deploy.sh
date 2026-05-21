#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")"

PYTHON_VERSION="${KIRIGAMI_PYTHON_VERSION:-3.13}"
FRONTEND_FORBIDDEN_API_PATTERNS=(
  "http://127.0.0.1:8000"
  "http://localhost:8000"
  "https://127.0.0.1:8000"
  "https://localhost:8000"
)

load_env_file() {
  local env_file="$1"
  [[ -f "$env_file" ]] || return 0

  while IFS= read -r line || [[ -n "$line" ]]; do
    line="${line#"${line%%[![:space:]]*}"}"
    line="${line%"${line##*[![:space:]]}"}"
    [[ -z "$line" || "${line:0:1}" == "#" ]] && continue
    [[ "$line" == export\ * ]] && line="${line#export }"

    local key="${line%%=*}"
    local value="${line#*=}"
    key="${key%"${key##*[![:space:]]}"}"
    value="${value#"${value%%[![:space:]]*}"}"

    [[ "$key" =~ ^[A-Za-z_][A-Za-z0-9_]*$ ]] || continue
    if [[ "$value" =~ ^\".*\"$ || "$value" =~ ^\'.*\'$ ]]; then
      value="${value:1:${#value}-2}"
    fi

    if [[ -z "${!key+x}" ]]; then
      export "$key=$value"
    fi
  done < "$env_file"
}

load_env_file ".env"

if [[ -z "${FASTAPI_CLOUD_TOKEN:-}" || -z "${FASTAPI_CLOUD_APP_ID:-}" ]]; then
  echo "FastAPI Cloud deploy requires FASTAPI_CLOUD_TOKEN and FASTAPI_CLOUD_APP_ID." >&2
  echo "Set them in .env from .env.dist or export them in the shell." >&2
  exit 2
fi

echo "Syncing Python environment from uv.lock..."
uv sync --python "$PYTHON_VERSION" --locked

echo "Building frontend (static export)..."
(
  cd apps/web
  npm ci
  NEXT_PUBLIC_API_BASE_URL= KIRIGAMI_API_BASE_URL= npm run build
)

echo "Verifying frontend API URLs..."
for pattern in "${FRONTEND_FORBIDDEN_API_PATTERNS[@]}"; do
  if grep -R -F -q "$pattern" apps/web/out; then
    echo "Frontend static export contains forbidden API URL: $pattern" >&2
    echo "NEXT_PUBLIC_API_BASE_URL and KIRIGAMI_API_BASE_URL must be empty for FastAPI Cloud." >&2
    exit 3
  fi
done

echo "Copying frontend build to kirigami/static..."
rm -rf kirigami/static
cp -r apps/web/out kirigami/static

echo "Deploying to FastAPI Cloud..."
uv run --python "$PYTHON_VERSION" --locked fastapi cloud deploy --app-id "$FASTAPI_CLOUD_APP_ID"
