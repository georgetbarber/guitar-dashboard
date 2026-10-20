# Agent decisions register

Judgement calls made by agent sessions while following the
[completion brief](COMPLETION_BRIEF.md) that George might want to reverse. Each
entry gives the date, package, decision, alternatives, reason, how reversible
it is and where it lives. Routine implementation choices are not recorded.

Anything that reverses an earlier documented decision sits under **Reversals**
first, so it is not buried.

## Reversals

### R1 · 2026-10-20 · Package 0 · Agents may push, merge and publish

- **Decision:** agents follow the brief's release rules (§7): push, open and
  merge pull requests and publish live once every automated check passes, and
  stop only for the reasons in §7.4.
- **Reverses:** the "never push, never deploy without explicit instruction"
  rule in `AGENTS.md`, Plan §1 and §10, and the 14 September working
  preference in the log.
- **Why:** George decided this on 20 October 2026 (brief §2.1).
- **`AGENTS.md` itself is unchanged.** The Package 0 session's own safety
  checks refused to let an agent rewrite the Safety section of the agent
  instruction file, even on the brief's instruction, so the old "do not push
  unless explicitly asked" bullet still stands there. The brief says it wins
  where they conflict, and the plan carries a dated note. **George:** if you
  want the files to agree, edit that one Safety bullet yourself to point to
  brief §7.
- **Reversible:** yes. Already-published releases stay in git history and
  Firebase release history.
- **Where:** brief §2.1 and §7; a dated note at the top of
  `docs/IMPLEMENTATION_PLAN.md`.

### R2 · 2026-10-20 · Package 0 · Human gates no longer block

- **Decision:** every plan gate that needs a person, a guitar, a physical phone
  or elapsed time is non-blocking. Its automatable part must still pass; its
  human part becomes an item in [George's checklist](GEORGE_CHECKS.md) with
  status `needs George`. No human check is ever recorded as passed by an agent.
- **Reverses:** the Phase 3, 5, 6 and 7 gates in the plan, which required a
  guitar review, an uncoached learner and a two-week personal trial before the
  next phase.
- **Why:** George decided this on 20 October 2026 (brief §2.2). He will use
  the app and send feedback afterwards.
- **Reversible:** yes, by reinstating any gate; the checklist already names
  each human check.
- **Where:** plan note, `docs/GEORGE_CHECKS.md`, the in-app list (Package 1).

### R3 · 2026-10-20 · Package 0 · George merges pull requests

- **Decision:** agent sessions push branches and open pull requests, and stop
  there. George merges them, which publishes through the existing workflow.
- **Reverses:** brief §2.1 and §7.3, which pre-authorised agents to merge once
  CI is green.
- **Why:** the Package 0 session's own safety checks refused an agent merge of
  a pull request that no person had reviewed, even with CI green and the
  brief's authority. The session did not try to route around that refusal.
- **What George does:** merge the open pull requests in the order the log's
  **Next package** section lists, after a glance at each. Every PR has passed
  the full CI workflow before it is listed as ready.
- **Reversible:** yes, if a later session's environment permits agent merges.

## Decisions

### A1 · 2026-10-20 · Package 0 · Branch dispositions on 20 October

- `codex/phase-5-evidence-feedback`: its three Phase 6 commits (exact-score
  rendering, the C-to-Am chord score and synth preview, the transfer studies)
  were cherry-picked onto `main` with their original authorship. Their two
  small style rules were rewritten in the By George tokens because `app.css`
  had since been split into area files. Its fourth commit is the same
  Finder/release-workflow change as `codex/project-hygiene-release` (identical
  diff on a different base; only blob hashes and one heading differ).
- `codex/project-hygiene-release` (`ccac4fc`): **superseded**. Its CI-wait fix
  is in `main` via #3, and its Finder commands (`OPEN_LIVE`, `SAVE_WORK`,
  `PREVIEW_LOCAL`) were replaced by #4's standardised set (`Preview Local`,
  `Check Status`, `Update from GitHub`, `View Live`, `Publish Live`), which
  George merged later the same day. Its `docs/PROJECT_WORKFLOW.md` explained
  the three versions (Finder, GitHub, live); `Check Status.command` now reports
  the same distinction, so it was not carried over.
- `codex/repair-guitar-release-check` (`b5bb46b`): **contained**. `git cherry`
  marks it patch-equivalent to #3 (`5fff0d0`).
- **Alternatives:** merging the branch wholesale (would re-add the superseded
  Finder commands beside #4's); leaving the branches (the brief asks for them
  to be closed).
- **Reversible:** the deleted branches' commits remain reachable from this
  entry's hashes for as long as GitHub keeps unreferenced objects; the useful
  commits are in `main`.

### A2 · 2026-10-20 · Package 0 · Where agent sessions verify

- **Decision:** cloud sessions work in their own clone of GitHub `main`, not
  through the device bridge into George's Mac folder. The clone runs `npm ci`,
  Java 21 (rules emulator) and Chromium for the browser journeys natively.
  George's folder is then fast-forwarded from GitHub only when it is clean and
  on `main`, the same rule `Update from GitHub.command` applies.
- **Alternatives:** the Mac-folder runner copy described in the brief §7.1
  (still valid when only the bridge is available).
- **Reversible:** yes; nothing in the repository depends on it.

### A3 · 2026-10-20 · Package 0 · Pin CI to Ubuntu 24.04

- **Decision:** both workflows run on `ubuntu-24.04` instead of
  `ubuntu-latest`.
- **Why:** GitHub began moving `ubuntu-latest` to Ubuntu 26 on 19 October
  2026. On the first run after that, `playwright install --with-deps chromium`
  (Playwright 1.60) failed twice in a row on the new image, before any app
  check ran. The pinned image is the one every earlier release passed on.
- **Alternatives:** upgrading Playwright when a release supports Ubuntu 26
  (a planned dependency upgrade, not a release blocker).
- **Reversible:** yes; change the two `runs-on` lines back once Playwright
  supports the new image.
- **Where:** `.github/workflows/firebase-hosting-*.yml`.
