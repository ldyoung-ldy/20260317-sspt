import { defineConfig, devices } from "@playwright/test";

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:3000";
const useWebServer = process.env.PLAYWRIGHT_SKIP_WEBSERVER !== "true";

export default defineConfig({
  testDir: "./e2e/specs",
  fullyParallel: false,
  workers: 1,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["line"], ["html", { open: "never" }]] : [["list"], ["html"]],
  use: {
    baseURL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
      },
    },
  ],
  ...(useWebServer
    ? {
        webServer: {
          command: "bun run dev -- --hostname 127.0.0.1 --port 3000",
          url: baseURL,
          timeout: 120_000,
          reuseExistingServer: !process.env.CI,
        },
      }
    : {}),
});
