# Interval: completion brief (finish Phases 5–8 autonomously)

Written 20 October 2026 with George. This brief is a standing instruction for every agent session until it is finished. It sits on top of `AGENTS.md` and `docs/IMPLEMENTATION_PLAN.md`. Where they conflict, this brief wins, because it records decisions George made after both were written.

---

## 0. How to use this brief

**First session only:** if this file is not already at `docs/COMPLETION_BRIEF.md`, save it there unchanged and commit it in the first package.

**Every session:**

1. Run `git fetch origin` and compare your branch with `origin/main`. If GitHub is ahead, bring it in before doing anything else. George works both locally and in cloud sessions, so assume the other side may have moved.
2. Read `AGENTS.md`, this brief, the **Progress** table at the end of this brief, the latest entries and the **Next package** section of `docs/IMPLEMENTATION_LOG.md`, and `docs/AGENT_DECISIONS.md` once it exists.
3. If George has pasted feedback (an export from the app's Feedback view, or notes), handle it first (section 9).
4. Then continue from the next unfinished package in section 6, and keep working through packages for as long as the session allows. Do not stop after one package.
5. Before the session ends, leave everything committed, pushed and recorded (section 8).

You will not finish in one session. Design every package so that a fresh session with no memory of yours can pick up exactly where you stopped, using only the repository.

---

## 1. Mission

Finish everything that remains in `docs/IMPLEMENTATION_PLAN.md`, Phases 5–8. The aim is a complete, honest, enjoyable guitar course George can start using and give feedback on. Phases 0–4 are done; do not redo them.

The finished state:

- The Phase 5 software path is closed. Real-input checks are handed to George as a checklist rather than blocking.
- All 48 units across the 8 stages have a reviewed **disposition** (revised, merged into a named replacement, or superseded with the outcome preserved elsewhere). Every live unit is a fully authored episode in the proven format, playable in the app.
- A small repertoire of original pieces in George's chosen style (section 4) runs through the course, with layered parts and a capstone piece at each stage boundary.
- The Phase 7 engineering, documentation and release work is done and the app is live.
- All four Phase 8 extensions are built, tested and released under the constraints in section 5.
- Every B01–B32 and D01–D13 finding in the plan's coverage registers has a final status with evidence.

---

## 2. Decisions George made on 20 October 2026 (do not re-ask)

1. **Publishing is pre-authorised.** You may push to GitHub, open and merge pull requests, and publish live whenever a milestone passes every automated check. This replaces the "never push, never deploy without explicit instruction" rule in `AGENTS.md`, the plan and earlier logs. Update `AGENTS.md`'s Safety section in Package 0 so that it points to this brief's release rules (section 7). Other sessions must not be left with contradictory instructions.
2. **No personal trial, no learner trial, no hands-on gate.** George will not run the two-week trial or an independent-learner trial before you finish. He will start using the app and feed back afterwards. Every plan gate that depends on a human, a guitar, a physical phone or elapsed time becomes **non-blocking**. Its automatable part must still pass. Its human part goes on George's checklist (section 3.3) with status `needs George`. Never record a human check as passed, and never write that a lesson "works for learners" or "has been reviewed on a guitar".
3. **Agent-written lessons go live with an honest marker.** Every lesson appears in the course as normal. Each shows a small, calm tag such as "Not yet checked on a guitar" while its status is `draft`, plus a one-tap "Something's wrong here" note (section 3.1). Review status and learner access locks remain separate concepts, as the plan requires.
4. **Musical direction:** "Expressive, rhythm-led, rootsy guitar playing, combining folk fingerpicking, blues-rock, and soulful, funky rhythm guitar." Section 4 turns this into authoring rules.
5. **AI explainer: build it, off by default.** It uses George's own Claude API key, stored only on his device. Section 5.4 has the constraints.
6. **Do not ask George questions.** Decide, record the decision (section 3.2) and move on. The only stopping conditions are in section 7.4.

---

## 3. Standing mechanisms to build early and keep using

### 3.1 Draft status and in-app feedback (build in Package 1)

- Every authored episode, study and repertoire piece carries `contentVersion`, `author` (use `agent-drafted` for your work), `reviewer` (empty until George or a named reviewer approves), `reviewStatus` (`draft` | `reviewed` | `trialled`) and `reviewedAt`. These fields already exist conceptually in the plan; make them real data.
- Show a calm draft tag on draft content. Do not show warning colours or modal interruptions.
- Add a "Something's wrong here" note, reachable from the player and the lesson view. It records which content, version, bar or step, and what was showing, plus George's free text and an optional category (wrong note or chord, unplayable, confusing, too hard, too easy, sounds bad, other). Feedback notes are **their own record type**. They are not learning evidence and must never affect progress. Store them locally, include them in backup and sync with the same validation, bounds, rules tests and mixed-version safety as every other record. Firestore rules need updating and testing (CI runs `test:rules`).
- Add a **Feedback** view, under Settings or About, that lists notes and exports them as Markdown George can paste into an agent session. Include an option to mark a note as dealt with.
- Add a **"Mark as checked"** action George can use on a lesson after he has played it. It sets `reviewStatus: reviewed` with his name and the date as reviewer. It is stored as a learner-owned overlay, not by editing authored content. This is how lessons become reviewed over time without a separate tool.

### 3.2 Decisions register (`docs/AGENT_DECISIONS.md`)

Create it in Package 0. For every judgement call that George might want to reverse, add one entry: date, package, the decision, the alternatives considered, why, how reversible it is, and where it lives in the code or content. Keep entries short. Put anything that **reverses an existing documented decision** at the top under "Reversals", because George wants those surfaced rather than buried. Do not record routine implementation choices.

### 3.3 George's checklist (`docs/GEORGE_CHECKS.md`, mirrored in-app)

This is one data source rendered both as the doc and as a simple in-app "Things to check" list with tick boxes. Tick state is stored locally and synced as a small record. Group items by where they happen: *with guitar*, *on the Pixel*, *on the laptop*, *after a few days*. Each item should take minutes, say exactly what to do and what counts as a pass, and link to the lesson or screen. Seed it with the outstanding human checks already listed in `docs/reviews/2026-09-30-phase-5-gate.md`, `docs/reviews/2026-09-30-phases-6-8-entry.md`, the 2A keyboard and screen-reader pass, and the real-device items in Plan §10. Add to it as you go, but keep it curated: no more than about 40 items in total, with the most valuable first.

---

## 4. Musical and content rules

### 4.1 Style direction (George's own words)

The direction is expressive, rhythm-led, rootsy guitar combining **folk fingerpicking**, **blues-rock** and **soulful, funky rhythm guitar**. In practice:

- **Folk fingerpicking:** a thumb-driven alternating bass (Travis-style patterns built up from a steady thumb), melody notes over the bass, pinches, let-ring textures and simple open-chord arrangements. Start from a one-note thumb pulse and build up from there.
- **Blues-rock:** shuffle and straight-eighth feels, the 12-bar form, minor and major pentatonic and the blues scale learned as interval shapes around a root, riffs, double-stops, bends (quarter, half, whole, judged by target pitch), vibrato, slides, palm-muted chugs and call-and-response phrasing.
- **Soul and funk rhythm:** sixteenth-note strumming with a constantly moving hand, muted "scratch" strokes, accents and ghost strokes, small triad and partial-chord shapes on the top three or four strings, hammer-on embellishments inside chord shapes, sliding sixths and double-stops, syncopated stabs and space.
- Rhythm leads. Every piece should groove at its practice tempo. Each style must be **audibly different** in feel and articulation, not just in its name.
- Keep the relationship-first pedagogy from `AGENTS.md`. Teach riffs, pentatonic shapes, triads, double-stops and chord moves as intervals, degrees and chord tones around a root, as movable shapes.

### 4.2 Repertoire

- **Original material only.** Do not copy existing songs, riffs or recordings. "In the style of a genre" is fine; "the riff from <song>" is not. Licensed repertoire remains a non-goal, as the roadmap says.
- Build a growing set of **named original pieces** that recur across stages and are revisited with deeper understanding. Each piece has layered parts: one-note participation, then accompaniment, then melody or riff, then expressive variation. Aim for roughly 10–16 pieces in total, not dozens.
- **At least one capstone piece at each of the 8 stage boundaries**, combining that stage's work into something worth playing for its own sake. At least one capstone should be a "make your own version" artefact routed through Create.
- Keep favourites. Let George return to earlier pieces from Play and Continue.

### 4.3 Episode completeness (from Plan §9; every episode needs all of it)

Every episode needs:

- exact musical events, strings and frets or voicings, rhythm and practical tempo range;
- an inviting purpose and audible destination;
- a demonstration, plus at least two musically distinct studies or contextual variations per unit;
- the variable being changed, the capabilities involved, honest success criteria, likely errors with specific repairs, and a cue-fading sequence;
- a retrieval task and a real transfer context;
- a route into a complete performance or personal artefact;
- provenance and review status (section 3.1).

Encode these as required fields. The content validator must fail when any is missing.

### 4.4 Physical coverage

By the end, audit the course against the Plan §9 list:

- open, movable and barre chords; strumming; picking; muting; chord changes; position shifts;
- slides, hammer-ons, pull-offs, bends, vibrato, palm muting, accents, fingerstyle;
- phrasing and ensemble timing;
- readable rhythm, triplets and actual swing playback;
- richer tab, with optional staff literacy that never gates the relationship path.

Record the coverage matrix in `docs/CURRICULUM_MAP.md`.

### 4.5 Tuning, demonstrations and sound

- **Standard tuning throughout.** Use a capo or drop D only if the fretboard, tab, transposition and audio maths handles it correctly and is tested; otherwise leave it out and record the decision. Other alternate tunings stay in the backlog.
- You cannot record real hand demonstrations. Provide the best honest substitute: exact synthesised playback at normal and slow tempo, synchronised tab, fretboard and count, plus clear written and diagrammed hand guidance. Wherever a technique really needs seeing (bends, vibrato, muting, fingerpicking hand), show a visible "demonstration video still needed" marker and add the item to George's checklist. Missing assets stay visibly provisional, as the plan requires.
- Synthesis should sound like a plucked string, not a beep. Karplus–Strong or a similar physical model is fine, with per-string voices, strum spread and direction, palm-mute and dead-note articulation, slides and bends as pitch glides, and let-ring versus damped notes. Samples are allowed only with a clear CC0 or permissive licence recorded in the repo, and within the asset budget (section 7.2).
- Tempo changes must preserve pitch. For synthesised material that is automatic, because you reschedule events. Never resample recorded audio and silently change its pitch.

### 4.6 Correctness

- Every interval, degree, chord tone, spelling, Roman numeral, fret mapping and voicing must be validated by code where practical, reusing the existing theory domain and never duplicating constants.
- Playability heuristics must be enforced by the validator, with documented exceptions. These cover: fret span by position, fingers needed (a barre counts as one), required open strings, string skips at the given tempo, stretch, and per-technique tempo ceilings for a beginner and for an improving player.
- Displayed tab, fretboard, notation and audio must derive from the same events. Add a correspondence test for every piece.

---

## 5. Phase 8 extensions: build all four, in this order

Each extension must be optional, off the core path, accessible, tested and documented. It must not inflate guest startup or the offline shell beyond budget (lazy-load it).

### 5.1 Hands-free controls

- Keyboard shortcuts for play/stop, loop on/off, previous/next section, tempo up/down and replay the last bar.
- Map the keys that Bluetooth page-turner pedals send (PageUp/PageDown, arrow keys) so a cheap pedal works without setup.
- Shortcuts must never fire inside text inputs or while a dialog is open. Make them discoverable via a short shortcuts sheet.

### 5.2 No-guitar companion

- Short phone-friendly rounds of a few minutes each (listen and compare, which-interval, which-degree, predict the next note, rhythm tapping) using the **exact material** from the lessons, not generic drills.
- Each round links to "try this on guitar next time", which schedules the handoff into Continue.
- Results are recorded only as listening, naming or rhythm-tap evidence and never grant playing capability.

### 5.3 Bring your own music

- George can add a piece he wants to learn: title, optional reference link (opened externally, not embedded), an optional local audio file he imports, the excerpt (A–B), a practice aim and notes.
- Imported audio stays on the device and is never uploaded or synced. Metadata syncs.
- A–B looping is required. Slow-down is allowed only with genuine pitch-preserving time-stretch, using a permissively licensed library, lazy-loaded and tested. Without that, offer looping at normal speed only.
- There is no automatic transcription. Provenance is recorded.

### 5.4 Contextual AI explainer (off by default)

- Settings has an "AI explanations" switch (off by default) and a field for George's own Anthropic API key. The key lives only in local device storage. It is never synced, never included in backups or exports, never logged, and can be cleared with one action.
- The explainer is reachable only from a specific bar, step or concept. It sends the reviewed or draft lesson text and the musical context for that point, plus George's typed question, and nothing else: no audio, no evidence, no progress. Use the Anthropic Messages API directly from the browser with the documented browser-access header. Choose the model ID from Anthropic's current documentation at build time; do not hardcode an old one from memory. Cap the output length, and show an approximate per-question cost and the model used.
- Label answers clearly as an AI explanation that may be wrong, and show them next to the authored explanation, never replacing it. They never grade playing, never write evidence and never change content.
- Allow `api.anthropic.com` in the CSP `connect-src` and nothing broader. Add tests with mocked network calls (success, invalid key, rate limit, offline, cost display, key never in exports), and a test that the CSP permits exactly that host.

---

## 6. Package sequence

Work in this order. Each package ends with the release steps in section 7 and the record in section 8. You may split a package if that keeps changes reviewable, but do not reorder phases unless a dependency forces it; record any reordering in the decisions register.

### Package 0: Start-up, consolidation, governance

- **Fetch and compare.** At the time of writing, `main` (`df70876`) matched GitHub. Three branches were unmerged:
  - `codex/phase-5-evidence-feedback`: 3 Phase 6 commits (exact-score rendering, the C-to-Am polyphonic score and synth preview, transfer studies) plus a workflow commit.
  - `codex/project-hygiene-release`: one Finder/release-workflow commit, apparently the same change on a different base.
  - `codex/repair-guitar-release-check`: probably superseded by `5fff0d0` (#3).
- Bring the useful work into `main` via a PR, reconciling the duplicate commit. Prove that superseded branches are fully contained or replaced (for example with `git cherry` and a diff), then delete them locally and on GitHub. Record each disposition.
- Commit this brief. Create `docs/AGENT_DECISIONS.md` and `docs/GEORGE_CHECKS.md`.
- Update `AGENTS.md` Safety so it points to this brief for push and publish authority.
- Add a short dated note at the top of `IMPLEMENTATION_PLAN.md` recording the 20 October decisions and that human gates are now non-blocking checklist items.
- Confirm the verification toolchain (section 7.1).

### Package 1: Draft status, feedback and George's checklist

Build section 3 end to end, including sync, rules, backup and mixed-version tests. **Release.**

### Package 2: Close Phase 5 (software terms)

- Harden the three temporary pitch checks against **synthetic realistic input**: generated plucked-string signals with harmonics, inharmonicity, decay, background noise at several levels, automatic-gain ramps, reverb, clipping, latency offsets, wrong strings, extra attacks and silence. Tune thresholds against that test set and keep the uncertain paths.
- **Do not add a `measured-pitch` evidence record.** The checks stay temporary until George's real-input checks say otherwise; record this decision. Put the real-input trial steps on George's checklist.
- Update `docs/reviews/2026-09-30-phase-5-gate.md` with a dated addendum: the Phase 5 gate is closed on software terms, real-input pending George. **Release.**

### Package 3: Phase 6 music engine and authoring pipeline

- Extend structured musical material to polyphony in a **versioned, migration-safe** way. It must cover:
  - chords and voicings, strum direction, spread and timing offsets;
  - fingerpicking patterns with thumb and finger assignment;
  - articulations: hammer-on, pull-off, slide, bend with target, vibrato, palm mute, dead or scratch strokes, accents, let-ring, staccato;
  - feels: straight, swing and shuffle eighths, swung sixteenths, triplets.
- Old saved material and sketches must keep loading, and old clients must not destroy new fields. Test mixed versions.
- Upgrade the practice player to play all of this with an audio-clock schedule, count-in, loop, tempo, stop and no overlapping players. Synchronise tab (with technique notation), rhythm notation, chord diagrams and the fretboard from the same events. It must work at phone width and at music-stand distance.
- Build the authoring format and validator (section 4.3, 4.6). It must check required fields, theory, playability, display and audio correspondence, provenance, and the continuity of cue fading and recall.
- Wire the two existing pilot drafts (Unit 10 third colour, Unit 6 C–Am) and the branch's transfer studies into Learn through this pipeline, as `draft`.
- Content loads per stage, lazily, so the offline shell stays within budget. "Ready offline" applies per selected stage or unit. **Release.**

### Package 4: Curriculum map and repertoire plan

- Write `docs/CURRICULUM_MAP.md`, covering:
  - the disposition of all 48 current units, with mappings from old unit and activity IDs so progress and saved work survive;
  - the capability catalogue extended to the whole course;
  - prerequisites;
  - the repertoire plan (pieces, their layered parts, and where each recurs);
  - the 8 capstones;
  - the physical-coverage matrix (section 4.4);
  - the style plan (section 4.1).
- The 8 stages keep their names unless the map gives a reason: Sound and time · Movable fretboard map · Tonal hearing and melody · Triads and harmonic movement · Groove and musical language · Functional and modal harmony · Composition and form · Personal voice.
- **Independent review:** if you can start a separate reviewer agent with fresh context, have it review the map for theory errors, prerequisite gaps, playability, style fit and pacing for an adult returning learner. If you cannot, do a deliberate second pass yourself against a written checklist. Fix what it finds. Record the review in `docs/reviews/`.

### Packages 5–8: Author the course in four batches

- **Batch 1:** Units 1–12 (stages 1–2).
- **Batch 2:** Units 13–24 (stages 3–4).
- **Batch 3:** Units 25–36 (stages 5–6).
- **Batch 4:** Units 37–48 (stages 7–8).

For each batch:

- Author every episode to section 4.3 and wire it in as `draft`.
- Extend capabilities, placement, exact-answer checks, delayed recall, Strengthen repairs, Explore links and Create "make it mine" routes to the new material.
- Pass the validator and correspondence tests. Add browser journeys for at least one episode per stage and every capstone. Run accessibility checks on any new screens. Check the offline-shell and guest-bundle budgets.
- Run the same independent-review step as Package 4, then fix what it finds. Write a short batch review in `docs/reviews/` stating exactly what was checked by code, what by review, and what remains `needs George`.
- Add the batch's few most valuable "with guitar" checks to George's checklist.
- **Release after each batch.**

### Package 9: Phase 7 consolidation and release readiness

- **B27:** prove which old UI is unreachable (runtime imports, type-only imports, tests, tooling, scripts). Move genuinely obsolete code to `apps/history` with the proof recorded. Keep shared theory, audio and instrument code and meaningful tests in the active app.
- Reconcile the README files, learning model, architecture, curriculum contract, roadmap, future-feature statuses, setup and publishing guidance with the actual behaviour. Preserve the audits as dated evidence.
- Run the complete applicable suite: legacy migration, large-history backup, rules, cloud conflicts and deletions, mixed-version fixtures, offline, browser navigation, accessibility, audio and display correspondence, and update while work is active.
- Write a release note, the exact change set since 1 October, known limitations, a backup and rollback procedure, and a compatible client/rules rollout sequence. Never roll back to an app that cannot safely read newly written state.
- Write `docs/START_HERE.md`, a one-page guide for George: how to begin, how placement works, what the draft tag means, how to leave feedback and mark lessons checked, the five most valuable checklist items, and how to hand feedback to an agent.
- **Release**, then do live verification where your environment can reach the site: deployed worker, security headers, the primary journey, update behaviour. Where it can't, say so and rely on the workflow's deployment result.

### Package 10: Phase 8 extensions

Build section 5, one extension per sub-package, each **released** separately. Update the Phase 8 decision record in `docs/reviews/` from "evaluated" to "built", with each admission test restated as a George's-checklist item.

### Package 11: Finish line

- Close every B and D finding in Plan §13–14 with a final status and evidence link: `verified locally`, `verified in CI`, `released`, `needs George` or `superseded (reason)`.
- Update the plan's status line, the Progress table below and the log.
- Run the full suite one last time and **release**.
- Send George a final summary (section 8).

---

## 7. Engineering, verification and release rules

### 7.1 Toolchain

- **Cloud session with a clone:** install and run normally (`npm ci` in `apps/current`). Try to get Java 21 and Playwright Chromium working for `test:rules` and `test:e2e`. If you can't, CI provides them on every PR; say which evidence came from where.
- **Session working through a device bridge into George's Mac folder:** watch for these traps:
  - never run `npm install` in the mounted folder, which has macOS `node_modules`;
  - use a Linux runner copy, re-synced including `package.json`, `firebase.json`, `vite.config.ts` and `tests/`;
  - run `npm ci` in the foreground only;
  - clear git lock files after each commit once delete permission is granted.
- The checks are `npm run lint`, `npm run format:check`, `npm test` (or `test:coverage`), `npm run build`, `npm run check:guest-bundle`, `npm run check:offline-shell`, `npm run test:e2e` and `npm run test:rules`. New repository-reading tests go in `apps/current/tests/` and must be named in the `test` script.

### 7.2 Quality bar

- Each package leaves a runnable app and adds tests for what it changed.
- When you fix a defect, reintroduce it in a scratch copy and confirm that **its own test, and only that test,** fails. A test that passes on both old and new code is worthless.
- Do not let the interface claim what the app does not do.
- Beware the orphaned-module trap: committed modules imported by nothing. Before trusting that a module is live, check that something imports it.
- **Do not relitigate these existing design decisions** (see the log and project notes):
  - never truncate learner work to fit a cloud limit;
  - never prune deletion records;
  - an unreadable workspace suspends saving;
  - restores are staged and then activated in one transaction;
  - a local restore is not an account replacement;
  - updates are offered, never imposed;
  - temporary audio has no recovery;
  - observations are immutable and self-reported, and corrections are retraction records;
  - recordings never upload automatically.
- Data compatibility is critical because George has real data on the live site and his phone. Every schema change needs a migration path, mixed-version tests (old client meets new data and vice versa), backup round-trip tests, and rules that accept both during rollout.
- **Budgets:** the offline shell must stay within its 1280 KiB review threshold, which had about 14 KiB of headroom on 1 October. Lesson content, synthesis and extensions load lazily, and no extension may enlarge guest startup. If a budget must move, record why in the decisions register.

### 7.3 Git and release flow

- One branch per package (for example `phase6/batch-1-units-1-12`). Commit in small logical steps with clear messages, staging paths explicitly (never `git add -A` over unrelated changes).
- Open a PR to `main`. The PR workflow runs lint, format, coverage, browser journeys and rules, and deploys a preview channel. **Merge only when CI is green.** If a check is flaky, re-run it once; if it fails again, fix it. Never merge red, never skip checks, never force-push `main` or rewrite its history.
- Merging to `main` triggers the live deployment workflow. That is how you publish. Watch it to completion and record the result. `Publish Live.command` is George's interactive tool and is not needed for this flow.
- If a deploy breaks the live site, fix forward or revert the merge immediately and record it. That is within your authority.

### 7.4 The only reasons to stop and wait for George

- An action would delete or irreversibly overwrite George's existing learner data, or ship a schema change without a safe migration and rollback path.
- An action would spend money or change billing, such as moving Firebase to the Blaze plan or enabling Storage. Recording sharing stays off.
- An action needs secrets or credentials you do not have, or would change `.env.local` values or GitHub secrets.
- An action would work outside this repository, or would rewrite or force-push `main`.

If you hit one of these, finish everything else you can, put the blocked item at the top of the log's **Next package** with exactly what George must do, and continue with other packages that do not depend on it.

---

## 8. Recording and reporting

After each package:

- Add an entry to `docs/IMPLEMENTATION_LOG.md` in the established format: scope, B/D IDs, changed areas, status, acceptance evidence (stating which came from local runs, CI and live), migration impact and limitations.
- Rewrite the **Next package** section so a fresh session knows exactly what to do.
- Update the **Progress** table below, the decisions register and George's checklist.
- Keep the plan's status line accurate.

At the end of each session, give George a short summary in plain English:

- what is now live and worth trying, with a sentence on how to find it;
- anything that reverses an earlier decision;
- the newest checklist items, if any are worth doing soon;
- what the next session will do.

No questions. No recap of every step.

---

## 9. When George sends feedback

When he pastes a Feedback export or notes:

1. Triage every item and record the outcome in the log.
2. Fix wrong music (notes, chords, frets, rhythm) first, because those undermine trust. Treat "unplayable" and "confusing" next.
3. Where he says something is too hard or too easy, adjust tempo ranges, steps and repairs. Where he marks a lesson as checked, respect it.
4. Release the fixes, then continue the package sequence.

His feedback outranks your earlier judgement, but not the honesty rules in section 7.2.

---

## Progress

Update this table as packages finish.

| Package | Status | Released (commit / date) | Notes |
| --- | --- | --- | --- |
| 0 Start-up and consolidation | PR open, CI green | PR #6 · awaiting George's merge | Phase 6 branch commits brought in; CI pinned to Ubuntu 24.04 (A3); superseded branches to delete after merge; `AGENTS.md` Safety left for George (R1) |
| 1 Draft status, feedback, checklist | pending | | |
| 2 Close Phase 5 (software) | pending | | |
| 3 Music engine and authoring pipeline | pending | | |
| 4 Curriculum map and repertoire plan | pending | | |
| 5 Batch 1 · Units 1–12 | pending | | |
| 6 Batch 2 · Units 13–24 | pending | | |
| 7 Batch 3 · Units 25–36 | pending | | |
| 8 Batch 4 · Units 37–48 | pending | | |
| 9 Phase 7 consolidation and release | pending | | |
| 10 Phase 8 extensions (hands-free, no-guitar, own music, AI) | pending | | |
| 11 Finish line | pending | | |
