# Curriculum map review — 24 October 2026

**What was reviewed:** the first draft of [CURRICULUM_MAP.md](../CURRICULUM_MAP.md) (completion brief Package 4, commit `62395e0`).

**Who:** a separate reviewer agent started with fresh context, no part in writing the map and read-only access. It read the map, brief §4 and §6, the 48 outlines in `apps/current/src/v8/curriculum.ts` and the two authored lessons. It was asked to check theory by working out every note, prerequisite gaps, playability and pacing for an adult returning learner, style fit and originality, brief compliance and data safety. Its review stopped once on a usage limit and was resumed the next day with the same context.

**What this review is not:** nobody played anything on a guitar, and George has not read the map. Every musical claim below is checked on paper and, where stated, by code. The guitar checks belong to the authoring batches and George's checklist.

## Checked by code

`apps/current/tests/curriculumMap.test.ts` (new, in the `test` script) checks the map against the code on every run:

- all 48 units appear once in §3, in order, with their current titles;
- every prerequisite exists and comes earlier, and every unit after the first has one;
- every stand-in activity is one the unit has, and matches the two authored lessons (Unit 6 `rhythm`, Unit 10 `technique`) and the Unit 1 pilot (`rhythm`);
- the §11 catalogue has at least three capabilities for every unit, reuses no id, and contains every capability already in use (the six pilot capabilities and the six in the authored lessons), with the same action.

Each check was confirmed to fail, alone, when its rule was broken in a scratch copy of the map (a changed title, a later prerequisite, a duplicated id, a renamed id in use, a wrong stand-in).

## Findings and what was done

| # | Severity | Finding | Outcome |
| --- | --- | --- | --- |
| 1 | Blocking | Unit 32 called vi–IV–I–V a rotation of I–vi–IV–V (it is a rotation of I–V–vi–IV) | Fixed: vi–IV–V–I |
| 2 | Blocking | Unit 21 said the open G and high E ring through C–Am–Fmaj7–G; the G string is fretted in Am and Fmaj7, the high E in G | Fixed: names the notes that really stay (B-string fret 1, open high E; G-string fret 2 from Am to Fmaj7) |
| 3 | Blocking | A prerequisite graph with today's lock rule could lock units for a learner placed past early units, and could lock a unit George has already worked in | Fixed in §5: prerequisites are met by completion, by placement or by "not needed"; the current open-to-next-unit allowance stays; a unit with any completion or evidence is never locked; Batch 1 tests this on a George-shaped fixture (§10 item 11) |
| 4 | Should fix | Unit 22's Travis strings were wrong for D, D was never taught before it, and the Stage 4 capstone melody was too demanding | Fixed: D introduced in Unit 16 (strummed I–IV–V–I); Unit 22 built in three steps with the right strings per chord; *Porch Light* L3 limited to chord tones on strings 1–2 on beats 1 and 3 |
| 5 | Should fix | Unit 32's barre shapes had no taught source shape | Fixed: open A and E in Unit 31's transfer; the E-shape built from the Unit 9 power chord plus octave and third |
| 6 | Should fix | Map claimed *Night Market* was Dorian from Stage 1 (a lone Em7 is not) | Fixed: Dorian from Unit 26, when A7 arrives |
| 7 | Should fix | *Night Market* L3 was taught nowhere | Fixed: second study in Unit 28; Stage 5 capstone cites it |
| 8 | Should fix | *Two Rivers* did not recur | Fixed: L1 in Unit 12, L4 as the worked example in Unit 40 |
| 9 | Should fix | Units 27 and 33 overloaded; Unit 26 started at 80 BPM | Fixed: ♭3 curl moved to Unit 17; Unit 27 keeps half and whole bends and vibrato in a legato/staccato frame; the boogie moved to Unit 29; Unit 26 is 60–96 BPM |
| 10 | Should fix | No sixteenth-note growth between Units 5 and 26 | Fixed: Unit 20's *Sunday Glide* part keeps the hand in constant sixteenths at 60–72 BPM |
| 11 | Should fix | The lesson player records a check with its stand-in's evidence source, so a playing check standing in for `listen-compare`, `creative` or `reflection` would be stored as the wrong kind of evidence | Fixed in §4 and §3: Units 7 and 13 now stand in for `technique`; `listen-compare` stand-ins (30, 34, 43) use exact-answer listening checks; creative and reflection stand-ins check a saved artefact or reflection; Batch 1 adds a validator rule (§10 item 9) |
| 12 | Should fix | Capability ids could be renamed after release, orphaning recorded attempts | Fixed: released ids are never renamed; an alias map carries any later change (§4, §11) |
| 13 | Should fix | A templated activity completed before its lesson existed hides the new lesson from Continue | Fixed in §4: "new lesson available" without changing the completion; Batch 1 (§10 item 10) |
| 14 | Should fix | Brief §4.1 asks for major pentatonic in blues-rock | Fixed: Unit 33 uses E major pentatonic over I7 against minor pentatonic over IV7 |
| 15 | Should fix | The *Low Road* riff on roots 1–♭3–4 sat close to a very famous riff | Fixed: its fingerprint is palm-muted root chugs with ♭3 and 4 as off-beat accents, with no ♭5 passing chord and no block-chord rhythm with rests; the batch must keep that fingerprint |
| 16 | Should fix | Em7 stabs cannot be silenced by releasing fingers (three open strings) | Fixed: Units 4–5 teach the flat fretting-hand lay-down and the picking-hand stop |
| 17 | Should fix | Unit 41's descending bass to F needed a low F | Fixed: F voiced 1x3211; Unit 32 added as a prerequisite |
| — | Minor | Unit 9 mixed Roman-numeral conventions; Units 15 and 16 overlapped; coverage matrix cells (open chords from Unit 4, D in 16, hammer-on practice, swing first heard in Unit 8); piece layers missing the octave fill and the *Porch Light* bridge; the Stage 6 self-report said "riff"; tempo mismatches (*Night Market*, Unit 9); the 3/4 split in Unit 37; the Stage 1 capstone must show the 12-bar form; prerequisites 19→25, 32→35, 4→6; a near-duplicate capability id; Unit 1's format; the missing review link | All fixed. Unit 1's pilot keeps its own player and records (§4) rather than being ported |

## Checks the reviewer confirmed

Voicings: Em7 022030, C x32010, Am x02210, G 320003, Em 022000, Fmaj7 xx3210, F xx3211, Fm xx3111 (A to A♭ on G-string fret 2 to 1), E7 020100, A7 x02020, B7 x21202, and the shared index and middle fingers in Unit 6.

Fretboard: the Unit 3 roots; fifth-fret tuning with the fourth fret on the G string; octave shapes (+2 frets, +3 across the B string); G–B double-stop thirds; A5–C5–D5 and E5–G5–A5 as 1–♭3–4; the Unit 10 frets; G major pentatonic at frets 2–5 including 4 and 7.

Scales, phrases and harmony: E minor pentatonic and the blues ♭5; the Unit 16 open endings in V; the sus2 hammer-on; the nearest-inversion move; the Unit 23 sixths; I–IV–V in G and its bass walks; the barre positions of G and C; A Mixolydian and A Dorian with their characteristic degrees; Em7–A7 as E Dorian i7–IV7; I–iii–IV–iv; E7 as V7 in A minor; the C–B–A–G–F bass line; Dsus2 and Dsus4; the *Lantern* reharmonisation chords; the E5–E6 boogie.

Brief compliance: 48 dispositions with id mappings, a catalogue for every unit and capstone, 11 pieces with four layers whose recurrence lists match §3, a capstone at every stage boundary with Stages 7 and 8 through Create, every §4.4 item covered, a style plan, and an acyclic, ordered prerequisite graph.

## Still `needs George`

Whether the pieces are enjoyable and the pacing suits him can only be judged by playing them. Each authoring batch adds its most valuable "with guitar" checks to [George's checklist](../GEORGE_CHECKS.md); the first two (Units 6 and 10) are already there.
