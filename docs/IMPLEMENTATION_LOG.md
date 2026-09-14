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

## Next package

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
