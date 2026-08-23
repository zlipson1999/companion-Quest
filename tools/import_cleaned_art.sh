#!/usr/bin/env bash
# Companion Quest — one-shot import of cleaned Horizon masters + contact sheets
# Usage:
#   1. Download horizon_cleaned_assets.zip (or lineups_key.zip) from the chat
#   2. Put the zip in the repo root (or pass its path as $1)
#   3. Run:  bash tools/import_cleaned_art.sh [path/to/zip]
#   4. git add + commit + push

set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

ZIP="${1:-horizon_cleaned_assets.zip}"
if [[ ! -f "$ZIP" ]]; then
  echo "Zip not found: $ZIP"
  echo "Download it from the chat, place it in the repo root, then re-run."
  exit 1
fi

TMP=$(mktemp -d)
trap 'rm -rf "$TMP"' EXIT

echo "Extracting $ZIP ..."
unzip -q -o "$ZIP" -d "$TMP"

mkdir -p tools/reference_art/horizon_cleaned tools/lineups tools/sprites_96

# Masters (transparent, centered)
if [[ -d "$TMP/horizon_clean" ]]; then
  cp -v "$TMP"/horizon_clean/*.png tools/reference_art/horizon_cleaned/ 2>/dev/null || true
elif [[ -d "$TMP/horizon_cleaned" ]]; then
  cp -v "$TMP"/horizon_cleaned/*.png tools/reference_art/horizon_cleaned/ 2>/dev/null || true
fi

# Contact sheets / lineups
if [[ -d "$TMP/lineups" ]]; then
  cp -v "$TMP"/lineups/*.png tools/lineups/ 2>/dev/null || true
fi

# Optional 96px sprites
if [[ -d "$TMP/sprites_96" ]]; then
  cp -v "$TMP"/sprites_96/*.png tools/sprites_96/ 2>/dev/null || true
fi

echo ""
echo "Done. Files now in:"
echo "  tools/reference_art/horizon_cleaned/  ($(ls tools/reference_art/horizon_cleaned/*.png 2>/dev/null | wc -l) pngs)"
echo "  tools/lineups/                        ($(ls tools/lineups/*.png 2>/dev/null | wc -l) pngs)"
echo "  tools/sprites_96/                     ($(ls tools/sprites_96/*.png 2>/dev/null | wc -l) pngs)"
echo ""
echo "Next:"
echo "  git add tools/reference_art/horizon_cleaned tools/lineups tools/sprites_96"
echo "  git status"
echo "  git commit -m \"Add cleaned Horizon masters (transparent) + contact sheets\""
echo "  git push origin main"
