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

## Next package

**Phase 1C — transactional restore and migration.** Import still writes
recordings and then the state with no staging generation, so an interruption
part-way leaves new blobs against the previous workspace. 1C stages into an
inactive workspace generation and activates only once every required write is
durable, keeps the previous workspace usable on failure, and separates a local
restore from a cloud merge or replacement.
