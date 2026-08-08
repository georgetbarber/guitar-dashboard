import { describe, expect, it } from "vitest";
import { CURRICULUM, validateCurriculum } from "./curriculum";

const OPEN_MIDI: Record<string, number> = { e: 64, B: 59, G: 55, D: 50, A: 45, E: 40 };

function tabNotes(order: number) {
  return CURRICULUM[order - 1].microStudy.tab.flatMap((line) => {
    const string = /^([eBGDAE])\|/.exec(line)?.[1];
    if (!string) return [];
    return [...line.matchAll(/(?<=-)(\d{1,2})(?=-)/g)].map((match) => ({
      string,
      fret: Number(match[1]),
      midi: OPEN_MIDI[string] + Number(match[1])
    }));
  });
}

describe("V8 curriculum music contract", () => {
  it("keeps the audited fretboard examples aligned with their named intervals", () => {
    const octaves = tabNotes(8);
    expect(Math.abs(octaves[1].midi - octaves[0].midi)).toBe(12);

    const fifths = tabNotes(9);
    const firstA = fifths.find((note) => note.string === "A")!;
    const dString = fifths.find((note) => note.string === "D")!;
    expect(dString.midi - firstA.midi).toBe(7);

    const thirds = tabNotes(10);
    const root = thirds.find((note) => note.string === "A")!;
    expect(thirds.filter((note) => note.string === "D").map((note) => note.midi - root.midi)).toEqual([3, 4]);

    const riff = tabNotes(25);
    expect(riff.find((note) => note.fret === 7)!.midi - OPEN_MIDI.E).toBe(7);
  });

  it("validates authored notation patterns and descriptive rhythm text", () => {
    expect(validateCurriculum()).toEqual([]);
  });

  it("gives every unit an authored and bounded ear target", () => {
    expect(CURRICULUM.every((unit) =>
      Boolean(unit.microStudy.earTargets?.length) && unit.microStudy.earTargets!.every((target) => target >= 0 && target <= 12)
    )).toBe(true);
    expect(CURRICULUM[9].microStudy.earTargets).toEqual([3, 4]);
    expect(CURRICULUM[0].microStudy.earTargets).toEqual([0]);
  });

  it("keeps listening instructions truthful about the playback that is available", () => {
    const tonicOnly = CURRICULUM[0].activities.find((activity) => activity.kind === "listen-compare")!;
    expect(tonicOnly.title).toBe("Hear and compare your attempts");
    expect(tonicOnly.action).toContain("Hear the tonic reference");
    expect(tonicOnly.action).not.toContain("reference and target");

    const intervalComparison = CURRICULUM[9].activities.find((activity) => activity.kind === "listen-compare")!;
    expect(intervalComparison.action).toContain("Hear reference and target");
  });
});
