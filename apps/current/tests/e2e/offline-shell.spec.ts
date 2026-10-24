import { expect, test } from "@playwright/test";
import { openLesson, seedWorkspace } from "./seed";

test.skip(!process.env.PWA_PREVIEW, "The offline shell needs the built production service worker.");

test("a selected unit reports its offline copy, with its stage's lessons, and reopens after a disconnected reload", async ({
  page,
  context,
}, testInfo) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Build freedom from sound, time and relationships." })).toBeVisible();
  const foregroundBytes = await page.evaluate(() =>
    [...performance.getEntriesByType("navigation"), ...performance.getEntriesByType("resource")].reduce(
      (sum, entry) => sum + (entry as PerformanceResourceTiming).transferSize,
      0,
    ),
  );
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByRole("button", { name: "Start your path" }).click();
  await page.evaluate(() => navigator.serviceWorker.ready);
  const cachedBytes = await page.evaluate(async () => {
    let bytes = 0;
    for (const name of await caches.keys()) {
      if (!name.includes("precache")) continue;
      const cache = await caches.open(name);
      for (const request of await cache.keys()) {
        bytes += (await (await cache.match(request))!.blob()).size;
      }
    }
    return bytes;
  });
  expect(cachedBytes).toBeGreaterThan(100 * 1024);
  expect(cachedBytes).toBeLessThan(1300 * 1024); // decision A16
  if (testInfo.project.name === "desktop-chromium") {
    console.log(
      `Local preview first-page transfer: ${foregroundBytes} bytes; installed precache: ${cachedBytes} bytes.`,
    );
  }
  await page.goto("/learn/course");
  await expect(
    page.getByText("Ready offline on this device · activities, full lessons and built-in sounds"),
  ).toBeVisible();

  await context.setOffline(true);
  await page.reload();
  await expect(page.getByRole("heading", { name: "See how your learning connects." })).toBeVisible();
  await expect(
    page.getByText("Ready offline on this device · activities, full lessons and built-in sounds"),
  ).toBeVisible();
  await page.locator(".activity-list li button").first().click();
  await expect(page.locator(".activity-header")).toBeVisible();
  await page.getByRole("button", { name: "Close activity" }).click();
  await page
    .locator(".activity-list li")
    .filter({ hasText: "Play a one-note question and answer" })
    .getByRole("button")
    .click();
  await expect(page.getByRole("heading", { name: "One-note question and answer" })).toBeVisible();
  await page.getByRole("button", { name: "Hear the exact phrase" }).click();
  await expect(page.getByText(/Count in:/)).toBeVisible();
  await page.getByRole("button", { name: "Stop sound" }).click();
  await page.getByRole("button", { name: "Close lesson" }).click();
  await page.locator(".primary-nav:visible, .mobile-nav:visible").getByRole("button", { name: /Play/ }).click();
  await expect(page.getByRole("heading", { name: "Put the guitar in your hands." })).toBeVisible();
  await page.getByRole("button", { name: "Start a mixed flow" }).click();
  await expect(page.getByText("Your one instruction")).toBeVisible();
});

test("a stage's lessons can be saved on request and open after a disconnected reload", async ({ page, context }) => {
  test.setTimeout(60_000);
  await seedWorkspace(page, "unit-10");
  await page.goto("/learn/course");
  await page.evaluate(() => navigator.serviceWorker.ready);
  // The app never claims an open page, so the shell serves it from the next load.
  await page.goto("/learn/course");
  const ready = page.getByText("Ready offline on this device · activities, full lessons and built-in sounds");
  // The stage the learner is working in is saved automatically while online.
  await expect(ready).toBeVisible({ timeout: 15_000 });
  const lessonFiles = () =>
    page.evaluate(async () => (await (await caches.open("interval-lessons")).keys()).map((request) => request.url));
  expect((await lessonFiles()).every((url) => /\/assets\/lesson-[^/]+\.(?:js|css)$/.test(url))).toBe(true);
  expect((await lessonFiles()).some((url) => /\/assets\/lesson-stage2-/.test(url))).toBe(true);
  // Precache holds no lesson files: they live only in the per-stage cache.
  const precached = await page.evaluate(async () => {
    const urls: string[] = [];
    for (const name of await caches.keys())
      if (name.includes("precache"))
        for (const request of await (await caches.open(name)).keys()) urls.push(request.url);
    return urls;
  });
  expect(precached.some((url) => url.includes("/assets/lesson-"))).toBe(false);

  // Without its saved lessons the stage says so and offers to save them.
  await page.evaluate(() => caches.delete("interval-lessons"));
  await page.evaluate(() => window.dispatchEvent(new Event("focus")));
  await expect(page.getByText("stage 2's full lessons are not saved on this device yet")).toBeVisible();
  await page.getByRole("button", { name: "Save this stage for offline" }).click();
  await expect(ready).toBeVisible();

  await context.setOffline(true);
  await page.reload();
  await expect(ready).toBeVisible();
  await openLesson(page, "Put it under the hands");
  await expect(page.getByRole("heading", { name: "One fret changes the third" })).toBeVisible();
  await expect(page.locator(".score-bar")).toHaveCount(2);
  await page.getByRole("button", { name: "Hear the exact music" }).click();
  await expect(page.getByText(/Count in: \d/)).toBeVisible();
  await page.getByRole("button", { name: "Stop sound" }).click();
  await page.getByRole("button", { name: "Close lesson" }).click();
});
