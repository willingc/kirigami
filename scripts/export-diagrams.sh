#!/usr/bin/env bash
# Regenerate PNG exports for MkDocs vision diagram pages.
set -euo pipefail
cd "$(dirname "$0")/.."

mkdir -p docs/images

npx --yes excalidraw2png convert docs/kirigami-vision.excalidraw \
  -o docs/images/kirigami-vision-overview.png --scale 2

npx --yes excalidraw2png convert docs/kirigami-vision-author-flow.excalidraw \
  -o docs/images/kirigami-vision-author-flow.png --scale 2

echo "Exported:"
echo "  docs/images/kirigami-vision-overview.png"
echo "  docs/images/kirigami-vision-author-flow.png"
