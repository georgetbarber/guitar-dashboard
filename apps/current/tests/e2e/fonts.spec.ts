import { expect, test } from "@playwright/test";

test("the intended fonts load from this app without changing the phone layout", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 640 });
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Build freedom from sound, time and relationships." })).toBeVisible();

  const fonts = await page.evaluate(async () => {
    await Promise.all([
      document.fonts.load('400 16px "DM Sans"'),
      document.fonts.load('800 16px "DM Sans"'),
      document.fonts.load('400 32px "Instrument Serif"')
    ]);
    await document.fonts.ready;
    return {
      faces: [...document.fonts].filter((face) => ["DM Sans", "Instrument Serif"].includes(face.family))
        .map((face) => ({ family: face.family, status: face.status })),
      body: getComputedStyle(document.body).fontFamily,
      heading: getComputedStyle(document.querySelector("h1")!).fontFamily,
      files: performance.getEntriesByType("resource")
        .filter((entry) => entry.name.includes(".woff2"))
        .map((entry) => ({ path: new URL(entry.name).pathname, origin: new URL(entry.name).origin })),
      origin: location.origin,
      overflow: document.documentElement.scrollWidth - innerWidth
    };
  });
  expect(fonts.faces).toEqual(expect.arrayContaining([
    { family: "DM Sans", status: "loaded" },
    { family: "Instrument Serif", status: "loaded" }
  ]));
  expect(fonts.body).toContain("DM Sans");
  expect(fonts.heading).toContain("Instrument Serif");
  expect(fonts.files.filter((file) => file.path.includes("dm-sans-latin-wght-normal"))).toHaveLength(1);
  expect(fonts.files.filter((file) => file.path.includes("instrument-serif-latin-400-normal"))).toHaveLength(1);
  expect(fonts.files.every((file) => file.origin === fonts.origin)).toBe(true);
  expect(fonts.overflow).toBeLessThanOrEqual(1);
});
