import { describe, expect, it } from "vitest";
import { CURRICULUM, PREREQUISITES } from "./curriculum";
import {
  createEvidence,
  newLessonsAvailable,
  nextUnit,
  unitHasWork,
  unitLocked,
  unitProgress,
  unmetPrerequisites,
} from "./learning";
import { DEFAULT_STATE } from "./store";
import type { CurriculumUnit, V8State } from "./types";

const unit = (order: number) => CURRICULUM[order - 1];
const openUnits = (state: V8State) => CURRICULUM.filter((item) => !unitLocked(state, item)).map((item) => item.order);

/** Every activity of these units reported successful, as a learner who has worked through them. */
function completed(orders: number[], extra: Partial<V8State> = {}): V8State {
  const evidence = orders.flatMap((order) =>
    unit(order).activities.flatMap((activity) =>
      createEvidence(
        activity.id,
        activity.competencyIds,
        activity.source,
        "none",
        "successful",
        {},
        "2026-10-01T09:00:00.000Z",
      ),
    ),
  );
  return {
    ...structuredClone(DEFAULT_STATE),
    evidence,
    completedActivityIds: orders.flatMap((order) => unit(order).activities.map((activity) => activity.id)),
    ...extra,
  };
}

/** The rule before the prerequisite graph: open up to one past current, or once the unit before is complete. */
function lockedBefore(state: V8State, item: CurriculumUnit): boolean {
  const current = nextUnit(state);
  return item.order > current.order + 1 && item.order > 1 && unitProgress(state, unit(item.order - 1).id) < 100;
}

describe("the prerequisite graph", () => {
  it("has no cycles: every unit builds only on units that come before it", () => {
    for (const item of CURRICULUM) {
      expect(item.prerequisiteIds.every((id) => CURRICULUM.find((u) => u.id === id)!.order < item.order)).toBe(true);
      expect(item.prerequisiteIds.length > 0 || item.order === 1).toBe(true);
    }
    expect(Object.keys(PREREQUISITES)).toHaveLength(48);
  });

  it("opens nothing past the next unit for a new learner whose first unit is unfinished", () => {
    expect(openUnits(structuredClone(DEFAULT_STATE))).toEqual([1, 2]);
  });

  it("treats units before the placement start as met, so a placed-out learner is not sent back", () => {
    const secure = completed([], { settings: { ...DEFAULT_STATE.settings, startingBaseline: "secure" } });
    expect(nextUnit(secure).order).toBe(7);
    // Unit 21 builds on 3 and 6, both before placement: open. Unit 22 also needs 21: not yet.
    expect(unitLocked(secure, unit(21))).toBe(false);
    expect(unmetPrerequisites(secure, unit(22)).map((item) => item.order)).toEqual([21]);
    expect(unitLocked(secure, unit(22))).toBe(true);
    // Unit 26 builds on 4 and 5 (placed) and 19 (not done): locked, and says only 19.
    expect(unmetPrerequisites(secure, unit(26)).map((item) => item.order)).toEqual([19]);
    // Unit 9 builds on 2 (placed) and 8: 8 is next, so 9 waits for it.
    expect(unmetPrerequisites(secure, unit(9)).map((item) => item.order)).toEqual([8]);
  });

  it("never locks a unit with recorded work, in a workspace shaped like George's", () => {
    // Units 1–9 complete, as the live data has, plus one report in Unit 14 and a capstone record.
    const george = completed([1, 2, 3, 4, 5, 6, 7, 8, 9]);
    const [report] = createEvidence(
      unit(14).activities[0].id,
      unit(14).activities[0].competencyIds,
      "recognition",
      "none",
      "partial",
      {},
    );
    const [capstone] = createEvidence(
      "stage-1-capstone",
      ["piece.front-step.one-finger"],
      "performance",
      "none",
      "successful",
      {},
    );
    const state = { ...george, evidence: [...george.evidence, report, capstone] };
    expect(nextUnit(state).order).toBe(10);
    expect(unitHasWork(state, unit(14))).toBe(true);
    expect(unitLocked(state, unit(14))).toBe(false);
    for (const item of CURRICULUM)
      if (unitHasWork(state, item)) expect(unitLocked(state, item), item.title).toBe(false);
    // Every unit the old rule left open with work in it is still open; nothing George can reach today is hidden.
    for (const item of CURRICULUM)
      if (!lockedBefore(state, item) && unitHasWork(state, item)) expect(unitLocked(state, item)).toBe(false);
    // And the style threads open by what they build on: Unit 13 needs 7 and 10, so it waits for 10.
    expect(unmetPrerequisites(state, unit(13)).map((item) => item.order)).toEqual([10]);
  });

  it("keeps every unit the old rule opened, for learners at every point of the first two stages", () => {
    for (let done = 0; done <= 12; done++) {
      const state = completed(Array.from({ length: done }, (_, index) => index + 1));
      const before = CURRICULUM.filter((item) => !lockedBefore(state, item)).map((item) => item.order);
      const after = openUnits(state);
      for (const order of before) expect(after, `after ${done} units, unit ${order}`).toContain(order);
    }
  });
});

describe("new lessons for finished activities", () => {
  it("points out an authored lesson whose activity was completed before it existed, until it is opened", () => {
    const earlier = completed([6]);
    expect(newLessonsAvailable(earlier).map((entry) => entry.id)).toEqual(["lesson-unit-06-common-tone"]);
    // The completion itself is untouched.
    expect(unitProgress(earlier, "unit-06")).toBe(100);
    const opened: V8State = {
      ...earlier,
      lessonCursors: [
        {
          id: "cursor",
          lessonId: "lesson-unit-06-common-tone",
          lessonVersion: 1,
          step: "learn",
          scoreId: "common-tone-c-am",
          tempo: 60,
          assistance: "none",
          updatedAt: "2026-10-24T09:00:00.000Z",
        },
      ],
    };
    expect(newLessonsAvailable(opened)).toEqual([]);
    expect(newLessonsAvailable(structuredClone(DEFAULT_STATE))).toEqual([]);
  });
});
