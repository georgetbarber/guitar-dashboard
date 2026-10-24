import { describe, expect, it } from "vitest";
import { performScore } from "../../core/score/perform";
import { positionMidi, strumPositions } from "../../core/score/validate";
import type { NoteEvent, Score } from "../../core/score/types";
import { CURRICULUM } from "../curriculum";
import { LESSONS as STAGE_1 } from "../lessons/stage1";
import { LESSONS as STAGE_2 } from "../lessons/stage2";
import { LESSONS as STAGE_3 } from "../lessons/stage3";
import { LESSONS as STAGE_4 } from "../lessons/stage4";
import { PIECE_CATALOG } from "./catalog";
import { pieceEntryOf, pieceScore, reportPrompt, type Piece } from "./format";
import { FRONT_STEP_PIECE, LANTERN_PIECE, LOW_ROAD_PIECE, PIECES } from "./library";
import { validatePiece, validatePieceSet } from "./validate";

const LESSONS = [...STAGE_1, ...STAGE_2, ...STAGE_3, ...STAGE_4];
const firstStage = (piece: Piece) =>
  Math.min(
    ...piece.parts.flatMap((part) => part.unitIds.map((id) => CURRICULUM.find((unit) => unit.id === id)!.stage)),
  );
/** Sounding pitches of each attack, in time order, as "tick:midi+midi". */
const attacks = (score: Score) =>
  score.events
    .filter((event) => event.kind !== "rest" && !event.art?.tie)
    .map((event) => {
      const midi =
        event.kind === "note"
          ? event.notes.map(positionMidi)
          : event.kind === "strum"
            ? strumPositions(event, score).map(positionMidi)
            : [];
      return { at: event.at, midi: midi.sort((a, b) => a - b) };
    });
const barOf = (tick: number) => Math.floor(tick / 192) + 1;

describe("the repertoire", () => {
  it("is shippable: every score correct, playable and corresponding, every part lining up with its band", () => {
    expect(validatePieceSet(PIECES, LESSONS)).toEqual([]);
  });

  it("is listed in the shell catalogue exactly as the library describes it", () => {
    expect(PIECE_CATALOG).toEqual(PIECES.map((piece) => pieceEntryOf(piece, firstStage(piece))));
  });

  it("gives Stages 1 to 4 their capstones, as the curriculum map plans", () => {
    expect(PIECES.flatMap((piece) => piece.capstones.map((capstone) => [capstone.stage, piece.id]))).toEqual([
      [1, "piece-front-step"],
      [2, "piece-low-road"],
      [3, "piece-lantern"],
      [4, "piece-porch-light"],
    ]);
  });
});

describe("Front Step", () => {
  const roots = pieceScore(FRONT_STEP_PIECE, "front-step-one-finger");
  const band = pieceScore(FRONT_STEP_PIECE, "front-step-band");

  it("walks the 12-bar roots E, A and B (low E open, A open, A string fret 2) under the band's E, A and B7", () => {
    const rootOfBar = (bar: number) => attacks(roots).find((attack) => barOf(attack.at) === bar)!.midi[0];
    expect(Array.from({ length: 12 }, (_, index) => rootOfBar(index + 1))).toEqual([
      40, 40, 40, 40, 45, 45, 40, 40, 47, 45, 40, 47,
    ]);
    const chordOfBar = (bar: number) => {
      const strum = band.events.find((event) => event.kind === "strum" && barOf(event.at) === bar);
      return strum && strum.kind === "strum" ? strum.chord : null;
    };
    expect(Array.from({ length: 12 }, (_, index) => chordOfBar(index + 1))).toEqual([
      "E",
      "E",
      "E",
      "E",
      "A",
      "A",
      "E",
      "E",
      "B7",
      "A",
      "E",
      "B7",
    ]);
    // The harmony line the form shows names the same chord the band strums in every bar.
    const markedChord = (bar: number) =>
      [...(band.harmony ?? [])].reverse().find((mark) => barOf(mark.at) <= bar)!.symbol;
    for (let bar = 1; bar <= 12; bar++) expect(markedChord(bar)).toBe(chordOfBar(bar));
  });

  it("plays palm-muted eighths in the 12 bars, the Unit 1 question and answer in the break while the band rests, and ends together", () => {
    const chorus = roots.events.filter((event) => barOf(event.at) <= 12);
    const chorusNotes = chorus.filter((event) => event.kind !== "rest");
    expect(chorusNotes.every((event) => event.kind === "note" && event.dur === 24 && event.art?.palmMute)).toBe(true);
    // The last beat of bar 12 is left free to lift the palm and reach the open high E for the break.
    expect(chorus.filter((event) => event.kind === "rest").map((event) => [event.at, event.dur])).toEqual([
      [11 * 192 + 144, 48],
    ]);
    const breakNotes = attacks(roots).filter((attack) => [13, 14].includes(barOf(attack.at)));
    expect(breakNotes.map((attack) => [attack.at - 12 * 192, attack.midi])).toEqual([
      [0, [64]],
      [96, [64]],
      [192, [64]],
      [240, [64]],
      [336, [64]],
    ]);
    expect(
      band.events.filter((event) => [13, 14].includes(barOf(event.at))).every((event) => event.kind === "rest"),
    ).toBe(true);
    const hits = (score: Score) =>
      attacks(score)
        .filter((attack) => barOf(attack.at) >= 15)
        .map((attack) => attack.at);
    expect(hits(roots)).toEqual(hits(band));
    // The ending is the Unit 5 stop-time figure: E5 (E2 with B2) twice, short, then held.
    expect(
      attacks(roots)
        .filter((attack) => barOf(attack.at) >= 15)
        .map((attack) => attack.midi),
    ).toEqual([
      [40, 47],
      [40, 47],
      [40, 47],
    ]);
  });

  it("shows the 12-bar form as three lines of four bars, then the break and the ending", () => {
    expect(roots.sections.map((section) => [section.label, barOf(section.from), section.to / 192])).toEqual([
      ["Line 1 · E", 1, 4],
      ["Line 2 · A to E", 5, 8],
      ["Line 3 · B, A, E, B", 9, 12],
      ["Break · question and answer", 13, 14],
      ["Ending · stop together", 15, 16],
    ]);
  });
});

describe("Low Road", () => {
  const riff = pieceScore(LOW_ROAD_PIECE, "low-road-riff");
  const inA = pieceScore(LOW_ROAD_PIECE, "low-road-whole-a");
  const inE = pieceScore(LOW_ROAD_PIECE, "low-road-whole-e");

  it("keeps its fingerprint: muted A5 chugs, with C5 and D5 accented on the “and” of 2 and of 4", () => {
    const bar = riff.events.filter((event): event is NoteEvent => event.kind === "note" && barOf(event.at) === 1);
    const accents = bar.filter((event) => event.art?.accent);
    expect(accents.map((event) => [event.at, event.notes.map(positionMidi)])).toEqual([
      [72, [48, 55]],
      [168, [50, 57]],
    ]);
    expect(accents.some((event) => event.art?.palmMute)).toBe(false);
    expect(
      bar
        .filter((event) => !event.art?.accent)
        .every((event) => event.art?.palmMute && positionMidi(event.notes[0]) === 45),
    ).toBe(true);
  });

  it("never sounds a ♭5 (E♭ over A, B♭ over E) and has no block-chord rhythm with rests", () => {
    for (const score of LOW_ROAD_PIECE.scores) {
      const flatFive = score.key.tonic === "A" ? 3 : 10;
      expect(
        attacks(score).every((attack) => attack.midi.every((midi) => midi % 12 !== flatFive)),
        score.id,
      ).toBe(true);
    }
    expect(riff.events.some((event) => event.kind === "rest")).toBe(false);
  });

  it("moves to E with every interval and every rhythm unchanged: each sound exactly a fourth lower", () => {
    expect(attacks(inE)).toEqual(
      attacks(inA).map((attack) => ({ at: attack.at, midi: attack.midi.map((m) => m - 5) })),
    );
    // The tag's thirds leave the G and B strings in E: the shape changes, the intervals do not.
    const tagStrings = (score: Score) =>
      score.events
        .filter((event): event is NoteEvent => event.kind === "note" && barOf(event.at) === 8)
        .map((event) => event.notes.map((note) => note.string));
    expect(tagStrings(inA)).toEqual([
      [3, 2],
      [3, 2],
      [5, 4],
    ]);
    expect(tagStrings(inE)).toEqual([
      [3, 2],
      [4, 3],
      [6, 5],
    ]);
  });

  it("sounds the riff's accents louder than its chugs", () => {
    const sounds = performScore(riff, { tempo: 84, toTick: 192 });
    const at = (tick: number) => sounds.filter((sound) => Math.abs(sound.time - (tick / 48) * (60 / 84)) < 0.01);
    expect(Math.min(...at(72).map((sound) => sound.velocity))).toBeGreaterThan(
      Math.max(...at(0).map((sound) => sound.velocity)),
    );
  });
});

describe("the piece validator", () => {
  const broken = (change: (piece: Piece) => Piece) => validatePiece(change(structuredClone(LOW_ROAD_PIECE)));

  it("refuses a capstone that uses a part first taught in a later stage", () => {
    expect(
      broken((piece) => ({
        ...piece,
        parts: piece.parts.map((part) => (part.id === "low-road-whole-e" ? { ...part, unitIds: ["unit-13"] } : part)),
      })).join(),
    ).toMatch(/first taught in a later stage/);
  });

  it("refuses a part whose band cannot line up, an unknown unit, and a feel none of the styles uses", () => {
    expect(
      broken((piece) => ({
        ...piece,
        parts: piece.parts.map((part) =>
          part.id === "low-road-riff" ? { ...part, accompanimentIds: ["low-road-whole-a"] } : part,
        ),
      })).join(),
    ).toMatch(/has 8 bars, not 4/);
    expect(
      broken((piece) => ({
        ...piece,
        parts: [{ ...piece.parts[0], unitIds: ["unit-99"] }, ...piece.parts.slice(1)],
      })).join(),
    ).toMatch(/unknown unit unit-99/);
    expect(broken((piece) => ({ ...piece, styles: ["folk"] })).join()).toMatch(
      /palm mutes or scratches, which a folk piece does not/,
    );
    expect(
      broken((piece) => ({
        ...piece,
        scores: piece.scores.map((score) => ({ ...score, feel: "swing-16" as const })),
      })).join(),
    ).toMatch(/swing-16 feel, which none of its styles uses/);
  });

  it("refuses a capstone that asks for something to make without saying what", () => {
    const lantern = structuredClone(LANTERN_PIECE);
    expect(validatePiece(lantern)).toEqual([]);
    const vague = { ...lantern, capstones: lantern.capstones.map((capstone) => ({ ...capstone, make: "Make it." })) };
    expect(validatePiece(vague).join()).toMatch(/must say what to make in Create/);
  });

  it("turns a first-person capstone criterion into what the learner is asked to report", () => {
    expect(reportPrompt("I kept my place and stopped with the second guitar.")).toBe(
      "Report whether you kept your place and stopped with the second guitar.",
    );
    expect(reportPrompt("The bass kept alternating while the melody sang on top.")).toBe(
      "Report whether this was true: “The bass kept alternating while the melody sang on top.”",
    );
  });

  it("refuses a wrong chord shape in a band part", () => {
    const front = structuredClone(FRONT_STEP_PIECE);
    const band = front.scores.find((score) => score.id === "front-step-band")!;
    const b7 = band.voicings.find((voicing) => voicing.id === "B7")!;
    (b7 as unknown as { frets: (number | null)[] }).frets = [null, 2, 1, 2, 0, 0];
    expect(validatePiece(front).join()).toMatch(/B7/);
  });
});
