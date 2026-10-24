# Interval curriculum map

**Status:** agent-drafted 23 October 2026 (completion brief Package 4), revised after an independent review on 24 October ([review record](reviews/2026-10-24-curriculum-map-review.md)). Not yet checked by George or on a guitar. This map is the plan the authoring batches (Packages 5–8) follow; each batch may refine a unit's exact music, but a change to a disposition, an id rule, a piece or a capstone is recorded in [AGENT_DECISIONS.md](AGENT_DECISIONS.md).

Sources: the [completion brief](COMPLETION_BRIEF.md) §4 (style, repertoire, episode completeness, physical coverage, tuning and correctness), Plan §9, the [design and learning audit](reviews/2026-09-10-design-and-learning-audit.md), the current outlines in `apps/current/src/v8/curriculum.ts`, and the two authored lessons in `apps/current/src/v8/lessons/`.

---

## 1. Principles

- **Relationship first.** Every shape is taught as intervals or degrees around a root, or chord tones around a chord root, and is moved at least once. Pentatonic and blues scales are degree sets (1 2 3 5 6; 1 ♭3 4 5 ♭7; plus ♭5), triads are 1–3–5 stacks, double-stops are named intervals, riffs are rhythm plus degrees.
- **Rhythm leads.** Every piece grooves at its slowest practice tempo. A unit is not finished when its notes are right but its time is not.
- **Three styles, audibly different.** Folk fingerpicking, blues-rock and soul/funk rhythm differ in feel (straight, shuffle, swung sixteenths), articulation (let ring, palm mute, scratch, slides, bends) and texture, not only in name (§9).
- **Music before labels.** A sound is played and heard before it is named. Dorian is played in *Night Market* from Unit 26 (Em7–A7) long before Unit 34 names it.
- **One piece, many visits.** A small repertoire of original pieces recurs with deeper layers (§6). Nothing is copied from an existing song, riff or recording.
- **Honest.** Lessons are drafts until George marks them checked. Synthesised playback stands in for hand demonstrations; techniques that need seeing carry a "demonstration video still needed" marker and a checklist item.
- **Standard tuning only** (decision A8). No capo or drop D until the engine handles them.

---

## 2. Stages at a glance

The eight stage names are unchanged: each still describes what its units do.

| Stage | Units | Purpose (unchanged) | Style emphasis | Capstone (§7) |
| --- | --- | --- | --- | --- |
| 1 Sound and time | 1–6 | Deliberate, relaxed sounds connected to an internal pulse | Thumb pulse (folk), palm-muted eighths (blues-rock), constant-motion strumming and stabs (funk) | *Front Step*: a 12-bar in E for one finger |
| 2 Movable fretboard map | 7–12 | Landmarks, octaves and portable interval geometry | Power chords and riffs (blues-rock), octaves and sixths (soul) | *Low Road*: power-chord riff, moved to a new key |
| 3 Tonal hearing and melody | 13–18 | Pitches as degrees around home, turned into phrases | Major pentatonic melody (folk/soul), minor pentatonic call and response (blues) | *Lantern*: melody, endings and your own answer |
| 4 Triads and harmonic movement | 19–24 | Chords as interval structures connected by moving voices | Top-string triads and hammer-ons (soul), Travis picking (folk) | *Porch Light*: Travis-picked with melody |
| 5 Groove and musical language | 25–30 | Articulation, rhythmic identity and responsive phrasing | Pentatonic riffs, bends, vibrato (blues-rock), sixteenth funk (soul/funk) | *Night Market*: a full funk groove |
| 6 Functional and modal harmony | 31–36 | Tonal function as reference, and stepping outside it | I–IV–V with bass walks (folk), the 12-bar with dominant sevenths (blues), Dorian and Mixolydian vamps, borrowed iv (soul) | *Front Step*: the full shuffle with a solo chorus |
| 7 Composition and form | 37–42 | Motifs, harmony, rhythm and texture shaped into sections | Songwriting in all three styles | *Tide Table*: your own A/B piece, made in Create |
| 8 Personal voice | 43–48 | Learn from music, choose, revise and finish | Your chosen blend | *Your Own Tune* (Create) and a three-piece set |

---

## 3. Unit dispositions

**Every one of the 48 units is _revised_**: it keeps its id (`unit-01` … `unit-48`), its position, its nine activity ids (`unit-NN-listen-compare`, `-sing-predict`, `-technique`, `-rhythm`, `-relationship`, `-variation`, `-creative`, `-transfer`, `-reflection`) and the core of its outcome. What changes is the material: each becomes an authored episode in the Package 3 lesson format, with style-specific music. No unit is merged or superseded, because every existing outcome still has a place in the style direction and keeping ids avoids any migration of evidence, sketches or session plans (§4).

Each table lists the authored episode's core, the templated activity it **stands in for** (decision A10: its unaided check records against that activity; its transfer check against `-transfer`), the piece and layer it feeds, and prerequisites (§5). Tempos are the practice range, slowest to target. Activities the lesson does not stand in for stay templated until a batch authors them; the batch review says which remain.

### Stage 1 — Sound and time

| Unit | Title (working) | Episode core | Stands in for | Piece · layer | Prerequisites |
| --- | --- | --- | --- | --- | --- |
| 1 | Your musical baseline | **Already authored** (Phase 3 pilot): one-note question and answer on the open high E, two bars, 50–72 BPM, rests stopped with the picking hand | `rhythm` (existing pilot) | *Front Step* L1 (the question and answer becomes the 12-bar's break) | — |
| 2 | Clean beginnings and endings | One pitch ended three ways: let ring, fretting-hand release (on the A string, fret 2), palm mute. Open A in quarter notes, then palm-muted eighths; two attack strengths. 70–96 BPM | `technique` | *Low Road* L1 (palm-muted open-A eighths) | 1 |
| 3 | Pulse before speed | Quarter-note pulse with the backbeat (2 and 4) accented, then the **thumb pulse**: one root per bar on G (low E fret 3), E (open low E), C (A fret 3), D (open D), held through the changes. 60–84 BPM | `rhythm` | *Porch Light* L1 | 1 |
| 4 | Subdivide the space | Eighth notes with a strumming hand that never stops moving: down on the beat, up on "and"; strings struck only where chosen; muted "scratch" strokes with the fretting hand laid flat across all six strings. Scratch eighths, then an Em7 (022030) groove: the course's first chord shape. 60–96 BPM | `rhythm` | *Night Market* L1 | 3 |
| 5 | Silence is an action | Short chord stabs with silence between (Em7 on 1 and the "and" of 2), and stop-time hits on E5. Em7 has three open strings, so lifting the fingers will not silence it: each stab is stopped by laying the fretting hand flat across the strings or with the heel of the picking hand. The strumming hand keeps moving through the rests. 60–96 BPM | `rhythm` | *Night Market* L1, *Front Step* (stop-time ending) | 2, 4 |
| 6 | Change without losing time | **Already authored** (Package 3): C (x32010) to Am (x02210) keeping index and middle fingers, four then two counts each; transfer to G (320003) to Em (022000) | `rhythm` (existing) | *Harbour Song* L2 (C–Am), *Porch Light* (G–Em) | 3, 4 |

### Stage 2 — Movable fretboard map

| Unit | Title (working) | Episode core | Stands in for | Piece · layer | Prerequisites |
| --- | --- | --- | --- | --- | --- |
| 7 | Open-string compass | The six open strings as landmarks; tuning by fifth-fret unisons (fourth fret on the G string) and hearing a unison beat slow down as it comes into tune; a melody on the B and high E strings over an open D drone | `technique` | *Porch Light* L1 (roots found from open-string landmarks) | 1 |
| 8 | Octaves reveal the neck | Octave shapes as geometry: low E→D string and A→G string are two strings and two frets up; D→B and G→high E are three frets up (the B-string shift). An octave line with the middle string muted: the root part *Sunday Glide* builds on. 56–88 BPM | `technique` | *Sunday Glide* L1 (octave roots) | 7 |
| 9 | Root and fifth skeleton | The root–fifth power chord on the low E and A strings as one movable shape; the *Low Road* riff: palm-muted A5 eighth chugs with C5 accented on the "and" of 2 and D5 on the "and" of 4 (roots 1, ♭3 and 4 of A). Its fingerprint is that off-beat rhythm over continuous chugs; it has no ♭5 passing chord and no block-chord rhythm with rests, so it cannot be mistaken for a well-known riff built on the same roots. 66–112 BPM | `technique` | *Low Road* L2 | 2, 8 |
| 10 | Thirds change colour | **Already authored** (Package 3): E–G–E and E–G♯–E on the high E string; reversed order; transfer from F | `technique` (existing) | *Front Step* L3 (later, the ♭3 that curls toward 3) | 7 |
| 11 | Crossing the B string | Shapes that change at the G–B boundary: octaves (+3 not +2), thirds as double-stops on the G and B strings (same fret = major third, B string one fret lower = minor third), sixths on the G and high E strings with the B string skipped and muted | `technique` | *Low Road* L4 (double-stop tag), *Sunday Glide* L3 (sixths) | 8, 9, 10 |
| 12 | Transpose without losing meaning | Move the *Low Road* riff from an A-string root to an E-string root (E5 chugs with G5 and A5 accents) and to D, keeping every interval and the off-beat fingerprint; the octave and power-chord shapes as rulers. The same move gives *Two Rivers*' A5–G5 root pulse | `technique` | *Low Road* (moved), *Two Rivers* L1 | 9, 11 |

### Stage 3 — Tonal hearing and melody

| Unit | Title (working) | Episode core | Stands in for | Piece · layer | Prerequisites |
| --- | --- | --- | --- | --- | --- |
| 13 | Home and departure | Degrees heard against an open-G drone: 1–2–3–1, 1–5–1, 1–6–5; feel the pull home. Melody on the B and high E strings in G major | `technique` | *Lantern* L1 (drone and first phrase) | 7, 10 |
| 14 | Degrees have character | G major pentatonic as degrees 1 2 3 5 6 in one movable shape around the root on the low E string (frets 2–5), then 4 and 7 as the leaning degrees; exact-answer degree checks | `technique` | *Lantern* L3, *Porch Light* L3 | 13 |
| 15 | Make a motif | The *Lantern* motif: three notes (3–2–1), rhythm first; repeat it, then vary its rhythm and then its contour while keeping it recognisable (endings are Unit 16's job). 66–88 BPM | `technique` | *Lantern* L3 | 4, 14 |
| 16 | Phrase toward a destination | Two endings of the same phrase over I–IV–V–I in G: settled (lands on 1) and open (lands on 5 or 2). Second study: the learner strums the I–IV–V–I with G, C and **D (xx0232, the course's first D chord)** while the app plays the melody | `technique` | *Lantern* L3 | 15 |
| 17 | Answer what you hear | E minor pentatonic in open position as degrees 1 ♭3 4 5 ♭7 around the open E; imitate a two-bar call, then answer it without copying. A first taste of blues: the ♭3 on the high E string (fret 3) given a quarter-tone curl toward 3. 70–90 BPM | `technique` | *Front Step* L3 (calls and answers) | 1, 14 |
| 18 | Find a melody by ear | The *Harbour Song* melody (3/4, C major) found by ear: sing, guess the degree, search, check against the reveal | `technique` | *Harbour Song* L3 | 6, 16 |

### Stage 4 — Triads and harmonic movement

| Unit | Title (working) | Episode core | Stands in for | Piece · layer | Prerequisites |
| --- | --- | --- | --- | --- | --- |
| 19 | Triads are relationships | Major and minor triads on the top three strings as 1–3–5 stacks, D and G first (*Sunday Glide* is in D); a hammer-on from the 2 (sus2) into the 3 inside the shape. 66–88 BPM | `technique` | *Sunday Glide* L2 | 10, 11 |
| 20 | Inversions change perspective | The three inversions of D and G on strings 3–1 up the neck; choosing the nearest inversion so I–IV moves by a fret or two; the *Sunday Glide* rhythm part at one position with the strumming hand in constant sixteenth motion (60–72 BPM): the funk thread's middle step between Units 5 and 26 | `technique` | *Sunday Glide* L2 | 19 |
| 21 | Keep what can stay | Common tones held between chords in a fingerpicked waltz: *Harbour Song* C–Am–Fmaj7 (xx3210)–G with p-i-m arpeggios in 3/4. B-string fret 1 (C) and the open high E stay through C–Am–Fmaj7, and G-string fret 2 (A) from Am to Fmaj7; G (320003) moves the hand. 60–84 BPM | `technique` | *Harbour Song* L2 | 3, 6 |
| 22 | Hear each moving voice | Travis picking as two voices, G–Em–C–D, built in three steps: thumb-only alternation (root, then another chord tone: strings 6 and 4 for G and Em, 5 and 4 for C, 4 and 3 for D), then one finger on the off-beats, then pinches on beat 1. 56–84 BPM | `technique` | *Porch Light* L2 | 3, 21 |
| 23 | Target the changing chord | Sliding sixths on the G and high E strings that land on chord tones of D and G (the 3 above the 5, the 1 above the 3), named by role as they land. 66–88 BPM | `technique` | *Sunday Glide* L3 | 11, 20 |
| 24 | First harmonised phrase | Harmonise the *Lantern* melody with G, C, D and Em triads by choosing chords that contain the melody note at each landing; made in Create from the lesson | `creative` | *Lantern* L2 | 16, 19 |

### Stage 5 — Groove and musical language

| Unit | Title (working) | Episode core | Stands in for | Piece · layer | Prerequisites |
| --- | --- | --- | --- | --- | --- |
| 25 | A riff is rhythm plus contour | The *Low Road* single-note riff in A minor pentatonic at the 5th position, with hammer-ons and pull-offs, straight eighths, locked to the power-chord part. 72–116 BPM | `technique` | *Low Road* L3 | 12, 17, 19 |
| 26 | Syncopation creates lift | Sixteenth-note funk strumming: the hand moves in sixteenths throughout; Em7 and A7 partial shapes on the accented sixteenths, scratches and ghost strokes between. With A7 arriving, *Night Market* becomes the i7–IV7 Dorian vamp. 60–96 BPM | `rhythm` | *Night Market* L2 | 4, 5, 19 |
| 27 | Articulation changes meaning | One pentatonic phrase played connected and then clipped, then with two new techniques: half and whole bends judged by target pitch, and vibrato on the held note (slides and the ♭3 curl were met in Units 23 and 17) | `technique` | *Front Step* L4 | 17, 25 |
| 28 | Develop an idea | The *Low Road* riff as A, A, A′, B: change the ending, then the rhythm, then the register, keeping its fingerprint. Second study: the *Night Market* single-note riff that answers its chords, developed the same way | `variation` | *Low Road* L4, *Night Market* L3 | 25 |
| 29 | Improvise with constraints | First the *Front Step* E5–E6 boogie shuffle as the accompaniment part (triplet feel); then, with the app playing it, improvise over the 12-bar: three notes (1, ♭3, 4), then the full minor pentatonic, then the blues scale (♭5 added); one bar of space in every four | `technique` | *Front Step* L4 | 17, 27 |
| 30 | Compare musical dialects | One motif in straight-eighth rock, shuffle blues and swung-sixteenth soul, with actual swing playback; name what changed (time and touch, not notes). The unaided check is an exact-answer listening check: which feel is this? | `listen-compare` | All three styles | 26, 29 |

### Stage 6 — Functional and modal harmony

| Unit | Title (working) | Episode core | Stands in for | Piece · layer | Prerequisites |
| --- | --- | --- | --- | --- | --- |
| 31 | Departure, tension, return | I–IV–V in G as home, expansion and tension; thumb bass walks connect them (G–A–B–C into IV, D–C–B–A–G home); Roman-numeral checks. Transfer: I–IV–V in A with open A (x02220), D and E (022100), the course's first open A and E | `technique` | *Porch Light* L4 | 22 |
| 32 | Loops tell different stories | The soul loop I–vi–IV–V against its rotation vi–IV–V–I; barre chords so the loop moves to any key: the E-shape built from the Unit 9 power chord plus its octave and third, then compared with the open E of Unit 31; the A-shape from open A the same way (G at the 3rd fret, C at the 3rd fret) | `technique` | *Glasshouse* L2 | 20, 31 |
| 33 | Blues bends the categories | E7, A7 and B7 (020100, x02020, x21202) in the 12-bar shuffle with the quick change and a turnaround (the boogie is already known from Unit 29); E major pentatonic (1 2 3 5 6) over I7 against minor pentatonic over IV7, and the ♭3 curled toward 3 where the two meet | `technique` | *Front Step* L2 | 27, 29 |
| 34 | Modes keep a different light | *Two Rivers*: A Mixolydian (A–G, I–♭VII) and A Dorian (Am7–D, i–IV); hear the characteristic degree (♭7; natural 6); then name what *Night Market* has been since Unit 26 (E Dorian). The unaided check is an exact-answer listening check: which mode is this? | `listen-compare` | *Two Rivers* L2–L3, *Night Market* | 26, 31 |
| 35 | Borrow colour deliberately | *Glasshouse* C–Em–F–Fm: the one note that changes (A to A♭) in small F (xx3211) and Fm (xx3111) shapes; in minor, the raised leading tone (E7 as V7 in A minor) | `technique` | *Glasshouse* L2–L3 | 19, 31, 32 |
| 36 | Outside is not wrong | Chromatic approaches: slide into a chord shape from one fret below (soul and funk), chromatic passing tones in blues lines and bass walks | `technique` | *Sunday Glide* L4, *Night Market* L4 | 23, 33 |

### Stage 7 — Composition and form

| Unit | Title (working) | Episode core | Stands in for | Piece · layer | Prerequisites |
| --- | --- | --- | --- | --- | --- |
| 37 | Harmonic rhythm shapes pace | *Harbour Song* with one chord per bar, then two per bar (split 2 + 1 counts in 3/4), then a held chord for two bars; what each does to pace | `variation` | *Harbour Song* L4 | 21 |
| 38 | Build and release tension | Tension over eight bars by register, density, a held V and stop-time, then release; in the *Front Step* turnaround and the *Porch Light* bridge (its L4) | `technique` | *Front Step*, *Porch Light* | 31, 33 |
| 39 | Repetition earns contrast | A motif family across a form (A A A′ B) using the *Lantern* motif and the *Low Road* riff: one fingerprint kept, one dimension changed each time | `variation` | *Lantern* L4, *Low Road* | 28 |
| 40 | Create an A/B form | *Tide Table*: a given A section (fingerpicked D with Dsus2 and Dsus4 hammer-ons and pull-offs); the learner writes a B section that differs in at least two of register, texture, groove and harmony. Worked example first: *Two Rivers*, whose two sections differ in mode and feel | `creative` | *Tide Table*, *Two Rivers* L4 | 22, 37 |
| 41 | Bass movement reframes harmony | A descending bass under held harmony, played by the thumb: C–G/B–Am–Am/G–F in *Harbour Song*, the F voiced 1x3211 so the bass steps down to the low E string's fret 1 instead of leaping up; the same chords with a rising bass | `technique` | *Harbour Song* L4 | 20, 22, 32 |
| 42 | Arrange the guitar part | *Glasshouse* for two guitar parts: top-string triads against fills and double-stops; register, density, dynamics and space | `creative` | *Glasshouse* L4 | 35, 40 |

### Stage 8 — Personal voice

| Unit | Title (working) | Episode core | Stands in for | Piece · layer | Prerequisites |
| --- | --- | --- | --- | --- | --- |
| 43 | Transcribe a fingerprint | Two to four bars transcribed rhythm first, contour next, notes last: from music George chooses (via *Bring your own music* once built), or from an agent-authored original phrase in the course styles | `listen-compare` | — | 18, 30 |
| 44 | Transform what you learned | Keep one relationship of the fingerprint, change three dimensions, until it is new material; provenance recorded | `variation` | *Your Own Tune* (seed) | 43 |
| 45 | Reharmonise one melody | *Lantern* reharmonised two ways: diatonic substitutes (vi, iii) and soul colours (maj7, borrowed iv) | `creative` | *Lantern* L4 | 24, 35 |
| 46 | Revise with intention | Record a draft of *Your Own Tune*, compare before and after, change one named thing | `reflection` | *Your Own Tune* | 42, 44 |
| 47 | Finish a complete original | *Your Own Tune*: two or more sections, an intro and an ending, in a chosen style or blend; recorded and kept | `creative` | *Your Own Tune* | 46 |
| 48 | Design your next path | From evidence and favourites, choose the next pieces and capabilities, and plan a cycle with music George brings | `reflection` | Favourites | 47 |

---

## 4. Id compatibility: what never moves

- **Unit and activity ids are permanent.** Revising a unit changes its lesson, never its id. Existing evidence, completion, session plans, sketches (`origin`), feedback notes and review marks keep pointing at the same unit and activity.
- **Old evidence keeps its meaning and its limits.** A templated activity completed before its unit was authored stays completed and counts for path position. It must not become evidence for the new lesson's capabilities: when a batch adds capability progress for lessons (today only the Unit 1 pilot has it, from its own attempts), it reads lesson attempts and their content versions, never templated completions (Plan 3A: do not fabricate granular mastery).
- **Titles may change; outcomes stay recognisable.** Where a working title differs from the current one, the current title is kept until the batch that authors the unit, and the outcome sentence keeps its meaning.
- **A lesson stands in for one activity** (A10). The stand-in kind is listed per unit above. A unit may later gain more lessons (one per activity); each records against its own activity id.
- **A lesson's check records the kind of evidence its stand-in records.** The lesson player stores the stand-in activity's evidence source, so a playing check stands in for `technique` or `rhythm` (performance); a `listen-compare` stand-in uses an exact-answer listening check (recognition); a `creative` stand-in's check is a saved artefact (creation); a `reflection` stand-in's check is a written reflection. Batch 1 adds a validator rule that a lesson declares its check kind and that it matches its stand-in.
- **New lessons stay visible after old completions.** A templated activity completed before its lesson existed keeps its completion, and Continue and the course map show "new lesson available" for it, so the authored lesson is not hidden (Batch 1).
- **The Unit 1 pilot keeps its own player and records.** It is not ported to the lesson format, so its cursor, attempts, reviews and variations stay exactly as they are; Batch 1 links its performance step to *Front Step*.
- **Capstones** record self-reports against a new additive activity id per stage, `stage-N-capstone` (source `performance`), with capability ids from §5. Evidence validation and the rules already accept any id string; the batch that adds the first capstone must add a mixed-version test showing an older build keeps such a record and a backup round-trip test.
- **Pieces** get stable ids (`piece-front-step`, …) and versioned parts; a revised part is a new version, and a review mark applies to one version (A5).
- **Released capability ids are never renamed.** Once a lesson using an id has shipped, attempts may be recorded under it; a later rename uses an alias map from the old id, never a silent change.
- **Nothing is retired.** If a later batch does merge or supersede a unit, it must add a mapping from the old id to the replacement, keep the old id resolvable, and record the reversal in the decisions register.

---

## 5. Prerequisites

Prerequisites replace the current strictly linear chain (`unit-NN` after `unit-NN-1`). The tables in §3 list them; the graph has no cycles and every prerequisite comes earlier in the order (tested). They describe what a unit's music assumes. A unit opens once the units it builds on are met, instead of only after the unit numbered before it, and its "available after" text names the unmet ones. A prerequisite counts as **met** when it is complete, when it comes before the learner's placement starting unit (Units 3 or 7 today), or when placement marked it not needed. Two rules protect existing work: the existing allowance stays (every unit up to one past the current unit is open), and **a unit with any completed activity or recorded evidence is never locked**, so nothing George can open today is hidden. Batch 1 tests these rules against a fixture shaped like George's real workspace. Dates never gate anything.

The three style threads, as prerequisite chains:

- **Folk:** 3 thumb pulse → 6 changes → 21 waltz arpeggio → 22 Travis → 31 bass walks → 40 *Tide Table* → 41 bass lines.
- **Blues-rock:** 1 → 2 palm mute → 9 power chords → 12 transposition → 17 minor pentatonic → 25 riff → 27 bends and vibrato → 29 improvising → 33 dominant sevenths → 38 tension.
- **Soul/funk:** 4 constant motion → 5 stabs → 11 sixths and double-stops → 19 triads → 20 inversions → 23 sliding sixths → 26 sixteenths → 34 modes → 36 chromatic approach.

---

## 6. Repertoire

Eleven original pieces: nine authored by agents, and two frameworks the learner completes in Create. Each is written for this course, in the style named, without borrowing any existing song's melody, riff, lyric or arrangement. Layers follow Plan §9: **L1** one-note participation, **L2** accompaniment, **L3** melody or riff, **L4** expressive variation. Learners play one layer while the app plays the others (play-along, §10).

| Piece | Style · key · metre · feel | Tempo | Layers | Recurs in units |
| --- | --- | --- | --- | --- |
| *Front Step* | Blues-rock call and response · E · 4/4 · straight, then shuffle | 66–100 | L1 the Unit 1 open-E question and answer, and root notes E, A, B as palm-muted eighths through a 12-bar · L2 E5–E6 boogie shuffle with E7, A7, B7 · L3 calls and answers in E minor pentatonic (open position) · L4 solo chorus with bends, vibrato, slides, turnaround and stop-time ending | 1, 5, 10, 17, 27, 29, 33, 38; capstones S1, S6 |
| *Low Road* | Blues-rock riff · A (moves to E and D) · 4/4 · straight eighths | 66–116 | L1 palm-muted open-A eighths · L2 palm-muted A5 chugs with C5 and D5 off-beat accents · L3 single-note riff, A minor pentatonic, 5th position, hammer-ons and pull-offs · L4 octave fill, double-stop tag on the G and B strings, riff development A A A′ B | 2, 8, 9, 11, 12, 25, 28, 39; capstone S2 |
| *Porch Light* | Folk fingerpicking · G · 4/4 · straight | 56–90 | L1 thumb roots G, E, C, D · L2 Travis alternating bass over G–Em–C–D · L3 melody of chord tones on strings 1–2, pinched on beats 1 and 3 · L4 hammer-ons inside the shapes, bass walks, let-ring, a bridge | 3, 6, 7, 14, 16, 22, 31, 38; capstone S4 |
| *Harbour Song* | Folk waltz · C · 3/4 · straight | 60–90 | L1 bass on beat one · L2 p-i-m arpeggios over C–Am–Fmaj7–G · L3 melody found by ear · L4 descending bass C–G/B–Am–Am/G–F, changed harmonic rhythm | 6, 18, 21, 37, 41 |
| *Lantern* | Melody piece, folk/soul · G · 4/4 · straight | 66–88 | L1 open-G drone and first phrase · L2 triads G, C, D, Em · L3 the motif melody with settled and open endings · L4 reharmonised (vi, iii, maj7, borrowed iv) and motif family | 13, 14, 15, 16, 24, 39, 45; capstone S3 |
| *Night Market* | Funk · E minor, then E Dorian once A7 arrives · 4/4 · straight then swung sixteenths | 60–104 | L1 Em7 scratch eighths and stabs · L2 sixteenth groove, Em7 and A7 partial shapes, accents and ghosts · L3 syncopated single-note riff answering the chords · L4 chromatic slide-ins, a break with space | 4, 5, 26, 28, 34, 36; capstone S5 |
| *Sunday Glide* | Soul · D · 4/4 · swung sixteenths | 60–88 | L1 octave roots in quarter notes · L2 top-string triads with sus2 hammer-ons, I–IV at one position, strumming hand in constant sixteenths · L3 sliding sixths landing on chord tones · L4 slide-ins from a fret below, ghosted scratches | 8, 11, 19, 20, 23, 36 |
| *Two Rivers* | Rock/soul modal vamp · A · 4/4 · straight (Mixolydian section), swung sixteenths (Dorian section) | 66–100 | L1 A5–G5 root pulse · L2 A–G (Mixolydian) and Am7–D (Dorian) rhythm parts · L3 a melody that leans on ♭7 and on the natural 6 · L4 the two sections joined as an A/B form | 12, 34, 40 |
| *Glasshouse* | Soul ballad · C · 4/4 · straight, slow | 60–76 | L1 root pulse · L2 barre and small shapes C–Em–F–Fm · L3 a melody whose A becomes A♭ over Fm · L4 two-guitar arrangement | 32, 35, 42 |
| *Tide Table* (framework) | Folk/soul A/B form · D · 4/4 | 64–88 | A given: fingerpicked D, Dsus2, Dsus4 with hammer-ons and pull-offs · B made by the learner in Create | 40; capstone S7 |
| *Your Own Tune* (framework) | Learner's choice | Learner's choice | Built in Create from a transformed fingerprint (44), revised (46), finished (47) | 44, 46, 47; capstone S8 |

**Favourites.** Every piece can be marked a favourite and reopened from Play and from Continue's "familiar favourites" (Plan 4A). Returning to a piece offers its next unplayed layer and the layers already played.

---

## 7. Capstones

Each capstone combines its stage's work into something worth playing for its own sake, is reached from the stage's last unit and from Play, and records a self-reported performance (`stage-N-capstone`, §4). The learner plays one part while the app plays the others; the synthesised parts are guitar sounds and the count, and the app says so.

| Stage | Capstone | What it combines | Self-report criterion |
| --- | --- | --- | --- |
| 1 | *Front Step*, one finger | Root notes as palm-muted eighths through a 12-bar in E (2, 4), the question and answer as a two-bar break (1), stop-time hits to end (5). No Stage 1 unit teaches the 12-bar form, so the capstone shows it: three lines of four bars with the root of each bar and a bar counter | "I kept my place through the twelve bars, the break and the ending, and stopped together with the second guitar." |
| 2 | *Low Road* | Power-chord riff (9), octave fill (8), double-stop tag (11), then the whole thing from E (12) | "I played the riff in A and in E without the tab." |
| 3 | *Lantern* | Melody by degrees (13–16) with a chosen ending, then an answering phrase saved in Create (17) | "I played the melody with both endings and saved an answer of my own." |
| 4 | *Porch Light* | Travis accompaniment (22) with melody pinches (14), common tones (21), hammer-ons inside shapes (19) | "The bass kept alternating while the melody sang on top." |
| 5 | *Night Market* | Sixteenth funk with accents and ghosts (26), partial shapes (19), the syncopated riff that answers the chords (28), a break (5) | "My strumming hand never stopped and the accents landed where the groove puts them." |
| 6 | *Front Step*, full | Shuffle accompaniment with dominant sevenths and turnaround (33), calls and answers (17), solo chorus with bends, vibrato and slides (27, 29), stop-time ending (5) | "I played three choruses: rhythm, calls and answers, solo, and the bends reached their notes." |
| 7 | *Tide Table* | **Made in Create:** given A section, the learner's B section (40), harmonic rhythm (37), bass movement (41), arrangement (42) | "My B section differs in two dimensions and the piece is saved and recorded." |
| 8 | *Your Own Tune* and a short set | **Made in Create:** a finished original (47); then three favourites played through as a set | "I finished a piece of my own and played a set of three." |

---

## 8. Physical coverage matrix

Where each item in brief §4.4 is introduced (**I**), practised (P) and applied in a piece (A). Every row has an introduction by Stage 6.

| Item | Introduced | Practised | Applied in |
| --- | --- | --- | --- |
| Open chords | **4** (Em7) | 6 (C, Am, G, Em), 16 (D), 21 (Fmaj7), 31 (A, E), 33 (E7, A7, B7) | *Porch Light*, *Harbour Song*, *Front Step* |
| Movable chords | **9** (power chords) | 12, 19–20 (top-string triads), 26 (partials) | *Low Road*, *Sunday Glide*, *Night Market* |
| Barre chords | **32** (E- and A-shape) | 35 (small barre F, Fm), 41 (F 1x3211) | *Glasshouse*, *Harbour Song* |
| Strumming | **4** (constant motion) | 5 (stabs), 16 (I–IV–V–I), 20 (constant sixteenths), 26 (sixteenth funk) | *Night Market*, *Two Rivers* |
| Picking (single notes) | **1** | 15, 17, 25 | *Front Step*, *Low Road*, *Lantern* |
| Muting | **2** (palm, fretting-hand release) | 4 (scratch), 5, 8 (muted middle string), 11 (skipped string) | all |
| Chord changes | **6** | 20, 21, 31, 32 | all chord parts |
| Position shifts | **8** (octaves) | 12, 20 (inversions up the neck), 23 (sliding sixths) | *Sunday Glide*, *Low Road* |
| Slides | **23** (sliding sixths) | 27, 36 (slide-ins) | *Sunday Glide*, *Front Step*, *Night Market* |
| Hammer-ons | **19** (sus2 to 3) | 25, 31, 40 | *Sunday Glide*, *Porch Light*, *Low Road*, *Tide Table* |
| Pull-offs | **25** | 27, 40 | *Low Road*, *Tide Table* |
| Bends (quarter, half, whole; judged by target pitch) | **17** (quarter-tone curl), **27** (half and whole) | 29, 33 | *Front Step* |
| Vibrato | **27** | 29 | *Front Step* |
| Palm muting | **2** | 9, 12 | *Low Road*, *Front Step* |
| Accents | **3** (backbeat) | 4, 26 (sixteenth accents and ghosts) | *Night Market* |
| Fingerstyle | **3** (thumb pulse) | 21 (p-i-m), 22 (Travis), 40 | *Porch Light*, *Harbour Song*, *Tide Table* |
| Phrasing | **16** | 17, 27, 28 | *Lantern*, *Front Step* |
| Ensemble timing | **S1 capstone** (play-along) | every capstone, 30 | all pieces |
| Readable rhythm | **1** (count grid and rhythm row) | 4, 26 (sixteenth grid) | all |
| Triplets | **29** (shuffle as triplets) | 30, 33 | *Front Step* |
| Actual swing playback | **20** (*Sunday Glide*'s swung sixteenths, heard and played) | 26, 29 (shuffle), 30 (all feels compared) | *Front Step*, *Sunday Glide*, *Night Market* |
| Richer tab | **1** (technique marks shipped in Package 3) | every unit | all |
| Optional staff notation | **13** (optional view, never required) | 14–18 | melodies |

**Demonstration video still needed** (shown in the lesson and added to George's checklist when the unit is authored): fingerpicking hand (3, 21, 22), strumming hand (4, 26), muting (2, 5), bends (17, 27), vibrato (27), legato (19, 25), barre hand position (32).

---

## 9. Style plan

| | Folk fingerpicking | Blues-rock | Soul and funk rhythm |
| --- | --- | --- | --- |
| **Feel** | Straight eighths, steady thumb; 3/4 waltz | Straight-eighth rock and triplet shuffle | Straight and swung sixteenths; the hand never stops |
| **Articulation** | Let ring, pinches, hammer-ons and pull-offs inside open shapes | Palm-muted chugs, accents, slides, bends to target, vibrato, double-stops | Scratches, ghost strokes, accents, stabs and space, slide-ins |
| **Harmony** | Open chords, I–IV–V and I–vi–IV–V, common tones, bass walks and descending lines | Power chords, I–♭III–IV riffs, dominant sevenths, the 12-bar | Top-string triads and partials, i7–IV7 (Dorian), I–IV with sixths, borrowed iv |
| **Melody as relationships** | Major pentatonic and 4/7 as degrees around the root | Minor pentatonic 1 ♭3 4 5 ♭7, major pentatonic 1 2 3 5 6 over I7, blues ♭5, the ♭3 that curls toward 3 | Sixths and thirds as chord-tone pairs; Dorian natural 6, Mixolydian ♭7 |
| **Pieces** | *Porch Light*, *Harbour Song*, *Tide Table* | *Front Step*, *Low Road* | *Night Market*, *Sunday Glide*, *Glasshouse*, *Two Rivers* |
| **Audibly different because** | Even, ringing, bass and melody separate | Driving or shuffling, muted low end, bent notes | Percussive, syncopated, short chords with space |

**How difference is checked.** Each piece's score declares its feel (`straight`, `swing`, `shuffle`, `swung-sixteenths`) and the validator rejects a piece whose feel or articulations contradict its style tag. Unit 30 asks the learner to identify feel by ear (exact-answer check), which also tests that the playback differs.

**Pacing for an adult returning learner.** At about 25 minutes a day, most units take one to two weeks and each capstone about a week: roughly a year for the course. Early units keep tempos low and parts short; every stage opens with a piece the learner already knows. The fingerpicking thread (3 → 21 → 22) and the funk thread (4 → 5 → 20 → 26) are the two steepest; each has intermediate steps (thumb pulse, waltz arpeggio, thumb-only Travis; constant eighths, stabs, constant sixteenths at 60–72 BPM) so no step is a jump.

---

## 10. Engine and data work the batches need

These are prerequisites for authoring, done in the batch that first needs them and released with it.

1. **Pieces as data** (Batch 1): a `Piece` with id, version, provenance, style tag, key, feel and parts (each a format 2 voice with a layer role L1–L4); the lesson validator accepts `performance.kind: "piece"` once the piece exists and is valid; a correspondence test per piece.
2. **Play-along** (Batch 1, needed for the S1 capstone): sound chosen parts while the learner's part is silent or quiet; per-part mute and solo; the same audio-clock schedule.
3. **Capstone records** (Batch 1): `stage-N-capstone` activity ids with mixed-version and backup tests (§4).
4. **Capability catalogue in code** (Batch 1): the §11 ids as data, with a test that every lesson uses only catalogued ids and that this document lists the same set.
5. **Prerequisite graph** (Batch 1): `prerequisiteIds` per §3, with "builds on" wording instead of a lock, and a test that the graph is acyclic and ordered.
6. **Favourites** (Batch 1): mark and reopen pieces from Play and Continue.
7. **Optional staff view** (Batch 2): a toggle in the score view, never required by any check.
8. **Visible techniques** (Batch 1): add "fretting hand" (barre) to the techniques that need a video marker.
9. **Check kind matches stand-in** (Batch 1): lessons declare their check kind; the validator refuses a mismatch with the stand-in's evidence source (§4).
10. **New lesson available** (Batch 1): Continue and the course map surface an authored lesson whose activity was completed before it existed (§4).
11. **Prerequisite rules** (Batch 1): met-by-placement and never-lock-started-work, tested against a fixture shaped like George's workspace (§5).

---

## 11. Capability catalogue

Action codes follow the existing catalogue: **L** listening, **N** naming, **Lo** locating, **T** timing, **P** playing. Ids already in use are kept exactly. A batch may split or add capabilities before a unit ships, recording the change here. Once a lesson using an id has shipped, the id is never renamed (an alias map carries any later change) and never reused for a different skill.

| Unit | Capabilities |
| --- | --- |
| 1 | `pilot.listen.question-answer` L · `pilot.name.attack-rest` N · `pilot.locate.open-high-e` Lo · `pulse.quarter-note.steady` T · `sound.release.to-rest` P · `phrase.question-answer.one-note` P (all existing) |
| 2 | `ear.sustain.compare` L · `sound.release.choose` P · `sound.palm-mute.chug` P |
| 3 | `pulse.backbeat.accent` T · `fingerstyle.thumb.root-pulse` P · `fretboard.roots.g-em-c-d.locate` Lo |
| 4 | `rhythm.eighths.count` T · `strum.constant-motion` P · `strum.scratch.mute` P |
| 5 | `ear.rest-pattern.recognise` L · `rhythm.rest.place` T · `sound.stab.staccato` P |
| 6 | `harmony.common-tone.hear` L · `chord.c-am.change` P · `rhythm.chord-change.pulse` T (existing) |
| 7 | `fretboard.open-strings.locate` Lo · `ear.unison.beating` L · `tune.fifth-fret.unison` P |
| 8 | `fretboard.octave.locate` Lo · `ear.octave.same-name` L · `play.octaves.muted-string` P |
| 9 | `fretboard.root-fifth.locate` Lo · `ear.fifth.hear` L · `chord.power.change` P |
| 10 | `ear.third.compare` L · `interval.third.locate` Lo · `fretboard.one-string.locate` Lo (existing) |
| 11 | `fretboard.gb-boundary.adjust` Lo · `play.double-stop.thirds` P · `play.sixths.string-skip` P |
| 12 | `fretboard.transpose.new-root` Lo · `ear.same-riff.new-key` L · `play.riff.transposed` P |
| 13 | `ear.tonic.return` L · `degree.home-away.name` N · `play.melody.over-drone` P |
| 14 | `fretboard.major-pentatonic.locate` Lo · `degree.character.name` N · `ear.degree.identify` L |
| 15 | `phrase.motif.play` P · `rhythm.motif.identity` T · `ear.motif.variation` L |
| 16 | `ear.ending.settled-open` L · `degree.landing.name` N · `phrase.target.degree` P · `chord.g-c-d.strum` P |
| 17 | `fretboard.minor-pentatonic.open-e` Lo · `ear.call.imitate` L · `phrase.answer.play` P · `play.minor-third.curl` P |
| 18 | `ear.melody.find` L · `fretboard.melody.by-ear` Lo · `rhythm.waltz.three` T |
| 19 | `chord.triad.top-strings` Lo · `chord-tone.role.name` N · `ear.triad.major-minor` L · `play.triad.hammer-on` P |
| 20 | `chord.inversion.locate` Lo · `chord.inversion.nearest` P · `ear.top-note.compare` L |
| 21 | `ear.held-tone.hear` L · `fingerstyle.waltz-arpeggio` P · `harmony.common-tone.hold` P |
| 22 | `ear.bass-melody.separate` L · `fingerstyle.alternating-bass` P · `fingerstyle.pinch` P |
| 23 | `play.sixths.slide-target` P · `chord-tone.landing.name` N · `ear.landing.consonant` L |
| 24 | `harmony.melody-in-chord.name` N · `ear.harmony.supports` L · `play.melody-with-triads` P |
| 25 | `play.riff.pentatonic` P · `play.legato.hammer-pull` P · `rhythm.riff.lock` T |
| 26 | `strum.sixteenths.constant` P · `rhythm.sixteenth.syncopation` T · `sound.accent-ghost` P |
| 27 | `play.bend.to-target` P · `ear.bend.in-tune` L · `play.vibrato.steady` P · `sound.legato-staccato.contrast` P |
| 28 | `phrase.riff.develop` P · `ear.variation.identity` L · `rhythm.displacement` T |
| 29 | `rhythm.shuffle.triplet` T · `ear.twelve-bar.place` L · `play.improvise.constraint` P · `play.boogie.shuffle` P |
| 30 | `ear.feel.identify` L · `feel.difference.name` N · `rhythm.feel.switch` T |
| 31 | `ear.function.hear` L · `harmony.roman.i-iv-v.name` N · `play.bass-walk.connect` P |
| 32 | `chord.barre.e-shape` P · `chord.barre.a-shape` P · `ear.loop.start-point` L |
| 33 | `chord.dominant7.open` P · `ear.major-minor-blues.hear` L · `play.pentatonic.major-over-i7` P |
| 34 | `ear.mode.characteristic` L · `mode.degree.name` N · `play.modal-vamp` P |
| 35 | `ear.borrowed-iv.hear` L · `harmony.changing-note.name` N · `chord.f-fm.small-shape` P |
| 36 | `play.chromatic-approach.slide` P · `ear.approach.resolve` L · `phrase.passing-tone` P |
| 37 | `ear.harmonic-rhythm.pace` L · `harmonic-rhythm.name` N · `rhythm.chord-rate.change` T |
| 38 | `ear.tension.curve` L · `play.tension.build-release` P · `rhythm.stop-time` T |
| 39 | `ear.motif-family.identity` L · `phrase.motif.develop` P · `form.repetition.name` N |
| 40 | `form.sections.contrast.name` N · `fingerstyle.dsus-hammer-pull` P · `ear.section.contrast` L |
| 41 | `ear.bass-line.reframe` L · `fingerstyle.thumb.bass-line` P · `harmony.slash-chord.name` N |
| 42 | `ear.texture.register` L · `play.part.fill-vs-rhythm` P · `arrangement.choice.name` N |
| 43 | `ear.rhythm-first.transcribe` L · `fretboard.phrase.by-ear` Lo · `fingerprint.name` N |
| 44 | `ear.transformation.identity` L · `play.transformed-phrase` P · `transformation.dimension.name` N |
| 45 | `harmony.reharmonise.name` N · `ear.reharmonisation.compare` L · `play.reharmonised-melody` P |
| 46 | `ear.before-after.compare` L · `revision.change.name` N · `play.revised-take` P |
| 47 | `play.original.complete` P · `form.original.name` N · `rhythm.original.steady` T |
| 48 | `ear.self-evidence.review` L · `plan.next-cycle.name` N · `play.favourite.revisit` P |

Capstones add one playing capability each: `piece.front-step.one-finger`, `piece.low-road.riff`, `piece.lantern.melody`, `piece.porch-light.travis`, `piece.night-market.groove`, `piece.front-step.full`, `piece.tide-table.own`, `piece.own-tune.finish`.
