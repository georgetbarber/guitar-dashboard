import { describe, expect, it } from "vitest";
import { assessNoteSequence, type NoteSequenceEstimate } from "./noteSequenceAssessment";
import { assessSustainedPitch, type PitchEstimate } from "./pitchAssessment";
import {
  captureFrames,
  renderInput,
  SAMPLE_RATE,
  withSecondString,
  type PluckedNote,
  type RoomConditions,
} from "./syntheticInput";

/*
 * Phase 5 close-out on software terms (completion brief Package 2). These
 * scenarios stand in for real guitar input until George's checks exist. Two
 * properties matter most:
 *
 *  1. SAFETY: the check never says "near the target" when another note was
 *     played, never names a different note when the target was played, and
 *     answers "uncertain" for input it cannot read.
 *  2. USEFULNESS: ordinary realistic input (a quiet room or ordinary noise,
 *     some reverb, a phone's automatic gain, an acoustic or electric string,
 *     a slightly out-of-tune guitar, a late start) gets an answer rather than
 *     "uncertain".
 *
 * The thresholds in pitchAssessment.ts and noteSequenceAssessment.ts were tuned
 * against this set (see docs/reviews/2026-09-30-phase-5-gate.md, addendum).
 */

const E4 = 64;
type Verdict = "near" | "different" | "uncertain";

function sustainedVerdict(result: PitchEstimate): Verdict {
  if (result.status === "uncertain") return "uncertain";
  return Math.abs(result.centsFromTarget) <= 40 ? "near" : "different";
}

function sequenceVerdict(result: NoteSequenceEstimate): Verdict {
  if (result.status === "uncertain") return "uncertain";
  return result.notes.every((note) => Math.abs(note.centsFromTarget) <= 40) ? "near" : "different";
}

const QUIET: RoomConditions = {};
const ORDINARY: RoomConditions = { snrDb: 26, humLevel: 0.01, reverb: 0.15 };
const NOISY: RoomConditions = { snrDb: 14, humLevel: 0.03, reverb: 0.2 };
const PHONE: RoomConditions = { snrDb: 22, reverb: 0.1, autoGain: true };
const ROOMS: Record<string, RoomConditions> = { quiet: QUIET, ordinary: ORDINARY, noisy: NOISY, phone: PHONE };

const TONES: Record<string, Partial<PluckedNote>> = {
  acoustic: { decaySeconds: 1.2 },
  electric: { decaySeconds: 2.6, pluckPosition: 0.12 },
  "soft pluck": { decaySeconds: 1.2, level: 0.06 },
  "slightly flat": { decaySeconds: 1.4, detuneCents: -22 },
};

function sustained(
  note: Partial<PluckedNote> & { midi: number },
  room: RoomConditions,
  extra: Partial<{ startMs: number; stallMs: number }> = {},
) {
  const pluck: PluckedNote = { atMs: extra.startMs ?? 450, holdMs: Infinity, ...note };
  const signal = renderInput([pluck], room, 2_400);
  return assessSustainedPitch(
    captureFrames(signal, { durationMs: 2_400, stallMs: extra.stallMs, seed: (room.seed ?? 3) + 1 }),
    SAMPLE_RATE,
    E4,
  );
}

function sequence(notes: PluckedNote[], room: RoomConditions, targets: number[], durationMs: number, stallMs?: number) {
  const signal = renderInput(notes, room, durationMs);
  return assessNoteSequence(captureFrames(signal, { durationMs, stallMs }), SAMPLE_RATE, targets);
}

/** Two E plucks with the player stopping the string between them, as the lesson asks. */
const twoPlucks = (tone: Partial<PluckedNote>, gapMs = 700, startMs = 500): PluckedNote[] => [
  { midi: E4, atMs: startMs, holdMs: 1_000, ...tone },
  { midi: E4, atMs: startMs + 1_000 + gapMs, holdMs: 1_000, ...tone },
];
const threeNotes = (middle: number, tone: Partial<PluckedNote>, startMs = 500): PluckedNote[] => [
  { midi: E4, atMs: startMs, holdMs: 1_000, ...tone },
  { midi: middle, atMs: startMs + 1_700, holdMs: 1_000, ...tone },
  { midi: E4, atMs: startMs + 3_400, holdMs: 1_000, ...tone },
];

describe("sustained open-E check against realistic input", () => {
  for (const [roomName, room] of Object.entries(ROOMS)) {
    for (const [toneName, tone] of Object.entries(TONES)) {
      it(`${toneName} open E in a ${roomName} room reads as near E`, () => {
        expect(sustainedVerdict(sustained({ midi: E4, ...tone }, room))).toBe("near");
      });
      it(`${toneName} B string by mistake in a ${roomName} room is never called E`, () => {
        const result = sustained({ midi: 59, ...tone }, room);
        expect(sustainedVerdict(result)).toBe("different");
        if (result.status === "stable") expect(result.midi).toBe(59);
      });
    }
  }

  it("names the neighbouring fret, not E, when the first fret is played", () => {
    const result = sustained({ midi: 65 }, ORDINARY);
    expect(result).toMatchObject({ status: "stable", midi: 65 });
  });

  it("still answers when the note starts late after the microphone opens", () => {
    expect(sustainedVerdict(sustained({ midi: E4 }, ORDINARY, { startMs: 900 }))).toBe("near");
  });

  it("is uncertain for silence, a too-quiet pluck, an overloaded input and a noise-only room", () => {
    expect(sustained({ midi: E4, level: 0 }, QUIET)).toMatchObject({ status: "uncertain", reason: "quiet" });
    expect(sustained({ midi: E4, level: 0.004 }, QUIET)).toMatchObject({ status: "uncertain", reason: "quiet" });
    expect(sustained({ midi: E4, level: 0.5 }, { ...ORDINARY, inputGain: 6 })).toMatchObject({
      status: "uncertain",
      reason: "clipped",
    });
    expect(sustained({ midi: E4, level: 0.0 }, { snrDb: -10, humLevel: 0.2 })).toMatchObject({ status: "uncertain" });
  });

  it("is uncertain when the noise is as loud as the string", () => {
    expect(sustainedVerdict(sustained({ midi: E4 }, { snrDb: 0, reverb: 0.2 }))).toBe("uncertain");
  });

  it("is uncertain, never near, when a neighbouring string rings at the same time", () => {
    const signal = renderInput(withSecondString([{ midi: E4, atMs: 450, holdMs: Infinity }], -5), ORDINARY, 2_400);
    expect(sustainedVerdict(assessSustainedPitch(captureFrames(signal, { durationMs: 2_400 }), SAMPLE_RATE, E4))).toBe(
      "uncertain",
    );
  });

  it("is uncertain for a palm-muted thud that dies before it can be read", () => {
    expect(sustainedVerdict(sustained({ midi: E4, decaySeconds: 0.06 }, ORDINARY))).toBe("uncertain");
  });

  it("is uncertain when the tab stalls mid-check", () => {
    expect(sustained({ midi: E4 }, ORDINARY, { stallMs: 600 })).toMatchObject({
      status: "uncertain",
      reason: "interrupted",
    });
  });

  it("is uncertain when the note is bent or slid during the check", () => {
    const bent = renderInput(
      [
        { midi: E4, atMs: 450, holdMs: 900 },
        { midi: E4 + 2, atMs: 1_350, holdMs: Infinity },
      ],
      ORDINARY,
      2_400,
    );
    expect(sustainedVerdict(assessSustainedPitch(captureFrames(bent, { durationMs: 2_400 }), SAMPLE_RATE, E4))).toBe(
      "uncertain",
    );
  });
});

describe("two separated E plucks against realistic input", () => {
  for (const [roomName, room] of Object.entries(ROOMS)) {
    for (const [toneName, tone] of Object.entries(TONES)) {
      it(`${toneName} in a ${roomName} room with a real silence reads as two Es`, () => {
        expect(sequenceVerdict(sequence(twoPlucks(tone), room, [E4, E4], 4_200))).toBe("near");
      });
    }
  }

  it("is uncertain without a real silence between the plucks", () => {
    const ringing: PluckedNote[] = [
      { midi: E4, atMs: 500, holdMs: Infinity },
      { midi: E4, atMs: 1_700, holdMs: Infinity },
    ];
    expect(sequenceVerdict(sequence(ringing, ORDINARY, [E4, E4], 4_200))).toBe("uncertain");
  });

  it("is uncertain for one pluck or three", () => {
    expect(sequenceVerdict(sequence([{ midi: E4, atMs: 500, holdMs: 1_000 }], ORDINARY, [E4, E4], 4_200))).toBe(
      "uncertain",
    );
    const extra = [...twoPlucks({}, 500), { midi: E4, atMs: 3_200, holdMs: 600 }];
    expect(sequenceVerdict(sequence(extra, ORDINARY, [E4, E4], 4_200))).toBe("uncertain");
  });

  it("never calls the second pluck E when it is the B string", () => {
    const notes = twoPlucks({});
    notes[1] = { ...notes[1], midi: 59 };
    expect(sequenceVerdict(sequence(notes, ORDINARY, [E4, E4], 4_200))).not.toBe("near");
  });

  it("is uncertain when the tab stalls", () => {
    expect(sequence(twoPlucks({}), ORDINARY, [E4, E4], 4_200, 600)).toMatchObject({
      status: "uncertain",
      reason: "interrupted",
    });
  });
});

describe("E–G–E on the high string against realistic input", () => {
  for (const [roomName, room] of Object.entries(ROOMS)) {
    for (const [toneName, tone] of Object.entries(TONES)) {
      it(`${toneName} in a ${roomName} room reads E–G–E in order`, () => {
        const result = sequence(threeNotes(E4 + 3, tone), room, [E4, E4 + 3, E4], 5_700);
        expect(sequenceVerdict(result)).toBe("near");
        if (result.status === "estimated") expect(result.notes.map((note) => note.midi)).toEqual([64, 67, 64]);
      });
      it(`${toneName} in a ${roomName} room never calls fret 2 a G`, () => {
        const result = sequence(threeNotes(E4 + 2, tone), room, [E4, E4 + 3, E4], 5_700);
        expect(sequenceVerdict(result)).not.toBe("near");
        if (result.status === "estimated") expect(result.notes[1].midi).toBe(66);
      });
    }
  }

  it("is uncertain for an extra pluck, a missing note and a slide with no gap", () => {
    const extra = [...threeNotes(E4 + 3, {}, 400), { midi: E4, atMs: 5_000, holdMs: 500 }];
    expect(sequenceVerdict(sequence(extra, ORDINARY, [E4, E4 + 3, E4], 5_700))).toBe("uncertain");
    const missing = threeNotes(E4 + 3, {}).slice(0, 2);
    expect(sequenceVerdict(sequence(missing, ORDINARY, [E4, E4 + 3, E4], 5_700))).toBe("uncertain");
    const slide: PluckedNote[] = [
      { midi: E4, atMs: 500, holdMs: 1_300 },
      { midi: E4 + 3, atMs: 1_800, holdMs: 1_300 },
      { midi: E4, atMs: 3_100, holdMs: Infinity },
    ];
    expect(sequenceVerdict(sequence(slide, ORDINARY, [E4, E4 + 3, E4], 5_700))).toBe("uncertain");
  });

  it("is uncertain when heavy reverb fills the gaps", () => {
    expect(
      sequenceVerdict(
        sequence(threeNotes(E4 + 3, { decaySeconds: 2.6 }), { snrDb: 26, reverb: 0.55 }, [E4, E4 + 3, E4], 5_700),
      ),
    ).not.toBe("different");
  });
});
