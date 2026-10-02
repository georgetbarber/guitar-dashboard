#!/bin/bash
set -u

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
LIVE_URL="https://learn-the-guitar.web.app"
REPOSITORY="georgetbarber/guitar-dashboard"

echo "Guitar Academy: live version"
echo "============================"
echo "Live website: $LIVE_URL"
echo "GitHub: https://github.com/$REPOSITORY"
echo

if command -v git >/dev/null 2>&1; then
  echo "This Finder folder:"
  git -C "$ROOT" status --short --branch
  echo
fi

if command -v gh >/dev/null 2>&1; then
  runs="$(gh run list --repo "$REPOSITORY" --workflow firebase-hosting-merge.yml --branch main --limit 30 --json headSha,conclusion,url --jq '.[] | select(.conclusion == "success") | [.headSha[0:7], .url] | @tsv' 2>/dev/null | head -1)"
  latest="$(gh run list --repo "$REPOSITORY" --workflow firebase-hosting-merge.yml --branch main --limit 1 --json headSha,status,conclusion,url --jq '.[0] | [.headSha[0:7], .status, (.conclusion // "pending"), .url] | @tsv' 2>/dev/null)"
  remote="$(gh api "repos/$REPOSITORY/commits/main" --jq '.sha[0:7]' 2>/dev/null)"
  if [ -n "$remote" ]; then echo "GitHub main: $remote"; fi
  if [ -n "$runs" ]; then
    IFS=$'\t' read -r successful_sha successful_url <<< "$runs"
    echo "Latest successful GitHub deployment: $successful_sha"
    echo "  $successful_url"
  fi
  if [ -n "$latest" ]; then
    IFS=$'\t' read -r latest_sha latest_status latest_conclusion latest_url <<< "$latest"
    echo "Latest deployment attempt: $latest_sha ($latest_status, $latest_conclusion)"
    echo "  $latest_url"
  fi
  if [ -n "$remote" ] && [ -n "$runs" ]; then
    if [ "$remote" != "$successful_sha" ]; then
      echo "GitHub main is newer than the latest successful GitHub deployment."
      echo "The website may still show an older version; check the deployment attempt above."
    fi
  fi
  if [ -z "$remote" ] || [ -z "$runs" ]; then
    echo "GitHub deployment status could not be checked here. Open GitHub Actions for details."
  fi
  echo
fi

echo "Opening the live website. This is the published version, not local edits."
if [ "${OPEN_LIVE_NO_BROWSER:-}" != "1" ]; then
  open "$LIVE_URL" || exit 1
fi
