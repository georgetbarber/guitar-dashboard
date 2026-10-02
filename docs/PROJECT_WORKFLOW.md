# Project workflow

## Which version am I seeing?

There are three different states:

| Place | Meaning |
| --- | --- |
| This Finder folder | The checked-out branch plus any uncommitted edits. `PREVIEW_LOCAL.command` shows this version. |
| GitHub `main` | The shared source record and the version the live release workflow tries to deploy. A push or merge changes it. |
| Live website and installed app | The most recent successful Firebase deployment. `OPEN_LIVE.command` opens the website and shows the latest GitHub release attempt. The installed app may wait for you to accept an update. |

GitHub `main` can be newer than the live website when release checks fail. The
live website can also change outside this workflow; the command reports GitHub
deployment evidence rather than claiming a byte-for-byte proof of its contents.

Learning progress, sketches and recordings are **user data**, not source code.
Publishing does not move them. Signed-in structured learning data follows the
app's Firebase sync rules; recordings stay on the device unless one is
explicitly shared through the separately configured feature.

## Working with Codex, Claude Code, or another editor

1. Start from the latest GitHub `main` when beginning a new piece of work. Give
   it its own branch and a name such as `codex/fix-navigation`.
2. Keep one purpose per branch. Before switching tools, ask the tool to show
   the branch name, changed files and recent commits. `SAVE_WORK.command`
   reviews the changed file list, asks for a descriptive message and creates a
   local commit. A commit is a snapshot; it is not a publication. Save only
   when all listed files belong in that commit.
3. If another machine or cloud editor has pushed work, bring that work into
   this branch and resolve any overlap before release. The publisher stops if
   GitHub `main` contains work this checkout has not seen.
4. Review the source diff and run relevant checks. Draft lessons and other
   unfinished work can remain on a branch. Do not release them merely because
   they are committed.
5. When a branch is approved for release, use `PUBLISH_LIVE.command`. On a
   feature branch it publishes **only the committed branch tip**. Uncommitted
   edits stay in this Finder folder. On `main`, it offers to commit the entire
   displayed change list, so inspect that list before typing `PUBLISH`.

Every editor that uses this same Finder folder sees the same files and Git
branch. Cloud work may live in another checkout or branch; it does not appear
here until its commits are fetched and reconciled. Never overwrite a branch or
force-push to solve a mismatch. Keep the separate history and resolve it.

## What publishing does

`PUBLISH_LIVE.command` checks GitHub for newer commits, verifies local `main`
changes when applicable, checks the Firebase web configuration, and pushes the
selected committed version to GitHub `main`. GitHub Actions runs the complete
release checks, deploys security rules and Firebase Hosting, and reports a
successful or failed result. The command waits for that result. It cannot make
cloud edits, local drafts, code deployment and personal learning data into one
automatic state; each has its own history and sync rules.

If a check fails, GitHub `main` may have the new code while the website remains
on the older successful deployment. Open `OPEN_LIVE.command` to see the
distinction and follow the failed Actions link. Fix the failed check on the
source branch, then run the publisher again.

See [publishing](PUBLISHING.md) for Firebase and first-run setup.
