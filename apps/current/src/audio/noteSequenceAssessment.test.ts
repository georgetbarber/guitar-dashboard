import { describe, expect, it } from "vitest";
import { assessNoteSequence } from "./noteSequenceAssessment";
import type { TimedAudioFrame } from "./pitchAssessment";

const RATE = 48_000;
const hz = (midi: number) => 440 * 2 ** ((midi - 69) / 12);
const samples = (midi: number | null, index: number) =>
  Float32Array.from({ length: 4096 }, (_, sample) =>
    midi === null ? 0 : 0.2 * Math.sin(2 * Math.PI * hz(midi) * ((index * 4096 + sample) / RATE)),
  );
const phrase = (notes: (number | null)[], gap = 100): TimedAudioFrame[] =>
  notes.map((midi, index) => ({
    atMs: index * gap,
    samples: samples(midi, index),
  }));
const two = [
  ...Array<number>(6).fill(64),
  ...Array<null>(3).fill(null),
  ...Array<number>(6).fill(64),
  ...Array<null>(5).fill(null),
];
const three = [
  ...Array<number>(6).fill(64),
  ...Array<null>(3).fill(null),
  ...Array<number>(6).fill(67),
  ...Array<null>(3).fill(null),
  ...Array<number>(6).fill(64),
];

describe("temporary separated-note estimates", () => {
  it("recognises two E plucks only when a quiet gap separates them", () => {
    expect(assessNoteSequence(phrase(two), RATE, [64, 64])).toMatchObject({
      status: "estimated",
      notes: [{ midi: 64 }, { midi: 64 }],
    });
    expect(assessNoteSequence(phrase(Array<number>(20).fill(64)), RATE, [64, 64])).toEqual({
      status: "uncertain",
      reason: "not-separated",
    });
  });

  it("recognises the open E, third-fret G, open E pitch order without scoring timing", () => {
    expect(assessNoteSequence(phrase(three), RATE, [64, 67, 64])).toMatchObject({
      status: "estimated",
      notes: [{ midi: 64 }, { midi: 67 }, { midi: 64 }],
    });
    const changed = [...three];
    changed.splice(9, 6, ...Array<number>(6).fill(65));
    const result = assessNoteSequence(phrase(changed), RATE, [64, 67, 64]);
    expect(result).toMatchObject({ status: "estimated", notes: [{ midi: 64 }, { midi: 65 }, { midi: 64 }] });
  });

  it("withholds a result for missing and extra attacks, clipping, or delayed capture", () => {
    expect(assessNoteSequence(phrase(Array<null>(20).fill(null)), RATE, [64, 64])).toEqual({
      status: "uncertain",
      reason: "quiet",
    });
    expect(assessNoteSequence(phrase(two), RATE, [64, 67, 64])).toEqual({
      status: "uncertain",
      reason: "not-separated",
    });
    expect(
      assessNoteSequence(
        phrase([...three, ...Array<null>(3).fill(null), ...Array<number>(6).fill(64)]),
        RATE,
        [64, 67, 64],
      ),
    ).toEqual({
      status: "uncertain",
      reason: "not-separated",
    });
    const clipped = phrase(two);
    clipped[0] = { ...clipped[0], samples: Float32Array.from({ length: 4096 }, () => 1) };
    clipped[1] = { ...clipped[1], samples: Float32Array.from({ length: 4096 }, () => 1) };
    expect(assessNoteSequence(clipped, RATE, [64, 64])).toEqual({ status: "uncertain", reason: "clipped" });
    expect(assessNoteSequence(phrase(two, 400), RATE, [64, 64])).toEqual({
      status: "uncertain",
      reason: "interrupted",
    });
  });

  it("does not mistake a pitch slide or separated noise bursts for clear notes", () => {
    const noGap = phrase([...Array<number>(10).fill(64), ...Array<number>(10).fill(67)]);
    expect(assessNoteSequence(noGap, RATE, [64, 67])).toEqual({
      status: "uncertain",
      reason: "not-separated",
    });
    let seed = 1;
    const noisy = phrase(two).map((frame) => ({
      ...frame,
      samples: Float32Array.from(frame.samples, (value) => {
        if (value === 0) return 0;
        seed = (seed * 16_807) % 2_147_483_647;
        return (seed / 2_147_483_647 - 0.5) * 0.5;
      }),
    }));
    expect(assessNoteSequence(noisy, RATE, [64, 64])).toEqual({ status: "uncertain", reason: "unclear" });
  });
});
