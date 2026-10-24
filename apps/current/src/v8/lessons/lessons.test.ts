import { describe, expect, it } from "vitest";
import type { Score } from "../../core/score/types";
import { ACTIVITIES } from "../curriculum";
import {
  COMMON_TONE_CHANGE_DRAFT,
  COMMON_TONE_TRANSFER_DRAFT,
  THIRD_COLOUR_DRAFT,
  THIRD_COLOUR_REVERSED_DRAFT,
  THIRD_COLOUR_TRANSFER_DRAFT,
} from "../phase6Drafts";
import { upgradeChordDraft, upgradeMaterial } from "../scoreUpgrade";
import { LESSON_CATALOG, lessonForActivity } from "./catalog";
import { loadLesson, STAGE_LOADERS } from "./load";
import { entryOf, scoreById, type Lesson } from "./format";
import { COMMON_TONE_LESSON } from "./stage1";
import { THIRD_COLOUR_LESSON } from "./stage2";
import { differsIn, validateLesson, validateLessonSet } from "./validate";

async function allLessons(): Promise<Lesson[]> {
  const modules = await Promise.all(Object.values(STAGE_LOADERS).map((load) => load()));
  return modules.flatMap((module) => [...module.LESSONS]);
}

/** The music of a score, without titles or provenance: what a learner hears and reads. */
function music(score: Score) {
  return {
    key: score.key.tonic,
    metre: score.metre,
    bars: score.bars,
    tempo: score.tempo,
    voicings: score.voicings.map((voicing) => [voicing.symbol, voicing.frets]),
    sections: score.sections.map((section) => [section.id, section.from, section.to]),
    events: score.events.map((event) => [
      event.id,
      event.at,
      event.dur,
      event.kind,
      event.kind === "note"
        ? event.notes.map((note) => [note.string, note.fret])
        : event.kind === "strum"
          ? event.chord
          : null,
    ]),
  };
}

describe("authored lessons", () => {
  it("are complete, correct, playable and match what they display and sound", async () => {
    expect(validateLessonSet(await allLessons())).toEqual([]);
  });

  it("are listed in the shell catalogue exactly as their content describes them", async () => {
    const lessons = await allLessons();
    expect(LESSON_CATALOG).toEqual(lessons.map(entryOf));
    for (const entry of LESSON_CATALOG) {
      expect(ACTIVITIES.some((activity) => activity.id === `${entry.unitId}-${entry.activityKind}`)).toBe(true);
      expect(lessonForActivity(`${entry.unitId}-${entry.activityKind}`)).toBe(entry);
      expect((await loadLesson(entry)).id).toBe(entry.id);
    }
    expect(lessonForActivity("unit-01-rhythm")).toBeNull();
  });

  it("keep the Phase 6 drafts' music unchanged after moving to format 2", () => {
    const pairs: Array<[Score, Score]> = [
      [scoreById(THIRD_COLOUR_LESSON, THIRD_COLOUR_DRAFT.id), upgradeMaterial(THIRD_COLOUR_DRAFT)],
      [scoreById(THIRD_COLOUR_LESSON, THIRD_COLOUR_REVERSED_DRAFT.id), upgradeMaterial(THIRD_COLOUR_REVERSED_DRAFT)],
      [scoreById(THIRD_COLOUR_LESSON, THIRD_COLOUR_TRANSFER_DRAFT.id), upgradeMaterial(THIRD_COLOUR_TRANSFER_DRAFT)],
      [
        scoreById(COMMON_TONE_LESSON, COMMON_TONE_CHANGE_DRAFT.id),
        upgradeChordDraft(COMMON_TONE_CHANGE_DRAFT, "study"),
      ],
      [
        scoreById(COMMON_TONE_LESSON, "common-tone-c-am-two-count"),
        upgradeChordDraft(COMMON_TONE_CHANGE_DRAFT, "two-count"),
      ],
      [
        scoreById(COMMON_TONE_LESSON, COMMON_TONE_TRANSFER_DRAFT.id),
        upgradeChordDraft(COMMON_TONE_TRANSFER_DRAFT, "study"),
      ],
    ];
    for (const [authored, upgraded] of pairs) {
      const { events, ...rest } = music(upgraded);
      const mine = music(authored);
      // The chord draft had no sections; the re-authored chord scores keep one covering the study.
      if (!upgraded.voicings.length) expect(mine).toEqual({ events, ...rest });
      else expect({ ...mine, sections: rest.sections }).toEqual({ events, ...rest });
    }
  });
});

describe("the lesson validator", () => {
  const broken = (change: (lesson: Lesson) => Lesson) => validateLesson(change(structuredClone(THIRD_COLOUR_LESSON)));

  it("fails a lesson that leaves out any required part", () => {
    expect(broken((l) => ({ ...l, purpose: "" }))).toContainEqual(expect.stringContaining("purpose"));
    expect(broken((l) => ({ ...l, destination: " " }))).toContainEqual(expect.stringContaining("audible destination"));
    expect(broken((l) => ({ ...l, studies: l.studies.slice(0, 1) }))).toContainEqual(
      expect.stringContaining("two studies"),
    );
    expect(broken((l) => ({ ...l, likelyErrors: l.likelyErrors.slice(0, 1) }))).toContainEqual(
      expect.stringContaining("likely errors"),
    );
    expect(broken((l) => ({ ...l, successCriteria: [] }))).toContainEqual(expect.stringContaining("success criteria"));
    expect(broken((l) => ({ ...l, demonstration: { ...l.demonstration, handGuidance: [] } }))).toContainEqual(
      expect.stringContaining("hand guidance"),
    );
    expect(broken((l) => ({ ...l, capabilities: [] }))).toContainEqual(expect.stringContaining("capability"));
    expect(broken((l) => ({ ...l, provenance: { ...l.provenance, author: "" } }))).toContainEqual(
      expect.stringContaining("author"),
    );
  });

  it("insists that cues only fade, recall is later and in range, and the transfer changes what it claims", () => {
    expect(
      broken((l) => ({ ...l, cueFading: [l.cueFading[0], l.cueFading[2], { ...l.cueFading[1], id: "back" }] })),
    ).toContainEqual(expect.stringContaining("cues may only fade"));
    expect(broken((l) => ({ ...l, retrieval: { ...l.retrieval, afterDays: 0 } }))).toContainEqual(
      expect.stringContaining("later day"),
    );
    expect(broken((l) => ({ ...l, retrieval: { ...l.retrieval, tempo: 120 } }))).toContainEqual(
      expect.stringContaining("retrieval tempo"),
    );
    expect(broken((l) => ({ ...l, transfer: { ...l.transfer, changed: ["rhythm"] } }))).toContainEqual(
      expect.stringContaining("claims to change rhythm"),
    );
    expect(
      broken((l) => ({ ...l, performance: { kind: "piece", pieceId: "x", instruction: l.performance.instruction } })),
    ).toContainEqual(expect.stringContaining("performs piece x, which does not exist"));
  });

  it("refuses duplicate studies, unused scores, wrong units and techniques shown without a video marker", () => {
    expect(
      broken((l) => ({ ...l, studies: [l.studies[0], { ...l.studies[1], scoreId: l.studies[0].scoreId }] })),
    ).toContainEqual(expect.stringContaining("musically identical"));
    expect(broken((l) => ({ ...l, scores: [...l.scores, { ...l.scores[0], id: "spare-score" }] }))).toContainEqual(
      expect.stringContaining("spare-score is never used"),
    );
    expect(broken((l) => ({ ...l, stage: 3 }))).toContainEqual(expect.stringContaining("stage 2, not 3"));
    const bent = broken((l) => ({
      ...l,
      scores: l.scores.map((score, index) =>
        index === 0
          ? {
              ...score,
              events: score.events.map((event) =>
                event.id === "minor-third" && event.kind === "note"
                  ? { ...event, art: { bend: { semitones: 1 as const } } }
                  : event,
              ),
            }
          : score,
      ),
    }));
    expect(bent).toContainEqual(expect.stringContaining("bends, so it must show"));
  });

  it("holds capabilities to the unit's catalogue and the check to the kind of evidence its stand-in records", () => {
    expect(
      broken((l) => ({
        ...l,
        capabilities: [{ ...l.capabilities[0], id: "ear.made-up.skill" }, ...l.capabilities.slice(1)],
      })),
    ).toContainEqual(expect.stringContaining("not in Unit 10's catalogue"));
    expect(
      broken((l) => ({
        ...l,
        capabilities: [{ ...l.capabilities[0], action: "playing" }, ...l.capabilities.slice(1)],
      })),
    ).toContainEqual(expect.stringContaining("is a listening capability in the catalogue, not playing"));
    // A playing check standing in for a listening activity would be stored as recognition evidence.
    expect(broken((l) => ({ ...l, activityKind: "listen-compare" }))).toContainEqual(
      expect.stringContaining("playing check would be recorded as recognition evidence"),
    );
    expect(broken((l) => ({ ...l, checkKind: "listening" }))).toContainEqual(
      expect.stringContaining("listening check would be recorded as performance evidence"),
    );
  });

  it("asks for a fretting-hand video wherever a barre chord is strummed", () => {
    // C is strummed in the C-to-Am lesson; give its shape a barre and the lesson must say a video is needed.
    const strummed = validateLesson({
      ...COMMON_TONE_LESSON,
      scores: COMMON_TONE_LESSON.scores.map((score, index) =>
        index === 0
          ? {
              ...score,
              voicings: score.voicings.map((voicing) =>
                voicing.id === "C"
                  ? { ...voicing, barre: { fret: 1, from: 1 as const, to: 2 as const, finger: 1 as const } }
                  : voicing,
              ),
            }
          : score,
      ),
    });
    expect(strummed).toContainEqual(expect.stringContaining("fretting hand, so it must show"));
  });

  it("compares scores in the dimension a transfer claims", () => {
    const [demo, reversed, fromF] = THIRD_COLOUR_LESSON.scores;
    expect(differsIn("key", demo, fromF)).toBe(true);
    expect(differsIn("key", demo, reversed)).toBe(false);
    expect(differsIn("pitch", demo, reversed)).toBe(true);
    expect(differsIn("rhythm", demo, reversed)).toBe(false);
  });
});
