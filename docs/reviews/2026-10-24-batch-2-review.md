# Batch 2 review — Units 13–24, *Lantern*, *Porch Light*, *Harbour Song*, *Sunday Glide* (24 October 2026)

**What was reviewed:** the Batch 2 content on branch `phase6/batch-2-units-13-24` (PR #12): the twelve lessons in `apps/current/src/v8/lessons/stage3.ts` and `stage4.ts`; the pieces *Lantern*, *Porch Light*, *Harbour Song* and *Sunday Glide* with the Stage 3 and 4 capstones, and *Front Step*'s calls-and-answers part, in `apps/current/src/v8/pieces/library.ts`; and the engine changes the batch needed (staff view, making check, lesson accompaniment, the capstone making step, validator changes). These were checked against [CURRICULUM_MAP.md](../CURRICULUM_MAP.md) §3, §6, §7 and §10 and brief §4.

**Who:** a separate reviewer agent, started with fresh context, which had no part in writing the content and had read-only access to the repository. It dumped every score's notes and timings with the repository's own builder and compared them with every verbal claim. It also checked playability for an adult returner, prerequisite and map fit, teaching quality, the engine code, originality and honesty. Its first run on 24 October was cut off by a usage limit and was resumed from where it stopped.

**What this review is not:** nobody played anything on a guitar, and George has not tried these lessons. Everything below was checked on paper or by code. What only a guitar can check is listed at the end as `needs George`.

## Checked by code

On every test run:

- every lesson and piece passes the score validator, the playability heuristics, the display/audio correspondence check and the ensemble line-up rules;
- `src/v8/lessons/batch2.test.ts` checks each lesson's and piece's verbal claims against its notes: degrees against the tonic; the interval of every sixth, triad and inversion; the one fret that turns D into Dm; the strings each thumb pattern alternates; pinches and off-beats by tick; swung-sixteenth hit positions; the shared notes in the waltz; chord tones under every melody, arpeggio and sixth; the motif's rhythm in every bar of *Lantern*; and *Front Step*'s first calls equal to Unit 17's;
- interface tests cover the making check (opening, reopening, waiting for the learner's chords, linking the report), lesson accompaniment (named when the score is shown, unnamed in a hidden check), the capstone's making step and the report wording;
- validator tests cover each new rule.

The reviewer also ran every validator over Stages 1–4 and the pieces, the staff projection on every score, and seven test files. All passed before its findings were fixed.

## Findings and what was done

| # | Severity | Finding | Outcome |
| --- | --- | --- | --- |
| 1 | Blocking | *Sunday Glide*'s sixths part said "pluck it again just before count 2". The re-pluck falls on the "a" of 2, just before count 3, and a test title repeated the error | Fixed: the instruction and the test say the "a" of 2 |
| 2 | Blocking | Once a version existed, "Open my version in Create again" made a second, empty sketch and re-pointed the check at it, stranding the learner's chords | Fixed: it reopens the same sketch. A test presses the button twice |
| 3 | Should fix | Unit 20 said to keep the D down, but the two 7th-fret shapes used different fingers for it. Unit 19's G sus2 hammer had no finger to hammer with | Fixed: one fingering for both units. D is xxx231 and G is xxx243, so the second finger keeps the D on the G string, and both sus2 shapes hammer with the third finger. The guidance and the Dm regrouping are written out |
| 4 | Should fix | Units 21 and 22 and *Porch Light* use the open D, which is taught in Unit 16, outside the folk thread. Unit 16 strums G and C without building on Unit 6 | Fixed: Unit 22's guidance and Unit 21's transfer now give the D shape where it is used, so the folk thread (3→6→21→22) stays open. Unit 6 is added to Unit 16's prerequisites (map and code) |
| 5 | Should fix | Unit 24's transfer gave the answer and claimed a rhythm change. The learner only strummed given chords | Fixed: the instruction gives the tune's notes only, the learner chooses, and one answer is shown afterwards. `changed` is pitch and harmony, backed by chord marks |
| 6 | Should fix | Unit 23 asked the learner to hear sixths settle into a chord, and to clash, with no chord sounding | Fixed: the second guitar holds D and G (A and D in the transfer) under every sixth study. A test checks each sixth against the chord under it |
| 7 | Should fix | Unit 17's destination promised a curled G in the answer, which uses the open G. The curl study was not in the cue-fading sequence | Fixed: the app's call curls its G, as *Front Step*'s does. The destination is reworded, and the curl is a practise step |
| 8 | Should fix | Unit 20's destination and third criterion are the swung-sixteenth part, but it was never practised with fading cues or checked | Fixed: the groove is a practise step and the unaided check |
| 9 | Should fix | Map §6 and §8 put Unit 19's sus2 hammer-on in *Sunday Glide*, but the rhythm part had none, and Unit 19 sent the learner to Unit 20's sixteenths | Fixed: a new *Sunday Glide* part, "Sus2 into the chord" (layer 2, Unit 19), over the octave roots. Unit 19 ends there and the rhythm part belongs to Unit 20 |
| 10 | Should fix | The making check assumed chords for every creative lesson | Fixed: a lesson's `making` data says what counts as made (chords, a melody change, or either), how to start and what to answer. The validator requires it for making checks only |
| 11–25 | Minor | The making-check wording claimed the version was made without hearing the lesson's; `artifactId` was validated on pilot attempts instead of lesson attempts; dotted rests had no dot, and the staff SVGs exposed text; the accompaniment sentence pasted titles mid-sentence and named the part in hidden checks; Unit 16 called itself the capstone; the *Lantern* answer was "two bars" answering four, and opened in C; the drone was named loosely; the Unit 14 performance overclaimed; "leaning back home"; the strum instruction contradicted itself; the Unit 20 guide finger was wrong; the Unit 22 transfer lacked its pinch; Unit 21's two studies were nearly the same; the Unit 16 "end on E" variant clashed with I; harmony comparison depended on declaration order | All fixed: "without replaying the lesson's version during this check"; the check moved to lesson attempts (tested); a dot for dotted rests and `aria-hidden` staff drawings (tested); "a synthesised second guitar plays: …", or "plays along" while hidden (tested); Unit 16 points at the melody; "two bars that answer Lantern's first two bars", in G at the piece's tempo (tested); "in Lantern you hold the drone yourself, on the open G string"; "the same degrees … in open position"; "to the note beside it"; "let it ring through count 4 and change at the very end of it"; "land the finger on the high E string first"; pinches on 1 (tested); Unit 21 now starts from plucked blocks (tested); the variant was dropped; chord symbols are sorted (tested) |

While fixing, Units 3 and 8 (Batch 1) were pointed at the pieces that now exist. Unit 3 now ends in *Porch Light*'s thumb roots, accompanied by the tune instead of the whole arrangement, so the two bass lines no longer double. Unit 8 ends in *Sunday Glide*'s octave roots. Both still offer an editable copy in Create. Their "(a later piece)" wording was removed where the piece now exists.

## Map items recorded rather than changed

- Tempo floors start at 60 BPM for Units 15, 17, 19 and 23 and *Lantern* (the map said 66 or 70). The map now matches, as a gentler start for an adult returner.
- Unit 13's melody uses the G string as well as the B and high E (map updated).
- Unit 14's check is playing, not an exact-answer degree check. Exact-answer listening checks come with Batch 3 (Units 30 and 34), and Unit 14 can gain one then.
- Unit 17 has no play-back imitation study; the call is sung back.
- Unit 19's only minor triad is Dm.
- Unit 22's second step uses the index and middle fingers (map updated from "one finger"); its repair covers one finger.
- Unit 24 harmonises with open chords rather than the Unit 19 top-string triads.
- *Harbour Song* uses p-i-m-a (map updated).
- The Stage 3 capstone plays both endings rather than "a chosen ending".
- The Stage 4 capstone part (thumb and pinched melody) is played solo, with no app part and no off-beat fills, so the capstone is the arrangement itself.
- *Sunday Glide*'s quarter-note octave roots are tagged as swung sixteenths. The swing is heard from the second guitar's rhythm part, as with Batch 1 finding 5.
- No lesson introduces the staff view. It is a global, optional toggle in every score.
- Unit 6 still ends in Create, and Unit 11 in *Low Road*.

## Originality

No copied melody, riff or progression was found. *Lantern* is a sequence of descending three-note cells (3–2–1, 6–5–4, 7–6–5) in an eighth, quarter, dotted-quarter rhythm. The 3–2–1 cell is generic, and the sequence and rhythm differ from the best-known tunes built on it. *Harbour Song*, the *Front Step* calls, *Porch Light* and *Sunday Glide* use generic vocabulary. The reviewer cannot listen, so a listening check is on George's list.

## Needs George

All of these are in [GEORGE_CHECKS.md](../GEORGE_CHECKS.md) under "With guitar":

- the Unit 17 quarter-tone curl: whether it can be controlled short of a half bend, and whether the fingering advice suits your hand (`guitar-unit-17-curl`);
- the 7th-fret shapes: the D-to-G change with the second finger kept down, the sus2 hammer-ons, all three strings ringing, and whether the swung sixteenths feel like a groove (`guitar-batch-2-up-the-neck`);
- *Lantern* and the answer made in Create (`guitar-lantern-capstone`);
- *Porch Light*'s thumb independence, the D shape with the thumb on the G string, and the hammer inside C (`guitar-porch-light-travis`);
- Unit 14's frets 2–5 at 56 BPM, Unit 18's C-to-A reach, Unit 21's Fmaj7-to-G change in one eighth note, Unit 23's quiet B string, and the balance between your guitar and the synthesised part. Leave a note on any of them;
- a quick listen to *Lantern*, *Harbour Song*, the *Front Step* calls and *Sunday Glide* for any resemblance to something you know.
