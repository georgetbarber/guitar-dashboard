import { describe, expect, it } from "vitest";
import { midiToHz, renderPluck, rms } from "./pluck";

const RATE = 48_000;

/** Fundamental by autocorrelation near the expected period, with parabolic refinement. */
function measuredHz(samples: Float32Array, expectedHz: number, from = 0.15, to = 0.65): number {
  const start = Math.round(from * RATE);
  const end = Math.round(to * RATE);
  const expected = RATE / expectedHz;
  const minLag = Math.floor(expected * 2 ** (-1 / 12));
  const maxLag = Math.ceil(expected * 2 ** (1 / 12));
  const score = (lag: number) => {
    let sum = 0;
    for (let index = start; index < end - lag; index++) sum += samples[index] * samples[index + lag];
    return sum;
  };
  let best = minLag;
  let bestScore = -Infinity;
  for (let lag = minLag; lag <= maxLag; lag++) {
    const value = score(lag);
    if (value > bestScore) {
      bestScore = value;
      best = lag;
    }
  }
  const left = score(best - 1);
  const right = score(best + 1);
  const offset = (left - right) / (2 * (left - 2 * bestScore + right));
  return RATE / (best + offset);
}

const cents = (measured: number, target: number) => 1200 * Math.log2(measured / target);

describe("plucked-string synthesis", () => {
  it("sounds in tune across the whole fretboard, including high notes where a whole-sample delay would not", () => {
    for (const [midi, string] of [
      [40, 6],
      [45, 5],
      [52, 4],
      [55, 3],
      [64, 1],
      [69, 1],
      [76, 1],
      [86, 1],
    ] as const) {
      const samples = renderPluck({ midi, seconds: 0.8, kind: "pluck", string, velocity: 0.8 }, RATE);
      expect(Math.abs(cents(measuredHz(samples, midiToHz(midi)), midiToHz(midi)))).toBeLessThan(3);
    }
  });

  it("decays like a string: loud at the attack, quieter a second later, lower strings ringing longer", () => {
    const high = renderPluck({ midi: 64, seconds: 2, kind: "pluck", string: 1, velocity: 0.8 }, RATE);
    const low = renderPluck({ midi: 40, seconds: 2, kind: "pluck", string: 6, velocity: 0.8 }, RATE);
    const early = (samples: Float32Array) => rms(samples, 0, RATE * 0.1);
    const late = (samples: Float32Array) => rms(samples, RATE * 1.2, RATE * 1.4);
    expect(late(high) / early(high)).toBeLessThan(0.5);
    expect(late(low) / early(low)).toBeGreaterThan(late(high) / early(high));
  });

  it("damps a palm-muted note quickly and makes a dead note short and pitchless", () => {
    const open = renderPluck({ midi: 45, seconds: 1, kind: "pluck", string: 5, velocity: 0.8 }, RATE);
    const muted = renderPluck({ midi: 45, seconds: 1, kind: "muted", string: 5, velocity: 0.8 }, RATE);
    const dead = renderPluck({ midi: 45, seconds: 1, kind: "dead", string: 5, velocity: 0.8 }, RATE);
    const ratio = (samples: Float32Array) => rms(samples, RATE * 0.3, RATE * 0.4) / rms(samples, 0, RATE * 0.05);
    expect(ratio(muted)).toBeLessThan(ratio(open) / 4);
    expect(rms(dead, RATE * 0.1, RATE * 0.2)).toBeLessThan(rms(dead, 0, RATE * 0.02) / 20);
    expect(Math.abs(cents(measuredHz(muted, midiToHz(45), 0.02, 0.2), midiToHz(45)))).toBeLessThan(5);
  });

  it("is louder and brighter when plucked harder, and identical every time it is rendered", () => {
    const soft = renderPluck({ midi: 57, seconds: 0.5, kind: "pluck", string: 3, velocity: 0.3 }, RATE);
    const hard = renderPluck({ midi: 57, seconds: 0.5, kind: "pluck", string: 3, velocity: 1 }, RATE);
    expect(rms(hard)).toBeGreaterThan(rms(soft) * 2);
    const again = renderPluck({ midi: 57, seconds: 0.5, kind: "pluck", string: 3, velocity: 1 }, RATE);
    expect(again).toEqual(hard);
    expect(Math.max(...hard.map(Math.abs))).toBeLessThanOrEqual(1);
  });
});
