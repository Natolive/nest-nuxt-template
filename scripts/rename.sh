#!/bin/sh
# Renomme le template pour un nouveau projet : `scripts/rename.sh <identifiant> "<Nom affiché>"`.
# Ex. `scripts/rename.sh mon-projet "Mon Projet"` : `socle` → `mon-projet` (paquets npm, Docker, base, cookie),
# `Socle` → `Mon Projet` (nom affiché dans l'appli, les emails et l'application d'authentification).
# À lancer une fois, juste après avoir créé le dépôt depuis le template.
set -eu
slug=${1:-}
name=${2:-}
if ! printf '%s' "$slug" | grep -Eq '^[a-z][a-z0-9-]*$' || [ -z "$name" ]; then
  echo 'Usage : scripts/rename.sh <identifiant en minuscules, ex. mon-projet> "<Nom affiché>"' >&2
  exit 1
fi
cd "$(dirname "$0")/.."
# Fichiers suivis par git uniquement (ni node_modules, ni .git), sauf ce script ; aucun nom de fichier n'a d'espace.
git ls-files | grep -v '^scripts/rename.sh$' | xargs grep -l -e socle -e Socle | SLUG="$slug" NAME="$name" xargs perl -pi -e 's/Socle/$ENV{NAME}/g; s/socle/$ENV{SLUG}/g'
echo "Renommé en $slug ($name). Ensuite : docker compose up -d --build -V, puis adapter README.md (partie 1) et la marque."
