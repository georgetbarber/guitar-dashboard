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

### A4 · 2026-10-20 · Package 1 · Storage SDK only in a build that shares recordings

- **Decision:** `firebase/storage` is imported dynamically, behind the
  build-time `VITE_RECORDING_SHARING === "enabled"` check, instead of
  statically in `cloud.tsx`.
- **Why:** recording sharing is off (the project has no Storage bucket), yet
  the SDK cost about 22 KiB of the offline shell, which was within 2 KiB of its
  1280 KiB threshold once Package 1's notes and checks were added. The ordinary
  build now omits it entirely.
- **Alternatives:** raising the shell threshold now (deferred until the music
  engine's size is known in Package 3).
- **Reversible:** yes. A build with sharing enabled loads the SDK on first use.
- **Where:** `apps/current/src/v8/cloud.tsx`.

### A5 · 2026-10-20 · Package 1 · Notes, ticks and checks are separate synced records

- **Decision:** feedback notes, checklist ticks and "Mark as checked" review
  marks live in their own Firestore subcollections (`feedback`, `checks`,
  `reviews`), never in the profile document. A note's words are fixed once
  written; only its "dealt with" state can change. A review mark applies to one
  exact content version, so a revised lesson shows the draft tag again until it
  is checked again. If the server ever refuses one of these collections (a
  hosting release ahead of its rules), sync carries on for everything else and
  the records stay on the device.
- **Why:** older clients rewrite the whole profile document and would drop
  fields they do not know; separate documents also keep every record within
  the per-document rules and size limits.
- **Alternatives:** profile fields (unsafe with older clients); one document
  holding every note (unbounded growth).
- **Reversible:** the records are additive; removing the feature leaves them in
  backups and the account.
- **Where:** `src/v8/notes.ts`, `src/v8/provenance.ts`, `src/v8/cloud.tsx`,
  `firestore.rules`.

### A6 · 2026-10-20 · Package 2 · No measured-pitch evidence yet

- **Decision:** the three microphone checks stay temporary, pitch-only and
  unsaved. No `measured-pitch` evidence method, record or progression rule is
  added. Their thresholds were retuned against a synthetic realistic-input set
  and are labelled provisional (pitch-check version 2).
- **Why:** the Phase 5 gate review made a measured record conditional on real
  guitar and phone trials. Synthetic input can show the checks are safe and
  useful on modelled input; it cannot show how George's microphone and room
  behave.
- **Alternatives:** adding the record now with a "synthetic-only" caveat
  (rejected: it would let a modelled result advance real progress).
- **Reversible:** yes; a later package can add the versioned record once the
  `guitar-pitch-*` checklist items have real results.
- **Where:** `src/audio/pitchAssessment.ts`, `noteSequenceAssessment.ts`,
  `src/v8/components/PitchCheck.tsx`; gate addendum in
  `docs/reviews/2026-09-30-phase-5-gate.md`.

### A7 · 2026-10-23 · Package 2 · Offline shell allowed 1284 KiB until Package 3

- **Decision:** the offline-shell review threshold is 1284 KiB on the
  Package 2 branch instead of 1280 KiB. Package 3 restores 1280 KiB.
- **Why:** PR #8 failed CI at `check:offline-shell`. The Firebase-enabled
  build CI makes is about 0.2 KiB larger than a local build (the project's
  configuration values are compiled in), and the retuned pitch checks left the
  shell at 1280.1 KiB there. Package 3 moves the lesson players and the music
  engine out of the automatic shell into per-stage lesson packs, which brings
  it back to about 1269 KiB.
- **Alternatives:** trimming a few hundred bytes from Package 2 (fragile, and
  any change would break it again); moving the lesson packs into Package 2
  (mixes two packages' scope).
- **Reversible:** yes, and reversed by design in Package 3.
- **Where:** `scripts/check-offline-shell.mjs`, `tests/e2e/offline-shell.spec.ts`.

- **Restored:** Package 3 (23 October) returns the threshold to 1280 KiB; the
  Firebase-enabled shell is 1269.3 KiB with the lesson packs outside it (A9).

### A8 · 2026-10-23 · Package 3 · Standard tuning only, for now

- **Decision:** score format 2 can only express standard tuning
  (`tuning: "standard"`). No capo or drop D.
- **Why:** brief §4.5 allows them only if the fretboard, tab, transposition and
  audio maths all handle them and are tested. None of that is built, so the
  format cannot claim it.
- **Alternatives:** a `capo` field rendered as shifted fret numbers (would make
  tab, fretboard and sounding pitch disagree until every projection handles it).
- **Reversible:** yes. A later format version can add a tuning and capo, with an
  upgrade from format 2 like the one from format 1.
- **Where:** `src/core/score/types.ts`.

### A9 · 2026-10-23 · Package 3 · Lessons are saved per stage, outside the app shell

- **Decision:** the lesson players, the music engine (score format, synth,
  score player, score views) and each stage's lessons are built as
  `assets/lesson-*` files and are **not** in the automatic offline shell.
  `lesson-packs.json` (in the shell) lists each stage's files. The stage the
  learner is working in, and the stage of the selected unit, are saved
  automatically while online; any other stage is saved with "Save this stage
  for offline". When an update is waiting, its packs are saved for every stage
  saved before, so applying it offline keeps those lessons. "Ready offline"
  includes full lessons only when every file of the stage's pack is saved.
- **Why:** the shell had under 2 KiB of headroom and the course will grow to
  48 units. This keeps the shell at about 1269 KiB however many lessons are
  added; each stage pack is currently 57–77 KiB, mostly shared engine code.
- **Alternatives:** raising the shell threshold for every batch (unbounded);
  loading lessons only on demand online (no offline lessons at all).
- **Reversible:** yes; dropping the `globIgnores` entry puts everything back in
  the shell.
- **Where:** `vite.config.ts`, `src/v8/lessonPacks.ts`,
  `src/v8/components/OfflineLessonStatus.tsx`, `scripts/check-offline-shell.mjs`.

### A10 · 2026-10-23 · Package 3 · An authored lesson stands in for its activity

- **Decision:** where an activity has an authored lesson (Unit 6 "Place it in
  time", Unit 10 "Put it under the hands"), opening the activity opens the
  lesson, and Continue sessions reach it first. The unaided check records a
  self-reported observation against that activity; the transfer check against
  the unit's transfer activity. Lesson positions and attempts are device
  workspace records, included in backups but not synced (as the Unit 1 pilot's
  are).
- **Why:** evidence keeps using existing activity and capability ids, so sync,
  older clients and the rules accept it unchanged and no migration is needed.
  Syncing lesson positions would need new collections and rules for little
  benefit before George has used them.
- **Alternatives:** a new evidence source for lessons (would need a rules and
  mixed-version rollout); syncing cursors in the profile (older clients would
  drop them).
- **Reversible:** yes; a later package can add a synced collection, as A5 did.
- **Where:** `src/v8/components/ActivityPlayer.tsx`, `LessonPlayer.tsx`,
  `src/v8/learning.ts`, `src/v8/lessonProgress.ts`.

### A11 · 2026-10-23 · Package 3 · Old Phase 6 draft modules kept as test fixtures

- **Decision:** `phase6Drafts.ts`, `scoreUpgrade.ts`, `chordStudy.ts`,
  `chordStudyPlayback.ts` and `components/ChordStudy.tsx` are imported only by
  tests. They prove the format 2 lessons kept the September drafts' music note
  for note. They are not part of the app.
- **Why:** removing them now would delete that evidence; Package 9 (B27) is the
  planned place to move superseded code with proof.
- **Reversible:** yes.
- **Where:** `src/v8/lessons/lessons.test.ts`; listed for Package 9.

### A12 · 2026-10-23 · Package 4 · All 48 units revised in place

- **Decision:** every current unit is *revised*: same id, same nine activity
  ids, same core outcome, new style-specific authored material. None is merged
  or superseded.
- **Why:** each existing outcome still has a natural home in the style
  direction (for example "Syncopation creates lift" becomes sixteenth-note funk
  strumming), and keeping ids means no evidence, sketch, session plan, note or
  review mark has to move.
- **Alternatives:** replacing weak outlines with new units (new ids and a
  migration for every learner's history); merging overlapping pairs such as
  Units 2 and 5 (they teach different things: shaping one sound, and placing
  silence in time).
- **Reversible:** yes, per unit, with an old-to-new mapping as `CURRICULUM_MAP.md`
  §4 requires.
- **Where:** `docs/CURRICULUM_MAP.md` §3–4; checked by
  `apps/current/tests/curriculumMap.test.ts`.

### A13 · 2026-10-23 · Package 4 · The repertoire and capstones

- **Decision:** eleven original pieces (nine authored, two learner frameworks
  completed in Create) carry the three styles through the course: *Front Step*
  and *Low Road* (blues-rock), *Porch Light*, *Harbour Song* and *Tide Table*
  (folk), *Night Market*, *Sunday Glide*, *Two Rivers* and *Glasshouse* (soul
  and funk), *Lantern* (melody) and *Your Own Tune*. Each stage ends with a
  capstone; Stages 7 and 8 are made in Create. The Unit 1 pilot becomes the
  first layer of *Front Step*.
- **Why:** brief §4.2 asks for 10–16 recurring pieces with layered parts and a
  capstone per stage; tying the existing pilot and the two authored lessons to
  pieces gives them a musical destination.
- **Alternatives:** one piece per stage (no recurrence); more, shorter pieces
  (less revisiting with deeper understanding).
- **Reversible:** yes; pieces are data, and a renamed or replaced piece keeps
  its id rule (`CURRICULUM_MAP.md` §4).
- **Originality:** the *Low Road* riff uses roots 1, ♭3 and 4, like a very
  famous riff, so its fingerprint is deliberately different (palm-muted root
  chugs with off-beat accents, no ♭5 passing chord, no block chords with
  rests). Authoring batches keep that fingerprint.
- **Where:** `docs/CURRICULUM_MAP.md` §6–7.

### A14 · 2026-10-23 · Package 4 · Units open by prerequisite, not by number

- **Decision:** the linear chain (each unit opens after the one before)
  becomes a prerequisite graph of what each unit's music assumes. A unit opens
  once the units it builds on are met: complete, before the learner's placement
  start, or marked not needed. The current allowance (every unit up to one past
  the current unit is open) stays, and a unit with any completion or evidence is
  never locked. "Available after" names the unmet units.
- **Why:** the three style threads advance at different rates; a learner keen
  on funk can reach Unit 26 once Units 4, 5 and 19 (and what they build on)
  are done, not all 25 before it. Dates still never gate anything.
- **Alternatives:** keep the strict chain (simple but misleading about what a
  unit needs); remove access locks altogether (a larger change to the existing
  course map behaviour, not needed for the style threads).
- **Reversible:** yes; the graph is data.
- **Where:** `docs/CURRICULUM_MAP.md` §3 and §5; implemented in Batch 1
  (`CURRICULUM_MAP.md` §10).

### A15 · 2026-10-24 · Package 4 · The Unit 1 pilot keeps its own player

- **Decision:** the Phase 3 one-note pilot is not ported to the Package 3
  lesson format. Its player, cursor, attempts, reviews and variations stay as
  they are; Batch 1 links its performance step to *Front Step*.
- **Why:** porting would mean migrating George's pilot records into lesson
  records for no learner-visible gain.
- **Alternatives:** port it for uniformity (a data migration with rollback
  risk).
- **Reversible:** yes, with a migration if a later package needs it.
- **Where:** `docs/CURRICULUM_MAP.md` §4.
