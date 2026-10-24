import { describe, expect, it } from "vitest";
import { performScore } from "../core/score/perform";
import { positionMidi, validateScore } from "../core/score/validate";
import { COMMON_TONE_CHANGE_DRAFT, THIRD_COLOUR_DRAFT, THIRD_COLOUR_TRANSFER_DRAFT } from "./phase6Drafts";
import { ONE_NOTE_ANSWER_SHIFT, ONE_NOTE_QUESTION_ANSWER } from "./pilotEpisode";
import { upgradeChordDraft, upgradeMaterial } from "./scoreUpgrade";

describe("format 1 material in format 2", () => {
  it("keeps every id, pitch, position, count and silence of the pilot and the Phase 6 line drafts", () => {
    for (const material of [
      ONE_NOTE_QUESTION_ANSWER,
      ONE_NOTE_ANSWER_SHIFT,
      THIRD_COLOUR_DRAFT,
      THIRD_COLOUR_TRANSFER_DRAFT,
    ]) {
      const upgraded = upgradeMaterial(material);
      expect(validateScore(upgraded)).toEqual([]);
      expect(upgraded).toMatchObject({
        id: material.id,
        version: material.version,
        bars: material.bars,
        tempo: material.tempo,
      });
      expect(
        upgraded.events.map((event) => [
          event.id,
          event.at / 48,
          event.dur / 48,
          event.kind === "note" ? positionMidi(event.notes[0]) : null,
        ]),
      ).toEqual(
        material.events.map((event) => [
          event.id,
          event.atBeat,
          event.beats,
          event.kind === "note" ? event.midi : null,
        ]),
      );
      expect(upgraded.sections.map((section) => [section.id, section.from / 48, section.to / 48])).toEqual(
        material.sections.map((section) => [section.id, section.fromBeat, section.toBeat]),
      );
    }
    expect(upgradeMaterial(ONE_NOTE_ANSWER_SHIFT).derivedFrom).toEqual({
      id: ONE_NOTE_QUESTION_ANSWER.id,
      version: 1,
      changed: ["rhythm"],
    });
  });

  it("turns the chord draft and its two-count variation into strummed scores with the same voicings and timing", () => {
    const study = upgradeChordDraft(COMMON_TONE_CHANGE_DRAFT, "study");
    const variation = upgradeChordDraft(COMMON_TONE_CHANGE_DRAFT, "two-count");
    expect(validateScore(study)).toEqual([]);
    expect(validateScore(variation)).toEqual([]);
    expect(study.voicings.map((voicing) => voicing.frets)).toEqual([
      [null, 3, 2, 0, 1, 0],
      [null, 0, 2, 2, 1, 0],
    ]);
    expect(variation.events.map((event) => [event.at / 48, event.dur / 48])).toEqual([
      [0, 2],
      [2, 2],
      [4, 2],
      [6, 2],
    ]);
    // C x32010 sounds 48/52/55/60/64; Am x02210 sounds 45/52/57/60/64.
    const sounds = performScore(study, { tempo: 60 });
    expect(sounds.filter((sound) => sound.eventId === "c-first").map((sound) => sound.midi)).toEqual([
      48, 52, 55, 60, 64,
    ]);
    expect(sounds.filter((sound) => sound.eventId === "am-answer").map((sound) => sound.midi)).toEqual([
      45, 52, 57, 60, 64,
    ]);
  });
});
