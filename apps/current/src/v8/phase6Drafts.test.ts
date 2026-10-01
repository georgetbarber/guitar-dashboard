import { describe, expect, it } from "vitest";
import { buildChords, createContext } from "../core/music/theory";
import {
  COMMON_TONE_CHANGE_DRAFT,
  COMMON_TONE_EPISODE_DRAFT,
  THIRD_COLOUR_DRAFT,
  THIRD_COLOUR_EPISODE_DRAFT,
  THIRD_COLOUR_REVERSED_DRAFT,
  validatePhase6Drafts,
} from "./phase6Drafts";

describe("two contrasting, unshipped Phase 6 episode drafts", () => {
  it("keeps the root and rhythm fixed while the third changes by one fret", () => {
    expect(validatePhase6Drafts()).toEqual([]);
    const original = THIRD_COLOUR_DRAFT.events.filter((event) => event.kind === "note");
    const reversed = THIRD_COLOUR_REVERSED_DRAFT.events.filter((event) => event.kind === "note");
    expect(original.map((event) => [event.atBeat, event.midi, event.position.fret])).toEqual([
      [0, 64, 0],
      [1, 67, 3],
      [2, 64, 0],
      [4, 64, 0],
      [5, 68, 4],
      [6, 64, 0],
    ]);
    expect(reversed.map((event) => event.atBeat)).toEqual(original.map((event) => event.atBeat));
    expect(reversed.map((event) => event.midi)).toEqual([64, 68, 64, 64, 67, 64]);
    expect(THIRD_COLOUR_EPISODE_DRAFT.moves.at(-1)?.cues).toBe("none");
    expect(THIRD_COLOUR_DRAFT.review.status).toBe("draft");
  });

  it("uses only C-major chord tones and keeps three guitar positions across C to Am", () => {
    const chords = buildChords(createContext("C", "major"));
    expect(chords.find((chord) => chord.symbol === "C")?.roman).toBe("I");
    expect(chords.find((chord) => chord.symbol === "Am")?.roman).toBe("vi");
    const [c, am] = COMMON_TONE_CHANGE_DRAFT.voicings;
    const common = c.positions.filter((position) =>
      am.positions.some((other) => other.string === position.string && other.fret === position.fret),
    );
    expect(common).toEqual([
      { string: 4, fret: 2 },
      { string: 2, fret: 1 },
      { string: 1, fret: 0 },
    ]);
    expect(COMMON_TONE_CHANGE_DRAFT.events.map((event) => [event.atBeat, event.beats, event.chordId])).toEqual([
      [0, 4, "C"],
      [4, 4, "Am"],
    ]);
    expect(COMMON_TONE_CHANGE_DRAFT.review.status).toBe("draft");
    expect(COMMON_TONE_EPISODE_DRAFT.materialId).toBe(COMMON_TONE_CHANGE_DRAFT.id);
    expect(COMMON_TONE_EPISODE_DRAFT.variation).toBe("two-count");
    expect(COMMON_TONE_EPISODE_DRAFT.moves.map((move) => move.phase)).toEqual(["learn", "practise", "try-unaided"]);
    expect(COMMON_TONE_EPISODE_DRAFT.obstacles.every((obstacle) => obstacle.returnTo === "whole-study")).toBe(true);
  });

  it("rejects a wrong chord fret and a gap in the phrase before either can enter a player", () => {
    const wrongFret = {
      ...COMMON_TONE_CHANGE_DRAFT,
      voicings: COMMON_TONE_CHANGE_DRAFT.voicings.map((voicing) =>
        voicing.id === "C"
          ? {
              ...voicing,
              positions: voicing.positions.map((position) =>
                position.string === 3 ? { ...position, fret: 1 } : position,
              ),
            }
          : voicing,
      ),
    };
    expect(validatePhase6Drafts(wrongFret)).toContain("C: frets do not sound the named chord.");
    const gap = {
      ...COMMON_TONE_CHANGE_DRAFT,
      events: COMMON_TONE_CHANGE_DRAFT.events.map((event) =>
        event.chordId === "Am" ? { ...event, atBeat: 5 } : event,
      ),
    };
    expect(validatePhase6Drafts(gap)).toContain("study: invalid chord event am-answer.");
  });
});
