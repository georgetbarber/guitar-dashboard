# Phase 0 baseline and audit status register

**Recorded 10 September 2026.** Deliverable for Phase 0 of the
[implementation plan](../IMPLEMENTATION_PLAN.md): a verified starting point,
a disposition for every supplied engineering finding, and a bounded first
implementation scope.

This document records what was observed, not what was fixed. Where a finding
could not be reproduced on this path, that is stated rather than assumed
resolved.

## 1. Starting point

| Item | Value |
| --- | --- |
| Branch | `codex/public-hardening` |
| Head commit | `6d4e5bf` — Run Firebase rule tests on Java 21 |
| Active application | `apps/current` (Guitar Academy V8, `package.json` version 0.8.0) |
| Entry point | `src/main.tsx` → `src/app/App.tsx` → `V8StoreProvider` → `CloudSyncProvider` |
| Active source tree | `src/v8/**`, plus shared `src/core`, `src/audio`, `src/components`, `src/styles` |
| Retained older UI | `src/app` (shell only), `src/application`, `src/features`, `src/learning`, `src/content` — reachability review belongs to Phase 7 (B27) |
| Routes | `/learn`, `/learn/course`, `/learn/strengthen`, `/play`, `/create`, `/explore` |

### Verification commands

| Purpose | Command |
| --- | --- |
| Unit tests | `npm test` (`vitest run src`) |
| Typecheck and build | `npm run build` (`tsc -b && vite build`) |
| Firebase rules | `npm run test:rules` (needs the emulator and a supported Java runtime) |
| Browser journeys | `npm run test:e2e` (needs `npm run test:e2e:install` first) |
| Whole repository | `scripts/verify-all.sh` |

## 2. Verification environment, and what that limits

The results below were produced in a Linux runner holding a copy of
`apps/current` at `~/runner/current`, installed from the repository's own
`package-lock.json` with `npm ci`.

This distinction matters and is not cosmetic. The `node_modules` tree inside
the repository is built for macOS (`@rollup/rollup-darwin-arm64`,
`rolldown/dist/shared/binding-darwin-arm64`) and cannot execute on the Linux
path used for this session; running an install in place would have replaced
George's working macOS tree. The runner copy is source-identical and
lock-identical, so unit, typecheck and build results transfer. Anything
platform-specific does not.

**Not run on this path, and not claimed:**

- **Firebase rules tests.** The runtime available here is OpenJDK 11; the
  emulator requires Java 21, which commit `6d4e5bf` configures for CI. Rules
  evidence must come from CI or from George's own machine (B31).
- **Browser journeys.** Playwright browsers are not installed on this path.
  The audit's figure of 32 browser tests is a historical observation and was
  not re-counted.
- **Live hosting behaviour.** Headers, service-worker delivery and update
  behaviour can only be checked against a published deployment (B32, Phase 7).

## 3. Baseline results

| Check | Result |
| --- | --- |
| `npm test` | **Pass** — 17 files, 94 tests, 1.02s |
| `npm run build` | **Pass** — `tsc -b` clean, 66 modules, built in 230ms |
| `npm audit` | **18 vulnerabilities (15 moderate, 3 high)**, all in the dev toolchain |
| Firebase rules tests | Not run here (Java 11; requires 21) |
| Browser journeys | Not run here (browsers not installed) |

The 94 unit tests match the count the supplied audit reported, so that figure
is current rather than stale. The 18 advisories also match. Both remain
observations, not pass criteria.

### Bundle and cache measurements

Taken from the production build, and useful later as before/after evidence for
B18 and B19:

| Asset | Raw | Gzip |
| --- | --- | --- |
| `assets/firebase-*.js` | 594.76 kB | 177.27 kB |
| `assets/index-*.js` | 345.40 kB | 108.02 kB |
| `assets/index-*.css` | 52.61 kB | 10.81 kB |
| Service worker precache | 14 entries, 991.19 KiB | — |

The Firebase chunk is separated by `manualChunks` but is still requested at
startup for guests, because `src/v8/cloud.tsx` imports the SDK at module scope.

## 4. Uncommitted work already in the tree

The working tree carries changes that predate this plan. Per Phase 0 they were
reviewed rather than overwritten or assumed finished.

| File | State | Disposition |
| --- | --- | --- |
| `src/v8/limits.ts`, `limits.test.ts` | **Wired and tested.** Imported by `store.tsx`, `features/Create.tsx`, `components/ActivityPlayer.tsx`; 6 passing tests | Keep. Partially addresses B09 for scalar sketch fields. Nested arrays remain unbounded — see B09 below |
| `firebase.json` | Security headers added (CSP, Referrer-Policy, X-Content-Type-Options) | Keep. The service-worker cache header is still misdirected — see B20 |
| `scripts/publish-live.sh` | Secret-name guard before `git add -A` | Keep. Unrelated to the audit findings, and a sensible guard on a public repository |
| `src/v8/cloud.tsx`, `store.tsx`, `features/Create.tsx`, `components/ActivityPlayer.tsx` | Bounds applied at the reducer and input layers | Keep |
| `docs/README.md` | Adds the plan to the documentation index | Keep |
| **`src/v8/identity.ts`** | **Orphaned.** Exports `newId(kind)`; imported by nothing | Adopt in Phase 1A — this is the intended fix for B28 |
| **`src/v8/validation.ts`** | **Orphaned.** Exports `validateSketch`, `validateEvidence`, `validateSettings`, `validateProfile`, `validateState`; imported by nothing | Adopt in Phase 1B. Not wired in 1A, because doing so changes what the app accepts from storage and needs 1B's isolation and recovery behaviour around it |

The two orphaned modules are the most important finding in this section: the
repository currently contains code that looks like a fix for B28 and B08 but
changes no behaviour, because nothing calls it.

## 5. Audit status register

`Confirmed` = reproduced against this checkout. `Partial` = a fix exists but
does not cover the finding. `Not reproduced here` = requires an environment
this path does not have.

### Confirmed

| ID | Finding | Evidence in this checkout |
| --- | --- | --- |
| B01 | Practice duration ignored | `learning.ts` `buildSession` hard-codes item minutes `3, 5, 6, 6, 5`. `settings.dailyMinutes` is written by `SettingsPanel.tsx` and displayed by `Today.tsx`, and read by neither planner |
| B02 | Invisible local-save failure | `store.tsx`: `void savePersistedState(state, workspaceId).catch(() => undefined)`. The failure is discarded; no state, message or retry exists. `Create.tsx` shows the fixed string "Changes save automatically on this device.", and `App.tsx`'s offline banner asserts "Your changes are safe on this device" |
| B05 | Create transformation controls only append prose | `Create.tsx` `TRANSFORMATIONS`: five of six write a line into `notes`. Only "Create a B section" changes musical data, and only by adding the string `"B"` to `sections` |
| B07 | Reported actions overstated as evidence | `createEvidence` records `source` and `assistance` from the caller with no distinction between measured and self-reported outcomes |
| B09 | Incomplete bounds | `limits.ts` bounds `tempo` and six string fields. `chords`, `melody`, `sections`, `tags`, `takes`, `revisions`, `reflections` and `deletedSketchIds` have no client-side length bound |
| B10 | Sketch ignores shared tonal context | `repository.ts` `newSketch` hard-codes `key: "C", mode: "major"` and never consults `settings.tonicName` / `settings.mode` |
| B17 | Internal version copy in learner experience | `App.tsx`: sidebar `Musical freedom · V8`, diagnostic mark `Guitar Academy V8`, and the eyebrow `A clean V8 beginning` |
| B18 | Guest startup loads Firebase | `cloud.tsx` calls `initializeApp` / `getAuth` / `getFirestore` at module scope, so the 594.76 kB Firebase chunk is fetched before any sign-in |
| B19 | Large initial and PWA cache footprint | 14 precache entries, 991.19 KiB; Firebase chunk 177.27 kB gzipped on first load |
| B20 | Worker header targets wrong filename | `firebase.json` sets `Cache-Control: no-cache` on `/service-worker.js`; `vite-plugin-pwa` emits `dist/sw.js`. The header applies to a file that is never built |
| B24 | Verification script omits iteration 07 | `scripts/verify-all.sh` lists `02`–`06`; `apps/history/07-practice-first` exists and is skipped |
| B25 | App-directory README wrong | `apps/README.md` calls `current/` "iteration 07 (V7)" — it is V8 — and says `history/` holds "six" snapshots, where it holds seven (`01`–`07`) |
| B26 | Two broken historical README links | Both in `apps/history/07-practice-first/README.md`: `../../docs/PROJECT_HISTORY.md` and `../../docs/ARCHITECTURE.md` resolve to `apps/docs/`. They need one more level (`../../../docs/`). The similar link in `01-original-prototype` is correct |
| B28 | Timestamp-derived IDs can collide | Four sites: `repository.ts` `sketch-${Date.now()}-${index}`; `Create.tsx` `revision-${Date.now()}`, `chord-${Date.now()}`, `take-${Date.now()}`. Evidence IDs in `learning.ts` are `${occurredAt}-${activityId}-${index}` — also clock-derived. The sketch index is `sketches.length`, so deleting a sketch and creating another within the same millisecond reproduces an ID |
| B29 | Append-only evidence conflicts with deletion | `firestore.rules`: `/evidence/{id}` allows `create` but not `update` — append-only — while also allowing `delete` |
| B30 | Development dependency advisories | 18 advisories (15 moderate, 3 high), including `stream-json` ≤3.4.0 and `uuid` <11.1.1 via `gaxios`. All reach the tree through `firebase-tools`; none ship to the browser |
| B31 | Rules tests not locally verified; Java unavailable | Only OpenJDK 11 is installed on the verification path. `6d4e5bf` sets Java 21 for CI, so the CI route works and the local route does not |

### Partial

| ID | Finding | What exists, and what it does not cover |
| --- | --- | --- |
| B08 | Persisted, imported and cloud data trusted too readily | `validation.ts` is written but wired to nothing, so nothing validates today. `repository.ts` `validateArchiveHeader` checks format, versions, recording index and blob references, but not the state's own contents |
| B04 | Non-transactional import, orphaned blobs | `importBinaryArchive` checks a storage estimate and total size before writing, which is real progress. It still calls `saveBlob` per recording and then `savePersistedState` with no staging generation: an interruption part-way leaves new blobs written against the previous state |

### Confirmed by inspection, deferred for measurement

| ID | Finding | Note |
| --- | --- | --- |
| B03 | Update reload during recording/editing | `vite.config.ts` sets `registerType: "autoUpdate"` with `skipWaiting: true` and `clientsClaim: true`, which is the mechanism the finding describes. The reload-during-recording behaviour itself needs a browser journey to demonstrate |
| B06 | 48 units / 432 templated activities lack depth | Structurally visible in `curriculum.ts`. This is a content judgement, settled by Phases 3 and 6, not by a code check |
| B11, B12, B13, B14, B15, B16 | Accessibility findings | Not measured on this path. Contrast ratios, dialog focus behaviour, fretboard traversal and font delivery need a browser and the automated checks that Phase 2A introduces. Accepted as Phase 2 scope without re-litigation |
| B21, B22, B23 | CI, deployment concurrency, lint/coverage gates | Confirmed absent by reading `.github/workflows/` (two Firebase hosting workflows only) and `package.json` (no lint, format or coverage script). Behaviour under a real deployment race is Phase 2B |
| B27 | Unreachable old UI in active source | The older trees are present. Proving non-reachability is the Phase 7 task and was not attempted |
| B32 | Real-device and live behaviour unverified | Requires publication, which needs George's explicit instruction |

## 6. Recovery fixtures

Fixtures were prepared to the extent Phase 1A needs them: failure injection for
the local store, and rapid-creation cases for identity. The remaining fixtures
the plan lists — older archives, malformed records, recording blobs,
conflicting device updates and deletion cases — belong with the milestones that
consume them (1B and 1C) and are deliberately not built ahead of the code they
must test.

No snapshot commit, stage, reset or deletion of unrelated files was performed.

## 7. First implementation scope

**Phase 1A**, as the plan specifies:

1. Adopt `identity.ts` at all five ID sites; preserve existing IDs and
   references (B28).
2. Expose distinct local save states — saving, saved, failed with retry —
   separate from cloud status, and stop asserting durability the app has not
   achieved (B02).
3. Offer a recoverable export when the normal store fails.
4. Add regression tests covering both.

Phase 1B follows and is where `validation.ts` is adopted, with the isolation
and recovery behaviour that wiring it in requires.
