#!/bin/zsh
set -euo pipefail

export PATH="/opt/homebrew/opt/openjdk@21/bin:/opt/homebrew/bin:/usr/local/bin:$PATH"
# Publishing is an automated flow: Git output must print and continue rather
# than opening an interactive `less` screen that waits for the user to press q.
export GIT_PAGER=cat

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
APP="$ROOT/apps/current"
BRANCH="$(git -C "$ROOT" branch --show-current)"
REMOTE_URL="$(git -C "$ROOT" remote get-url origin 2>/dev/null || true)"
LIVE_URL="https://learn-the-guitar.web.app"
REQUIRED_FIREBASE_VARIABLES=(
  VITE_FIREBASE_API_KEY
  VITE_FIREBASE_AUTH_DOMAIN
  VITE_FIREBASE_PROJECT_ID
  VITE_FIREBASE_STORAGE_BUCKET
  VITE_FIREBASE_MESSAGING_SENDER_ID
  VITE_FIREBASE_APP_ID
  VITE_FIREBASE_APP_CHECK_SITE_KEY
)

fail() {
  echo
  echo "Cannot publish: $1"
  exit 1
}

echo "Guitar Academy publisher"
echo "========================"
echo

command -v git >/dev/null 2>&1 || fail "Git is not installed."
command -v gh >/dev/null 2>&1 || fail "GitHub CLI is not installed."
command -v npm >/dev/null 2>&1 || fail "Node.js and npm are not installed."
[ -d "$APP" ] || fail "apps/current could not be found."
[ "$BRANCH" = "main" ] || fail "the current Git branch is '$BRANCH'. Switch to main before publishing."
[ -n "$REMOTE_URL" ] || fail "the GitHub origin remote is not configured."
[ -f "$APP/.env.local" ] || fail "apps/current/.env.local is missing. Follow apps/current/docs/pixel-sync-setup.md first."

if [ -n "$(git -C "$ROOT" diff --name-only --diff-filter=U)" ]; then
  fail "there are unresolved Git conflicts. Resolve them before publishing."
fi

echo "GitHub: $REMOTE_URL"
echo "Live app: $LIVE_URL"
echo
echo "The following repository changes will be included:"
echo
if [ -n "$(git -C "$ROOT" status --porcelain)" ]; then
  git -C "$ROOT" status --short
else
  echo "  No uncommitted changes; the current main branch will be redeployed."
fi
echo
echo "This will verify the app, commit every change shown above, push main to GitHub,"
echo "deploy Firebase Hosting, and wait until the live update is complete."
echo
printf "Type PUBLISH to continue: "
read -r confirmation
[ "$confirmation" = "PUBLISH" ] || fail "confirmation was not entered."

echo
echo "Checking GitHub sign-in..."
if ! gh auth status --hostname github.com >/dev/null 2>&1; then
  echo "GitHub needs you to sign in. Your browser will open once."
  gh auth login --hostname github.com --web --git-protocol https
fi

REPOSITORY="$(cd "$ROOT" && gh repo view --json nameWithOwner --jq '.nameWithOwner')"
[ -n "$REPOSITORY" ] || fail "the GitHub repository could not be identified."

echo
echo "Checking GitHub for newer work..."
git -C "$ROOT" fetch origin main
if ! git -C "$ROOT" merge-base --is-ancestor origin/main HEAD; then
  fail "GitHub contains work that is not in this checkout. Reconcile it before publishing."
fi

if [ ! -d "$APP/node_modules" ]; then
  echo
  echo "Installing application dependencies..."
  (cd "$APP" && npm ci)
fi

echo
echo "Running music, application, Firebase-rule, and production checks..."
(cd "$APP" && npm run test && npm run test:rules && npm run build)

echo
echo "Keeping Firebase cloud sync configured..."
for name in "${REQUIRED_FIREBASE_VARIABLES[@]}"; do
  value="$(awk -F= -v target="$name" '
    $1 == target {
      value = substr($0, index($0, "=") + 1)
      sub(/^[[:space:]]+/, "", value)
      sub(/[[:space:]]+$/, "", value)
      print value
      exit
    }
  ' "$APP/.env.local")"
  [ -n "$value" ] || fail "$name is missing from apps/current/.env.local."
  print -rn -- "$value" | gh variable set "$name" --repo "$REPOSITORY"
done
echo "Firebase cloud sync settings are ready."

created_release=0
if [ -n "$(git -C "$ROOT" status --porcelain)" ]; then
  # This repository is public, and the line below stages everything without
  # review. `.env.local` is ignored today, but an ignore rule is the only thing
  # standing between a credential file at a new path and a public commit, so the
  # names are checked here as well. Calm Week's deploy script does the same.
  changed_files="$(
    {
      git -C "$ROOT" diff --name-only
      git -C "$ROOT" diff --cached --name-only
      git -C "$ROOT" ls-files --others --exclude-standard
    } | sort -u
  )"
  blocked_files="$(printf '%s\n' "$changed_files" | grep -E '(^|/)\.env($|\.)|keystore\.properties$|\.(jks|keystore|pem|p12)$|serviceAccount.*\.json$' | grep -Ev '(^|/)\.env\.example$|keystore\.properties\.example$' || true)"
  if [ -n "$blocked_files" ]; then
    echo "Refusing to commit files that may contain secrets or signing material:" >&2
    printf '%s\n' "$blocked_files" >&2
    exit 1
  fi

  git -C "$ROOT" add -A
  git -C "$ROOT" diff --cached --check
  echo
  echo "Creating the release commit..."
  git -C "$ROOT" --no-pager diff --cached --stat
  commit_message="Publish Guitar Academy $(date '+%Y-%m-%d %H:%M')"
  git -C "$ROOT" commit -m "$commit_message"
  created_release=1
else
  echo
  echo "No new commit is needed."
fi

echo
echo "Pushing main to GitHub..."
git -C "$ROOT" push origin main

echo
echo "GitHub has received the release. Waiting for Firebase Hosting..."
commit_sha="$(git -C "$ROOT" rev-parse HEAD)"
previous_run_id=""
if [ "$created_release" -eq 0 ]; then
  previous_run_id="$(gh run list \
    --repo "$REPOSITORY" \
    --workflow firebase-hosting-merge.yml \
    --branch main \
    --limit 1 \
    --json databaseId \
    --jq '.[0].databaseId // empty')"
  gh workflow run firebase-hosting-merge.yml --repo "$REPOSITORY" --ref main
fi
run_id=""
for attempt in {1..20}; do
  candidate_run_id="$(gh run list \
    --repo "$REPOSITORY" \
    --workflow firebase-hosting-merge.yml \
    --commit "$commit_sha" \
    --limit 1 \
    --json databaseId \
    --jq '.[0].databaseId // empty')"
  if [ -n "$candidate_run_id" ] && [ "$candidate_run_id" != "$previous_run_id" ]; then
    run_id="$candidate_run_id"
  fi
  [ -n "$run_id" ] && break
  sleep 3
done
[ -n "$run_id" ] || fail "GitHub did not start the Firebase deployment. Check https://github.com/$REPOSITORY/actions."

gh run watch "$run_id" --repo "$REPOSITORY" --exit-status

echo
echo "Published successfully: $LIVE_URL"
echo "Your phone will download the new version automatically. If the app was already"
echo "open, bring it to the foreground; it will reload when the update is ready."
