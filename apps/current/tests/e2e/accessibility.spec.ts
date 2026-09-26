import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

function contrast(first: string, second: string) {
  const channels = (color: string) => color.startsWith("#")
    ? [1, 3, 5].map((index) => parseInt(color.slice(index, index + 2), 16))
    : (color.match(/[\d.]+/g) ?? []).slice(0, 3).map(Number);
  const luminance = (color: string) => channels(color)
    .map((value) => value / 255)
    .map((value) => value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4)
    .reduce((sum, value, index) => sum + value * [0.2126, 0.7152, 0.0722][index], 0);
  const [lighter, darker] = [luminance(first), luminance(second)].sort((a, b) => b - a);
  return (lighter + 0.05) / (darker + 0.05);
}

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

test("core learning screens and dialogs meet automated WCAG 2.2 A and AA checks in both themes", async ({ page }) => {
  const failures: string[] = [];
  const nav = () => page.locator(".primary-sidebar nav:visible, .mobile-nav:visible");
  const scan = async (theme: string, screen: string, dialog = false) => {
    let builder = new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22a", "wcag22aa"]);
    if (dialog) builder = builder.include("dialog");
    const result = await builder.analyze();
    for (const violation of result.violations) {
      failures.push(`${theme} / ${screen}: ${violation.id} (${violation.impact}), ${violation.nodes.length} nodes; first: ${violation.nodes.slice(0, 5).map((node) => `${node.target.join(" ")} ${node.failureSummary ?? ""}`).join(" | ")}`);
    }
  };

  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Build freedom from sound, time and relationships." })).toBeVisible();
  await scan("light", "Onboarding");
  await startLearning(page);
  for (const theme of ["light", "dark"]) {
    if (theme === "dark") {
      await page.getByRole("button", { name: /settings and (?:data|sync)/i }).filter({ visible: true }).click();
      await page.getByRole("dialog").getByLabel("Theme").selectOption("dark");
      await page.getByRole("button", { name: "Close settings" }).click();
    }
    await scan(theme, "Continue");
    await page.getByRole("navigation", { name: "Learn views" }).getByRole("button", { name: /Course map/ }).click();
    await scan(theme, "Course map");
    await page.getByRole("navigation", { name: "Learn views" }).getByRole("button", { name: /Strengthen/ }).click();
    await scan(theme, "Strengthen");
    await nav().getByRole("button", { name: /Play/ }).click();
    await scan(theme, "Play");
    await page.getByRole("button", { name: "Start a mixed flow" }).click();
    await scan(theme, "Play flow");
    await page.getByRole("button", { name: /Leave the flow/ }).click();
    await nav().getByRole("button", { name: /Create/ }).click();
    await scan(theme, "Create");
    const firstSketch = page.getByRole("button", { name: "Start your first sketch" });
    if (await firstSketch.isVisible()) await firstSketch.click();
    await scan(theme, "Create sketch");
    await nav().getByRole("button", { name: /Explore/ }).click();
    await scan(theme, "Explore");
    await page.getByRole("button", { name: /settings and (?:data|sync)/i }).filter({ visible: true }).click();
    await scan(theme, "Settings dialog", true);
    await page.getByRole("button", { name: "Close settings" }).click();
    await nav().getByRole("button", { name: /Learn/ }).click();
    await page.getByRole("button", { name: /Start with:/ }).click();
    await scan(theme, "Activity dialog", true);
    await page.getByRole("button", { name: "Close activity" }).click();
    await page.getByRole("button", { name: /(?:Start|Continue) the one-note lesson/ }).click();
    await scan(theme, "Pilot lesson dialog", true);
    await page.getByRole("button", { name: "Close lesson" }).click();
  }
  expect(failures, failures.join("\n")).toEqual([]);
});

test("phone navigation, save status and motion control remain readable and keyboard-visible", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await startLearning(page);
  const nav = page.getByRole("navigation", { name: "Mobile learning navigation" });
  const status = page.locator(".mobile-topbar .save-indicator");
  for (const theme of ["light", "dark"]) {
    const sizes = await page.evaluate(() => ({
      labels: [...document.querySelectorAll(".mobile-nav span")].map((node) => parseFloat(getComputedStyle(node).fontSize)),
      save: parseFloat(getComputedStyle(document.querySelector(".mobile-topbar .save-indicator")!).fontSize)
    }));
    expect(sizes.labels.every((size) => size >= 12), `${theme}: bottom navigation labels`).toBe(true);
    expect(sizes.save, `${theme}: local save status`).toBeGreaterThanOrEqual(12);
    await expect(status).toBeVisible();

    await page.keyboard.press("Tab");
    const learn = nav.getByRole("button", { name: /Learn/ });
    await learn.focus();
    const ring = await learn.evaluate((button) => {
      const style = getComputedStyle(button);
      return { width: style.outlineWidth, style: style.outlineStyle, color: style.outlineColor, surface: getComputedStyle(document.documentElement).getPropertyValue("--night").trim() };
    });
    expect(ring, `${theme}: mobile navigation focus ring`).toMatchObject({ width: "3px", style: "solid" });
    expect(contrast(ring.color, ring.surface), `${theme}: focus ring contrast`).toBeGreaterThanOrEqual(3);

    await page.getByRole("button", { name: "Open settings and data" }).click();
    const settings = page.getByRole("dialog");
    const motion = settings.getByRole("checkbox", { name: "Reduce interface motion" });
    const themeSelect = settings.getByLabel("Theme");
    const box = await motion.boundingBox();
    expect(box?.width, `${theme}: motion checkbox width`).toBeGreaterThanOrEqual(18);
    expect(box?.width, `${theme}: motion checkbox should not fill its row`).toBeLessThan(30);
    const control = await themeSelect.evaluate((select) => {
      const style = getComputedStyle(select);
      return { border: style.borderColor, background: style.backgroundColor };
    });
    expect(contrast(control.border, control.background), `${theme}: form control border contrast`).toBeGreaterThanOrEqual(3);
    if (theme === "light") await themeSelect.selectOption("dark");
    await settings.getByRole("button", { name: "Close settings" }).click();
  }
});
