# Batch 1 review — Units 1–12, *Front Step* and *Low Road* (24 October 2026)

**What was reviewed:** the Batch 1 content on draft PR #11: the nine new lessons and the two existing ones in `apps/current/src/v8/lessons/stage1.ts` and `stage2.ts`, and the pieces *Front Step* and *Low Road* with the Stage 1 and 2 capstones in `apps/current/src/v8/pieces/library.ts`, against [CURRICULUM_MAP.md](../CURRICULUM_MAP.md) §3, §6 and §7 and brief §4.

**Who:** a separate reviewer agent started with fresh context, no part in writing the content and read-only access to the repository. It worked out every score's notes and timings with the repository's own score builder and compared them with every verbal claim; checked playability for an adult returner, prerequisite fit, map fit, originality and honesty. A first attempt on 24 October was cut off by a usage limit before it reported; this record is from the complete second run.

**What this review is not:** nobody played anything on a guitar, and George has not tried these lessons. Everything below is checked on paper or by code. What only a guitar can check is listed at the end as `needs George`.

## Checked by code

On every test run (see the Package 5 log entry for the full list):

- every lesson and piece passes the score validator (structure, spelling, degree labels, voicings against chord symbols, technique notation, one note per string), the playability heuristics and the display/audio correspondence check;
- `src/v8/lessons/batch1.test.ts` checks each lesson's verbal claims against its notes: unisons, octaves, fifths, thirds and sixths by interval, strum and stab placement, transpositions by exact semitones;
- `src/v8/pieces/pieces.test.ts` checks the pieces: the 12-bar's roots and the second guitar's chords bar by bar, the break and the ending, the riff's fingerprint (off-beat ♭3 and 4 accents, no ♭5), the E version exactly a fourth lower;
- the capability catalogue, check kinds and prerequisite graph are enforced, and the map test keeps the map and code consistent.

After the fixes below, three tests were tightened: the Unit 7 tuning study starts with the app's low E; *Front Step*'s ending is E5 (E2 with B2) twice then held, and bar 12 leaves its last beat free; and a new interface test fails if the lesson player's hooks change order between renders (it failed before the fix, alone).

## Findings and what was done

| # | Severity | Finding | Outcome |
| --- | --- | --- | --- |
| 1 | Blocking | Unit 5 said *Front Step* ends with "exactly these" E5 stop-time hits, but the piece ended on a single low E | Fixed: *Front Step* bars 15–16 are now the Unit 5 figure, E5 short twice then held (still one finger) |
| 2 | Blocking | *Low Road* from E said the tag's thirds leave the G and B strings; the major third is the open G and B | Fixed: the instruction names the open G and B (still major) and D-string fret 2 with the open G |
| 3 | Blocking | Unit 9's "slide from C to D" repair looped A5 to C5 | Fixed: the loop covers C5 to D5 |
| 4 | Should fix | The second guitar played C5 under the riff's chugs (*Low Road* bar 4, and bar 7 of the whole piece), muddying the low end and hiding the off-beat accents | Fixed: bar 4 matches the riff's turn (A5 then D5 on count 3); bar 7 holds A5 |
| 5 | Should fix | Unit 8's octave lines were tagged swung sixteenths but contain only quarter notes, so no swing could be heard | Fixed: the lines are straight, the wording no longer claims a soul feel, and the map's first heard and played swing moves to Unit 20 (decision A17) |
| 6 | Should fix | Unit 8's muting guidance did not cover a wide strum or open-root octaves | Fixed: guidance for muting with the fretting hand above and below, and for open roots |
| 7 | Should fix | Unit 9 called A5 the locked shape, but its root is open; 66 BPM was a fast start | Fixed: A5 fretted with the first finger, the locked shape starts at C5, criteria reworded; the riff now starts at 56 BPM (lesson and piece) |
| 8 | Should fix | Unit 11 ends on A5 and performs the riff, which Unit 9 teaches, but listed only Units 8 and 10 | Fixed: Unit 9 added to Unit 11's prerequisites (map and code) and A5 explained |
| 9 | Should fix | Unit 11's sixths were not taught as relationships, and the plucking hand was unstated | Fixed: same fret on G and high E is a major sixth, one fret lower minor; the four in D named; thumb and middle finger; a plucking-hand video marker |
| 10 | Should fix | Unit 7: the synthesised pairs never wobble; relative tuning could leave the guitar off the app's pitch; "the higher string's peg" was ambiguous; a pick cannot sound the drone and melody together | Fixed: a reference low E bar first; the wobble is heard on your own guitar; "the open string's peg (the thinner one)"; thumb and fingers, with a plucking-hand video marker |
| 11 | Should fix | Unit 5 told the strumming hand both to keep moving and to drop its heel on each stab | Fixed: the fretting hand stops the Em7 stabs; the strumming heel only stops the E5 hits, on the count after each (2 and 4) |
| 12 | Should fix | *Front Step* gave one eighth note to lift the palm and reach the open high E | Fixed: bar 12's last beat is a rest |
| — | Minor | "Line 3 · B, A, E" (four bars); self-report said "all twelve bars" for sixteen; Unit 7 repair loop covered two pairs; Unit 7 A-drone melody never reached A; Unit 3 "the roots of Harbour Song"; Unit 11 "exactly this tag"; riff instruction silent on bar 4; Unit 9 "tell it from a full chord" with no full chord; later pieces named as if present; "the band"; Unit 4 "with a lilt" | All fixed: "B, A, E, B"; "the twelve bars, the break and the ending" (map §7 too); the loop covers the first pair; the A melody walks down to A; "its first two roots"; "twice as fast"; D5 on count 3; "no third, so neither major nor minor"; "(a later piece)"; "second guitar" throughout, including the piece player's button; "a bounce" |
| — | Found while fixing | The lesson player called a hook after an early return, so React warned of a change in hook order on every lesson's first render (seen in the browser suite's server log) | Fixed: the hook runs before the early return; a test fails if hook order changes again. The project's lint has no hooks rule; adding one is noted for Package 9 |

## Map items Batch 1 does not yet cover

Recorded rather than changed, because each belongs naturally to a later unit or batch:

- Unit 11 does not revisit octaves across the B string (Unit 8 teaches the three-fret shift);
- Unit 12 does not use octaves as rulers or include *Two Rivers*' A5–G5 pulse (*Two Rivers* is a Batch 3 piece; Unit 12 can gain it then);
- *Front Step*'s learner part tops out at 90 BPM; the map's 100 BPM belongs to the full shuffle (Stage 6 capstone).

## Originality

No copied signature riff was found. *Low Road*'s continuous palm-muted root chugs with a single eighth-note kick on ♭III at the "and" of 2 and on IV at the "and" of 4 differ from the best-known I–♭III–IV riffs, which use block chords with rests and a ♭5 passing chord, or play ♭III and IV back to back. The octave fill, the tag and *Front Step*'s root-note 12-bar are generic vocabulary. The reviewer cannot listen to recordings, so one ear-check is on George's list.

## Needs George

- Play the Stage 1 and 2 material on a guitar: the existing `guitar-*` items in [GEORGE_CHECKS.md](../GEORGE_CHECKS.md) cover Unit 1, Units 6 and 10, the Stage 1 and 2 capstones and the Batch 1 lessons.
- When playing *Low Road*, listen once for any resemblance to a riff you know (already in the `guitar-low-road-riff` item).
