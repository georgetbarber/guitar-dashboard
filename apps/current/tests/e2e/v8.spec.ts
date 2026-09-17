import { expect, test, type Page } from "@playwright/test";

async function completeDiagnostic(page: Page) {
  await page.goto("/");
  await expect(page).toHaveTitle("Guitar Academy");
  const onboarding = page.getByRole("heading", { name: "Build freedom from sound, time and relationships." });
  const home = page.getByRole("heading", { name: "Turn one relationship into music." });
  // Wait past the loading screen: counting immediately can find neither and skip onboarding.
  await expect(onboarding.or(home)).toBeVisible();
  if (await onboarding.isVisible()) {
    await page.getByRole("button", { name: "Continue" }).click();
    await page.getByRole("button", { name: "Continue" }).click();
    await page.getByRole("button", { name: "Start your path" }).click();
  }
  await expect(home).toBeVisible();
  await expectNoInternalCopy(page);
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
  await expect(page.getByText(/Recordings never leave this device/)).toBeVisible();
});

test("previews and cancels a backup, then restores it durably after confirmation", async ({ page }, testInfo) => {
  await completeDiagnostic(page);
  await learningNav(page).getByRole("button", { name: /Create/ }).click();
  await page.getByRole("button", { name: "Start your first sketch" }).click();
  await page.getByLabel("Sketch name").fill("Original backed-up idea");
  await expect(page.locator(".save-indicator:visible")).toHaveText("Saved on this device");
  const settings = () => page.getByRole("button", { name: /settings and (?:data|sync)/i }).filter({ visible: true }).click();
  await settings();
  const downloadEvent = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export complete backup" }).click();
  const backup = testInfo.outputPath("restore-fixture.guitar-academy");
  await (await downloadEvent).saveAs(backup);
  await page.getByLabel("Close settings").click();
  await page.getByLabel("Sketch name").fill("Idea written after the backup");
  await expect(page.locator(".save-indicator:visible")).toHaveText("Saved on this device");
  await settings();
  const fileInput = page.locator('input[type="file"]');
  await fileInput.setInputFiles(backup);
  await expect(page.getByRole("group", { name: "Confirm this restore" })).toBeVisible();
  // Chromium closes a dialog without a cancel event on a repeated Escape with
  // no user activation between; the pending restore must survive that too.
  for (let press = 0; press < 3; press++) await page.keyboard.press("Escape");
  await page.getByRole("dialog").click({ position: { x: 4, y: 4 } });
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(page.getByRole("group", { name: "Confirm this restore" })).toBeVisible();
  await expect(page.getByText(/Restore this backup or cancel it before closing settings/)).toBeVisible();
  await page.getByRole("button", { name: "Cancel", exact: true }).click();
  await expect(page.getByText(/Restore cancelled/)).toBeVisible();
  await expect(page.getByLabel("Sketch name")).toHaveValue("Idea written after the backup");
  await fileInput.setInputFiles(backup);
  await page.getByRole("button", { name: "Restore this backup", exact: true }).click();
  await expect(page.getByText(/Backup restored: 1 sketches/)).toBeVisible();
  await page.getByLabel("Close settings").click();
  await expect(page.getByLabel("Sketch name")).toHaveValue("Original backed-up idea");
  await page.reload();
  await expect(page.getByLabel("Sketch name")).toHaveValue("Original backed-up idea");
});

test("Settings contains keyboard focus, blocks background focus and restores its trigger", async ({ page }) => {
  await completeDiagnostic(page);
  const trigger = page.getByRole("button", { name: /settings and (?:data|sync)/i }).filter({ visible: true });
  await trigger.click();
  const dialog = page.getByRole("dialog", { name: "Your instrument, sync and storage" });
  const close = dialog.getByRole("button", { name: "Close settings" });
  await expect(close).toBeFocused();
  await page.locator("#main-content").evaluate((element) => element.focus());
  await expect(close).toBeFocused();
  // A native modal lets Tab pass from its last control to the browser's own UI
  // (the document body here) and back to its first control, never to the page.
  const background = page.locator(".v8-shell > :not(dialog) :focus, .v8-shell > :not(dialog):focus");
  // The last control is About this app's disclosure.
  await dialog.locator("button, summary").last().focus();
  await page.keyboard.press("Tab");
  await expect(background).toHaveCount(0);
  await page.keyboard.press("Tab");
  await expect(close).toBeFocused();
  await page.keyboard.press("Shift+Tab");
  await expect(background).toHaveCount(0);
  await page.keyboard.press("Shift+Tab");
  await expect(dialog.locator(":focus")).toHaveCount(1);
  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
  await expect(trigger).toBeFocused();
  await trigger.click();
  await expect(close).toBeFocused();
  await dialog.click({ position: { x: 4, y: 4 } });
  await expect(dialog).toHaveCount(0);
  await expect(trigger).toBeFocused();
});

test("the activity player is a labelled modal with a keyboard exit", async ({ page }) => {
  await completeDiagnostic(page);
  const trigger = page.getByRole("button", { name: /Start with:/ });
  await trigger.click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toHaveAccessibleName(/Hear and compare your attempts/);
  await expect(dialog.getByRole("button", { name: "Close activity" })).toBeFocused();
  await page.locator("#main-content").evaluate((element) => element.focus());
  await expect(dialog.getByRole("button", { name: "Close activity" })).toBeFocused();
  // Unlike Settings, pressing the page around the player is not a way out of an activity.
  await dialog.click({ position: { x: 2, y: 2 } });
  await expect(dialog).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
  await expect(trigger).toBeFocused();
});

test("Escape keeps an activity open while a written reflection is unsaved", async ({ page }) => {
  await completeDiagnostic(page);
  await learnViews(page).getByRole("button", { name: /Course map/ }).click();
  const reflect = page.locator(".activity-list li").last();
  await expect(reflect).toContainText("Reflect");
  await reflect.getByRole("button").click();
  const dialog = page.getByRole("dialog");
  const draft = dialog.getByRole("textbox");
  await draft.fill("The held note made the change feel calmer");
  for (let press = 0; press < 3; press++) await page.keyboard.press("Escape");
  await expect(dialog).toBeVisible();
  await expect(dialog.getByText(/Your written reflection has not been saved/)).toBeVisible();
  await expect(draft).toHaveValue("The held note made the change feel calmer");
  await dialog.getByRole("button", { name: "Close activity" }).click();
  await expect(dialog).toHaveCount(0);
});

/** Make every local write fail until `window.__failSaves` is cleared: IndexedDB and its localStorage fallback. */
async function injectSaveFailures(page: Page) {
  await page.addInitScript(() => {
    const flags = window as unknown as { __failSaves?: boolean };
    const put = IDBObjectStore.prototype.put;
    IDBObjectStore.prototype.put = function (...args: Parameters<typeof put>) {
      if (flags.__failSaves && this.name === "state") throw new DOMException("Injected by the test", "QuotaExceededError");
      return put.apply(this, args);
    };
    const setItem = Storage.prototype.setItem;
    Storage.prototype.setItem = function (key: string, value: string) {
      if (flags.__failSaves && key.includes("guitar-academy")) throw new DOMException("Injected by the test", "QuotaExceededError");
      return setItem.call(this, key, value);
    };
  });
}

test("a save failure during an activity is shown and usable inside it, and the record is not called saved", async ({ page }) => {
  await injectSaveFailures(page);
  await completeDiagnostic(page);
  await learnViews(page).getByRole("button", { name: /Course map/ }).click();
  await page.locator(".activity-list li").last().getByRole("button").click();
  const dialog = page.getByRole("dialog");
  await dialog.getByRole("textbox").fill("The held note made the change feel calmer");
  await page.evaluate(() => { (window as unknown as { __failSaves: boolean }).__failSaves = true; });
  await dialog.getByRole("button", { name: /Needs another pass/ }).click();
  const alert = dialog.getByRole("alert", { name: "Local save failure" });
  await expect(alert).toBeVisible();
  await expect(page.getByRole("alert", { name: "Local save failure" })).toHaveCount(1);
  await expect(dialog.locator(".record-save-status")).toHaveText(/^Not saved on this device yet/);
  await expect(dialog.getByText(/The evidence is saved/)).toHaveCount(0);
  await page.evaluate(() => { (window as unknown as { __failSaves: boolean }).__failSaves = false; });
  await alert.getByRole("button", { name: "Try saving again" }).click();
  await expect(dialog.locator(".record-save-status")).toHaveText("Saved on this device.");
  await expect(page.getByRole("alert", { name: "Local save failure" })).toHaveCount(0);
});

test("an unreadable saved workspace is explained on the first screen, not shown as a fresh start", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Build freedom from sound, time and relationships." })).toBeVisible();
  await page.evaluate(() => new Promise<void>((resolve, reject) => {
    const open = indexedDB.open("guitar-academy-v8");
    open.onerror = () => reject(open.error);
    open.onsuccess = () => {
      const transaction = open.result.transaction("state", "readwrite");
      transaction.objectStore("state").put({ version: 99, note: "written by a newer build" }, "anonymous");
      transaction.oncomplete = () => { open.result.close(); resolve(); };
      transaction.onerror = () => reject(transaction.error);
    };
  }));
  await page.reload();
  const notice = page.getByRole("alert", { name: "Saved workspace could not be read" });
  await expect(notice).toBeVisible();
  await expect(notice.getByRole("button", { name: "Download the stored copy" })).toBeEnabled();
});

test("the Explore fretboard is one keyboard stop that moves with arrow keys and selects with Enter", async ({ page }) => {
  await completeDiagnostic(page);
  await learningNav(page).getByRole("button", { name: /Explore/ }).click();
  const grid = page.getByRole("grid", { name: /fretboard/i });
  const help = page.getByText(/Arrow keys move between strings and frets/);
  await expect(grid.locator('[role="gridcell"][tabindex="0"]')).toHaveCount(1);
  await expect(help).not.toBeInViewport();
  await page.getByRole("button", { name: "Hear chord structure" }).focus();
  await page.keyboard.press("Tab");
  const start = grid.getByRole("gridcell", { name: /^String 1, fret 0, E4,/ });
  await expect(start).toBeFocused();
  await expect(help).toBeVisible();
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("ArrowRight");
  const bFretOne = grid.getByRole("gridcell", { name: /^String 2, fret 1, C4,/ });
  await expect(bFretOne).toBeFocused();
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("ArrowRight");
  await page.keyboard.press("Enter");
  await expect(page.locator(".pitch-analysis h2")).toHaveText("A");
  await expect(grid.getByRole("gridcell", { name: /^String 3, fret 2, A3,/ })).toHaveAttribute("aria-selected", "true");
  await page.keyboard.press("Tab");
  await expect(grid.locator(":focus")).toHaveCount(0);
  await page.keyboard.press("Shift+Tab");
  await expect(grid.getByRole("gridcell", { name: /^String 3, fret 2,/ })).toBeFocused();
});

/** Nothing a learner reads carries an internal version or build language (B17). */
async function expectNoInternalCopy(page: Page) {
  const text = await page.evaluate(() => `${document.title}\n${document.body.innerText}`);
  expect(text).not.toMatch(/\bV[0-9]+\b|\.env|Firebase|IndexedDB|localStorage/);
}

for (const [width, height, label] of [[320, 640, "small phone"], [390, 844, "phone"], [640, 360, "laptop at 200% zoom"]] as const) {
  test(`phone layout keeps controls clear and content reachable: ${label}`, async ({ page }) => {
    await page.setViewportSize({ width, height });
    await page.goto("/");
    await expect(page.getByRole("heading", { name: "Build freedom from sound, time and relationships." })).toBeVisible();
    await expectNoInternalCopy(page);
    await completeDiagnostic(page);
    const nav = page.getByRole("navigation", { name: "Mobile learning navigation" });
    const settings = page.getByRole("button", { name: "Open settings and data" });
    const check = async (screen: string) => {
      const result = await page.evaluate(() => {
        const box = (element: Element) => element.getBoundingClientRect();
        const overlaps = (a: DOMRect, b: DOMRect) => a.left < b.right - 1 && b.left < a.right - 1 && a.top < b.bottom - 1 && b.top < a.bottom - 1;
        const controls = [...document.querySelectorAll("main button, main input, main select, main textarea, main a, main summary")]
          .filter((element) => { const rect = box(element); return rect.width > 0 && rect.height > 0 && getComputedStyle(element).visibility !== "hidden"; });
        const settingsButton = document.querySelector('[aria-label="Open settings and data"]')!;
        const settingsHits = controls.filter((element) => overlaps(box(element), box(settingsButton))).map((element) => element.textContent?.trim().slice(0, 30));
        scrollTo(0, document.documentElement.scrollHeight);
        const navTop = box(document.querySelector(".mobile-nav")!).top;
        const lastBottom = Math.max(...controls.map((element) => box(element).bottom));
        const tabs = [...document.querySelectorAll(".learn-tabs button")].map((button) => ({
          height: box(button).height,
          clipped: button.scrollWidth > button.clientWidth + 1,
          // Visible text only: the purpose line is still in the accessible name, just not squeezed onto a phone.
          smallestText: Math.min(...[...button.querySelectorAll("strong, small")].filter((text) => box(text).width > 1).map((text) => parseFloat(getComputedStyle(text).fontSize)))
        }));
        scrollTo(0, 0);
        return { overflow: document.documentElement.scrollWidth - innerWidth, settingsHits, hiddenBehindNav: lastBottom - navTop, tabs };
      });
      expect(result.overflow, `${screen}: horizontal overflow`).toBeLessThanOrEqual(1);
      expect(result.settingsHits, `${screen}: controls under the settings button`).toEqual([]);
      expect(result.hiddenBehindNav, `${screen}: last control still behind the navigation`).toBeLessThanOrEqual(0);
      for (const tab of result.tabs) {
        expect(tab.height, `${screen}: Learn tab touch target`).toBeGreaterThanOrEqual(44);
        expect(tab.clipped, `${screen}: Learn tab label clipped`).toBe(false);
        expect(tab.smallestText, `${screen}: Learn tab text too small to read`).toBeGreaterThanOrEqual(12);
      }
      await expect(settings).toBeInViewport();
      // The sidebar's local save status is hidden on phones; its own copy must be visible.
      await expect(page.locator(".save-indicator:visible")).toBeInViewport();
      await expectNoInternalCopy(page);
    };
    await check("Continue");
    for (const view of ["Course map", "Strengthen"]) {
      await learnViews(page).getByRole("button", { name: new RegExp(view) }).click();
      await check(view);
    }
    await nav.getByRole("button", { name: /Play/ }).click();
    await check("Play");
    await nav.getByRole("button", { name: /Create/ }).click();
    await check("Create, empty");
    await page.getByRole("button", { name: "Start your first sketch" }).click();
    await page.getByLabel("Sketch name").fill("A deliberately long sketch name that keeps going to test wrapping on narrow screens");
    await check("Create, long sketch name");
    await nav.getByRole("button", { name: /Explore/ }).click();
    await check("Explore");
    await settings.click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await expectNoInternalCopy(page);
  });
}

test("keeps build details in Settings → About this app", async ({ page }) => {
  await completeDiagnostic(page);
  await page.getByRole("button", { name: /settings and (?:data|sync)/i }).filter({ visible: true }).click();
  const about = page.getByRole("dialog").locator("details.about-app");
  await expect(about.locator("dd").first()).toBeHidden();
  await about.locator("summary").click();
  await expect(about.getByText(/^\d+\.\d+\.\d+$/)).toBeVisible();
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
