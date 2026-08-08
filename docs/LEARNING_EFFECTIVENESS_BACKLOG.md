# Learning Effectiveness Backlog

This backlog contains the learning-product improvements identified in the July
2026 review that remain after the activity-integrity repair. It deliberately
excludes marketing, pricing, billing, acquisition and other commercial work.

## Completed in the integrity repair

- Retry and partial outcomes remain evidence but no longer complete an activity.
- Persisted and synchronised completion flags are reconciled from successful
  evidence, repairing earlier inflated progress.
- A retry result offers another attempt instead of advancing to the next activity.
- Tonic-only listening tasks now describe the tonic playback actually available
  instead of claiming that a separate reference and target will be played.

## Priority 1: Deeply author the guided curriculum

The 48 units currently share nine activity templates and one micro-study per
unit. The pedagogical sequence is sound, but the individual tasks need more
musical specificity and better failure recovery.

For each activity, author:

- the exact notes, strings, frets, rhythm or voicing to use;
- what remains constant and what changes;
- a reviewed reference performance;
- the most likely errors and how to recognise them;
- an easier repair version and a harder variation;
- a transfer context that changes one meaningful variable;
- an observable success criterion specific to the musical material.

Start with Units 01–12. Keep later units hidden or clearly provisional until
their activities reach the same standard.

Acceptance criteria:

- No activity relies only on a generic activity-kind instruction plus a unit topic.
- A learner can begin each task without inventing missing musical material.
- Retry guidance responds to the likely failure rather than merely saying to slow down.
- Every unit has at least two musically distinct studies or contextual variations.

## Priority 2: Build a real practice player

The learner should be able to practise the actual micro-study against a stable,
controllable reference rather than relying on static tab or an abstract interval.

Required capabilities:

- count-in and metronome;
- adjustable tempo without changing pitch;
- looping of the whole study or a selected section;
- synchronised tab, count and fretboard highlighting;
- reviewed guitar-only reference audio;
- guitar-plus-rhythm or backing context where appropriate;
- record, replay and compare the learner's attempt;
- transposition where the activity is explicitly teaching transfer.

Acceptance criteria:

- Every technique and rhythm activity has audible time support.
- Playback corresponds exactly to the displayed notes, rhythm and tempo.
- The learner can repeat a short section without restarting the whole activity.
- Original and learner recordings can be compared without uploading private audio.

## Priority 3: Add honest activity-specific feedback

Automate only what can be measured reliably. The app should not claim to hear
polyphonic guitar detail that browser audio cannot distinguish.

Suitable initial assessments:

- sustained monophonic pitch and pitch-class target;
- clearly separated attack timing against a pulse;
- short monophonic note sequences with generous timing tolerance;
- sung prediction followed by private record-and-compare playback;
- exact answers for interval, scale-degree, chord-tone and Roman-numeral choices;
- structured self-review for tone, tension, muting and creative intention.

Acceptance criteria:

- Each assessed activity states exactly what was and was not measured.
- Uncertain input returns an uncertain result rather than a failure.
- Feedback identifies the next corrective action, not only correct/incorrect.
- Self-reported evidence remains visibly distinct from automatically checked evidence.

## Priority 4: Replace unit-level strands with granular capabilities

Evidence such as `rhythm:unit-01` is too broad to distinguish the individual
actions a learner can and cannot perform. Introduce stable capability IDs such as:

- `pulse.quarter-note.steady`;
- `sound.release.deliberate`;
- `ear.tonic.identify`;
- `fretboard.octave.transfer`;
- `interval.major-third.locate`;
- `harmony.triad-third.target`.

Activities may contribute evidence to several capabilities, but mastery must be
calculated per capability rather than granted to every strand in a unit.

Acceptance criteria:

- Strengthen can name the precise weak action and choose a matching repair task.
- Success in listening cannot imply mastery of an unobserved physical skill.
- Prerequisites refer to capabilities, not merely the preceding numbered unit.
- A changed key, neck region or tempo is recorded against the capability tested.

## Priority 5: Add physical guitar demonstrations

Static tab and prose cannot adequately demonstrate a physical instrument. Add
reviewed demonstrations for skills where hand movement affects the outcome.

Important coverage:

- fretting position and minimum useful pressure;
- picking and strumming motion;
- left- and right-hand muting;
- relaxed chord changes and position shifts;
- barre technique;
- slides, hammer-ons and pull-offs;
- bends and bend intonation;
- vibrato;
- palm muting, accents and articulation.

Acceptance criteria:

- Both hands are visible when both contribute to the technique.
- Demonstrations include normal speed, slow speed and a musical-context example.
- Instructions identify common tension and muting problems.
- The app does not award physical-technique mastery from conceptual answers alone.

## Priority 6: Add substantial musical application

Learners need complete musical objects between isolated studies and open-ended
creation. Use reviewed original material so licensed repertoire is not required.

Add:

- short pieces, riffs and chord studies worth performing;
- stylistically varied grooves and backing tracks;
- progressively harder performance pieces at stage boundaries;
- imitation, analysis, controlled variation and recombination tasks;
- capstones that combine ear, fretboard, time, harmony and creative decisions.

Acceptance criteria:

- Every stage culminates in at least one complete performance or original artifact.
- Earlier relationships recur in later musical contexts rather than disappearing.
- A learner can hear how the same relationship behaves in contrasting styles.
- Capstone completion requires demonstrated musical actions, not page completion.

## Priority 7: Use demonstrated placement and adaptive remediation

The starting point currently depends largely on learner self-selection. Replace
or supplement this with a short, optional placement sequence using actions the
app can assess honestly.

Acceptance criteria:

- Placement samples sound, pulse, fretboard, ear and chord knowledge separately.
- The learner receives a recommended starting point with an explanation.
- Placement never grants mastery for an untested capability.
- Repeated difficulty triggers a smaller prerequisite task before presenting the
  same challenge again.

## Priority 8: Close core guitar-skill coverage gaps

Before describing the product as a complete standalone guitar course, review the
curriculum for systematic coverage of:

- open, movable and barre chord vocabulary;
- strumming and rhythm-guitar development;
- lead articulation and phrasing;
- bends, vibrato and expressive intonation;
- style-specific vocabulary;
- complete performances and ensemble awareness;
- detailed rhythm literacy, including triplets and audible swing;
- optional staff and richer tab literacy.

If this coverage is intentionally out of scope, describe the product as a
relationship-first musicianship companion and state which physical instruction
should come from a teacher or another resource.

## Review gate

Do not promote a unit from provisional to reviewed until it has passed:

1. music-theory review;
2. manual guitar-playability review;
3. audio/display correspondence checks;
4. an uncoached learner attempt;
5. confirmation that failure leads to a useful corrective action;
6. confirmation that recorded evidence matches what the interaction observed.

