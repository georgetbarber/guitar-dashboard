# Batch 3 review — Units 25–36, *Night Market*, *Two Rivers*, *Glasshouse* (24–25 October 2026)

**What was reviewed:** the Batch 3 content on branch `phase6/batch-3-units-25-36` (PR #13):

- the twelve lessons in `apps/current/src/v8/lessons/stage5.ts` and `stage6.ts`;
- the pieces *Night Market*, *Two Rivers* and *Glasshouse*, with the Stage 5 capstone;
- the new layers of *Low Road*, *Front Step*, *Porch Light* and *Sunday Glide*, with the Stage 6 capstone, in `apps/current/src/v8/pieces/library.ts`;
- the engine change: the exact-answer listening check (decision A19).

These were checked against [CURRICULUM_MAP.md](../CURRICULUM_MAP.md) §3, §6, §7 and §10 and brief §4.

**Who:** a separate reviewer agent, started with fresh context, which had no part in writing the content and had read-only access to the repository. It dumped every new or changed score with the repository's own builder: notes, ticks, swing and shuffle timings, and strum pitches. It compared every verbal claim with those dumps. It also ran the validators of the Batch 2 build (`fe4c7b7`) and the live site (`origin/main`) against listening evidence and listening attempts. Its first run on 24 October was cut off by a usage limit and was resumed on 25 October.

**What this review is not:** nobody played anything on a guitar or listened to anything, and George has not tried these lessons. Everything below was checked on paper or by code. What only ears and a guitar can check is listed at the end as `needs George`.

## Checked by code

On every test run:

- every lesson and piece passes the score validator, the playability heuristics, the display/audio correspondence check and the ensemble line-up rules. A new score rule refuses vibrato on an open string;
- `src/v8/lessons/batch3.test.ts` checks each lesson's and piece's claims against its notes, including:
  - every bend reaching its fretted target, and each bend's degrees in both keys;
  - the 7th-fret bends taught before the open-position ones, and vibrato only on fretted notes;
  - the Unit 30 examples sharing one fully picked motif with six sixteenth pairs;
  - each Unit 34 example holding its mode's note, and never the one it replaces, over a second chord that carries it, with a home chord of the right quality. Paired examples differ in that one note only;
  - both slide-ins of each *Night Market* bar;
  - the break's silent riff in both bars;
  - the Stage 6 capstone's three parts sharing one shuffle form, with the calls equal to Unit 17's;
- interface tests run a listening set twice:
  - the first run in authored order: nothing is recorded until it is finished, then every answer with one time; a 3-of-4 set does not complete the activity, and the attempt keeps to values older builds accept;
  - the second run in a new order, marked as practice with help;
  - a reload after answers seen today, which starts as practice with help;
- validator and domain tests cover the set-completion rule, the shuffle, "answers seen today" and the attempt's compatibility.

The reviewer's own scripts are in the session scratch space. Its mixed-version script was re-run after the fixes. The Batch 2 build and the live site both accept the new listening evidence, hinted answers included, and the new listening attempt.

## Findings and what was done

| # | Severity | Finding | Outcome |
| --- | --- | --- | --- |
| 1 | Blocking | Vibrato was written on open strings (the B and high E) in *Front Step*'s solo and Unit 27's phrase, and Unit 27's destination, criterion and guidance relied on it | Fixed: the held notes are fretted (B at G-string fret 4, E at B-string fret 5) and the guidance says so. A new score rule refuses vibrato on fret 0 (tested), and tests check every held note in the solo and the phrase |
| 2 | Blocking | In Unit 30, straight and swung sixteenths were told apart only by four hammered notes, which the synth plays as a 2-tick pitch glide with no new attack | Fixed: the examples (heard, never played) pick every note and have six sixteenth pairs and three eighth pairs, at 60 BPM. A documented `tempo-ceiling` exception covers the picked sixteenths, because nobody plays these scores. The learner's own motif keeps its hammered pairs. Whether the light swing can be heard is a `needs George` item |
| 3 | Blocking | "Try the set again", run straight after every answer had been shown, replayed the same order and recorded unassisted exact-answer evidence and a successful first check. A reload or the later check reused the sequence | Fixed: every run shuffles the examples and their choices. A run after answers were shown (this session, or recorded earlier the same day) says it is practice with help, and its answers and attempt are recorded as hinted (the strongest help older builds accept on an answer). The later check is reshuffled (tested) |
| 4 | Blocking | The *Night Market* riff instruction said "from the 'and' of 3"; the riff starts on count 3 | Fixed: "from count 3 … and an accented B on 4" |
| 5 | Should fix | Each answer was recorded at once, and any single right answer completed the activity, even in a 3-of-4 set | Fixed: a set is recorded when it ends, every answer with one time, and a set completes its activity only if every answer in it was right (`learning.ts`, tested both ways) |
| 6 | Should fix | The set's attempt used method `exact-answer`, which every earlier build with lessons refuses. A rollback or an older restore would leave the workspace unreadable | Fixed: the attempt keeps `method: "self-reported"`, the only value older builds accept, and says the app marked it in a new `checkedAnswers` field that older builds ignore. A19 is updated, and the reviewer's mixed-version script now passes against both older builds |
| 7 | Should fix | In Unit 34 the third and the root motion answered every example, and natural minor was never offered, so the natural 6 was never tested | Fixed: four choices, natural minor included. Six examples in three pairs on one home chord (D, E, G) differ only in the characteristic note, and the second chord carries that note in both (I–v or I–V; i–IV or i–iv). Two new studies make the same one-note comparisons in A before the check |
| 8 | Should fix | The Unit 34 prompt said to listen over the second chord; one example's deciding note was over the first | Fixed: in every example the deciding note is over the second chord, and the prompt also says to hear the home chord's quality first (tested) |
| 9 | Should fix | The Stage 6 capstone joined a straight 16-bar calls part to two 14-bar shuffle parts | Fixed: a new part, the calls in shuffle on the quick-change form over the boogie (Units 17 and 29), replaces the straight calls in the capstone. The criterion and the map say "three shuffle choruses" (tested) |
| 10 | Should fix | In *Night Market*'s break the second guitar's riff still played bar 6 | Fixed: the riff rests through both break bars, and the low line hits only the stabs. The section, instruction and catalogue say so (tested for both bars) |
| 11 | Should fix | Unit 27's A-minor bend G→G♯ was ♭7→7, not ♭3→3 | Fixed: C→C♯ on the high E (frets 8 and 9), tested as ♭3→3 in both keys |
| 12 | Should fix | Unit 27 taught bends first at G-string fret 2, the hardest place, and the three-finger advice did not fit at fret 2 | Fixed: the bends are taught at the 7th fret first, then in open position as a second study, with one-finger support and the stiffer string explained. The transfer is the whole phrase in A minor at the 5th–7th frets (tested) |
| 13 | Should fix | `nightSlideBar` slid only the first accent, but the transfer said each accented hit slides | Fixed: both accents slide, and the part instruction names them (tested) |
| 14 | Should fix | The boogie part said B is "one fret higher" | Fixed: "two frets higher" |
| 15 | Should fix | Unit 31's walks gave no fretting advice under the G, D, A and E shapes, and the A-key walk needs notes the shape covers | Fixed: the guidance says which finger takes each walk note in G. The transfer gives the A-shape first-finger barre that extends to the A string for B, and the fourth finger for C♯ under E |
| 16 | Should fix | Units 4 and 5 ended in Create and Unit 12 did not reach *Two Rivers*, though those parts name them | Partly changed: Unit 4's "(a later piece)" now says it is the first half of *Night Market*'s first layer, which Unit 5's stabs complete. Unit 4 stays in Create, because the part needs Unit 5's stabs. Units 5 and 12 already end in the Stage 1 and 2 capstones, which take priority; the parts list them as practice |
| 17 | Should fix | Unit 32 called Em an A-shape barre it had not taught, and the transfer's F♯m was untaught | Fixed: a minor-barres study (A to Am, E-shape; E to Em, A-shape at the 7th) and a guidance line on lowering the third. The performance names Em as the A-shape minor from that study |
| 18–29 | Minor | Listening steps used "Play it…" headings; the attempt recorded the hidden slider tempo and example 1; the Unit 30 repair looped two beats as "the first beat"; the Unit 31 repair loop ended before the landing C; "the band" in Unit 29 and the solo; "on every beat" for the boogie; "both melodies start from A"; "three, then five"; A♯ spelled when descending; a solo comment said ♭3-to-3; Unit 33's repair named the wrong third; "Check my answer" was not tied to its hint | Fixed: "Name what you hear" and "Can you still hear it on another day?" (tested); the attempt names the first example heard and its tempo (tested); "the first two beats"; a loop to tick 240 into the C; "second guitar"; "beat by beat"; "both are built on A"; "three to start, then the blue note"; B♭ when descending, linked to Unit 29's blue note (tested); "3-to-♭3"; "E's major third, then its blues third"; `aria-describedby` (tested). The `develop-call` derivation from `develop-low-road` is kept: that transfer applies the same development to another idea, so the change it records is key and pitch |
| 30 | Minor | Bumping a piece's version to add parts drops review marks on parts that did not change | Recorded as decision A20. The pieces are unreleased drafts, so nothing is lost now |
| 31 | Minor | No Batch 3 "with guitar" items in the checklist | The four Batch 3 items were already in the source file; the reviewer read an older generated copy. A fifth, `guitar-batch-3-bends`, was added, and the others now describe the revised content |

## Map items recorded rather than changed

- Unit 29 improvises over line 1 only (4 bars), not the whole 12-bar; the rest of the minor pentatonic is in the guidance, not a study.
- Unit 31's Roman numerals are self-reported, not an exact-answer check. Unit 14's exact-answer degree check (deferred from Batch 2) is still not added; the listening check now exists for it, and it is left for Package 9's consolidation.
- Unit 32 compares the E-shape with Unit 31's open E in words only.
- Unit 36 has no chromatic passing notes in a bass walk; its passing notes are in a single-note blues line.
- In the Stage 5 capstone the app plays the answering riff; the learner plays groove, break and ending.
- *Porch Light*'s L4 has the bass walks only; its hammer-ons, let-ring and bridge are left for Unit 38. *Two Rivers*' A/B form is left for Unit 40.
- *Night Market*'s groove is straight sixteenths (map updated). Unit 25's floor is 60 BPM in the lesson and 66 in the piece part.
- The *Front Step* boogie part has the fret-6 stretch that Unit 29 says to postpone; Unit 29 itself keeps B to root and fifth.

## Originality

Nothing copied was found. The *Low Road* single-note riff follows the Batch 1 power-chord fingerprint. The *Night Market* riff is a chord-tone arpeggio, and the boogie is the generic 5–6 shuffle. The progressions in *Two Rivers* (I–♭VII, i7–IV) and *Glasshouse* (I–iii–IV–iv) are common and cannot be owned. The melodies are short stepwise cells, and the mode examples and the Unit 30 motif are generic pentatonic. The reviewer cannot listen, so a check by ear is on George's list.

## Needs George

In [GEORGE_CHECKS.md](../GEORGE_CHECKS.md):

- whether swung sixteenths can be told from straight in the Unit 30 examples as they now sound, and whether the shuffle sounds like a shuffle (`laptop-listening-checks`);
- the Unit 27 bends at the 7th fret and near the nut, and the vibrato on the fretted B (`guitar-batch-3-bends`);
- the B7 boogie stretch, B7 arriving on count 1 in shuffle, and the full Stage 6 capstone (`guitar-front-step-full`);
- the minor barres, F♯m at fret 2, and the shifts from Em at the 7th fret to F and from C to Em (`guitar-batch-3-barres`);
- *Night Market*'s Em7-to-A7 change in the scratch gap and the double slide-ins (`guitar-night-market-capstone`);
- Unit 31's walks under the G, D, A and E shapes with the fingers still picking, and a listen to the *Low Road* single-note riff, *Night Market*, *Two Rivers* and *Glasshouse* for any resemblance to a song you know. Leave a note on either.
