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

test("Stage 5: the Unit 30 listening check plays hidden examples, marks each answer and keeps the result", async ({
  page,
}) => {
  test.setTimeout(90_000);
  await page.setViewportSize({ width: 320, height: 720 });
  await openCourseAt(page, "unit-30");
  await openLesson(page, "Hear and compare your attempts");
  await expect(page.getByRole("heading", { name: "Three feels, one motif" })).toBeVisible();
  await page.getByRole("button", { name: "3 · Try unaided" }).click();
  await expect(page.getByRole("figure", { name: /^Score/ })).toHaveCount(0);
  for (let example = 1; example <= 4; example++) {
    await expect(page.getByText(`Example ${example} of 4`)).toBeVisible();
    await page.getByRole("button", { name: `Hear example ${example}`, exact: true }).click();
    await expect(page.getByText(/Count in: \d|Reference · count/)).toBeVisible();
    await page.getByRole("radio", { name: "Shuffle, as in blues" }).check();
    await page.getByRole("button", { name: "Check my answer" }).click();
    await expect(page.locator(".listening-check__result")).toContainText(/Right\.|Not this time/);
    if (example < 4) await page.getByRole("button", { name: "Next example →" }).click();
  }
  await expect(page.getByText(/You named \d of 4 correctly/)).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(1);
  await expect(page.locator('.save-indicator[data-status="saved"]:visible')).toBeVisible();
});

test("Stage 6: the Unit 33 lesson ends in Front Step's shuffle chords with the boogie under them", async ({ page }) => {
  test.setTimeout(60_000);
  await openCourseAt(page, "unit-33");
  await openLesson(page, "Put it under the hands");
  await expect(page.getByRole("heading", { name: "Blues sevenths, major and minor" })).toBeVisible();
  await expect(page.getByText(/a synthesised second guitar plays: The second guitar's boogie, line 1/)).toBeVisible();
  await page.getByRole("button", { name: "3 · Try unaided" }).click();
  await page.getByRole("button", { name: "I played it without the app sound" }).click();
  await page.getByRole("textbox", { name: "One concrete observation" }).fill("A7 landed on 1 every time in line 1.");
  await page.getByRole("button", { name: "I could do it" }).click();
  await page.getByRole("button", { name: "5 · Make it yours" }).click();
  await page.getByRole("button", { name: "Play it in Front Step →" }).click();
  await expect(page.getByRole("heading", { name: "Front Step", level: 1 })).toBeVisible();
  await expect(page.getByRole("heading", { name: "E7, A7 and B7 in shuffle" })).toBeVisible();
  await page.getByRole("button", { name: "Play along with the second guitar" }).click();
  await expect(page.getByText(/Count in: \d/)).toBeVisible();
  await page.getByRole("button", { name: "Stop sound" }).click();
});

test("the Stage 5 and Stage 6 capstones open from the course map and play", async ({ page }) => {
  test.setTimeout(90_000);
  await openCourseAt(page, "unit-30");
  await page.getByRole("button", { name: "Open the capstone" }).click();
  await expect(page.getByRole("heading", { name: "Night Market", level: 1 })).toBeVisible();
  await expect(page.getByText("Stage 5 capstone · Soul and funk")).toBeVisible();
  await expect(page.getByRole("list", { name: "Form" })).toContainText("Break · the band stops");
  await page.getByRole("button", { name: "Play along with the second guitar" }).click();
  await expect(page.getByText(/Your part · bar \d+ of 8/)).toBeVisible({ timeout: 10_000 });
  await page.getByRole("button", { name: "Stop sound" }).click();
  await page.getByRole("button", { name: "Close piece" }).click();

  await page
    .getByRole("navigation", { name: "Curriculum stages" })
    .getByRole("button", { name: /Stage 6 Functional and modal harmony/ })
    .click();
  await page.getByRole("button", { name: "Open the capstone" }).click();
  await expect(page.getByRole("heading", { name: "Front Step", level: 1 })).toBeVisible();
  await expect(page.getByText("Stage 6 capstone · Blues-rock")).toBeVisible();
  await page.getByRole("button", { name: "A solo chorus · capstone" }).click();
  await expect(page.getByText(/Demonstration video still needed/)).toBeVisible();
  await page.getByRole("button", { name: "Hear everything" }).click();
  await expect(page.getByText(/Count in: \d/)).toBeVisible();
  await page.getByRole("button", { name: "Stop sound" }).click();
});

test("the listening check, the Night Market capstone and Glasshouse meet automated WCAG 2.2 A and AA checks", async ({
  page,
}) => {
  test.setTimeout(120_000);
  await openCourseAt(page, "unit-30");
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
    await openLesson(page, "Hear and compare your attempts");
    await page.getByRole("button", { name: "3 · Try unaided" }).click();
    await page.getByRole("button", { name: "Hear example 1", exact: true }).click();
    await page.getByRole("radio", { name: "Straight eighths, as in rock" }).check();
    await page.getByRole("button", { name: "Check my answer" }).click();
    await scanDialog(page, `${theme} / Unit 30 listening check`, failures);
    await page.getByRole("button", { name: "Close lesson" }).click();
    await page.getByRole("button", { name: "Open the capstone" }).click();
    await expect(page.getByRole("heading", { name: "Night Market", level: 1 })).toBeVisible();
    await scanDialog(page, `${theme} / Night Market capstone`, failures);
    await page.getByRole("button", { name: "Close piece" }).click();
  }
  await page.locator(".primary-nav:visible, .mobile-nav:visible").getByRole("button", { name: /Play/ }).click();
  await page.getByRole("button", { name: "Open Glasshouse" }).click();
  await expect(page.getByRole("heading", { name: "Glasshouse", level: 1 })).toBeVisible();
  await scanDialog(page, "dark / Glasshouse", failures);
  expect(failures, failures.join("\n")).toEqual([]);
});
