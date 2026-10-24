import { describe, expect, it } from "vitest";
import { score } from "./build";
import { keySignature, ledgerSteps, noteValue, staffSymbols, writtenPitch } from "./staff";
import { barGrid } from "./views";

const provenance = { author: "test", reviewer: "", reviewStatus: "draft", reviewedAt: null } as const;
const make = (key: string, text: string | Record<string, string>, extra: Record<string, unknown> = {}) =>
  score({
    id: "staff-test",
    title: "Staff test",
    version: 1,
    provenance,
    key: key as "C major",
    metre: "4/4",
    bars: 2,
    tempo: [40, 60, 90],
    voices:
      typeof text === "string"
        ? { line: { label: "Line", text } }
        : Object.fromEntries(Object.entries(text).map(([id, body]) => [id, { label: id, text: body }])),
    ...extra,
  });

describe("staff notation", () => {
  it("writes guitar an octave above sounding pitch, by the score's own spelling", () => {
    const key = { tonic: "C", mode: "major" } as const;
    // Open low E sounds E2 and is written E3, seven steps below the staff's bottom line (E4 = 30).
    expect(writtenPitch({ string: 6, fret: 0 }, key)).toEqual({ step: 23, letter: "E", alter: 0 });
    expect(writtenPitch({ string: 1, fret: 0 }, key)).toEqual({ step: 37, letter: "E", alter: 0 });
    // Middle C on the B string (fret 1) sounds C4 and is written C5.
    expect(writtenPitch({ string: 2, fret: 1 }, key)).toEqual({ step: 35, letter: "C", alter: 0 });
    // A spelled flat stays a flat on its own line: B string fret 2 spelled Db is written Db5, not C#5.
    expect(writtenPitch({ string: 2, fret: 2, spell: "Db" }, key)).toEqual({ step: 36, letter: "D", alter: -1 });
    // In D major, G-string fret 11 is F#4 sounding, written F#5 on the top line.
    expect(writtenPitch({ string: 3, fret: 11 }, { tonic: "D", mode: "major" })).toEqual({
      step: 38,
      letter: "F",
      alter: 1,
    });
  });

  it("draws the key signature the key's spelled scale implies", () => {
    expect(keySignature({ tonic: "C", mode: "major" })).toEqual({ kind: "none", steps: [] });
    expect(keySignature({ tonic: "G", mode: "major" })).toEqual({ kind: "sharp", steps: [38] });
    expect(keySignature({ tonic: "E", mode: "minor" })).toEqual({ kind: "sharp", steps: [38] });
    expect(keySignature({ tonic: "D", mode: "major" })).toEqual({ kind: "sharp", steps: [38, 35] });
    expect(keySignature({ tonic: "F", mode: "major" })).toEqual({ kind: "flat", steps: [34] });
    // A Dorian has G major's signature; A Mixolydian has D major's.
    expect(keySignature({ tonic: "A", mode: "dorian" })).toEqual({ kind: "sharp", steps: [38] });
    expect(keySignature({ tonic: "A", mode: "mixolydian" })).toEqual({ kind: "sharp", steps: [38, 35] });
  });

  it("shows an accidental only where the key and the bar so far do not imply it, and resets each bar", () => {
    // C major: F#, F# again, F natural, then a new bar's F#.
    const study = make("C major", "q 4:4{F#} q 4:4{F#} q 4:3 q r | q 4:4{F#} q r h r");
    const first = staffSymbols(study, barGrid(study, 1));
    expect(first.map((symbol) => symbol.heads.map((head) => head.accidental ?? "-").join())).toEqual([
      "sharp",
      "-",
      "natural",
      "",
    ]);
    const second = staffSymbols(study, barGrid(study, 2));
    expect(second[0].heads[0].accidental).toBe("sharp");
    // In G major the same F# needs nothing, and an F natural needs a natural sign.
    const inG = make("G major", "q 4:4 q 4:3 h r | w r");
    expect(staffSymbols(inG, barGrid(inG, 1)).map((symbol) => symbol.heads[0]?.accidental ?? "-")).toEqual([
      "-",
      "natural",
      "-",
    ]);
  });

  it("gives each duration its written value, dots and triplets included", () => {
    expect(noteValue(192)).toEqual({ value: "whole", dotted: false, triplet: false });
    expect(noteValue(144)).toEqual({ value: "half", dotted: true, triplet: false });
    expect(noteValue(72)).toEqual({ value: "quarter", dotted: true, triplet: false });
    expect(noteValue(16)).toEqual({ value: "eighth", dotted: false, triplet: true });
    expect(noteValue(12)).toEqual({ value: "sixteenth", dotted: false, triplet: false });
    const study = make("C major", "e 1:0 e 1:1 q. 1:3 e 1:1 q 1:0 | e3 1:0 e3 1:1 e3 1:3 q. r e r q r");
    expect(
      staffSymbols(study, barGrid(study, 2))
        .slice(0, 4)
        .map((symbol) => [symbol.value, symbol.dotted, symbol.triplet, symbol.rest]),
    ).toEqual([
      ["eighth", false, true, false],
      ["eighth", false, true, false],
      ["eighth", false, true, false],
      ["quarter", true, false, true],
    ]);
  });

  it("stacks a chord's notes on one stem and marks a dead scratch with a cross on the middle line", () => {
    const study = make("C major", "h D:C q X q X | w r", { voicings: { C: { symbol: "C", shape: "x32010" } } });
    const [chord, scratch] = staffSymbols(study, barGrid(study, 1));
    // C x32010 sounds C3 E3 G3 C4 E4, written C4 E4 G4 C5 E5.
    expect(chord.heads.map((head) => head.step)).toEqual([28, 30, 32, 35, 37]);
    expect(chord.value).toBe("half");
    expect(scratch.heads).toEqual([{ step: 34, dead: true }]);
  });

  it("stems a thumb voice down and a finger voice up when two voices share the staff", () => {
    const study = make("G major", { fingers: "h 2:0 h 2:0 | w r", thumb: "q 6:3 q 4:0 q 6:3 q 4:0 | w r" });
    const symbols = staffSymbols(study, barGrid(study, 1));
    expect(new Set(symbols.filter((symbol) => symbol.voice === "fingers").map((symbol) => symbol.stem))).toEqual(
      new Set(["up"]),
    );
    expect(new Set(symbols.filter((symbol) => symbol.voice === "thumb").map((symbol) => symbol.stem))).toEqual(
      new Set(["down"]),
    );
  });

  it("adds ledger lines between a note and the staff, and none inside it", () => {
    expect(ledgerSteps(23)).toEqual([28, 26, 24]);
    expect(ledgerSteps(28)).toEqual([28]);
    expect(ledgerSteps(33)).toEqual([]);
    expect(ledgerSteps(41)).toEqual([40]);
  });
});
