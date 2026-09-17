#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
export npm_config_cache="$ROOT/.npm-cache"

verify_react_app() {
  local directory="$1"
  if [ ! -d "$directory/node_modules" ]; then
    echo "Installing dependencies for ${directory#"$ROOT/"}"
    (cd "$directory" && npm ci)
  fi
  (cd "$directory" && npm test && npm run build)
}

echo "Validating iteration 01: original prototype"
(cd "$ROOT/apps/history/01-original-prototype" && npm run validate)

APPS=(
  "02-typed-react-rebuild"
  "03-relationship-first-dashboard"
  "04-connected-dashboard"
  "05-learning-platform"
  "06-playing-learning"
  "07-practice-first"
)

for app in "${APPS[@]}"; do
  echo "Checking historical iteration: $app"
  verify_react_app "$ROOT/apps/history/$app"
done

echo "Checking current application"
verify_react_app "$ROOT/apps/current"

echo "All application validations passed."
