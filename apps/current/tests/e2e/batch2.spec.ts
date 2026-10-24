import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { openLesson, seedWorkspace } from "./seed";

/** Open the course map at a unit, with every unit before it reported complete. */
async function openCourseAt(page: Page, unitId: string) {
  await seedWorkspace(page, unitId, Number(unitId.slice(-2)) - 1);
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

test("Stage 3: the Unit 16 lesson plays the tune under the learner's chords, takes a report and opens Lantern", async ({
  page,
}) => {
  test.setTimeout(60_000);
  await page.setViewportSize({ width: 320, height: 720 });
  await openCourseAt(page, "unit-16");
  await openLesson(page, "Put it under the hands");
  await expect(page.getByRole("heading", { name: "Two endings" })).toBeVisible();
  await expect(page.getByText("Not yet checked on a guitar")).toBeVisible();
  await expect(
    page.getByText("While you play, a synthesised second guitar plays: The chords under the two phrases."),
  ).toBeVisible();
  await page.getByRole("button", { name: "Hear the exact music" }).click();
  await expect(page.getByText(/Count in: \d/)).toBeVisible();
  await page.getByRole("button", { name: "Stop sound" }).click();
  await page.getByRole("button", { name: "3 · Try unaided" }).click();
  await expect(page.getByRole("figure", { name: "Score: hidden during this check" })).toBeVisible();
  await page.getByRole("button", { name: "I played it without the app sound" }).click();
  await page.getByRole("textbox", { name: "One concrete observation" }).fill("Phrase one hung on A; two came home.");
  await page.getByRole("button", { name: "I could do it" }).click();
  await expect(page.getByText(/Your self-report was added/)).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(1);
  await page.getByRole("button", { name: "5 · Make it yours" }).click();
  await page.getByRole("button", { name: "Play it in Lantern →" }).click();
  await expect(page.getByRole("heading", { name: "Lantern", level: 1 })).toBeVisible();
  await expect(page.getByRole("heading", { name: "The melody" })).toBeVisible();
  await page.getByRole("button", { name: "Play along with the second guitar" }).click();
  await expect(page.getByText(/Count in: \d/)).toBeVisible();
  await page.getByRole("button", { name: "Stop sound" }).click();
});

test("Stage 4: the Unit 24 making check opens Create with the tune and links the report to the learner's version", async ({
  page,
}) => {
  test.setTimeout(90_000);
  await openCourseAt(page, "unit-24");
  await openLesson(page, "Make a small musical object");
  await expect(page.getByRole("heading", { name: "Chords under a tune" })).toBeVisible();
  await page.getByRole("button", { name: "3 · Try unaided" }).click();
  await expect(page.getByRole("figure", { name: "Score: Lantern's tune" })).toBeVisible();
  await expect(page.getByRole("button", { name: "I could do it" })).toBeDisabled();
  await page.getByRole("button", { name: "Make my version in Create →" }).click();
  await expect(page).toHaveURL(/\/create$/);
  await expect(page.getByRole("textbox", { name: "Sketch name" })).toHaveValue("Chords under a tune: my version");
  await expect(page.locator(".sketch-melody-events > div").first()).toBeVisible();
  await page.getByRole("combobox", { name: "Add chord" }).selectOption({ label: "I · G" });
  await expect(page.locator(".chord-events article")).toHaveCount(1);
  await page.getByRole("button", { name: /Return to the creative learning activity/ }).click();
  await expect(page.getByRole("heading", { name: "Chords under a tune" })).toBeVisible();
  await expect(
    page.getByText("Your version: “Chords under a tune: my version”, 1 chord. Report on it below."),
  ).toBeVisible();
  await page
    .getByRole("textbox", { name: "One concrete observation" })
    .fill("G under the first bar, the rest to come.");
  await page.getByRole("button", { name: "Partly there" }).click();
  await expect(page.getByText(/linked to the sketch you made/)).toBeVisible();
  await expect(page.locator('.save-indicator[data-status="saved"]:visible')).toBeVisible();
});

test("the Stage 3 and Stage 4 capstones open from the course map and play", async ({ page }) => {
  test.setTimeout(90_000);
  await openCourseAt(page, "unit-16");
  await page.getByRole("button", { name: "Open the capstone" }).click();
  await expect(page.getByRole("heading", { name: "Lantern", level: 1 })).toBeVisible();
  await expect(page.getByText("Stage 3 capstone · Melody")).toBeVisible();
  await expect(page.getByText(/write two bars that answer Lantern's first two bars/)).toBeVisible();
  await page.getByRole("button", { name: "Play along with the second guitar" }).click();
  await expect(page.getByText(/Your part · bar \d+ of 8/)).toBeVisible({ timeout: 10_000 });
  await page.getByRole("button", { name: "Stop sound" }).click();
  await page.getByRole("button", { name: "Close piece" }).click();

  await page
    .getByRole("navigation", { name: "Curriculum stages" })
    .getByRole("button", { name: /Stage 4 Triads and harmonic movement/ })
    .click();
  await page.getByRole("button", { name: "Open the capstone" }).click();
  await expect(page.getByRole("heading", { name: "Porch Light", level: 1 })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Melody over the thumb" })).toBeVisible();
  await expect(page.locator("p").filter({ hasText: "Demonstration video still needed" })).toContainText(
    "fingerpicking hand",
  );
  // Porch Light's capstone part is solo: thumb and melody together, no second guitar.
  await page.getByRole("button", { name: "Hear this part" }).click();
  await expect(page.getByText(/Count in: \d/)).toBeVisible();
  await page.getByRole("button", { name: "Stop sound" }).click();
});

test("the Unit 24 making check and the Stage 3 and 4 capstones, with the staff shown, meet automated WCAG 2.2 A and AA checks", async ({
  page,
}) => {
  test.setTimeout(120_000);
  await openCourseAt(page, "unit-24");
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
    await openLesson(page, "Make a small musical object");
    await expect(page.getByRole("heading", { name: "Chords under a tune" })).toBeVisible();
    await page.getByRole("button", { name: "3 · Try unaided" }).click();
    await scanDialog(page, `${theme} / Unit 24 making check`, failures);
    await page.getByRole("button", { name: "Close lesson" }).click();
    await page.getByRole("button", { name: "Open the capstone" }).click();
    await expect(page.getByRole("heading", { name: "Porch Light", level: 1 })).toBeVisible();
    await page.getByRole("checkbox", { name: "Show staff notation (optional)" }).check();
    await scanDialog(page, `${theme} / Porch Light capstone with staff`, failures);
    await page.getByRole("button", { name: "Close piece" }).click();
  }
  await page
    .getByRole("navigation", { name: "Curriculum stages" })
    .getByRole("button", { name: /Stage 3 Tonal hearing and melody/ })
    .click();
  await page.getByRole("button", { name: "Open the capstone" }).click();
  await expect(page.getByRole("heading", { name: "Lantern", level: 1 })).toBeVisible();
  await scanDialog(page, "dark / Lantern capstone", failures);
  expect(failures, failures.join("\n")).toEqual([]);
});
