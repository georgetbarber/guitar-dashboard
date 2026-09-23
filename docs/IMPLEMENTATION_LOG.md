# Implementation log

The running record [section 15 of the implementation plan](IMPLEMENTATION_PLAN.md)
asks for: one entry per work package, with its linked findings, acceptance
evidence and remaining limitations.

"Implemented" does not close a finding that still needs its verification.
Statuses: pending, in progress, implemented, verified locally, verified in CI,
needs musical/device/learner review, released, superseded.

---

## Phase 0 — verified starting point

| | |
| --- | --- |
| **Status** | Verified locally |
| **Findings** | All of B01–B32 given a disposition; none closed |
| **Depends on** | — |
| **Changed** | `docs/reviews/2026-09-10-phase-0-baseline.md` (new). Documentation only |
| **Evidence** | 94 unit tests pass; `tsc -b && vite build` clean; `npm audit` reports 18 advisories. Every finding's classification cites a line in the current source |
| **Migration impact** | None |
| **Limitations** | Firebase rules tests and browser journeys did not run on this path (Java 11 against the emulator's Java 21 requirement; no Playwright browsers). Accessibility findings B11–B16 were accepted from the audit rather than re-measured, and belong to Phase 2A. Live behaviour (B32) needs publication |

---

## Phase 1A — stable identity, and a truthful local save

| | |
| --- | --- |
| **Status** | Verified locally |
| **Findings** | B28 (closed pending CI), B02 (closed pending CI) |
| **Depends on** | Phase 0 |
| **Changed** | `src/v8/identity.ts`, `saveState.ts` (new), `components/SaveStatus.tsx` (new), `save.test.ts` (new); `repository.ts`, `store.tsx`, `learning.ts`, `features/Create.tsx`, `app/App.tsx`, `styles/app.css` |
| **Evidence** | 110 unit tests pass (94 before, 16 in the new file); build clean. Each of the four repaired defects was reintroduced individually in a scratch copy and failed exactly its own test and no other |
| **Migration impact** | None. Existing IDs are read and written unchanged; only newly created records use the new form. No schema or rules change |

### What changed, and why

**Identity (B28).** All five creation sites — sketch, revision, chord event,
take, observation — now call `newId(kind)`. The previous
`${kind}-${Date.now()}` form collides whenever two records of a kind are made
inside one millisecond, which every transformation button in Create does
(it writes a revision and updates the sketch in one click). The sketch ID was
worse: it mixed in `sketches.length`, so deleting a sketch and creating another
returned the index to a used value and reproduced a whole ID. Because these IDs
are Firestore document keys and recording blob keys, a collision overwrites one
record with another silently, in the cloud and on the device.

`newId` falls back to `getRandomValues` where `randomUUID` is missing.
`randomUUID` requires a secure context, which excludes the dev server reached
over a LAN address — the exact route for testing on a phone in Phase 7.

**Local save (B02).** The store discarded the save promise's rejection
(`.catch(() => undefined)`), so a device that could store nothing was
indistinguishable from one that had just saved, while the interface asserted
"changes save automatically on this device" and the offline banner said work was
"safe on this device".

Now:

- `savePersistedState` reports **where** the write landed. A localStorage
  fallback is no longer reported as equivalent to a durable IndexedDB write —
  it holds a few megabytes at best and will start refusing a growing sketchbook.
- `saveState.ts` holds the transitions as pure functions. A failure preserves
  `lastSavedAt` and `medium`, because they describe the copy already on the
  device, which a failed write does not touch.
- `runSave` is the single path by which an outcome is reported. Every branch
  either reports or is deliberately silent, and silence only happens when a
  newer save has superseded this one and will report the truth for a superset of
  the same edits. No branch discards a rejection.
- The unsaved state is held before the write begins and released only once it is
  durable, so a retry resends exactly what failed rather than a newer partial.
- Switching workspace retires any in-flight save and drops the unsaved copy, so
  one workspace's result cannot be reported against another, and a retry cannot
  write one workspace's work into another.
- `SaveIndicator` states the device's status in the sidebar, permanently and
  separately from the cloud badge. `SaveFailureAlert` appears only on failure
  and offers a retry and a recovery-file download.
- Copy that asserted durability was corrected in `App.tsx` and `Create.tsx`.

### Limitations

- Not verified in CI, on a real device, or against the Firebase emulator.
- The recovery file omits recordings this device can no longer read. The
  interface says so; it is not silently a partial backup.
- `runSave` is covered through its seam rather than by rendering the provider.
  A DOM test environment does not exist in this repository yet; adding one is
  Phase 2B work (B23).
- B02's sibling promises are **not** addressed here and remain open:
  `buildSession` still ignores `settings.dailyMinutes` (B01), the Create
  transformation controls still only append prose (B05), and `newSketch` still
  hard-codes C major rather than inheriting the tonal context (B10). All three
  belong to Phase 1E.

---

## Phase 1B-1 — validation at the three trust boundaries

| | |
| --- | --- |
| **Status** | Verified locally |
| **Findings** | B08 (closed pending CI); part of B04 (blob ordering on import) |
| **Depends on** | Phase 1A |
| **Changed** | `validation.test.ts` (new); `repository.ts`, `sync.ts`, `cloud.tsx`, `store.tsx`, `components/SaveStatus.tsx`, `app/App.tsx`, `styles/app.css`. `validation.ts` adopted unchanged |
| **Evidence** | 122 unit tests pass (110 before); build clean. Four defects reintroduced individually failed seven of the twelve new tests and no others |
| **Migration impact** | A stored workspace this build cannot parse now blocks saving and shows a recovery notice instead of starting empty. No schema or rules change |
| **Limitations** | Not verified in CI, on a device, or against the emulator |

`validation.ts` had been in the tree imported by nothing, so nothing was
validated at all. It is now applied at all three boundaries:

- **Local.** `loadWorkspace` returns empty, ok or **unreadable** rather than
  casting bytes to `V8State`. Unreadable suspends saving, because the default
  state is what is on screen and the first autosave would write it over the only
  copy of the learner's work — turning a parsing problem into real data loss.
  `workspaceExists` treats unreadable as present so signing in cannot replace
  it, and `moveWorkspace` refuses it rather than rewriting the only recoverable
  copy under a new key.
- **Archives.** The workspace is validated in full, and before any recording is
  written. The old ordering wrote blobs first, so a rejected import left them
  orphaned.
- **Cloud.** Documents are accepted one at a time. The valid ones merge, the
  rest are set aside with a reason, and the badge says how many were skipped.
  Only accepted ids enter the upload cache, so a good local copy of a rejected
  record repairs it rather than being skipped as already present.

---

## Phase 1B-2 — complete bounds, visible refusal, isolated uploads

| | |
| --- | --- |
| **Status** | Verified locally |
| **Findings** | B09 (closed pending CI); the sync-stall half of B02's cloud path |
| **Depends on** | 1B-1 |
| **Changed** | `upload.test.ts` (new); `limits.ts` (rewritten), `limits.test.ts` (rewritten), `sync.ts`, `cloud.tsx`, `store.tsx`, `features/Create.tsx` |
| **Evidence** | 143 unit tests pass (122 before); build clean. Four defects reintroduced individually failed seven tests and no others |
| **Migration impact** | Over-limit material already on a device is preserved and kept working locally; it stops being uploaded and says so. No schema or rules change |

These two landed together because removing the truncation without the isolation
would have reintroduced the permanent sync stall that the truncation existed to
avoid.

**Bounds (B09).** `tags`, `chords`, `melody`, `sections`, `takes`, `revisions`
and `reflections` were all capped by `firestore.rules` and unbounded on the
client, so any of them could end an account's sync with no warning. All are now
mirrored, along with the profile's `activeUnitId`, `completedActivityIds` and
`deletedSketchIds`. A whole-document size estimate was added as well, because
the per-field caps do not add up to a guarantee: exactly 500 revisions is within
the rules' cap and still exceeds the 1 MiB Firestore refuses outright — before
any rule runs, so the rules tests would never catch it.

**No more silent truncation.** The previous `boundSketch` cut every over-length
string back to the cap, arguing that losing the overflow beat losing sync. That
argument fails in the one case it matters: the caps are far above anything typed
by hand, so they are reached by accumulated work, and quietly deleting a
learner's accumulated work to make a cloud document fit is the worst available
outcome. Now `admitSketchEdit` refuses an edit that would **newly** exceed a cap
and Create names what was refused while the learner still has the text in hand;
material already over a cap is left untouched, because it is theirs and a bound
introduced later must not consume it. Tempo remains the one clamped value — it
comes from a number input and has no content to lose.

**Isolation.** A batch is atomic, so a document the server refuses failed every
write beside it, and the next state change rebuilt the identical batch — which
is the mechanism by which one out-of-range field ended a learner's sync for
good. Documents are now screened before batching, and a batch refused for a
permanent reason is retried one write at a time so the offender is found,
withheld with its reason, and everything else gets through. Transient codes are
rethrown untouched rather than split into hundreds of individual writes.
Withheld records never enter the upload cache, so trimming a sketch back within
range uploads it rather than leaving it skipped as already sent.

**Growth strategy.** Deletion records are counted and reported, never pruned:
dropping one to fit the cap lets a device offline since before the deletion
resurrect the deleted sketch on its next sync, which is a worse failure than a
profile that will not upload and says so.

### Limitations

- Not verified in CI, on a real device, or against the Firebase emulator. The
  isolation path in particular deserves an emulator test against the real rules.
- Separating histories into their own records, if revision growth demands it, is
  deliberately **not** done here. It is a schema change with a migration, and it
  belongs with 1C's transactional work rather than being bolted onto a bounds
  change.
- `firestore.rules` is unchanged; these are the client counterparts to limits
  that already existed server-side.

---

## Phase 1C — transactional restore

| | |
| --- | --- |
| **Status** | Verified locally |
| **Findings** | B04 (closed pending CI) |
| **Depends on** | 1B |
| **Changed** | `restore.test.ts` (new); `repository.ts`, `store.tsx`, `cloud.tsx`, `components/SettingsPanel.tsx`, `components/SaveStatus.tsx`, `app/App.tsx`, `styles/app.css`, `validation.test.ts` |
| **Evidence** | 152 unit tests pass (143 before); build clean. Four defects reintroduced individually failed four of the nine new tests and no others |
| **Migration impact** | IndexedDB goes to version 3, adding a `staging` store. The upgrade only creates the store; no existing record is read or rewritten. `importArchive` is replaced by `prepareRestore` + `activateRestore` |

### Staged, then activated

Every step of the old import was live. Recordings were written straight into the
active workspace and the state replaced afterwards, so an interruption between
the first blob and the final state left new recordings against the old workspace
with nothing referencing them — and a failure on the state write left them there
permanently with no way to find them again. There was also no point at which the
learner could see what they were about to replace, or in which workspace.

Now:

- **Validated whole, before anything is staged** — versions, metadata, the
  workspace itself, the recording index, and that every recording the state
  references is actually carried.
- **Staged into an inactive generation.** Recordings are written under a
  `staging\u0000<operationId>` namespace, never the workspace's own, and the
  manifest only becomes activatable once every one of them is durable.
- **Activated in a single IndexedDB transaction** that re-keys the staged
  recordings, replaces the state and deletes the staging generation. The
  transaction is atomic, so the workspace either becomes the restored one or
  stays exactly as it was.
- **Interruption costs nothing.** Nothing in the previous workspace is touched
  before that transaction commits, so a cancellation, a crash or a quota failure
  at any earlier stage leaves it fully usable. A manifest still present at
  startup means activation never ran, so `discardIncompleteStaging` clears what
  it staged before the workspace opens.
- **A preview before confirming** names the workspace, the export date, the
  counts and how many recordings the restore would supersede.

**Superseded recordings** are removed only after activation has committed, and
only those the previous workspace referenced and the restored one does not. A
recording the restored state still points at is never a candidate, and neither
is one belonging to another workspace — so a restore cannot delete a shared or
externally referenced recording.

### A local restore is not an account replacement

Left alone, the ordinary upload loop would push a restored workspace straight
into the signed-in account and overwrite whatever history was there, silently
and with nothing to undo it with. Activating a restore now pauses uploading and
asks: update the account from this backup, or sign out and keep the restored
copy on this device. The pause is cleared on any workspace switch, since signing
in or out changes which account is at stake.

### Limitations

- Not verified in CI, on a real device, or against the Firebase emulator.
- The restore hold is provider state, covered by reading rather than by a test,
  for the same reason as `runSave`: there is still no DOM test environment
  (Phase 2B, B23).
- Quota exhaustion *during* staging is handled by the same cleanup path as any
  other staging failure, but is not itself fault-injected in a test — only its
  cleanup is, through `discardIncompleteStaging`.
- Real-device restore behaviour, including a large archive on the Pixel, is
  Phase 7 work.

---

## Phase 1D — safe application updates

| | |
| --- | --- |
| **Status** | Verified locally |
| **Findings** | B03, B20 (both closed pending CI and a live check) |
| **Depends on** | 1A (save state), 1C (restore) |
| **Changed** | `updates.ts`, `updates.test.ts`, `components/UpdateNotice.tsx`, `tests/hosting.test.ts` (all new); `install.ts`, `vite.config.ts`, `firebase.json`, `package.json`, `features/Create.tsx`, `components/SaveStatus.tsx`, `components/SettingsPanel.tsx`, `app/App.tsx`, `styles/app.css` |
| **Evidence** | 164 tests pass across 23 files (152 before); build clean. Three defects reintroduced individually failed eight of the fifteen new tests and no others. The built `dist/sw.js` was inspected directly: `skipWaiting()` now appears only inside the SKIP_WAITING message handler, and `clientsClaim()` is gone |
| **Migration impact** | A client on the old build still self-activates once, because its worker was built with `skipWaiting`. From the first build carrying this change onward, updates wait to be asked for |

### The update no longer takes the page

`registerType: "autoUpdate"` with `skipWaiting` and `clientsClaim` meant a new
build took control the moment it finished installing, and `install.ts` reloaded
on `controllerchange`. A learner could lose a recording in progress, an import
part-way through, or unsaved edits — with no warning and nothing to decline.
Worse, the update check was tied to window focus, so the reload was most likely
to arrive exactly as they returned to the tab.

A new worker now installs and waits. `updates.ts` holds the rules about when it
may be applied, deliberately free of service-worker and DOM types so they can be
tested directly:

- `holdUpdates(reason)` keeps an update off while something is in flight, and
  the reason is shown to the learner.
- `requestUpdate()` applies immediately when nothing is held, and otherwise
  **queues** — the last hold to be released applies it. Nothing is interrupted.
- Releasing a hold with no update requested does nothing. Finishing a recording
  is not consent to reload the page.
- A queued update can be called off and asked for again later.

Holds are taken while a recording is in progress, while a temporary take is
neither kept nor discarded, while work is mid-save or failed to save, and while
a backup is being restored.

`install.ts` also reloads only for an update **this tab** asked for. A
`controllerchange` can arrive because another tab applied the update, and
reloading on that would reintroduce the same interruption in a tab that never
consented.

### Temporary audio is described as what it is

A pending take lives only in the tab's memory — no chunk persistence exists — so
the copy now says so plainly rather than implying a recovery that is not
implemented. The update hold is the whole protection, not a fallback.

### The cache header named a file that is never built

`firebase.json` set `Cache-Control: no-cache` on `/service-worker.js`;
`vite-plugin-pwa` emits `/sw.js`. The rule applied to nothing and the real
worker was served with default caching, which is how a device goes on running an
old build after a new one is published. `tests/hosting.test.ts` now asserts the
header names the emitted worker, and — when a build is present — that every
`.js` source named in the hosting headers actually exists in `dist`. It sits
outside `src/` because it reads repository configuration rather than
application code, which is also why `npm test` now names it explicitly.

### Limitations

- Not verified in CI, on a real device, or against a live deployment. Whether
  the header is actually served, and whether the waiting worker behaves on the
  Pixel's installed PWA, are Phase 7 checks (B32).
- The hold wiring is provider and component state, covered by reading rather
  than by a rendered test — the standing gap until a DOM environment exists
  (Phase 2B, B23). The rules those holds obey are fully tested.
- One client already running the old build will still self-activate its next
  update, because the decision lives in the worker it already has. Only builds
  from this change onward wait.

---

## Phase 1E — correct the current promises

| | |
| --- | --- |
| **Status** | Verified locally |
| **Findings** | B01, B05 (interim wording), B07, B10, B29 — all closed pending CI |
| **Depends on** | 1A–1D |
| **Changed** | `promises.test.ts` (new); `learning.ts`, `types.ts`, `repository.ts`, `store.tsx`, `validation.ts`, `firestore.rules`, `tests/firebaseRules.test.ts`, `components/ActivityPlayer.tsx`, `components/SettingsPanel.tsx`, `features/Create.tsx` |
| **Evidence** | 180 tests pass across 24 files (164 before); build clean. Five defects reintroduced individually failed ten of the sixteen new tests and no others |
| **Migration impact** | Three optional evidence fields (`method`, `artifactId`, `retracts`). Records written without them stay valid in the validator and the rules; nothing is rewritten |

Every item here is a case where the interface claimed something the app did not
do.

**B01 — the session is the length that was chosen.** `buildSession` hard-coded
five items totalling 25 minutes, while `dailyMinutes` was settable from 10 to 90
and displayed on Learn as though it applied. It now fits the existing five-part
shape to the budget: fewer parts when there is less time rather than unusable
slivers, whole minutes that add up to the figure exactly, and no activity used
twice to fill two slots — which the old planner could do, so a "five-part
session" was sometimes three. This is an interim correction; the session design
itself is Phase 4A.

**B10 — a sketch starts in the music the learner is in.** `newSketch` was born
in C major whatever the app was set to, so someone practising in E minor got the
wrong key, the wrong chord choices and the wrong relationships, and Create and
Explore then disagreed about where home was. It now inherits the current root
and mode. The root lists also differed — seven options in Create, twelve in
Settings — so a key chosen in one place could not be chosen in the other; both
now use the shared `TONAL_ROOTS` and `MODE_OPTIONS` from `validation.ts`, which
were present and, like the rest of that module, used by nothing.

**B05 — the experiments no longer read as operations.** Five of the six buttons
appended a sentence to `notes` while presenting as actions, so pressing
"Transpose the idea" could reasonably be taken to mean something had been
transposed. They now say they are noting an experiment for the learner to try,
under a heading that says the app does not change your music for you. "Add a B
section", the one that does change the sketch, is separated out and labelled as
such. The real reversible operations remain Phase 4C.

**B07 — an observation says how it was established.** Nothing in V8 measures a
performance or checks an answer; every outcome is the learner reading a success
criterion and reporting what happened. Observations now carry
`method: "self-reported"`, and the interface says so at the point of recording
and again on the confirmation. The type deliberately has one value — naming
"measured" before anything measures would be the same overstatement this field
removes. Creative completion also used to accept "I captured the idea" on its
own; it now requires a sketch that exists, names it, and links it through
`artifactId` — which records that work exists, never a judgement of it.

**B29 — the append-only contract is settled.** The rules allowed `create` but
not `update`, implying immutability, while also allowing `delete`. The contract
is now explicit in all three places. Observations are immutable: a mistaken
report is corrected by appending a **retraction** naming the original through
`retracts`, and the player offers exactly that ("I picked the wrong result").
Both halves survive, so the correction is auditable rather than a quiet rewrite,
and every progress calculation runs through `liveObservations`, which sets aside
retractions and what they retract. `allow update: if false` states the rule the
omission only implied, and `delete` is documented as belonging to deliberate
account erasure — never to amending a single record. Nothing in the client
deletes an evidence document during ordinary use.

### Limitations

- Not verified in CI, on a real device, or against the emulator. The four new
  rules cases are written and will run there.
- The session fitting is arithmetic over the existing activity set. Whether the
  resulting sessions are musically coherent at 10 or 90 minutes is a content
  question for Phase 4A, not something these tests can answer.
- Retraction covers the record a learner just wrote, from the confirmation
  screen. Correcting an older observation from the history has no route yet.
- `method` exists to be extended. Phase 5 adds measured and answer-checked
  values, and the rules and validator gain them at the same time.

## Phase 1 gate

With 1E complete, Phase 1's gate is met as far as local evidence can establish
it: failure injection does not lose the previous durable workspace (1A, 1C);
saves and sync never falsely report success (1A, 1B-2); malformed data is
handled visibly (1B-1); and each confirmed trust failure has a targeted
regression check, every one of them mutation-verified. Local transactions are
not described as atomic across Firebase and browser storage — activation is
atomic within IndexedDB only, and the log says so.

What the gate still wants and this repository cannot yet give: CI runs, Firebase
rules evidence from the emulator, and real-device behaviour. Those belong to
Phase 2B and Phase 7.

---

## Next package at the end of Phase 1 (historical)

**Phase 2 — accessibility and release foundations.** 2A is the interface work:
the mobile settings/new-sketch collision and cramped Learn tabs (B11), text and
control contrast (B12), dialog focus entry, containment, Escape and restoration
(B13), a usable keyboard fretboard (B14), automated and manual accessibility
checks (B15), fonts supplied locally or chosen deliberately (B16), and removing
"V8" and build language from learner-facing copy (B17).

2B is the release side: browser journeys in CI (B21), deployment concurrency
protection (B22), linting, formatting and coverage visibility (B23), reviewed
dependency upgrades (B30), lazy-loading Firebase so guest startup omits the
594 kB chunk (B18), startup and cache measurement (B19), iteration 07 in the
verification script (B24), and the app-directory README and two broken
historical links (B25, B26).

**Worth doing early in 2B:** a DOM test environment. `runSave`, the restore hold
and the update holds are all provider or component state covered by reading
rather than by a rendered test. Their rules are tested; their wiring is not.
That gap has now accrued across 1A, 1C and 1D.


---

## Phase 2B-1 — rendered reliability tests and release checks

Completed locally 17 September 2026, starting at `d0cf81d` on
`codex/public-hardening`. This is the first Phase 2 package, not completion of
Phase 2 or a release approval. Earlier changes in the root `.gitignore` and
`scripts/publish-live.sh` were preserved separately.

### What changed

- Added jsdom and React Testing Library. Nine new rendered tests run the actual
  store, save notices, Create recording controls, restore controls, update
  coordinator, and cloud provider. Storage and Firebase SDK operations are
  controlled test doubles; no production account or microphone is used.
- Four update-protection defects were reproduced and fixed: React's transition
  from recording to temporary take could release the last hold too early;
  keeping a take could release its temporary hold before the sketch's save
  indicator rendered; backup file preparation was unprotected; and completing
  activation could reload away the pending account choice. Update activation
  now rechecks holds after React's effect handoff and is sent at most once.
  The store owns save protection from the start of the write, through failures
  and retries, rather than depending on a status component rendering.
- Restore preparation, activation and cancellation keep Settings open.
  Conflicting import, sign-in/out and erasure controls are disabled while a
  restore is pending. Failed cancellation keeps the preview and an actionable
  error. Failed recording storage keeps the temporary take available for retry;
  bounds are checked before storing it, and keep/discard cannot race each other.
- Added a real browser journey covering export, preview, cancel, confirmed
  restore and reload. Added a Firestore emulator case exercising `commitIsolating`
  against real rules: one denied sketch is withheld while a valid sketch is saved.
- Both hosting workflows now run unit/component coverage and desktop/mobile
  browser journeys, retain coverage and browser failure evidence, and keep the
  existing Java 21 rules gate. CI refuses focused browser tests and always starts
  its own server. These are workflow changes, not claims of executed GitHub runs.
- Live publication has a shared concurrency group with cancellation disabled,
  protecting the rules-to-hosting sequence. `check-release-head.sh` rejects
  non-main branches, mismatched checkouts, stale reruns and unreadable remote
  refs. Five disposable-local-Git tests exercise these cases without GitHub writes.
  Concurrency alone does not establish release order; the final remote-head
  check is necessary. See [GitHub's concurrency documentation](https://docs.github.com/en/actions/how-tos/write-workflows/choose-when-workflows-run/control-workflow-concurrency).
- `test:coverage` reports selected critical domains and UI, including gaps, with
  HTML and JSON output. There is deliberately no blanket percentage target.
  Lint and formatting gates remain separate Phase 2 work.
- `verify-all.sh` now includes history iteration 07. The app-directory README
  identifies V8 and seven historical snapshots, and iteration 07's two broken
  root-document links resolve. No historical application code changed.

### Dependency review

Added development-only DOM testing and coverage tools. Updated Vitest and its
coverage reporter together from 4.1.8 to 4.1.11 to address
[GHSA-82fw-gwwq-j7x9](https://github.com/advisories/GHSA-82fw-gwwq-j7x9).
A second compatible update group covered Browserslist/browser data, fast-uri,
js-yaml, Hono and Morgan within their existing dependency constraints. The
lockfile was inspected; Firebase application dependencies were not changed.

The initial audit found 18 development advisories. Adding coverage briefly
increased the dependency-path count to 19; the reviewed updates leave **10
moderate, zero high, zero critical**. Every remaining affected lockfile path is
a development dependency. Remaining reports concern Firebase CLI dependencies
including OpenTelemetry, csv-parse, stream-json and uuid, plus Express/body-parser
and qs. npm's suggested Firebase CLI 10.1.1 downgrade was not applied. The
compatible qs update attempt did not resolve its constrained nested copy.
This is partial B30 remediation, not a claim that dependency review is closed.

### Verification

| Check | Result |
| --- | --- |
| `npm run test:coverage` | 194 tests in 27 files passed on Vitest 4.1.11. |
| `CI=true npm run test:e2e` | 34 passed; desktop Chromium and Pixel 7 viewport/emulation. Complete exit status 0 recorded. |
| `npm run test:rules` with local Java 21 | 10 passed against Firestore and Storage emulators using `demo-guitar-academy`; complete exit status 0. |
| `npm run build` | TypeScript and production bundle passed; existing large-chunk warning remains. |
| Targeted mutation checks | All four update-protection defects reintroduced individually failed their selected rendered test; source restored after each run. |
| Release guard | Five cases passed against disposable local repositories, including a stale rerun with its matching checkout and a failed remote lookup. |
| Workflow/config review | Both YAML files parsed; browser, coverage and Java 21 gates present. Shell syntax and diff whitespace checks passed. |
| Preservation documentation | Both repaired historical links resolve; iteration 07 is in the verification list. Full historical-app suite was not rerun. |

Coverage for the selected reported files: **75.35% lines, 51.77% branches**.
The cloud provider remains only 53.11% line-covered; this is useful visibility,
not evidence that all auth, upload and restoration interactions are tested.
PWA build measurement: **14 precached entries, 1024.60 KiB**. B18/B19 loading and
cache work has not happened in this package.

Local Node was 26.8.1. CI specifies Node 22; jsdom requires 22.22.2 or newer in
that line. npm warns that Firebase's `superstatic` package declares support for
Node 20/22/24. Local success is not a substitute for running the configured CI
runtime. Java 21 was downloaded from Adoptium, checksum-verified against its
release metadata, and extracted inside ignored `.local-recovery/java21/`;
no system Java or production Firebase configuration was changed.

Logs are retained in ignored `.local-recovery/phase-2-unit.log`,
`phase-2-browser.log`, `phase-2-rules.log`, `phase-2-build.log`,
`phase-2-audit-final.json`, and `mutation-*.log`. HTML coverage is under
`apps/current/coverage/`. The browser rerun was initially blocked by automatic
approval review when account usage was exhausted; it subsequently completed
after George asked to continue.

### Remaining scope and release limits

- **Signed-in restore needs another reliability package before release:** the
  account decision still lives in provider memory. App-requested updates now
  wait for it, but manual reloads/crashes can lose that pause. Make the pending
  decision durable alongside activation, and verify remount, sign-in and incoming
  cloud snapshots cannot bypass it. The current cloud component test establishes
  cancellation of a scheduled upload and explicit resumption in one mounted
  session only. It does not establish exact cloud-history replacement semantics.
- Phase 2A remains: mobile layout, contrast, dialog focus/keyboard/inertness,
  fretboard keyboard navigation, accessibility checks, fonts and learner copy.
- Phase 2B remains: lint/format gates, remaining advisory review, Firebase lazy
  loading, and startup/offline-cache policy. B23 and B30 are only partially met.
- No CI job, physical Pixel, installed-PWA update, cross-tab update, real Google
  sign-in or live hosting header has been verified here. Nothing was pushed or
  deployed. These checks retain their explicit later gates.

Next: durable restore-decision protection, then the remaining Phase 2 interface
and loading work. Keep the rendered tests in the normal test command so fixes
cannot silently become unwired again.

---

## Phase 2B-2 — the restore decision survives reloads

Implemented 17 September 2026 (Codex session, after the 2B-1 entry above was
written). Verified locally, and mutation-checked, in a later session the same
day. Findings: B04 follow-up (restore versus account history), B03 (updates
during work). Uncommitted, like 2B-1: see "Commit status" below.

### What changed

- **The pause is stored with the restored workspace.** Activation writes
  `pendingRestoreId` in the same IndexedDB transaction that replaces the
  workspace. Reloading, crashing, signing out and signing back in all reopen
  the pause. It used to be provider memory.
- **Confirmation is durable before sync resumes.** `confirmRestoreMerge` clears
  the marker in its own transaction, only if it still names the same restore.
  An older confirmation cannot clear a newer restore or another account's.
  If writing the choice fails, sync stays paused and the choice can be retried.
- **Sync is paused in both directions.** No Firestore subscription starts while
  the marker is present. Late snapshots from a retired subscription are
  ignored, and the reducer refuses `mergeCloud` while the marker is set.
- **Write ordering.** Restore waits for in-flight autosaves before activating,
  so an older save cannot land afterwards and replace the restored copy.
  Activation refuses a preview prepared for a different workspace.
- **The marker is device-only.** Exports strip it, `cloudProfile` omits it and
  validation checks its shape.
- **Copy corrected.** The notice says "Merge with my account" and explains that
  this merges records by recency. It does not replace the account's history,
  which is what the sync code actually does.

### Verification

Mutation checks: each defect was reintroduced on its own.

| Defect reintroduced | Tests that failed |
| --- | --- |
| Activation does not persist the marker | 3 restore tests |
| Restore does not wait for older autosaves | rendered restore-hold test |
| A stale confirmation is accepted | older-confirmation test |
| Subscription ignores the marker | 3 cloud provider tests |
| Memory is cleared before the durable write | failed-confirmation test |
| Activation ignores the expected workspace | workspace-mismatch test |
| Export keeps the marker | archive test |
| Reducer merges cloud data while paused | **none, at first** |

The reducer guard had no test, because the subscription guard stopped every
case the existing tests covered. That leaves a real gap: a `mergeCloud`
dispatched in the same React update as the restore decision.
`ignores cloud data dispatched after a restore decision, even in the same
update` now covers it, and fails under that mutation.

### Limitations

- Only the emulated provider has tested this. Real Google sign-in and a
  physical device reload have not been checked.
- A guest workspace also keeps the marker, which surfaces once the learner
  signs in. That is intended, but no learner has seen it yet.

---

## Phase 2A-1 — modal dialogs and a keyboard fretboard

Verified locally 17 September 2026. Findings: **B13** (dialog focus, Escape,
restoration, inertness) and **B14** (fretboard keyboard traversal). B15 is
partly met: new browser checks exist, but nothing automated for contrast yet.
Codex started this package, and it was completed in a later session. It was
unfinished at handover: Settings failed its own new focus test, and the
fretboard edit was partial.

### What changed

- **`Modal` wraps the native `<dialog>` with `showModal()`.** Settings and the
  activity player use it. The browser keeps focus inside and makes the rest of
  the page inert. Escape and backdrop presses are only *requests*, and the
  owning component decides whether to close.
- **Chromium can close a dialog without a `cancel` event.** It does this when
  Escape is pressed repeatedly with no user activation in between. At handover,
  three Escapes closed Settings with a restore still pending. The dialog
  disappeared, the page stayed interactive, and React still considered it open.
  An unrequested close now reopens the dialog and counts as a request. Removing
  that handling fails the restore and reflection browser journeys.
- **Initial focus is explicit.** Chromium focuses the first focusable
  descendant, and in Settings that was the scrolling panel, not a control.
  Controls marked `data-autofocus` (the close buttons) receive focus instead.
  Focus returns to the trigger on close.
- **Only Settings closes from its backdrop.** A backdrop press no longer moves
  focus after the trigger has been refocused. The handover version also closed
  an activity when its margin was pressed, which would lose work.
- **React StrictMode remounts** used to leave a queued close event that shut
  every dialog as it opened. Stale close events are now ignored.
- **Escape keeps an activity open while a written reflection is unsaved.** A
  notice names the explicit exit, Close activity, which still works. With no
  draft, Escape closes. This follows the plan's "explicit safe exit when work
  is in progress".
- **The fretboard is one tab stop.** It uses roving `tabindex`: arrow keys move
  between strings and frets, Home/End jump along a string, and Ctrl/Cmd+Home/End
  jump to the corners. Tab leaves the grid, and focus returns to the last
  position. Before this, all 96 frets were separate tab stops.
- **Announcements.** Each cell reads string, fret, spelled pitch with octave,
  then relationship, for example "String 2, fret 1, B#3, Key 7". Selection uses
  `aria-selected`, and the grid is multi-selectable when a pitch class is
  selected.
- **Octaves are spelled correctly.** The handover code used
  `floor(midi / 12) - 1`, which labels B#3 as "B#4" and Cb4 as "Cb3". The octave
  number belongs to the letter, so the new `pitchWithOctave` in `theory.ts`
  takes accidentals into account, with ten tests.
- **Keyboard help matches what the fretboard does.** It appears only while
  keyboard focus is on the neck and is always exposed through
  `aria-describedby`. It says "selects", not "plays". A read-only fretboard
  makes no promise about Enter.
- **Test-helper race.** `completeDiagnostic` counted the onboarding heading
  before the loading screen had finished. When startup was slow it skipped
  onboarding, then timed out. This caused the intermittent failures
  (1–3 per run) seen when this package was picked up. It now waits for either
  screen first.

### Verification

Run in a Linux container from a copy of the working tree (Node 22.22.2, the CI
line). The Mac's local shell was unavailable this session.

| Check | Result |
| --- | --- |
| `npm run build` | Passed; existing large-chunk warning; 14 precache entries, 1030.37 KiB. |
| `npm test` | 229 tests in 29 files passed. |
| Browser journeys | 42 passed on desktop Chromium and Pixel 7 emulation, twice consecutively. The bundled Chromium build differs from Playwright 1.60's pinned one, so a local config override supplied `executablePath`. |
| `npm run test:rules` | **Not run.** The container cannot download the Firestore emulator jar. This package does not touch rules; 2B-1's local run stands. |

Mutation checks: each defect was reintroduced on its own, and the full unit
suite plus the named browser journeys were rerun.

| Defect reintroduced | Tests that failed |
| --- | --- |
| Browser chooses initial focus | 3 Modal unit tests; Settings journey (both viewports) |
| Native close without cancel accepted | Modal unit test; restore and reflection journeys (both) |
| Backdrop closes every dialog | Modal backdrop unit test |
| Backdrop press moves focus | Settings journey (both) |
| Stale StrictMode close treated as a request | Settings journey (both) |
| App bypasses the player's guard | reflection journey (both) |
| Player guard ignores drafts | Modal/activity unit test |
| Every fret tabbable | 2 fretboard unit tests; Explore journey (both) |
| Octave from `floor(midi / 12)` | 2 theory tests; fretboard announcement test |
| Help promises selection when read-only | read-only fretboard test |
| Settings closes during a pending restore | restore journey (both) |
| Fret clamp removed | none: equivalent mutant (movement starts from the focused cell, and a missing cell is never focused) |

### Limitations and findings

- **Save failures are hidden during an activity (newly identified).**
  `SaveFailureAlert` and the other notices live in `<main>`. The full-screen
  activity dialog covers them, as its fixed overlay already did, and they are
  now inert as well. Meanwhile the partial/retry completion screen says "The
  evidence is saved" whatever the save outcome. This is a B02 truthfulness gap outside this
  package, and it should come next rather than wait.
- Screen-reader output has not been listened to. The announcements are checked
  through accessible names in jsdom and Chromium, not with VoiceOver, TalkBack
  or NVDA. B15's manual check is still outstanding.
- Tab from a native modal's last control goes to the browser's own UI before
  wrapping, and the journey asserts that. This is native `<dialog>` behaviour,
  not a hand-rolled trap.
- Only the v8 Explore fretboard is reachable. The older `src/features` screens
  also render `Fretboard`, and they get the same behaviour, but they are
  unreachable (B27).
- Not addressed yet: B11, B12, B16, B17, and axe or contrast automation.

---

## Decisions on 2A-1, confirmed

George was asked about the three judgement calls in 2A-1 and left them to the
implementer. All three stand as implemented:

- Escape keeps an activity open while a written reflection is unsaved.
- Tab passes through the browser's own UI, as native `<dialog>` does, rather
  than a hand-built focus wrap.
- The hidden save-failure finding became the next package, ahead of B11/B12.

---

## Phase 2A-2 — urgent notices reach the learner, and records aren't called saved too early

Verified locally 17 September 2026. Findings: **B02** (invisible local-save
failure), whose 1A fix did not reach dialogs or onboarding; **B13** follow-up;
the 1E principle "don't let the interface claim what the app doesn't do".

### What was wrong

1. **During an activity, save failures could not be seen or used.** The save
   failure alert, the unreadable-workspace notice, the restore choice and the
   update offer were all rendered inside `<main>`. The activity player (where
   learners spend most of their time) and Settings are full-screen or backdrop
   dialogs that cover `<main>`. Since 2A-1 they also make it inert.
2. **The partial/retry completion screen said "The evidence is saved"** as soon
   as the button was pressed, before any write had started, and whether or not
   the write succeeded.
3. **An unreadable workspace looked like a brand-new install.** This was not in
   the original finding. An unreadable workspace loads default settings, and
   default settings mean the onboarding screen, which rendered no notices at
   all. That is exactly the case 1A set out to prevent: an empty app that looks
   like total data loss, while saving is silently suspended. The recovery
   notice's rendered test mounted the notice directly, so it never exercised
   what the application actually shows.

### What changed

- **`NoticeHost` renders `AppNotices` in exactly one place.** While a dialog
  that can host them is open, the notices appear at the top of that dialog and
  step aside on the page. Each alert is announced once, and update holds are
  not duplicated; `holdUpdates` already rechecks after React's effect handoff,
  so moving them cannot trigger an update in the gap. Inside dialogs the
  notices are in the normal flow, not sticky, so they never cover the dialog's
  heading or close button. The Settings dialog is now a flex column: as a grid
  row, its scrolling panel could shrink and slide underneath the notices on a
  phone.
- **Both onboarding screens now render `AppNotices`:** the diagnostic and the
  account-history choice.
- **`isEvidenceSaved(ids)` in the store** is true only once a *current*
  (non-superseded) write that contained those observations has completed, in
  the same workspace. It can say "not yet" about something already stored,
  never the reverse. `RecordSaveStatus` uses it on both completion screens:
  - "Saving on this device…"
  - "Saved on this device." (or the limited-backup wording)
  - "Not saved on this device yet…", pointing to the notice at the top
  - "Not saved: … saving is paused", when the workspace is unreadable
- **An unsaved written reflection holds updates.** An update reloads the page,
  which would lose the draft just as Escape would.

### Verification

| Check | Result |
| --- | --- |
| `npm run build` | Passed; 14 precache entries, 1032.96 KiB. |
| `npm test` | 238 tests in 30 files passed. |
| Browser journeys | 46 passed on desktop Chromium and Pixel 7 emulation. New: a save failure injected during an activity (IndexedDB and its localStorage fallback both refuse) is visible and operable inside the dialog, and the record reads "Not saved" until a retry succeeds; an unreadable stored workspace is explained on the first screen. |
| Visual check | Screenshots at desktop and phone width of the failure inside an activity, inside Settings, and on onboarding. The first attempt showed sticky notices covering the activity heading and overlapping the Settings panel on a phone; both were fixed before this entry. |
| `npm run test:rules` | Not run: the emulator download is blocked from this workspace, and this package does not touch rules. |

Mutation checks: each defect was reintroduced on its own.

| Defect reintroduced | Tests that failed |
| --- | --- |
| Dialogs never host notices | 3 rendered tests; activity-failure journey (both viewports) |
| Page notices never step aside | 2 rendered tests; activity-failure journey (both), which counts one alert |
| Onboarding without notices | unreadable-workspace journey (both) |
| Record line trusts `save.status` | unrelated-save test |
| Superseded write counts as durable | existing `save.test.ts` superseded-success test |
| "The evidence is saved" copy restored | rendered retry test; activity-failure journey (both) |
| Draft does not hold updates | draft update-hold test |
| Record line ignores an unreadable workspace | unreadable-workspace record test |
| Durable status not scoped to its workspace | workspace-switch test |
| Durable ids read from current state rather than from the write | none: equivalent in practice, because a newer save always supersedes the older one |

### Limitations

- Notices move into a dialog only if its owner opts in through the app
  shell's context. Both current dialogs do, and a future dialog added outside
  the shell would not.
- On a phone, a failure notice at the top of a long activity scrolls away with
  the content, as it does on the page. The record's own status line repeats the
  outcome where the learner is looking.
- The Settings "Backup restored …" and cloud messages are unchanged. They report
  operations that do complete before the message is set.
- Screen-reader announcement order has not been checked with a real screen
  reader.

---

## Phase 2A-3 — the phone layout and learner-facing copy

Verified locally 17 September 2026. Findings: **B11** (mobile settings and
new-sketch collision; cramped Learn tabs) and **B17** (internal version copy),
plus a B02 gap on phones found while reproducing B11.

### What was wrong (reproduced before changing anything)

The screens were measured at 320×640, 390×844, 640×360 (a 1280×720 laptop at
200% zoom) and 320×256.

- **The floating settings button covered controls.** The ⚙ button was fixed
  to the top right on phones and sat on top of Create's "+" new-sketch button,
  the Strengthen tab, and the Explore and Play headings. It floated over
  whatever was scrolled beneath it.
- **The Learn tabs were cramped.** On phones each tab squeezed a 0.55rem
  (8.8px) purpose line under its label, and at 390px the Strengthen label ran
  under the settings button.
- **Create overflowed at 320px.** The chord track header could not wrap, so its
  "Add a chord…" select pushed the page 42px wider than the screen.
- **Phones had no local save status.** The quiet save indicator lived only in
  the desktop sidebar, which is hidden on phones, so its half of the 1A save
  contract never appeared there.
- **Internal language reached learners (B17):**
  - the page title "Guitar Academy V8"
  - the onboarding "A clean V8 beginning" and "Guitar Academy V8" mark
  - the sidebar "Musical freedom · V8"
  - backup errors saying "not a supported Guitar Academy V8 backup/archive"
  - on builds without sync: "Firebase connection required", "Add the Firebase
    web configuration to `.env.local`", "Cloud sync is ready for Firebase
    configuration" and "Firebase is not configured yet"

### What changed

- **An in-flow top bar on phones replaces the floating button.** It holds the
  brand, the local save indicator and a labelled Settings button (at least
  44px). Because it scrolls with the page, nothing can sit on top of the page's
  controls. The brand name hides below 380px, leaving the mark.
- **Learn tabs on phones show their labels only.** The purpose line stays in
  each tab's accessible name but no longer squeezes onto the screen. Tabs are
  at least 44px tall.
- **Create no longer overflows.** The chord track header wraps, the select is
  capped at the container width, and headings break long words rather than
  widening the page.
- **Short screens get a compact bottom navigation.** When the height is at most
  500px (for example a laptop at 200% zoom), the navigation shrinks from about
  72px to 52px, and the page's bottom padding and Free Play's sticky footer
  follow it.
- **Copy.** The title and onboarding now say "Guitar Academy" and "Welcome to
  Guitar Academy". Two onboarding promises were claims the app could not
  always keep, so they now match what it does:
  - "25-minute sessions" → "Sessions sized to your time"
  - "Offline and synchronised" → a line that depends on whether sync exists
    in the build

  Settings no longer claims progress "synchronises after sign-in" when sync is
  not set up. Its messages and errors now use learner language, for example
  "Sync is not set up", or "Sharing recordings is not set up in this copy",
  now separate from "Sign in before sharing a take". Backup errors read "This
  file is not a Guitar Academy backup this version can read."
- **Diagnostics are kept in Settings → About this app.** It shows the version
  (from `package.json` through a Vite `define`), build mode, whether sync is
  configured and why, and whether the window is installed or a browser tab.

### Verification

| Check | Result |
| --- | --- |
| `npm run build` | Passed; 14 precache entries, 1036.35 KiB. |
| `npm test` | 238 tests passed (no unit tests changed; this package is layout and copy). |
| Browser journeys | 54 passed on desktop Chromium and Pixel 7 emulation. New: a phone-layout journey at 320×640, 390×844 and 640×360 across Continue, Course map, Strengthen, Play, Create (empty and with a long sketch name), Explore and Settings. On every screen it checks that there is no horizontal overflow and no control under the Settings button, that the last control scrolls clear of the bottom navigation, and that Learn tabs are at least 44px, unclipped and at least 12px text. It also checks that the save status is visible and that no learner-visible text matches `V<digit>`, `.env`, Firebase, IndexedDB or localStorage. That copy check now also runs on every journey's home screen at both viewports, and a new journey checks that About this app shows the version. |
| Visual check | Before and after screenshots at the four sizes, and About this app on desktop. |

Mutation checks: each defect was reintroduced on its own.

| Defect reintroduced | Tests that failed |
| --- | --- |
| Settings button fixed over the page again | phone journey (both projects) |
| Learn tab purpose text squeezed back onto phones | phone journey (both) |
| Chord track header cannot wrap | small-phone journey (both) |
| "A clean V8 beginning" restored | phone journey (both) |
| "Guitar Academy V8" title restored | phone journey (both) |
| "Firebase connection required" restored | phone journey (both) |
| No bottom clearance for the navigation | phone journey (both) |
| Save status removed from the phone top bar | phone journey (both) |
| "Musical freedom · V8" restored in the sidebar | desktop navigation journey |
| Version removed from About this app | About journey (both) |

### Limitations

- Emulated only. Real Pixel rendering, the on-screen keyboard over inputs,
  safe-area insets and browser-level zoom rather than a reduced viewport are
  not tested. B32 remains for Phase 7.
- Small text elsewhere is untouched: the bottom navigation labels (0.58rem) and
  the top bar's save status (0.6rem) are below 10px. That belongs with
  contrast and typography in 2A-4, not here.
- Two things seen but left alone: in Settings the "Reduce interface motion"
  checkbox sits apart from its label, and the onboarding claims "48 connected
  units". Both are out of scope: the first is a layout detail for 2A-4, and
  the second is curriculum copy that Phase 3 revisits.
- The version comes from `package.json` (0.8.0) and does not identify a
  specific build. A commit hash would need the release workflow to supply one.

---

## Release attempt, 17 September 2026 — first CI run, and a project with no Storage

George committed 2B-1 to 2A-3 as `c514a47` on `codex/public-hardening`, merged it
into `main` as `601fec9`, and ran the publisher. It pushed and triggered the live
workflow.

### First CI evidence

On GitHub (Node 22, Temurin 21), runs 35226754514 and 35226754904 passed:

- `test:coverage`
- the desktop and Pixel 7 browser journeys
- `test:rules` against the emulators
- the Firebase-enabled build
- the release-head check

This is the first CI execution of anything since 1A. **B21 is verified in CI**
for this revision, and B31's rules evidence now exists in CI as well as
locally.

### Why nothing deployed

1. **The first failure was a permission error.** "Deploy tested Firestore and
   Storage rules" got a 403 on `firebasestorage.defaultBucket.get`. The GitHub
   deploy service account had only Hosting roles. George added **Firebase Rules
   Admin** and **Cloud Storage for Firebase Viewer**.
2. **The rerun reached the real problem:** "Firebase Storage has not been set up
   on project 'learn-the-guitar'." Both failures happened before any rules
   release, so live rules and hosting were unchanged.
3. **The August merge had also failed.** Its run, 31817680675, failed, so the
   live site was still July's "v8 curriculum" build. bb8e04c's rule hardening
   had never gone live either.

Cross-device take sharing had therefore never worked live. The app offered a
"Share this take across devices" button because a bucket *name* was configured,
but no bucket existed. New default buckets require the Blaze plan (Firebase FAQ
on the September 2024 Storage changes).

### Decision (George, 17 September 2026): deploy without Storage

- **Sharing is an explicit opt-in.** `cloud.tsx` creates Storage only when
  `VITE_RECORDING_SHARING=enabled` *and* a bucket name is set, and exposes
  `sharingAvailable`. Create offers no share or remove control without it.
  Settings says "Recordings never leave this device", and About this app
  reports that recording sharing is not enabled.
- **The live workflow deploys `firestore:rules` only.** It adds `storage` when
  the repository variable `VITE_RECORDING_SHARING` is `enabled`. Both workflows
  pass that variable to the build.
- **Docs updated.** `.env.example`, `PUBLISHING.md` and the Pixel setup guide now
  describe the opt-in, the Blaze requirement, the US-only always-free regions,
  and the service-account roles.
- **Tests.** Rendered tests check that a bucket name alone does not enable
  sharing, that the finished-take control appears only when sharing is
  available, and that the workflow adds storage rules only under the variable.
  Each was mutation-checked by re-enabling sharing from the bucket name,
  ungating the button, and making storage unconditional.
- **Local verification.** Build passed (1023.35 KiB precache; the disabled
  Storage path is now dropped from the build). 244 unit and interface tests and
  54 browser journeys passed.

### Still to do for this release

- Commit and push. The live run must still pass "Deploy tested security rules"
  with Firestore only, then Hosting.
- Watch the first live load. This deploy takes the site from July to Phase 2A-3
  in one step, including the Firestore rules written since August. The rules
  tests include pre-change records, but George's real account data has not been
  exercised against them.
- **Cloud Storage for Firebase Viewer** is no longer needed while storage rules
  are not deployed, and can be removed to keep the deploy account minimal.
- CI warnings to address with B30: several pinned actions still target Node 20,
  and `setup-java` v4 is deprecated.

---

## Live at last, and what the live site showed (17–18 September 2026)

Run 35231938517 deployed `3298963`. Every step passed, including the browser
journeys, the rules tests and, for the first time, "Deploy tested security
rules" (Firestore only) and Hosting. https://learn-the-guitar.web.app serves the
new build: its title is "Guitar Academy" and its bundle is `index-DDRljqpO.js`.

### Verified on the live site

Checked from a separate browser, against the real deployment:

| Check | Result |
| --- | --- |
| `/sw.js` cache header | `Cache-Control: no-cache`. **B20 is verified live**, on the filename the build actually emits. |
| Security headers | CSP, `X-Content-Type-Options: nosniff` and `Referrer-Policy: strict-origin-when-cross-origin` are present on the page, the worker and the manifest. |
| Page cache header | `/` is served `max-age=3600`. The worker serves navigations from its precache, so this does not delay an update, but an hour of browser caching on the shell is worth revisiting with B19. |

### The CSP blocks Google sign-in (found live, not by any test)

August's hardening added a Content-Security-Policy that had never been deployed
until today. Firebase Auth's popup flow needs two things the policy forbids:

- `https://apis.google.com/js/api.js`, the loader the SDK injects — blocked by
  `script-src-elem`.
- an iframe on the auth domain, `https://learn-the-guitar.firebaseapp.com` —
  blocked by `frame-src`.

Both were confirmed on the live page by loading each resource and catching the
`securitypolicyviolation` events. `VITE_FIREBASE_AUTH_DOMAIN` is
`learn-the-guitar.firebaseapp.com`, so the iframe host is that project domain.
Signing in again would fail. An existing signed-in session keeps working:
token refresh and Firestore both use `*.googleapis.com`, which the policy allows.

No test caught this. The rules tests use the emulator, the browser journeys never
sign in to a real account, and nothing asserted the policy against Firebase
Auth's requirements. `hosting.test.ts` now checks that the policy admits the
Google API loader, the auth domain's iframe and the token endpoints; each
assertion fails against the deployed policy.

**Prepared for the next release:** `firebase.json` adds those two hosts, and
nothing else. A deploy is needed before sign-in works again.

### Also corrected

The publisher and `PUBLISHING.md` still said the phone reloads itself when an
update arrives. Since 1D it does not: the app offers the update and waits (B03).
Both now say so, and note the one exception — a build older than 1D cannot ask,
so the first update from July's build only takes effect once every window is
closed and reopened.

---

## Sign-in policy fix, verified live (18 September 2026)

Run 35337753164 deployed `4cb8bc1`. The live policy now reads
`script-src ... https://apis.google.com ...` and
`frame-src https://learn-the-guitar.firebaseapp.com https://www.google.com`.
Checked from a separate browser against the live site: the Google API loader
loads (`window.gapi` is an object), the auth domain's iframe loads, and no
`securitypolicyviolation` events fire. Before the deploy the same check
reported both as blocked.

**A header change does not reach a device until that device applies the
update.** The first check after this deploy still reported the old policy: the
service worker was serving the cached page, and a cached response carries the
headers it was stored with. Unregistering the worker and reloading showed the
new policy immediately. So for any header or CSP change:

- a returning learner keeps the old headers until the new build is applied;
- `/` is served `max-age=3600`, so an uncontrolled browser can hold the old
  headers for up to an hour as well;
- a header fix cannot be assumed live from the deploy alone — check it from a
  browser that is not running the previous worker.

Sign-in with a real Google account has still not been exercised; that needs
George's account.

---

## Commit status

**Superseded 17 September 2026:** 2B-1 to 2A-3 were committed as `c514a47` and merged to `main` as `601fec9`; see the release attempt above. The paragraphs below record the situation before that.

Nothing had been committed since `d0cf81d` (1E, 14 September). 2B-1, 2B-2,
2A-1, 2A-2 and 2A-3 are all in the working tree on `codex/public-hardening`. The shell
on George's Mac was unavailable in the session that did 2A-1 to 2A-3, so they
were built and verified on a copy and written back file by file.

Several files carry changes from more than one package (`SettingsPanel.tsx`,
`App.tsx`, `store.tsx`, `app.css`, the browser spec). Committing each package
separately would mean inventing intermediate states that were never built or
tested. The honest options are one commit naming all five packages, or two:
2B-1+2B-2, then 2A-1 to 2A-3. The latter split is also only approximate for
`SettingsPanel.tsx`. The earlier `.gitignore` and `scripts/publish-live.sh`
changes are still waiting for George's review and must stay out; stage paths
explicitly. Nothing has been pushed or deployed.

**Publisher, 17 September 2026.** George ran `PUBLISH_LIVE.command` from
`codex/public-hardening`. `publish-live.sh` correctly refused, because
publishing is only allowed from `main`, so nothing was committed, pushed or
deployed. The wrapper then failed with `read-only variable: status`, because zsh
reserves `status`. That aborted the window before it could report the outcome or
wait for Return. The variable is now `publish_status`, checked under zsh with
both a failing and a succeeding step.

Publishing this work needs three things. First, commit it on the branch. Then
merge it into `main`, which is a clean merge because `main`'s tree equals
`6d4e5bf`, the base these commits build on. Finally, run the publisher, which
also runs `test:rules` and so needs Java 21 on the path it sets (Homebrew's
`openjdk@21`); the Java that 2B-1 downloaded lives only in `.local-recovery/`.
The pending root `.gitignore` change is what keeps `.local-recovery/` (a JDK
download, logs, `firebase-config/`, `phase-01-start/`) out of a public commit.
It must be kept before anything runs `git add -A`, which the publisher does.

## Next package

**Phase 2A-4: contrast, legibility and automated accessibility checks (B12,
B15).** Measure text, control and focus contrast against WCAG AA in both
themes. Keep the palette and adjust colour roles. Include the sub-10px bottom
navigation labels and top-bar status, and the Settings motion checkbox layout.
Add axe (or an equivalent) to the browser journeys for the core screens and
dialogs, and record a manual keyboard and screen-reader pass.

Then 2A-5, fonts (B16).

---

## Phase 2B-3 — lint, format and coverage visibility (23 September 2026)

**Status: verified locally; CI and live release not verified here.** This
package addresses the lint/format/coverage portion of B23. Phase 2A-4 and
2A-5 were completed separately; their evidence is in the linked review notes
from the implementation plan.

ESLint now checks all current TypeScript source with recommended JavaScript and
TypeScript rules. The save, restore, sync, cloud, validation, identity and
update modules receive additional type-aware checks for floating and misused
promises and unsafe assignments. The initial findings were fixed in the
affected files. Prettier checks a small adopted set plus newly added app files;
legacy files are intentionally not reformatted as a whole. Both Firebase
Hosting workflows run lint and format checks before their existing tests and
build. The local publisher runs lint, format and coverage checks before it can
commit or push. Coverage is reported without a global percentage threshold.

| Check | Result |
| --- | --- |
| `npm run lint` | Passed. A deliberately dropped promise in a critical file failed the rule in a temporary mutation check. |
| `npm run format:check` | Passed. A deliberately unformatted new file failed the gate in a temporary mutation check. |
| `npm run test:coverage` | 247 tests in 32 files passed; 69.41% statements, 55.96% branches and 77.64% lines overall. `cloud.tsx` remains comparatively weak at 57.87% lines. |
| `npm run test:e2e` | 60 desktop and phone browser checks passed. |
| `npm run build` | Passed; the existing large Firebase chunk warning remains. |
| Workflow and diff review | Both workflow files parsed as YAML; lint/format steps precede tests; `git diff --check` passed. |

The changes were included in `11b22a1` on `main` by a separate publisher run
while the browser suite was running. This session did not run the publisher or
push. The checkout was clean and tracked `origin/main` after that commit. A
GitHub run query was inconclusive: one query returned no run for that commit,
and a later query could not reach `api.github.com`. CI and live behaviour are
therefore not claimed as verified by this entry.

**Next:** finish Phase 2B guest-loading and offline-cache work (B18/B19), then
reconcile the remaining development advisories (B30). The manual keyboard,
screen-reader and real-phone checks from Phase 2A remain open. Do not treat
coverage percentages or browser emulation as proof of those experiences.

---

## Phase 2B-4 — defer account code on guest startup (23 September 2026)

**Status: verified locally for the startup module graph; offline-cache transfer
remains open under B19.** The app now uses a small cloud facade for guests.
Firebase and account sync load only after sign-in is prepared, when a retained
account hint exists, or when a one-time check finds an account workspace or
earlier guest learning from an older installation. The hint is only a loading choice: Firebase still
verifies the account, and guest/account workspaces remain separate.

The first guest sign-in is deliberately two taps: **Prepare Google sign-in**
loads the SDK, then **Open Google sign-in** opens the existing popup from a new
user gesture. This avoids relying on popup permission surviving an asynchronous
download. Redirect sign-in was considered and rejected for this package:
Firebase's guidance requires additional domain setup for `web.app` hosting.
An account restored on this device opens the SDK automatically; a signed-out
guest no longer pays that load on later visits. The facade also owns the guest
connection notice so going offline still remains visible without Firebase.

| Check | Result |
| --- | --- |
| `npm run test:coverage` | 253 tests in 33 files passed; 69.50% statements, 55.71% branches, 77.77% lines. |
| `npm run lint` and `npm run format:check` | Passed. |
| Firebase-configured production build and `npm run check:guest-bundle` | Passed with non-secret placeholder configuration. The initial static graph contains two JavaScript files and no cloud or Firebase chunk. The deferred account chunk imports Firebase. |
| Browser journeys | 58 of 60 passed initially; the two offline-notice failures were fixed and both then passed. Welcome and automated accessibility journeys also passed after the last copy change. |
| Account boundary tests | A new guest does not import the account module; first sign-in prepares it, then popup opening occurs on the next click; a retained account or pre-hint workspace/guest history loads it. Existing restore and sync provider tests pass through the facade. |

The configured build's entry graph is **372.6 KiB uncompressed**; Firebase is a
deferred **594.8 KiB uncompressed** chunk. These are bundle file sizes, not a
measured mobile transfer or time-to-interaction improvement. The current PWA
service worker still precaches all JavaScript: **19 entries, 1108.36 KiB**,
including cloud and Firebase. That preserves a returning signed-in learner's
offline startup after an update, but means the browser may still download
account code in the background. B19 must design and verify a smaller cache
without hiding signed-in offline work. Real Google sign-in, installed-PWA
updates, physical-phone behavior and CI remain unverified here.

**Next:** B19 startup transfer/offline-cache policy, including a safe account
offline path, then remaining development dependency advisories (B30).

---

## Phase 2B-5 — deliberate offline shell and selected-unit readiness (23 September 2026)

**Status: verified locally in a production preview; not verified on an installed
Pixel or with a real signed-in account.** B19's cache policy is now an explicit
allowlist of app code, styles, fonts, font notices and install icons. All built
JavaScript remains precached, including the deferred cloud and Firebase chunks.
Dropping those chunks without a version-safe replacement would hide a retained
account workspace after an update while offline. No separate lesson media
exists today: curriculum text is bundled and lesson sounds are synthesised in
the browser. Future demonstration files belong under `lesson-media/` and must
be fetched for a selected lesson rather than entering the install-time shell.
The build gate rejects any unexpected precache URL, missing app asset or
duplicate entry, with review thresholds of 420 KiB for the guest entry graph
and 1280 KiB for the full raw shell.

The selected unit in Course map now reports offline readiness only after it
finds the current page's index, entry script and stylesheet together in an
installed precache. A stale cache does not earn a ready label. The status
claims the unit's activities and built-in sounds, not downloaded recordings or
future demonstration media. On a browser without offline downloads it says so.
The production-preview journey installs the worker, goes offline, reloads the
unit and opens an activity at desktop and phone viewports. That journey and
the shell gate are added to both Hosting workflows; the local publisher runs
the shell gate too.

| Measure | Result |
| --- | --- |
| Guest entry graph | 374.3 KiB uncompressed JavaScript; the account chunk remains deferred. |
| Offline precache | 15 unique entries, 1110.2 KiB raw built files (1,136,893 bytes measured in Chromium CacheStorage); 381.7 KiB summed gzip estimates. The PWA plugin reports 1090.47 KiB, down from its prior 1108.36 KiB report after duplicate icon/manifest entries were removed. |
| Local preview foreground first-page transfer | 191,232 bytes recorded by Chromium's Navigation and Resource Timing entries. This excludes background worker downloads and is a local-server measurement, not a mobile-network estimate. |
| Verification | 256 unit/interface tests across 34 files, lint, format, build, guest/offline bundle gates, and two production-preview offline reload journeys passed. |

The remaining B19 media work is conditional: when real demonstration assets
are introduced in Phases 3 or 6, attach them to a unit, fetch/cache only that
unit's selected assets, include those assets in the readiness check, and test
eviction and interrupted downloads. Real Google sign-in, an installed-PWA
update across versions, actual phone storage behavior and CI are still open.

**Next:** reconcile remaining development dependency advisories (B30), then
continue into Phase 3's teaching journey.
