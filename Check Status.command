#!/bin/bash
# Read-only view of this folder, GitHub main, and any live website.
set -u
cd "$(dirname "$0")" || exit 1
project="$(basename "$PWD")"
case "$project" in
  georgebarber-site) label='By George'; live='https://georgebarber.blog/' ;;
  guitar-dashboard) label='Guitar Dashboard'; live='https://learn-the-guitar.web.app/' ;;
  calm-week) label='Calm Week'; live='https://calm-week.web.app/' ;;
  calm-house) label='Calm House'; live='' ;;
  calm-career) label='Calm Career'; live='' ;;
  *) label="$project"; live='' ;;
esac
printf '%s — status\n' "$label"
branch="$(git branch --show-current 2>/dev/null)"
local_sha="$(git rev-parse HEAD 2>/dev/null)"
printf 'This folder: %s at %.12s\n' "${branch:-detached commit}" "$local_sha"
if [ -n "$(git status --porcelain=v1 --untracked-files=all)" ]; then
  printf 'Files changed here:\n'
  git status --short --untracked-files=all
else
  printf 'No unsaved file changes here.\n'
fi
remote_sha="$(GIT_TERMINAL_PROMPT=0 git ls-remote origin refs/heads/main 2>/dev/null | cut -f1)"
if [ -n "$remote_sha" ]; then
  printf 'GitHub main: %.12s' "$remote_sha"
  if [ "$branch" = main ] && [ "$local_sha" = "$remote_sha" ]; then
    printf ' (matches this folder)\n'
  else
    printf ' (different from this folder)\n'
  fi
else
  printf 'GitHub main: unavailable; no files were changed.\n'
fi
if [ -n "$live" ]; then
  http_code="$(curl --location --silent --show-error --output /dev/null --max-time 12 --write-out '%{http_code}' "$live" 2>/dev/null)"
  if [ "$http_code" = 200 ]; then
    printf 'Live website: responding at %s\n' "$live"
  else
    printf 'Live website: could not verify now (HTTP %s).\n' "${http_code:-unavailable}"
  fi
  if [ "$project" = calm-week ] && [ "$http_code" = 200 ] && command -v python3 >/dev/null 2>&1; then
    live_sha="$(curl --location --fail --silent --show-error --max-time 12 "${live}release.json?check=$(date +%s)" 2>/dev/null | python3 -c 'import json,sys; print(json.load(sys.stdin).get("commit", ""))' 2>/dev/null)"
    if [ -n "$live_sha" ]; then
      printf 'Live revision: %.12s' "$live_sha"
      if [ -n "$remote_sha" ] && [ "$live_sha" = "$remote_sha" ]; then
        printf ' (matches GitHub main)\n'
      else
        printf ' (different from GitHub main)\n'
      fi
    fi
  elif [ "$project" = guitar-dashboard ] && command -v gh >/dev/null 2>&1; then
    run="$(gh run list -R georgetbarber/guitar-dashboard --branch main --limit 1 --json headSha,status,conclusion --jq '.[0] | [.headSha[0:12], .status, (.conclusion // "pending")] | @tsv' 2>/dev/null)"
    if [ -n "$run" ]; then
      printf 'Latest release check: %s\n' "$run"
    fi
  elif [ "$project" = georgebarber-site ]; then
    printf 'Cloudflare deployment revision: check the Cloudflare dashboard.\n'
  fi
else
  printf 'Live website: none; this project is local-only.\n'
fi
printf 'This command only checks status.\n'
if [ -t 0 ]; then read -r -p 'Press Return to close. ' _; fi
