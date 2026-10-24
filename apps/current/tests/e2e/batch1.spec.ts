import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { openLesson, seedWorkspace } from "./seed";

async function openCourseAt(page: Page, unitId: string) {
  await seedWorkspace(page, unitId);
  await page.goto("/learn/course");
  await expect(page.getByRole("heading", { name: "See how your learning connects." })).toBeVisible();
}

async function scanDialog(page: Page, label: string, failures: string[]) {
  const result = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22a", "wcag22aa"])
    .include("dialog")
    .analyze();
  for (const violation of result.violations)
    failures.push(
      `${label}: ${violation.id}, ${violation.nodes
        .map((node) => node.target.join(" "))
        .slice(0, 3)
        .join(" | ")}`,
    );
}

test("Stage 1: the Unit 5 stabs lesson plays, hides its score for the check, records a report and keeps its place", async ({
  page,
}) => {
  test.setTimeout(60_000);
  await page.setViewportSize({ width: 320, height: 720 });
  await openCourseAt(page, "unit-05");
  await openLesson(page, "Place it in time");
  await expect(page.getByRole("heading", { name: "Stabs and space" })).toBeVisible();
  await expect(page.getByText("Not yet checked on a guitar")).toBeVisible();
  await expect(page.getByText(/Demonstration video still needed/)).toBeVisible();
  await page.getByRole("button", { name: "Hear the exact music" }).click();
  await expect(page.getByText(/Count in: \d/)).toBeVisible();
  await page.getByRole("button", { name: "Stop sound" }).click();
  await page.getByRole("button", { name: "3 · Try unaided" }).click();
  await expect(page.getByRole("figure", { name: "Score: hidden during this check" })).toBeVisible();
  await page.getByRole("button", { name: "I played it without the app sound" }).click();
  await page.getByRole("textbox", { name: "One concrete observation" }).fill("Second stab rang into the rest twice.");
  await page.getByRole("button", { name: "Partly there" }).click();
  await expect(page.getByText(/Your self-report was added/)).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(1);
  await expect(page.locator('.save-indicator[data-status="saved"]:visible')).toBeVisible();
  await page.reload();
  await expect(page.getByRole("heading", { name: "Stabs and space" })).toBeVisible();
  await expect(page.getByRole("button", { name: "3 · Try unaided" })).toHaveAttribute("aria-current", "step");
});

test("Stage 2: the Unit 9 lesson ends by opening the Low Road riff with its band", async ({ page }) => {
  test.setTimeout(60_000);
  await openCourseAt(page, "unit-09");
  await openLesson(page, "Put it under the hands");
  await expect(page.getByRole("heading", { name: "Root and fifth, anywhere" })).toBeVisible();
  await page.getByRole("button", { name: "3 · Try unaided" }).click();
  await page.getByRole("button", { name: "I played it without the app sound" }).click();
  await page.getByRole("textbox", { name: "One concrete observation" }).fill("Accents landed; C5 slid cleanly.");
  await page.getByRole("button", { name: "I could do it" }).click();
  await page.getByRole("button", { name: "5 · Make it yours" }).click();
  await page.getByRole("button", { name: "Play it in Low Road →" }).click();
  await expect(page.getByRole("heading", { name: "Low Road", level: 1 })).toBeVisible();
  await expect(page.getByRole("heading", { name: "The riff" })).toBeVisible();
  await page.getByRole("button", { name: "Play along with the second guitar" }).click();
  await expect(page.getByText(/Count in: \d/)).toBeVisible();
  await page.getByRole("button", { name: "Stop sound" }).click();
});

test("the Stage 1 and Stage 2 capstones open from the course map, play with the second guitar and take a report", async ({
  page,
}) => {
  test.setTimeout(90_000);
  await openCourseAt(page, "unit-06");
  await page.getByRole("button", { name: "Open the capstone" }).click();
  await expect(page.getByRole("heading", { name: "Front Step", level: 1 })).toBeVisible();
  await expect(page.getByText("Stage 1 capstone · Blues-rock")).toBeVisible();
  await expect(page.getByRole("list", { name: "Form" })).toContainText("Line 3 · B, A, E");
  await page.getByRole("button", { name: "Play along with the second guitar" }).click();
  await expect(page.getByText(/Your part · bar \d+ of 16/)).toBeVisible({ timeout: 10_000 });
  await page.getByRole("button", { name: "Stop sound" }).click();
  await page.getByRole("checkbox", { name: "Hide the tab" }).check();
  await expect(page.getByRole("figure", { name: "Score: hidden during this check" })).toBeVisible();
  await page.getByRole("button", { name: "I played it without the app sound" }).click();
  await page.getByRole("textbox", { name: "One concrete observation" }).fill("Kept my place; late on the last E.");
  await page.getByRole("button", { name: "I played it" }).click();
  await expect(page.getByText(/Your report was added/)).toBeVisible();
  await page.getByRole("button", { name: "Close piece" }).click();

  await page
    .getByRole("navigation", { name: "Curriculum stages" })
    .getByRole("button", { name: /Stage 2 Movable fretboard map/ })
    .click();
  await page.getByRole("button", { name: "Open the capstone" }).click();
  await expect(page.getByRole("heading", { name: "Low Road", level: 1 })).toBeVisible();
  await page.getByRole("button", { name: "The same piece from E · capstone" }).click();
  await expect(page.getByRole("heading", { name: "The same piece from E" })).toBeVisible();
  await page.getByRole("button", { name: "Hear everything" }).click();
  await expect(page.getByText(/Count in: \d/)).toBeVisible();
  await page.getByRole("button", { name: "Stop sound" }).click();
});

test("pieces are listed in Play and a favourite piece comes back in Continue", async ({ page }) => {
  await openCourseAt(page, "unit-03");
  await page.locator(".primary-nav:visible, .mobile-nav:visible").getByRole("button", { name: /Play/ }).click();
  await expect(page.getByRole("heading", { name: "Play a piece" })).toBeVisible();
  await page.getByRole("button", { name: "Open Low Road" }).click();
  await expect(page.getByRole("heading", { name: "Low Road", level: 1 })).toBeVisible();
  await page.getByRole("button", { name: "☆ Save as a familiar favourite" }).click();
  await page.getByRole("button", { name: "Close piece" }).click();
  await page.locator(".primary-nav:visible, .mobile-nav:visible").getByRole("button", { name: /Learn/ }).click();
  await page.getByRole("button", { name: /^Continue/ }).click();
  await expect(page.getByText("Favourite pieces")).toBeVisible();
  await page.locator(".familiar-favorites").getByRole("button", { name: "Low Road" }).click();
  await expect(page.getByRole("heading", { name: "Low Road", level: 1 })).toBeVisible();
});

test("the piece player and a Batch 1 lesson meet automated WCAG 2.2 A and AA checks in both themes", async ({
  page,
}) => {
  test.setTimeout(90_000);
  await openCourseAt(page, "unit-04");
  const failures: string[] = [];
  for (const theme of ["light", "dark"]) {
    if (theme === "dark") {
      await page
        .getByRole("button", { name: /settings and (?:data|sync)/i })
        .filter({ visible: true })
        .click();
      await page.getByRole("dialog").getByLabel("Theme").selectOption("dark");
      await page.getByRole("button", { name: "Close settings" }).click();
    }
    await openLesson(page, "Place it in time");
    await expect(page.getByRole("heading", { name: "The hand that never stops" })).toBeVisible();
    await scanDialog(page, `${theme} / Unit 4 lesson`, failures);
    await page.getByRole("button", { name: "Close lesson" }).click();
    await page.getByRole("button", { name: "Open the capstone" }).click();
    await expect(page.getByRole("heading", { name: "Front Step", level: 1 })).toBeVisible();
    await scanDialog(page, `${theme} / Front Step capstone`, failures);
    await page.getByRole("button", { name: "Close piece" }).click();
  }
  expect(failures, failures.join("\n")).toEqual([]);
});
