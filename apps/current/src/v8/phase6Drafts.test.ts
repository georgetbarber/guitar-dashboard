import { describe, expect, it } from "vitest";
import { buildChords, createContext } from "../core/music/theory";
import {
  COMMON_TONE_CHANGE_DRAFT,
  COMMON_TONE_EPISODE_DRAFT,
  COMMON_TONE_TRANSFER_DRAFT,
  THIRD_COLOUR_DRAFT,
  THIRD_COLOUR_EPISODE_DRAFT,
  THIRD_COLOUR_REVERSED_DRAFT,
  THIRD_COLOUR_TRANSFER_DRAFT,
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

  it("moves the third comparison to F without changing its rhythmic question", () => {
    expect(THIRD_COLOUR_EPISODE_DRAFT.transfer.materialId).toBe(THIRD_COLOUR_TRANSFER_DRAFT.id);
    expect(THIRD_COLOUR_TRANSFER_DRAFT.derivedFrom?.id).toBe(THIRD_COLOUR_DRAFT.id);
    expect(THIRD_COLOUR_TRANSFER_DRAFT.tonalCenter).toEqual({ name: "F", midi: 65 });
    expect(THIRD_COLOUR_TRANSFER_DRAFT.events.map((event) => [event.kind, event.atBeat, event.beats])).toEqual(
      THIRD_COLOUR_DRAFT.events.map((event) => [event.kind, event.atBeat, event.beats]),
    );
    const notes = THIRD_COLOUR_TRANSFER_DRAFT.events.filter((event) => event.kind === "note");
    expect(notes.map((event) => [event.spelling, event.midi, event.position.string, event.position.fret])).toEqual([
      ["F", 65, 1, 1],
      ["Ab", 68, 1, 4],
      ["F", 65, 1, 1],
      ["F", 65, 1, 1],
      ["A", 69, 1, 5],
      ["F", 65, 1, 1],
    ]);
    expect(notes[1].midi - notes[0].midi).toBe(3);
    expect(notes[4].midi - notes[3].midi).toBe(4);
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

  it("moves the I-to-vi chord question to G and Em with new shared positions", () => {
    const chords = buildChords(createContext("G", "major"));
    expect(chords.find((chord) => chord.symbol === "G")?.roman).toBe("I");
    expect(chords.find((chord) => chord.symbol === "Em")?.roman).toBe("vi");
    expect(validatePhase6Drafts(COMMON_TONE_TRANSFER_DRAFT)).toEqual([]);
    expect(COMMON_TONE_EPISODE_DRAFT.transfer.studyId).toBe(COMMON_TONE_TRANSFER_DRAFT.id);
    expect(COMMON_TONE_TRANSFER_DRAFT.events.map((event) => [event.atBeat, event.beats, event.chordId])).toEqual([
      [0, 4, "G"],
      [4, 4, "Em"],
    ]);
    const [g, em] = COMMON_TONE_TRANSFER_DRAFT.voicings;
    expect(g.positions.filter((position) => em.positions.some((other) =>
      other.string === position.string && other.fret === position.fret,
    ))).toEqual([
      { string: 5, fret: 2 },
      { string: 3, fret: 0 },
      { string: 2, fret: 0 },
    ]);
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
    const duplicateVoicing = {
      ...COMMON_TONE_CHANGE_DRAFT,
      voicings: [COMMON_TONE_CHANGE_DRAFT.voicings[0], ...COMMON_TONE_CHANGE_DRAFT.voicings],
    };
    expect(validatePhase6Drafts(duplicateVoicing)).toContain("C: duplicate voicing ID.");
    const duplicateEvent = {
      ...COMMON_TONE_CHANGE_DRAFT,
      variation: COMMON_TONE_CHANGE_DRAFT.variation.map((event) =>
        event.id === "am-two" ? { ...event, id: "am-one" } : event,
      ),
    };
    expect(validatePhase6Drafts(duplicateEvent)).toContain("variation: invalid chord event am-one.");
    const crossingBar = {
      ...COMMON_TONE_CHANGE_DRAFT,
      events: [
        { ...COMMON_TONE_CHANGE_DRAFT.events[0], beats: 5 },
        { ...COMMON_TONE_CHANGE_DRAFT.events[1], atBeat: 5, beats: 3 },
      ],
    };
    expect(validatePhase6Drafts(crossingBar)).toContain("study: invalid chord event c-first.");
  });
});
