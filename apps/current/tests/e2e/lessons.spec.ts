import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { openLesson, seedWorkspace } from "./seed";

async function openCourseAt(page: Page, unitId: string) {
  await seedWorkspace(page, unitId);
  await page.goto("/learn/course");
  await expect(page.getByRole("heading", { name: "See how your learning connects." })).toBeVisible();
}

test("plays, repairs and checks the authored C-to-Am lesson at phone width, and keeps its place", async ({ page }) => {
  test.setTimeout(60_000);
  await page.setViewportSize({ width: 320, height: 720 });
  await openCourseAt(page, "unit-06");
  await openLesson(page, "Place it in time");
  await expect(page.getByRole("heading", { name: "Keep what stays: C to Am" })).toBeVisible();
  await expect(page.getByText("Not yet checked on a guitar")).toBeVisible();
  await expect(
    page.getByRole("img", { name: /^C chord shape: low E not played; A fret 3, ring finger/ }),
  ).toBeVisible();
  await expect(page.getByRole("img", { name: /^Am chord shape/ })).toBeVisible();
  await expect(page.getByText(/Only the ring finger moves/)).toBeVisible();

  await page.getByRole("button", { name: "Hear the exact music" }).click();
  await expect(page.getByText(/Count in: \d/)).toBeVisible();
  await expect(page.locator(".score-row--string .is-sounding").first()).toBeVisible({ timeout: 8000 });
  await expect(page.locator(".chord-diagram.is-sounding figcaption")).toHaveText("C");
  await page.getByRole("button", { name: "Stop sound" }).click();

  await page.getByRole("button", { name: "2 · Practise it" }).click();
  await page.getByRole("button", { name: "Two counts each" }).click();
  await expect(page.getByText(/twice as often/)).toBeVisible();
  await page.getByRole("button", { name: "The change stops my pulse." }).click();
  await expect(page.getByRole("heading", { name: "The change stops my pulse." })).toBeVisible();
  await expect(page.getByText("Tempo · 40 BPM")).toBeVisible();
  await page.getByRole("button", { name: "Return to the whole study →" }).click();

  await page.getByRole("button", { name: "3 · Try unaided" }).click();
  await expect(page.getByRole("figure", { name: "Score: hidden during this check" })).toBeVisible();
  await expect(page.getByRole("img", { name: /chord shape/ })).toHaveCount(0);
  await page.getByRole("button", { name: "Count in, then I play" }).click();
  await expect(page.getByText(/Your turn · count/)).toBeVisible({ timeout: 8000 });
  await expect(page.locator(".score-row .is-sounding")).toHaveCount(0);
  await page.getByRole("button", { name: "Stop sound" }).click();
  await page.getByRole("button", { name: "I played it without the app sound" }).click();
  await page
    .getByRole("textbox", { name: "One concrete observation" })
    .fill("Am arrived on count one; the change to C was late once.");
  await page.getByRole("button", { name: "Partly there" }).click();
  await expect(page.getByText(/Your self-report was added/)).toBeVisible();
  await expect(page.getByRole("button", { name: "4 · Move it" })).toBeDisabled();
  expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(1);

  await expect(page.locator('.save-indicator[data-status="saved"]:visible')).toBeVisible();
  await page.reload();
  await expect(page.getByRole("heading", { name: "Keep what stays: C to Am" })).toBeVisible();
  await expect(page.getByRole("button", { name: "3 · Try unaided" })).toHaveAttribute("aria-current", "step");
  await expect(page.getByText("1 reported attempt on this device.")).toBeVisible();
});

test("the third-colour lesson shows exact frets, plays one section, and reveals a hidden check on request", async ({
  page,
}) => {
  await openCourseAt(page, "unit-10");
  await openLesson(page, "Put it under the hands");
  await expect(page.getByRole("heading", { name: "One fret changes the third" })).toBeVisible();
  const bars = page.locator(".score-bar");
  await expect(bars).toHaveCount(2);
  await expect(bars.first()).toHaveAttribute("aria-label", /2: high E string fret 3 \(G\)/);
  await expect(bars.last()).toHaveAttribute("aria-label", /2: high E string fret 4 \(G#\)/);
  await page.getByRole("button", { name: "2 · Practise it" }).click();
  await page.getByRole("combobox", { name: /^Play/ }).selectOption("major");
  await expect(bars).toHaveCount(1);
  await expect(bars.first()).toHaveAttribute("aria-label", /Bar 2, Major third/);
  await page.getByRole("button", { name: "3 · Try unaided" }).click();
  await expect(page.getByRole("figure", { name: "Score: hidden during this check" })).toBeVisible();
  await page.getByRole("button", { name: "Show the notes to help me" }).click();
  await expect(page.getByRole("figure", { name: "Score: The same thirds in reverse order" })).toBeVisible();
  await expect(page.getByText(/recorded as assisted/)).toBeVisible();
});

test("authored lesson screens meet automated WCAG 2.2 A and AA checks in both themes", async ({ page }) => {
  test.setTimeout(60_000);
  await openCourseAt(page, "unit-06");
  const failures: string[] = [];
  const scan = async (label: string) => {
    const result = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22a", "wcag22aa"])
      .include("dialog")
      .analyze();
    for (const violation of result.violations)
      failures.push(
        `${label}: ${violation.id}, ${violation.nodes.length} nodes; ${violation.nodes
          .slice(0, 3)
          .map((node) => node.target.join(" "))
          .join(" | ")}`,
      );
  };
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
    await expect(page.getByRole("heading", { name: "Keep what stays: C to Am" })).toBeVisible();
    await scan(`${theme} / learn`);
    await page.getByRole("button", { name: "2 · Practise it" }).click();
    await scan(`${theme} / practise`);
    await page.getByRole("button", { name: "3 · Try unaided" }).click();
    await scan(`${theme} / try unaided`);
    await page.getByRole("button", { name: "Close lesson" }).click();
  }
  expect(failures, failures.join("\n")).toEqual([]);
});
