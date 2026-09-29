import { expect, test } from "@playwright/test";

test("the intended fonts load from this app without changing the phone layout", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 640 });
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Build freedom from sound, time and relationships." })).toBeVisible();

  const families = ["Newsreader", "Libre Caslon Display", "IBM Plex Mono"];
  const fonts = await page.evaluate(async (families) => {
    await Promise.all([
      document.fonts.load('400 16px "Newsreader"'),
      document.fonts.load('400 32px "Libre Caslon Display"'),
      document.fonts.load('750 12px "IBM Plex Mono"')
    ]);
    await document.fonts.ready;
    return {
      faces: [...document.fonts].filter((face) => families.includes(face.family) && face.status === "loaded")
        .map((face) => face.family),
      body: getComputedStyle(document.body).fontFamily,
      heading: getComputedStyle(document.querySelector("h1")!).fontFamily,
      button: getComputedStyle(document.querySelector(".primary-action")!).fontFamily,
      files: performance.getEntriesByType("resource")
        .filter((entry) => entry.name.includes(".woff2"))
        .map((entry) => ({ path: new URL(entry.name).pathname, origin: new URL(entry.name).origin })),
      origin: location.origin,
      overflow: document.documentElement.scrollWidth - innerWidth
    };
  }, families);
  expect(new Set(fonts.faces)).toEqual(new Set(families));
  expect(fonts.body).toContain("Newsreader");
  expect(fonts.heading).toContain("Libre Caslon Display");
  expect(fonts.button).toContain("IBM Plex Mono");
  for (const file of ["newsreader", "libre-caslon-display", "ibm-plex-mono-700"]) {
    expect(fonts.files.filter((entry) => entry.path.includes(file) && !entry.path.includes("italic"))).toHaveLength(1);
  }
  expect(fonts.files.every((file) => file.origin === fonts.origin)).toBe(true);
  expect(fonts.overflow).toBeLessThanOrEqual(1);
});
