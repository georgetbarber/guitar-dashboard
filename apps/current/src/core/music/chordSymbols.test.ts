import { describe, expect, it } from "vitest";
import { analyseVoicing, CHORD_SYMBOL_FORMULAS, parseChordSymbol } from "./chordSymbols";
import { CHORD_FORMULAS } from "./theory";

describe("chord symbols as interval structures", () => {
  it("reuses the theory module's formulas for the shared qualities", () => {
    expect(CHORD_SYMBOL_FORMULAS.find((formula) => formula.suffix === "m7")?.intervals).toBe(
      CHORD_FORMULAS.minor7.intervals,
    );
    expect(CHORD_SYMBOL_FORMULAS.find((formula) => formula.suffix === "")?.labels).toBe(CHORD_FORMULAS.major.labels);
  });

  it("spells chord tones on their own letters", () => {
    expect(parseChordSymbol("Am")?.tones.map((tone) => tone.name)).toEqual(["A", "C", "E"]);
    expect(parseChordSymbol("E7#9")?.tones.map((tone) => tone.name)).toEqual(["E", "G#", "B", "D", "F##"]);
    expect(parseChordSymbol("Bb7")?.tones.map((tone) => tone.name)).toEqual(["Bb", "D", "F", "Ab"]);
    expect(parseChordSymbol("Cdim7")?.tones.map((tone) => tone.name)).toEqual(["C", "Eb", "Gb", "Bbb"]);
    expect(parseChordSymbol("A5")?.tones.map((tone) => tone.label)).toEqual(["1", "5"]);
  });

  it("reads slash basses and refuses what it cannot spell", () => {
    expect(parseChordSymbol("C/G")).toMatchObject({ root: "C", bass: "G", bassPitchClass: 7 });
    for (const bad of ["H", "Cmaj13#11", "C/H", "C/G/E", "", "c"]) expect(parseChordSymbol(bad)).toBeNull();
  });

  it("finds foreign and missing tones and the bass role of real guitar shapes", () => {
    const c = parseChordSymbol("C")!;
    expect(analyseVoicing(c, [48, 52, 55, 60, 64])).toEqual({ foreign: [], missing: [], bassLabel: "1" });
    expect(analyseVoicing(c, [48, 52, 57, 60, 64]).foreign).toEqual([9]);
    expect(analyseVoicing(c, [48, 52, 60, 64]).missing.map((tone) => tone.label)).toEqual(["5"]);
    expect(analyseVoicing(c, [52, 55, 60]).bassLabel).toBe("3");
    // A dominant seventh may leave out its fifth; a triad may not.
    const e7 = parseChordSymbol("E7")!;
    expect(analyseVoicing(e7, [40, 50, 56, 64]).missing).toEqual([]);
  });
});
