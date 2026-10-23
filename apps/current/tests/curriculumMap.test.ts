import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { CURRICULUM } from "../src/v8/curriculum";
import { PILOT_CAPABILITIES } from "../src/v8/capabilities";
import { LESSON_CATALOG } from "../src/v8/lessons/catalog";
import { LESSONS as STAGE_1 } from "../src/v8/lessons/stage1";
import { LESSONS as STAGE_2 } from "../src/v8/lessons/stage2";

/*
 * docs/CURRICULUM_MAP.md is the plan the authoring batches follow. These
 * checks keep its tables consistent with the code they describe: every unit
 * once, with its current id and title, prerequisites that come earlier, a
 * stand-in activity the unit actually has, and a capability catalogue that
 * contains every capability already in use and reuses no id.
 */
const MAP = readFileSync(new URL("../../../docs/CURRICULUM_MAP.md", import.meta.url), "utf8");
const section = (heading: string) => {
  const start = MAP.indexOf(heading);
  if (start < 0) throw new Error(`Missing section ${heading}`);
  const next = MAP.indexOf("\n## ", start + heading.length);
  return MAP.slice(start, next < 0 ? undefined : next);
};
const rows = (text: string) =>
  text
    .split("\n")
    .filter((line) => /^\| \d+ \|/.test(line))
    .map((line) =>
      line
        .slice(1, -1)
        .split(" | ")
        .map((cell) => cell.trim()),
    );

const unitRows = rows(section("## 3. Unit dispositions"));
const capabilityRows = rows(section("## 11. Capability catalogue"));
const ACTIONS: Record<string, string> = { L: "listening", N: "naming", Lo: "locating", T: "timing", P: "playing" };

describe("curriculum map", () => {
  it("gives every one of the 48 units exactly one disposition row, with its current title", () => {
    expect(unitRows.map((row) => Number(row[0]))).toEqual(CURRICULUM.map((unit) => unit.order));
    for (const [order, title] of unitRows) expect(title).toBe(CURRICULUM[Number(order) - 1].title);
  });

  it("lists prerequisites that exist and come earlier", () => {
    for (const row of unitRows) {
      const order = Number(row[0]);
      const cell = row.at(-1)!;
      const prerequisites = cell === "—" ? [] : cell.split(",").map((value) => Number(value.trim()));
      expect(
        prerequisites.every((value) => Number.isInteger(value) && value >= 1 && value < order),
        `unit ${order}`,
      ).toBe(true);
      if (order > 1) expect(prerequisites.length, `unit ${order} has prerequisites`).toBeGreaterThan(0);
    }
  });

  it("names a stand-in activity each unit has, matching the lessons already authored", () => {
    for (const row of unitRows) {
      const unit = CURRICULUM[Number(row[0]) - 1];
      const kind = row[3].match(/`([a-z-]+)`/)?.[1];
      expect(
        unit.activities.some((activity) => activity.kind === kind),
        `unit ${unit.order} stands in for ${kind}`,
      ).toBe(true);
      const authored = LESSON_CATALOG.find((entry) => entry.unitId === unit.id);
      if (authored) expect(kind).toBe(authored.activityKind);
    }
    // The Unit 1 pilot stands in for the unit's rhythm activity.
    expect(unitRows[0][3]).toContain("`rhythm`");
  });

  it("catalogues capabilities for all 48 units, keeps every id in use, and never reuses an id", () => {
    expect(capabilityRows.map((row) => Number(row[0]))).toEqual(CURRICULUM.map((unit) => unit.order));
    const all = capabilityRows.flatMap(([order, cell]) =>
      [...cell.matchAll(/`([a-z0-9.-]+)` (Lo|L|N|T|P)\b/g)].map((match) => ({
        order: Number(order),
        id: match[1],
        action: ACTIONS[match[2]],
      })),
    );
    expect(new Set(all.map((item) => item.id)).size).toBe(all.length);
    for (const order of CURRICULUM.map((unit) => unit.order))
      expect(all.filter((item) => item.order === order).length, `unit ${order}`).toBeGreaterThanOrEqual(3);
    const inUse = [
      ...PILOT_CAPABILITIES.map((capability) => ({ order: 1, id: capability.id, action: capability.action })),
      ...[...STAGE_1, ...STAGE_2].flatMap((lesson) =>
        lesson.capabilities.map((capability) => ({
          order: CURRICULUM.find((unit) => unit.id === lesson.unitId)!.order,
          id: capability.id,
          action: capability.action,
        })),
      ),
    ];
    for (const capability of inUse) expect(all).toContainEqual(capability);
  });
});
