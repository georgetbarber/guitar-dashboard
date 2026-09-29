import { describe, expect, it } from "vitest";
import { assessSustainedPitch } from "./pitchAssessment";
import type { TimedAudioFrame } from "./pitchAssessment";

const RATE = 48_000;
const E4 = 440 * 2 ** ((64 - 69) / 12);
const frames = (sound: (time: number, frame: number) => number, gap = 100): TimedAudioFrame[] =>
  Array.from({ length: 18 }, (_, frame) => ({
    atMs: frame * gap,
    samples: Float32Array.from({ length: 4096 }, (_, index) => sound((frame * 4096 + index) / RATE, frame)),
  }));
const sine =
  (frequency: number, amplitude = 0.2) =>
  (time: number) =>
    amplitude * Math.sin(2 * Math.PI * frequency * time);

describe("a bounded sustained-note estimate", () => {
  it("locates a stable open high E with realistic harmonics without grading technique", () => {
    const result = assessSustainedPitch(
      frames((time) => sine(E4)(time) + sine(E4 * 2, 0.08)(time) + sine(E4 * 3, 0.03)(time)),
      RATE,
      64,
    );
    expect(result.status).toBe("stable");
    if (result.status !== "stable") return;
    expect(result.midi).toBe(64);
    expect(Math.abs(result.centsFromTarget)).toBeLessThan(8);
    expect(result.confidence).toBeGreaterThan(0.85);
    expect(result.frames).toBeGreaterThanOrEqual(12);
  });

  it("distinguishes a stable nearby wrong note from an unsuitable signal", () => {
    const F4 = E4 * 2 ** (1 / 12);
    const result = assessSustainedPitch(frames(sine(F4)), RATE, 64);
    expect(result.status).toBe("stable");
    if (result.status === "stable") {
      expect(result.midi).toBe(65);
      expect(result.centsFromTarget).toBeGreaterThan(90);
    }
  });

  it("returns uncertain for silence, clipping, noise and two simultaneous notes", () => {
    expect(
      assessSustainedPitch(
        frames(() => 0),
        RATE,
        64,
      ),
    ).toEqual({ status: "uncertain", reason: "quiet" });
    expect(assessSustainedPitch(frames(sine(E4, 1)), RATE, 64)).toEqual({ status: "uncertain", reason: "clipped" });
    let seed = 1;
    const noise = frames(() => {
      seed = (seed * 16_807) % 2_147_483_647;
      return (seed / 2_147_483_647 - 0.5) * 0.5;
    });
    expect(assessSustainedPitch(noise, RATE, 64)).toEqual({ status: "uncertain", reason: "unclear" });
    const mixed = frames((time) => sine(E4, 0.2)(time) + sine(E4 * 2 ** (3 / 12), 0.2)(time));
    expect(assessSustainedPitch(mixed, RATE, 64)).toEqual({ status: "uncertain", reason: "unclear" });
  });

  it("rejects a changing note and gaps that could be input or tab latency", () => {
    const changing = frames((time, frame) => sine(frame < 9 ? E4 : E4 * 2 ** (1 / 12))(time));
    expect(assessSustainedPitch(changing, RATE, 64)).toEqual({ status: "uncertain", reason: "unstable" });
    expect(assessSustainedPitch(frames(sine(E4)).slice(0, 7), RATE, 64)).toEqual({
      status: "uncertain",
      reason: "interrupted",
    });
    expect(assessSustainedPitch(frames(sine(E4), 400), RATE, 64)).toEqual({
      status: "uncertain",
      reason: "interrupted",
    });
  });
});
