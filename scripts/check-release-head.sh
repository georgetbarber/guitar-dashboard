#!/usr/bin/env bash
set -euo pipefail

# The deployment workflow holds the live concurrency lock while checking and
# publishing. Older reruns may acquire that lock later, so check the remote head
# as well as serialising deployments. A failed lookup also stops publication.
if [[ "${GITHUB_REF:-}" != "refs/heads/main" ]]; then
  echo "Release refused: only main may publish to the live site." >&2
  exit 1
fi
checkout_sha="$(git rev-parse HEAD)"
remote_head="$(git ls-remote --exit-code origin refs/heads/main)"
remote_sha="${remote_head%%[[:space:]]*}"
if [[ -z "${GITHUB_SHA:-}" || "$checkout_sha" != "$GITHUB_SHA" || "$remote_sha" != "$GITHUB_SHA" ]]; then
  echo "Release refused: this checkout is no longer the current main commit. Run the workflow for current main." >&2
  exit 1
fi
echo "Release is the current main commit."
