#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")"

echo "Building frontend (static export)..."
(cd apps/web && npm ci && npm run build)

echo "Copying frontend build to kirigami/static..."
rm -rf kirigami/static
cp -r apps/web/out kirigami/static

echo "Deploying to FastAPI Cloud..."
uv run fastapi cloud deploy
