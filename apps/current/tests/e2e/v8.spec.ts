import { expect, test, type Page } from "@playwright/test";

async function completeDiagnostic(page: Page) {
  await page.goto("/");
  await expect(page).toHaveTitle("Guitar Academy V8");
  if (await page.getByRole("heading", { name: "Build freedom from sound, time and relationships." }).count()) {
    await page.getByRole("button", { name: "Continue" }).click();
    await page.getByRole("button", { name: "Continue" }).click();
    await page.getByRole("button", { name: "Start your path" }).click();
  }
  await expect(page.getByRole("heading", { name: "Turn one relationship into music." })).toBeVisible();
}

function learningNav(page: Page) {
  return page.locator(".primary-sidebar nav:visible, .mobile-nav:visible");
}

function learnViews(page: Page) {
  return page.getByRole("navigation", { name: "Learn views" });
}

test("first launch explains the learning contract before entering the app", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Build freedom from sound, time and relationships." })).toBeVisible();
  await expect(page.getByText("48 connected units", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByRole("button", { name: /Acoustic/ }).click();
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByRole("button", { name: /Skip the basics/ }).click();
    await page.getByRole("button", { name: "Start your path" }).click();
  await expect(page.getByText("acoustic", { exact: true }).first()).toBeVisible();
});

test("navigates four distinct destinations and three nested Learn views with real URL history", async ({ page }) => {
  await completeDiagnostic(page);
  const nav = learningNav(page);
  await expect(nav.getByRole("button")).toHaveCount(4);
  for (const [label, path] of [["Course map", "/learn/course"], ["Strengthen", "/learn/strengthen"], ["Continue", "/learn"]]) {
    await learnViews(page).getByRole("button", { name: new RegExp(label) }).click();
    await expect(page).toHaveURL(new RegExp(`${path}$`));
  }
  for (const [label, path] of [["Play", "/play"], ["Create", "/create"], ["Explore", "/explore"], ["Learn", "/learn"]]) {
    await nav.getByRole("button", { name: new RegExp(label) }).click();
    await expect(page).toHaveURL(new RegExp(`${path}$`));
  }
  await page.goBack();
  await expect(page).toHaveURL(/\/explore$/);
});

test("migrates legacy learning URLs into the canonical Learn structure", async ({ page }) => {
  await completeDiagnostic(page);
  for (const [legacy, canonical] of [["/today", "/learn"], ["/path", "/learn/course"], ["/practice", "/learn/strengthen"]]) {
    await page.goto(legacy);
    await expect(page).toHaveURL(new RegExp(`${canonical}$`));
  }
});

test("makes the course hierarchy explicit and keeps later activity detail folded away", async ({ page }) => {
  await completeDiagnostic(page);
  const location = page.locator('[aria-label="Current course location"]');
  await expect(location).toContainText("Stage 1 of 8");
  await expect(location).toContainText("Current unit · 1 of 6");
  await expect(location).toContainText("Your musical baseline");

  await learnViews(page).getByRole("button", { name: /Course map/ }).click();
  await expect(page.locator(".stage-list > button").first()).toContainText("Stage 1");
  await expect(page.locator(".unit-card").first().locator(".unit-status")).toContainText("Current");
  await expect(page.locator(".activity-list li").first().locator("button > span")).toHaveText("Listen");

  await page.locator(".stage-list > button").nth(2).click();
  await expect(page.getByText("Preview only", { exact: true })).toBeVisible();
  await expect(page.locator(".activity-list li")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Return to current unit" })).toBeVisible();
});

test("runs an ability-matched prompted free-play flow without scoring it", async ({ page }) => {
  await completeDiagnostic(page);
  await learningNav(page).getByRole("button", { name: /Play/ }).click();
  await expect(page.getByRole("heading", { name: "Put the guitar in your hands." })).toBeVisible();
  await expect(page.getByRole("button", { name: "Play Groove keeper" })).toBeEnabled();
  await expect(page.getByRole("button", { name: "Play Riff echo" })).toBeEnabled();
  await expect(page.getByRole("button", { name: "Build this relationship in Learn" }).first()).toBeDisabled();
  await page.getByRole("button", { name: "Start a mixed flow" }).click();
  await expect(page.getByText("Your one instruction")).toBeVisible();
  await expect(page.getByText(/There is no right response to submit/)).toBeVisible();
  await page.getByRole("button", { name: "Hand cue" }).click();
  await expect(page.getByText("Connect it to the hand")).toBeVisible();
  await page.getByRole("button", { name: /Played it — keep flowing/ }).click();
  await expect(page.getByLabel(/Prompt 2 of 8/)).toBeVisible();
});

test("keeps local learning and Free Play available when the connection drops", async ({ page, context }) => {
  await completeDiagnostic(page);
  await context.setOffline(true);
  await expect(page.getByRole("status").filter({ hasText: "Working offline" })).toBeVisible();
  await learningNav(page).getByRole("button", { name: /Play/ }).click();
  await expect(page.getByRole("heading", { name: "Put the guitar in your hands." })).toBeVisible();
  await page.getByRole("button", { name: "Start a mixed flow" }).click();
  await expect(page.getByText("Your one instruction")).toBeVisible();
  await context.setOffline(false);
});

test("waits for real learning evidence before suggesting Strengthen work", async ({ page }) => {
  await completeDiagnostic(page);
  await learnViews(page).getByRole("button", { name: /Strengthen/ }).click();
  await expect(page.getByRole("heading", { name: "Nothing to strengthen yet." })).toBeVisible();
  await expect(page.getByRole("button", { name: "Go to Continue" })).toBeVisible();
  await expect(page.getByRole("navigation", { name: "Skill focuses" })).toHaveCount(0);
});

test("records hints separately from independent learning evidence", async ({ page }) => {
  await completeDiagnostic(page);
  await page.getByRole("button", { name: /Start with:/ }).click();
  await expect(page.locator(".activity-header > div > span")).toContainText("Guided session");
  await page.getByRole("button", { name: "Use a hint" }).click();
  await page.getByRole("button", { name: /Hear (?:reference and target|the tonic reference)/ }).click();
  await page.getByRole("button", { name: "Successful today" }).click();
  await page.getByRole("button", { name: "Stop here for now" }).click();
  await learnViews(page).getByRole("button", { name: /Strengthen/ }).click();
  await expect(page.getByRole("region", { name: "Skill focuses" }).getByRole("button")).toHaveCount(8);
  await expect(page.locator(".recommendation-reason")).toContainText("assisted attempt");
  await expect(page.locator(".recommendation-context")).toContainText("Stage 1");
  await expect(page.getByText(/assisted attempt.*kept separate/).first()).toBeVisible();
  await expect(page.getByText("secure", { exact: true })).toHaveCount(0);
  await page.getByRole("button", { name: "Start strengthening" }).click();
  await expect(page.locator(".activity-header > div > span")).toContainText("Strengthen");
  await page.getByRole("button", { name: "Close activity" }).click();
  await page.getByRole("button", { name: /Ear to hand/ }).click();
  await expect(page.getByRole("heading", { name: "Meet this skill in Continue first." })).toBeVisible();
});

test("keeps retry and partial attempts in the guided path", async ({ page }) => {
  await completeDiagnostic(page);
  await page.getByRole("button", { name: /Start with:/ }).click();
  await page.getByRole("button", { name: "Hear the tonic reference" }).click();
  await page.getByRole("button", { name: "Needs another pass" }).click();
  await expect(page.getByRole("heading", { name: /Attempt logged:/ })).toBeVisible();
  await expect(page.getByRole("heading", { name: "This stays in your path." })).toBeVisible();

  await page.getByRole("button", { name: "Try this activity again" }).click();
  await page.getByRole("button", { name: "Hear the tonic reference" }).click();
  await page.getByRole("button", { name: "Partly there" }).click();
  await page.getByRole("button", { name: "Stop here for now" }).click();

  await expect(page.getByRole("button", { name: "Start with: Hear and compare your attempts" })).toBeVisible();
});

test("exposes all eight stages and a complete unit activity contract", async ({ page }) => {
  await completeDiagnostic(page);
  await learnViews(page).getByRole("button", { name: /Course map/ }).click();
  await expect(page.getByRole("navigation", { name: "Curriculum stages" }).getByRole("button")).toHaveCount(8);
  await expect(page.locator(".unit-card")).toHaveCount(6);
  await expect(page.locator(".activity-list li")).toHaveCount(9);
  await expect(page.getByText("Make a small musical object", { exact: true })).toBeVisible();
  await expect(page.getByText("Move it somewhere new", { exact: true })).toBeVisible();
});

test("creates, revises, finishes and restores a local musical sketch", async ({ page }) => {
  await completeDiagnostic(page);
  await learningNav(page).getByRole("button", { name: /Create/ }).click();
  await page.getByRole("button", { name: "Start your first sketch" }).click();
  await page.getByLabel("Sketch name").fill("Two-note horizon");
  await page.getByLabel("Add chord").selectOption({ index: 1 });
  await page.getByRole("button", { name: "Change one interval" }).click();
  await expect(page.locator(".revision-count")).toContainText(/1\s*preserved revisions/);
  await page.getByRole("button", { name: "Finish this version" }).click();
  await expect(page.getByText(/creative workflow · finished/i)).toBeVisible();
  await page.waitForTimeout(150);
  await page.reload();
  await expect(page.getByLabel("Sketch name")).toHaveValue("Two-note horizon");
  await expect(page.locator(".revision-count")).toContainText(/2\s*preserved revisions/);
});

test("treats chromatic colour as contextual rather than wrong", async ({ page }) => {
  await completeDiagnostic(page);
  await learningNav(page).getByRole("button", { name: /Explore/ }).click();
  await page.getByRole("button", { name: "Move one semitone" }).click();
  await expect(page.getByText("Chromatic neighbour", { exact: true })).toBeVisible();
  await expect(page.getByText(/Outside does not mean wrong|outside the active reference/i)).toBeVisible();
  await expect(page.getByText(/Compact note layout|Fingering-checked voicing/)).toBeVisible();
});

test("handles denied microphone access without losing a sketch", async ({ page, context }) => {
  await context.clearPermissions();
  await page.addInitScript(() => Object.defineProperty(navigator, "mediaDevices", { configurable: true, value: { getUserMedia: () => Promise.reject(new DOMException("Permission denied", "NotAllowedError")) } }));
  await completeDiagnostic(page);
  await learningNav(page).getByRole("button", { name: /Create/ }).click();
  await page.getByRole("button", { name: "Start your first sketch" }).click();
  await page.getByRole("button", { name: "Record a temporary take" }).click();
  await expect(page.getByText(/Microphone unavailable/)).toBeVisible();
  await expect(page.getByLabel("Sketch name")).toBeVisible();
});

test("exports a complete local backup", async ({ page }) => {
  await completeDiagnostic(page);
  await page.getByRole("button", { name: /settings and (?:data|sync)/i }).filter({ visible: true }).click();
  await expect(page.getByRole("heading", { name: "Install Guitar Academy" })).toBeVisible();
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export complete backup" }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(/\.guitar-academy$/);
  await expect(page.getByText(/Audio uploads only when you choose one retained take/)).toBeVisible();
});

test("gives reinstall guidance without claiming a surviving app window is installed", async ({ page }) => {
  await page.addInitScript(() => {
    const browserMatchMedia = window.matchMedia.bind(window);
    window.matchMedia = (query: string) => {
      if (query !== "(display-mode: standalone)") return browserMatchMedia(query);
      return {
        matches: true,
        media: query,
        onchange: null,
        addEventListener: () => undefined,
        removeEventListener: () => undefined,
        addListener: () => undefined,
        removeListener: () => undefined,
        dispatchEvent: () => false
      } as MediaQueryList;
    };
  });
  await completeDiagnostic(page);
  await page.getByRole("button", { name: /settings and (?:data|sync)/i }).filter({ visible: true }).click();
  await expect(page.getByRole("heading", { name: "Opened in app mode" })).toBeVisible();
  await expect(page.getByText(/If you removed the installation while this window was open/)).toBeVisible();
  await expect(page.getByText("Installed on this device", { exact: true })).toHaveCount(0);
});

test("keeps content first and avoids horizontal page overflow on a phone", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await completeDiagnostic(page);
  await expect(page.getByRole("navigation", { name: "Mobile learning navigation" })).toBeVisible();
  await expect(page.getByRole("navigation", { name: "Mobile learning navigation" }).getByRole("button")).toHaveCount(4);
  await expect(page.getByRole("navigation", { name: "Primary learning navigation" })).toBeHidden();
  await expect(page.getByRole("heading", { name: "Turn one relationship into music." })).toBeVisible();
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(1);
});
