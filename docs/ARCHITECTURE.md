# Current Architecture

## Scope

This document describes `apps/current` (iteration 08). Historical applications
are isolated, runnable snapshots and are not runtime dependencies.

## System Shape

```text
URL route + React shell
        |
        v
V8 store and commands -----> daily session + mastery derivation
        |                              |
        v                              v
IndexedDB repositories       curriculum + activity definitions
        |                              |
        +--------------+---------------+
                       v
       music, guitar, rhythm, motif, and analysis domains
                       |
                       v
          browser audio and recording adapters
```

The shell has four primary destinations: Learn, Play, Create, and Explore. Learn
contains three related views with canonical URLs: Continue (`/learn`), Course map
(`/learn/course`), and Strengthen (`/learn/strengthen`). Legacy Today, Path, and
Practice URLs migrate to those views. An activity can open a tool and return to
its exact attempt, assistance, reflection, and timing state.

## Source Ownership

```text
src/
  app/             V8 shell, first-run diagnostic, navigation, overlays
  v8/
    curriculum.ts  Eight stages, 48 units, typed activity definitions, validation
    learning.ts    Sessions, evidence, mastery, transfer, progress summaries
    repository.ts  IndexedDB, fallback storage, blobs, archive export/import
    store.tsx       Versioned product state, commands, routing, persistence
    components/     Activity player, micro-study, rhythm notation, settings
    features/       Learn views (Today, Path, Practice), Play, Create, Explore
  core/
    music/          Theory, rhythm, motif, and chromatic descriptions
    instrument/     Fretboard geometry, shapes, transitions, fingering feasibility
  audio/            Playback, honest limited analysis, browser recording
  components/       Shared relationship visualisations
  styles/           Responsive V8 visual and accessibility system
```

The V7 modules retained outside `src/v8` remain the validated source for pitch
spelling, tonal context, chord construction, fretboard geometry, playback, and
limited microphone analysis. New V8 UI does not duplicate those constants.

## Learning and Evidence

Curriculum is data, not page markup. The 48 unit outlines each contain sound,
ear-to-hand, technique, rhythm, relationship, variation, creation, transfer and
reflection activity templates. Only Unit 1 has a structured two-bar episode;
the other units have not received Phase 6 musical authoring and human review.
Validation rejects broken prerequisites, duplicate IDs, missing activity types,
invalid budgets, and incomplete assets.

Evidence records source, assistance, outcome, activity, time, and musical context.
Self-reported lesson success is practice history and cannot produce secure or
transfer-ready physical mastery. Narrow exact-answer concept checks have their
own capability records and delayed changed examples. Creative work is tracked
as artifacts and revisions, not reduced to a creativity score.

## Persistence and Privacy

IndexedDB stores V8 state and private recorded blobs behind a repository interface;
local storage is used only as a compatibility fallback. Saves are automatic. A
versioned binary `.guitar-academy` archive stores its validated state index beside
raw recording blobs, avoiding the memory and size cost of base64 JSON for large
Sketchbooks while remaining compatible with the earlier JSON archive.

When configured, Firebase Authentication and Firestore synchronise structured
learning data. Evidence is append-only; settings use last-modified resolution;
sketch fields carry individual edit times so independent device edits can merge;
revision history is unioned and deletion tombstones prevent stale resurrection.
Reconnect events retry queued changes. Firestore rules isolate every learner under
their authenticated user ID. The service worker caches the complete application
shell for offline use, and learners can request persistent browser storage.

Recordings are temporary by default. A retained take stays private to its device
unless the learner finishes the project and explicitly selects that one take for
cross-device use. Only its metadata enters Firestore; the audio object is confined
to the authenticated learner's Firebase Storage path, with a 50 MB audio-only
rule. There are no analytics. Microphone feedback offers temporary pitch-only
estimates for a sustained note and short sequences separated by clear silence;
it does not grade onset timing, tone, technique or overall performance. The
estimate is not retained as mastery evidence. Richer performances use learner
comparison and self-review.

## Test Strategy

Unit tests cover theory, spelling, chord relationships, fretboard geometry,
fingering feasibility, rhythm, motif transformation, chromatic interpretation,
curriculum integrity, mastery, session budgets, free-play ability matching,
field-level conflict merges, and substantial histories. Browser journeys cover
first launch, navigation/history, prompted play, offline continuation, activity
evidence, interrupted work, Sketchbook persistence, microphone denial, binary
exports, and mobile layouts. Production build success is part of the release gate.

## Architectural Rules

1. Put musical rules in pure domains before exposing them in UI.
2. Derive relationship labels from shared context; do not copy constants.
3. Treat assistance, outcome, and context as distinct learning evidence.
4. Keep creation durable and preserve revision history.
5. Label generated note layouts honestly until fingering validation passes.
6. Make routes refreshable and activity interruptions resumable.
7. Keep browser capabilities opt-in, local, and explicit about limitations.
