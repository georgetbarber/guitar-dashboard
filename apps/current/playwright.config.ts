import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  workers: process.env.CI ? 2 : undefined,
  retries: 0,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: "http://127.0.0.1:4184",
    trace: "retain-on-failure",
    screenshot: "only-on-failure"
  },
  webServer: {
    command: process.env.PWA_PREVIEW
      ? "node node_modules/vite/bin/vite.js preview --host 127.0.0.1 --port 4184"
      : "node node_modules/vite/bin/vite.js --host 127.0.0.1",
    url: "http://127.0.0.1:4184",
    reuseExistingServer: !process.env.CI
  },
  projects: [
    { name: "desktop-chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile-chromium", use: { ...devices["Pixel 7"] } }
  ]
});
