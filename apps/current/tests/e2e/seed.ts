import type { Page } from "@playwright/test";
import { CURRICULUM } from "../../src/v8/curriculum";

/**
 * A learner who has reported units 1 to `completeThrough` (9 by default)
 * complete, so the lessons after them are open. Seeded as the device's
 * compatibility copy, which the app reads when its database is empty.
 */
export function seededWorkspace(activeUnitId: string, completeThrough = 9) {
  const occurredAt = "2026-10-01T09:00:00.000Z";
  const evidence = CURRICULUM.filter((unit) => unit.order <= completeThrough).flatMap((unit) =>
    unit.activities.map((activity) => ({
      id: `seed-${activity.id}`,
      competencyId: activity.competencyIds[0],
      activityId: activity.id,
      source: activity.source,
      assistance: "none",
      outcome: "successful",
      occurredAt,
      localDate: "2026-10-01",
      method: "self-reported",
      context: {},
    })),
  );
  return {
    version: 8,
    syncVersion: 1,
    updatedAt: occurredAt,
    settingsUpdatedAt: occurredAt,
    route: "path",
    activeUnitId,
    activeActivityId: null,
    resumeActivityId: null,
    completedActivityIds: [],
    evidence,
    settings: {
      instrument: "acoustic",
      dailyMinutes: 25,
      tonicName: "C",
      mode: "major",
      theme: "light",
      reducedMotion: false,
      diagnosticComplete: true,
      startingBaseline: "repair",
    },
    sketches: [],
    deletedSketchIds: {},
    activeSketchId: null,
    lastReflection: "",
  };
}

/** Seed the workspace once per test (a reload keeps what the app saved since). */
export async function seedWorkspace(page: Page, activeUnitId: string, completeThrough = 9) {
  await page.addInitScript(
    (workspace) => {
      if (sessionStorage.getItem("seeded")) return;
      sessionStorage.setItem("seeded", "1");
      localStorage.setItem("guitar-academy-v8-fallback:anonymous", JSON.stringify(workspace));
    },
    seededWorkspace(activeUnitId, completeThrough),
  );
}

/** Open an activity row that has an authored lesson. */
export async function openLesson(page: Page, activityTitle: string) {
  await page
    .locator(".activity-list li")
    .filter({ hasText: activityTitle })
    .filter({ hasText: "full lesson" })
    .getByRole("button")
    .click();
}
