import { describe, expect, it } from "vitest";
import { CURRICULUM } from "./curriculum";
import { buildFreePlayPrompt } from "./freePlay";
import { sketchFromFreePlay } from "./freePlayFragment";
import { DEFAULT_STATE } from "./store";
import { cloudSketch } from "./sync";
import { validateSketch } from "./validation";

describe("Free Play fragments", () => {
  it("keeps an exact muted-string guide without inventing pitched notes", () => {
    const prompt = buildFreePlayPrompt(DEFAULT_STATE, "groove", 1);
    const sketch = sketchFromFreePlay(DEFAULT_STATE, prompt)!;
    expect(sketch.origin?.preview).toEqual(prompt.preview);
    expect(sketch.melody).toEqual([]);
    expect(sketch.rhythmPattern).toMatch(/^[●· ]+$/);
    validateSketch(sketch);
    expect(cloudSketch(sketch)).not.toHaveProperty("origin");
  });

  it("transfers an audible riff to valid guitar positions and retains its source", () => {
    const prompt = buildFreePlayPrompt(DEFAULT_STATE, "riff", 1);
    const sketch = sketchFromFreePlay(DEFAULT_STATE, prompt)!;
    expect(sketch.melody.length).toBeGreaterThan(0);
    expect(
      sketch.melody.every((note) => note.string >= 0 && note.string < 6 && note.fret >= 0 && note.fret <= 12),
    ).toBe(true);
    expect(sketch.origin?.sourceId).toBe(prompt.id);
    validateSketch(sketch);
  });

  it("preserves advanced degree and chord guides in the correct domain", () => {
    const state = { ...DEFAULT_STATE, completedActivityIds: [CURRICULUM[18].activities[0].id] };
    const degree = sketchFromFreePlay(state, buildFreePlayPrompt(state, "degree", 1));
    const chord = sketchFromFreePlay(state, buildFreePlayPrompt(state, "chord", 1));
    expect(degree?.melody).toHaveLength(3);
    expect(chord?.chords.length).toBeGreaterThan(0);
    if (degree) validateSketch(degree);
    if (chord) validateSketch(chord);
  });
});
