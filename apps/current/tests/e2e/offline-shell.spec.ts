import { expect, test } from "@playwright/test";

test.skip(!process.env.PWA_PREVIEW, "The offline shell needs the built production service worker.");

test("a selected unit reports its offline copy and reopens after a disconnected reload", async ({
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
  expect(cachedBytes).toBeLessThan(1280 * 1024);
  if (testInfo.project.name === "desktop-chromium") {
    console.log(
      `Local preview first-page transfer: ${foregroundBytes} bytes; installed precache: ${cachedBytes} bytes.`,
    );
  }
  await page.goto("/learn/course");
  await expect(page.getByText("Ready offline on this device · activities and built-in sounds")).toBeVisible();

  await context.setOffline(true);
  await page.reload();
  await expect(page.getByRole("heading", { name: "See how your learning connects." })).toBeVisible();
  await expect(page.getByText("Ready offline on this device · activities and built-in sounds")).toBeVisible();
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
});
