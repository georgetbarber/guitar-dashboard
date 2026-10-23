import AxeBuilder from "@axe-core/playwright";
import { readFile } from "node:fs/promises";
import { expect, test, type Page } from "@playwright/test";

async function startLearning(page: Page) {
  await page.goto("/");
  const welcome = page.getByRole("heading", { name: "Build freedom from sound, time and relationships." });
  const home = page.getByRole("heading", { name: "Turn one relationship into music." });
  await expect(welcome.or(home)).toBeVisible();
  if (await welcome.isVisible()) {
    await page.getByRole("button", { name: "Continue" }).click();
    await page.getByRole("button", { name: "Continue" }).click();
    await page.getByRole("button", { name: "Start your path" }).click();
  }
  await expect(home).toBeVisible();
}

async function expectAccessible(page: Page, label: string) {
  const result = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22a", "wcag22aa"])
    .include("dialog")
    .analyze();
  expect(
    result.violations.map((violation) => `${label}: ${violation.id} ${violation.nodes[0]?.target.join(" ")}`),
  ).toEqual([]);
}

const noSidewaysScroll = (page: Page) => page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);

test("leaves a note from a lesson, finds it in Feedback, exports it and marks it dealt with", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 760 });
  await startLearning(page);
  await page.getByRole("button", { name: /(?:Start|Continue) the one-note lesson/ }).click();
  await expect(page.getByText("Not yet checked on a guitar")).toBeVisible();
  await page.getByRole("button", { name: "Something's wrong here" }).click();
  const note = page.getByRole("dialog", { name: "Leave a note about this" });
  await expect(note.getByText(/Step 1 · Learn it/)).toBeVisible();
  await expectAccessible(page, "note dialog");
  await note
    .getByRole("textbox", { name: "What is wrong, or what did you expect?" })
    .fill("The second bar's rest feels rushed at 60 BPM.");
  await note.getByRole("radio", { name: "Confusing" }).check();
  expect(await noSidewaysScroll(page)).toBeLessThanOrEqual(1);
  await note.getByRole("button", { name: "Save note" }).click();
  await expect(page.getByText("Note saved. Find it in Settings › Feedback.")).toBeVisible();
  await page.getByRole("button", { name: "Close lesson" }).click();

  // A note is not practice: nothing in the course moves.
  await page
    .getByRole("navigation", { name: "Learn views" })
    .getByRole("button", { name: /Course map/ })
    .click();
  await expect(page.locator(".path-total strong")).toHaveText("0");

  await page
    .getByRole("button", { name: /settings and (?:data|sync)/i })
    .filter({ visible: true })
    .click();
  await page.getByRole("button", { name: "Feedback · 1 open" }).click();
  await expect(page.getByText("The second bar's rest feels rushed at 60 BPM.")).toBeVisible();
  await expectAccessible(page, "feedback view");
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download Markdown" }).click();
  const download = await downloadPromise;
  const markdown = await readFile((await download.path())!, "utf8");
  expect(markdown).toContain("> The second bar's rest feels rushed at 60 BPM.");
  expect(markdown).toContain("- **Content:** `one-note-qa-episode` version 1");
  await page.getByRole("button", { name: "Mark as dealt with" }).click();
  await expect(page.getByText("Every note has been dealt with.")).toBeVisible();
  await page.reload();
  await page
    .getByRole("button", { name: /settings and (?:data|sync)/i })
    .filter({ visible: true })
    .click();
  await expect(page.getByRole("button", { name: "Feedback · 0 open" })).toBeVisible();
});

test("ticks a thing to check and marks a lesson as checked, and both survive a reload", async ({ page }) => {
  await startLearning(page);
  await page
    .getByRole("button", { name: /settings and (?:data|sync)/i })
    .filter({ visible: true })
    .click();
  await page.getByRole("button", { name: /Things to check · 0 ticked/ }).click();
  await expectAccessible(page, "checks view");
  await page.getByRole("checkbox", { name: "Keep a backup of your current data" }).check();
  await expect(page.getByText(/^1 of \d+ ticked/)).toBeVisible();
  await page.getByRole("button", { name: "Close settings" }).click();

  await page.getByRole("button", { name: /(?:Start|Continue) the one-note lesson/ }).click();
  await page.getByRole("button", { name: "Mark as checked" }).click();
  await page.getByRole("textbox", { name: "Checked by" }).fill("George");
  await page.getByRole("button", { name: "Save check" }).click();
  await expect(page.getByText(/^Checked by George ·/)).toBeVisible();
  await expect(page.locator('.save-indicator[data-status="saved"]:visible')).toBeVisible();

  await page.reload();
  await expect(page.getByText(/^Checked by George ·/)).toBeVisible();
  await page.getByRole("button", { name: "Close lesson" }).click();
  await page
    .getByRole("button", { name: /settings and (?:data|sync)/i })
    .filter({ visible: true })
    .click();
  await expect(page.getByRole("button", { name: /Things to check · 1 ticked/ })).toBeVisible();
});
