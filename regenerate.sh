#!/usr/bin/env bash
#
# Regenerates the whole icon set from the official npm packages.
#
#   ./regenerate.sh            downloads the packages, then rebuilds everything
#   ./regenerate.sh --offline  rebuilds from an already downloaded .cache/
#
# Sources of truth: protocols.json, products.json, roles.json. Add an entry,
# run this again, that is all.
#
set -euo pipefail

cd "$(dirname "$0")"

CACHE=".cache"
OFFLINE=0
[[ "${1:-}" == "--offline" ]] && OFFLINE=1

# Pinned versions: a reproducible icon set does not depend on "latest".
TABLER_VERSION="${TABLER_VERSION:-3.46.0}"
LUCIDE_VERSION="${LUCIDE_VERSION:-1.34.0}"
SIMPLE_VERSION="${SIMPLE_VERSION:-16.28.0}"
PLEX_VERSION="${PLEX_VERSION:-5.3.0}"   # IBM Plex Sans, to vectorise the labels

command -v node >/dev/null || { echo "node is required (>= 18)"; exit 1; }
command -v npm  >/dev/null || { echo "npm is required"; exit 1; }

fetch() { # fetch <package> <version> <target-directory>
  local pkg="$1" version="$2" dest="$3"
  if [[ -d "$CACHE/$dest/package" ]]; then
    echo "  ✓ $pkg@$version (already cached)"
    return
  fi
  if [[ $OFFLINE -eq 1 ]]; then
    echo "  ✗ $pkg missing from the cache and --offline was requested" >&2
    exit 1
  fi
  echo "  ↓ $pkg@$version"
  mkdir -p "$CACHE/$dest"
  ( cd "$CACHE" && npm pack "$pkg@$version" --silent >/dev/null )
  local tgz
  tgz=$(ls "$CACHE"/*.tgz | head -1)
  tar xzf "$tgz" -C "$CACHE/$dest"
  rm -f "$tgz"
}

echo "→ Fetching the packages"
fetch "@tabler/icons"  "$TABLER_VERSION" "tabler"
fetch "lucide-static"  "$LUCIDE_VERSION" "lucide"
fetch "simple-icons"   "$SIMPLE_VERSION" "simple-icons"
fetch "@fontsource/ibm-plex-sans" "$PLEX_VERSION" "plex"

echo "→ Text vectorisation dependency"
[[ -d node_modules/opentype.js ]] || npm install --silent --no-audit --no-fund

echo "→ Extracting the raw glyphs (sources/)"
node scripts/build.mjs
node scripts/verify-docs.mjs

echo "→ Assembling the lockups (lockups/, symbols/)"
node scripts/lockups.mjs

echo "→ Editor libraries (drawio/, excalidraw/)"
node scripts/drawio.mjs
node scripts/excalidraw.mjs
node scripts/excalidraw-grammar.mjs

echo "→ Example views (docs/)"
node scripts/example.mjs
node scripts/example-layers.mjs
node scripts/example-systems.mjs
node scripts/example-custody.mjs
node scripts/dark.mjs
# after the views: it reads what they recorded
node scripts/drawio-examples.mjs

echo "→ README figures (docs/figures/)"
node scripts/readme-figures.mjs

echo "→ Specimen sheets (specimen/, docs/)"
node scripts/specimen-lockups.mjs
node scripts/specimen.mjs
node scripts/specimen-candidates.mjs
node scripts/specimen-fills.mjs
node scripts/specimen-accent.mjs
node scripts/specimen-arrows.mjs
node scripts/styles.mjs

echo
echo "Done. The npm cache is in $CACHE/ (ignored by git) —"
echo "remove it with: rm -rf $CACHE"
