#!/usr/bin/env bash
#
# Régénère l'intégralité du jeu d'icônes depuis les paquets npm officiels.
#
#   ./regenerer.sh            télécharge les paquets puis reconstruit tout
#   ./regenerer.sh --offline  reconstruit depuis un .cache/ déjà téléchargé
#
# Source de vérité : protocoles.json. Ajoutez-y une entrée, relancez, c'est tout.
#
set -euo pipefail

cd "$(dirname "$0")"

CACHE=".cache"
OFFLINE=0
[[ "${1:-}" == "--offline" ]] && OFFLINE=1

# Versions épinglées : un jeu d'icônes reproductible ne dépend pas de "latest".
TABLER_VERSION="${TABLER_VERSION:-3.46.0}"
LUCIDE_VERSION="${LUCIDE_VERSION:-1.34.0}"
SIMPLE_VERSION="${SIMPLE_VERSION:-16.28.0}"
PLEX_VERSION="${PLEX_VERSION:-5.3.0}"   # IBM Plex Sans, pour vectoriser les libellés

command -v node >/dev/null || { echo "node est requis (>= 18)"; exit 1; }
command -v npm  >/dev/null || { echo "npm est requis"; exit 1; }

fetch() { # fetch <paquet> <version> <dossier-cible>
  local pkg="$1" version="$2" dest="$3"
  if [[ -d "$CACHE/$dest/package" ]]; then
    echo "  ✓ $pkg@$version (déjà en cache)"
    return
  fi
  if [[ $OFFLINE -eq 1 ]]; then
    echo "  ✗ $pkg absent du cache et --offline demandé" >&2
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

echo "→ Récupération des paquets"
fetch "@tabler/icons"  "$TABLER_VERSION" "tabler"
fetch "lucide-static"  "$LUCIDE_VERSION" "lucide"
fetch "simple-icons"   "$SIMPLE_VERSION" "simple-icons"
fetch "@fontsource/ibm-plex-sans" "$PLEX_VERSION" "plex"

echo "→ Dépendance de vectorisation du texte"
[[ -d node_modules/opentype.js ]] || npm install --silent --no-audit --no-fund

echo "→ Extraction des glyphes bruts (sources/)"
node scripts/build.mjs

echo "→ Assemblage des lockups (lockups/, symboles/)"
node scripts/lockups.mjs

echo "→ Planches de specimen (specimen/)"
node scripts/specimen-lockups.mjs
node scripts/specimen.mjs
node scripts/styles.mjs

echo
echo "Terminé. Le cache npm est dans $CACHE/ (ignoré par git) —"
echo "supprimez-le avec : rm -rf $CACHE"
