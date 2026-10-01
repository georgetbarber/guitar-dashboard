# Phases 6–8 entry review — 30 September 2026

## Actual status

Phase 5's software paths are locally verified, but its real guitar, Pixel and delayed-learning gate is open. The work below prepares Phases 6–8 without treating those gates as passed. The 48 units remain outlines; Unit 1 is the only live structured episode. No new lesson in this package is available to learners, no release has been made, and no independent learner has tried these drafts.

## Phase 6: two contrasting teaching problems

The unshipped, versioned drafts in `apps/current/src/v8/phase6Drafts.ts` use two different problems before scaling content:

| Draft | Exact music and relationship | Teaching test | Still needed |
| --- | --- | --- | --- |
| Unit 10, third colour | E–G–E then E–G♯–E on the high E string (frets 0–3–0 then 0–4–0), two four-beat bars at 66 BPM with a rest on each fourth beat. The reverse-order variation keeps rhythm and root fixed. | Can the learner hear, predict and find the one-fret change without relying on a label or fixed presentation order? | Live lesson hookup; listening and guitar trial; reviewed performance or demonstration; changed-root transfer before calling the unit complete. |
| Unit 6, common-tone change | C (x32010) for four beats, then Am (x02210) for four; a variation changes every two beats at 60 BPM. D-string fret 2, B-string fret 1 and open high E remain in the same positions. | Does identifying what can stay put help the learner change chords without losing pulse, and can a two-count phrase make the change musical? | A polyphonic score and player; an actual normal/slow hand demonstration; playability and sound review; a distinct changed-context transfer beyond faster C–Am repetition. |

Both drafts have cue fading, named obstacles, a return to the whole study and a next-day retrieval instruction. The validator checks each monophonic event against guitar tuning, each chord voicing against C-major chord tones, and event continuity. These checks establish internal consistency, not playable hand movement or effective teaching. The C–Am draft deliberately has a separate type because the current `MusicalMaterial` and `PilotEpisodePlayer` support only one sounding note at a time. Connecting it as though it already played chords would misrepresent the product.

**1 October follow-up:** the existing score component now renders a monophonic material's actual notes, frets, sections and active guitar position instead of always saying “open high E.” The playback adapter accepts the material's own section IDs. Its unaided view hides answer-bearing labels, tablature and position cues, including screen-reader text. The Unit 10 draft passes score and playback checks but is still unconnected to a learner route; the C–Am draft still needs a polyphonic player. The live Unit 1 browser journey passed after the component change.

Before either draft enters the course: perform Phase 5's real-input pilot review; try each study with a guitar and a learner; adjust the tempo and instruction from observation; add a real playable display and audio path; provide normal and slow demonstrations where hand action matters; name the author, reviewer and date; and test the changed-context task. Then use the observed authoring pattern for Units 1–12 before considering later batches. Every one of the 48 outlines still needs a reviewed disposition.

## Phase 7: documentation and source reachability

The learning model, architecture and current-app README previously implied a general streak/expanding interval, secure mastery from reported successes, onset-timing assessment and reliable real-guitar microphone feedback. Those claims were corrected against the current code. A correct theory answer remains separate from a reported playing action. The signal checks are temporary pitch-only estimates and have not been validated on George's guitar or phone.

A static import graph from `src/main.tsx`, including literal dynamic imports and exports, reaches 66 maintained source modules. It reaches `src/app/App.tsx`, 52 of 53 non-test `src/v8` modules, the shared theory/instrument/audio domains and one shared visual component. It does not reach the older `src/features/` UI, `src/application/store.ts`, `src/content/`, most older `src/components/`, or `src/learning/`; `src/v8/phase6Drafts.ts` is intentionally unreferenced. This is **candidate evidence**, not deletion proof: type-only imports, test imports, tooling and historical value need a second check. Shared core and audio modules have test/reference value even where the live import graph does not reach them. No files were moved to history.

The local browser suite passed 88 desktop and phone-sized checks; two production-only checks were skipped in development mode. The Firebase rules suite could not start because this machine has no Java runtime. The release gate remains open: Phase 5 real-input trial, two-week personal learning trial, review of drafted and remaining units, emulator rules verification, physical laptop/Pixel installed-PWA/offline/update/sync checks, CI provenance, and a reviewed release/rollback package. Local test and build success does not substitute for these observations. Publication needs an explicit request.

## Phase 8: optional extensions evaluated, none admitted yet

| Candidate | Current evidence and provisional decision | Admission experiment |
| --- | --- | --- |
| No-guitar companion | Highest immediate relevance while a guitar is unavailable. Existing concept checks already allow narrow guitar-free answers. A companion could reuse an exact reviewed phrase, but must not grant playing mastery. Defer feature construction until the phrase and later guitar handoff are trialled. | On a phone, complete a short sound/relationship round, then use that *same* relationship on guitar later; check whether recall helps and whether the app keeps the evidence separate. |
| Hands-free controls | Plausible practice friction, unobserved. A keyboard shortcut is smaller than pedal integration. | During an actual guitar session, count interrupted reaches for playback controls. Prototype shortcuts only if they reduce them and never fire during text input. |
| Bring your own music | Potentially motivating, but the current structured lesson and provenance contracts do not yet cover a chosen excerpt. | Try a manually selected private excerpt or reference link with a single practice aim; preserve source, consent and local-audio choice without automatic transcription. |
| Contextual AI | Lowest priority until reviewed source material and a real explanation failure exist. No provider/data/cost design exists. | Record a specific learner question that authored help fails to answer; compare a bounded source-grounded alternate explanation before considering integration. Never use it to grade playing or silently upload audio. |

The Phase 8 table is a decision record, not a commitment to ship those features. Phase 6 teaching and Phase 7 observed usefulness determine whether any extension deserves implementation.
