import { describe, expect, it } from "vitest";
import { CURRICULUM } from "./curriculum";
import {
  ONE_NOTE_ANSWER_SHIFT,
  ONE_NOTE_QUESTION_ANSWER,
  PILOT_EPISODE,
  PILOT_PERFORMED_REFERENCES,
  validatePilotEpisode,
} from "./pilotEpisode";
import { positionMidi, STANDARD_TUNING_MIDI, validateMaterial } from "./structuredMusic";

describe("the first authored musical episode", () => {
  it("keeps every count, sounding note and intentional silence in an exact two-bar timeline", () => {
    expect(validatePilotEpisode()).toEqual([]);
    expect(CURRICULUM[0].episodeId).toBe(PILOT_EPISODE.id);
    expect(ONE_NOTE_QUESTION_ANSWER.events.map((event) => event.kind)).toEqual([
      "note",
      "rest",
      "note",
      "rest",
      "note",
      "note",
      "rest",
      "note",
    ]);
    expect(ONE_NOTE_QUESTION_ANSWER.sections.map(({ fromBeat, toBeat }) => [fromBeat, toBeat])).toEqual([
      [0, 4],
      [4, 8],
    ]);
    expect(positionMidi(STANDARD_TUNING_MIDI, { string: 1, fret: 0 })).toBe(64);
    expect(ONE_NOTE_QUESTION_ANSWER.review.status).toBe("draft");
    expect(PILOT_PERFORMED_REFERENCES).toEqual([]);
  });

  it("changes only the middle answer attack in the proposed variation", () => {
    const attacks = (events: typeof ONE_NOTE_QUESTION_ANSWER.events) =>
      events.filter((event) => event.kind === "note").map((event) => event.atBeat);
    expect(attacks(ONE_NOTE_QUESTION_ANSWER.events)).toEqual([0, 2, 4, 5, 7]);
    expect(attacks(ONE_NOTE_ANSWER_SHIFT.events)).toEqual([0, 2, 4, 6, 7]);
    expect(ONE_NOTE_ANSWER_SHIFT.derivedFrom).toEqual({
      id: ONE_NOTE_QUESTION_ANSWER.id,
      version: 1,
      changedDimension: "rhythm",
    });
    expect(
      ONE_NOTE_ANSWER_SHIFT.events
        .filter((event) => event.kind === "note")
        .every((event) => event.midi === 64 && event.position.string === 1 && event.position.fret === 0),
    ).toBe(true);
  });

  it("rejects a wrong guitar position and a missing rest before a player can use them", () => {
    const wrongPitch = {
      ...ONE_NOTE_QUESTION_ANSWER,
      events: ONE_NOTE_QUESTION_ANSWER.events.map((event) =>
        event.id === "q-1" && event.kind === "note" ? { ...event, midi: 65 } : event,
      ),
    };
    expect(validateMaterial(wrongPitch)).toContain("Pitch and guitar position disagree at q-1.");
    const missingRest = {
      ...ONE_NOTE_QUESTION_ANSWER,
      events: ONE_NOTE_QUESTION_ANSWER.events.filter((event) => event.id !== "q-2"),
    };
    expect(validateMaterial(missingRest).some((error) => error.includes("Gap"))).toBe(true);
    const impossiblePitch = {
      ...ONE_NOTE_QUESTION_ANSWER,
      events: ONE_NOTE_QUESTION_ANSWER.events.map((event) =>
        event.id === "q-1" && event.kind === "note" ? { ...event, midi: 164 } : event,
      ),
    };
    expect(validateMaterial(impossiblePitch)).toContain("Invalid MIDI pitch at q-1.");
  });

  it("does not copy the pilot phrase into other sound and time units", () => {
    expect(CURRICULUM[0].activities.find((activity) => activity.kind === "rhythm")?.title).toBe(
      "Play a one-note question and answer",
    );
    expect(CURRICULUM[1].activities.find((activity) => activity.kind === "rhythm")?.title).not.toBe(
      "Play a one-note question and answer",
    );
  });

  it("specifies an unaided check and three changed-support routes back to the original phrase", () => {
    expect(PILOT_EPISODE.moves.map((move) => move.phase)).toEqual(["learn", "practise", "try-unaided"]);
    expect(PILOT_EPISODE.moves.at(-1)?.cues).toBe("none");
    expect(PILOT_EPISODE.obstacles.map((branch) => branch.id)).toEqual(["unclear-start", "release", "pulse"]);
    expect(
      PILOT_EPISODE.obstacles.every((branch) => branch.returnTo === "whole-study" && branch.changedSupport.length > 20),
    ).toBe(true);
    expect(PILOT_EPISODE.delayedCheck.earliestDaysLater).toBeGreaterThan(0);
  });
});
