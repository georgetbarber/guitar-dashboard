#!/bin/bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "Save this folder's changes as a local Git commit"
echo "==============================================="
branch="$(git branch --show-current)"
[ -n "$branch" ] || { echo "Switch to a branch before saving."; exit 1; }
[ -z "$(git diff --name-only --diff-filter=U)" ] || { echo "Resolve Git conflicts before saving."; exit 1; }
if [ -z "$(git status --porcelain)" ]; then
  echo "Nothing has changed on $branch."
  exit 0
fi

echo "Branch: $branch"
echo "Files to include:"
git status --short
echo
echo "Review the list above. This saves a local snapshot; it does not publish."
read -r -p "Commit message (what changed): " message
[ -n "$message" ] || { echo "No message entered. Nothing was saved."; exit 1; }
read -r -p "Type SAVE to include all listed files: " confirmation
[ "$confirmation" = "SAVE" ] || { echo "Cancelled. Nothing was saved."; exit 1; }

changed_files="$(
  {
    git diff --name-only
    git diff --cached --name-only
    git ls-files --others --exclude-standard
  } | sort -u
)"
blocked_files="$(printf '%s\n' "$changed_files" | grep -E '(^|/)\.env($|\.)|keystore\.properties$|\.(jks|keystore|pem|p12)$|serviceAccount.*\.json$' | grep -Ev '(^|/)\.env\.example$|keystore\.properties\.example$' || true)"
if [ -n "$blocked_files" ]; then
  echo "These files may contain secrets or signing material and cannot be saved by this command:"
  printf '%s\n' "$blocked_files"
  exit 1
fi

git add -A
git diff --cached --check
git commit -m "$message"
echo
echo "Saved locally on $branch. This commit has not been pushed or published."
