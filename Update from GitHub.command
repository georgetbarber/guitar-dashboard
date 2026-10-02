#!/bin/bash
# Safely fast-forward a clean local main from GitHub main.
set -euo pipefail
cd "$(dirname "$0")"
finish() {
  if [ -t 0 ]; then read -r -p 'Press Return to close. ' _; fi
}
trap finish EXIT
printf 'Update from GitHub — %s\n' "$(basename "$PWD")"
if [ "$(git branch --show-current)" != main ]; then
  printf 'This folder is on a working branch. Switch to main after saving that work.\n' >&2
  exit 1
fi
if [ -n "$(git status --porcelain=v1 --untracked-files=all)" ]; then
  printf 'This folder has unsaved files. Review or save them before updating; nothing was changed.\n' >&2
  git status --short --untracked-files=all
  exit 1
fi
printf 'Checking GitHub main...\n'
git fetch origin main
local_sha="$(git rev-parse HEAD)"
remote_sha="$(git rev-parse origin/main)"
if [ "$local_sha" = "$remote_sha" ]; then
  printf 'Already up to date at %.12s.\n' "$local_sha"
elif git merge-base --is-ancestor HEAD origin/main; then
  git merge --ff-only origin/main
  printf 'Updated this folder to GitHub main at %.12s.\n' "$remote_sha"
else
  printf 'Local main has commits GitHub main does not contain. Review both histories; nothing was replaced.\n' >&2
  exit 1
fi
