import { defineConfig, devices } from "@playwright/test";

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:3000";
const useWebServer = process.env.PLAYWRIGHT_SKIP_WEBSERVER !== "true";

// 当显式提供 E2E_DATABASE_URL 时，把它注入为被测应用的 DATABASE_URL，
// 让 Next dev server 与 E2E reset/seed 共享同一个隔离测试库，
// 避免本地开发库被 reset/seed 误清。CI 不设 E2E_DATABASE_URL，保持原行为。
const webServerEnv: Record<string, string> = {};
if (process.env.E2E_DATABASE_URL?.trim()) {
  webServerEnv.DATABASE_URL = process.env.E2E_DATABASE_URL.trim();
  // E2E 模式下统一覆盖 ADMIN_EMAILS 为 E2E 测试账号，避免本地 .env.local 中的
  // 真实管理员邮箱与 E2E_USERS.admin 冲突，导致 admin 路由 403。
  // 与 .github/workflows/ci.yml 中 ADMIN_EMAILS=admin-e2e@example.com 行为一致。
  webServerEnv.ADMIN_EMAILS = process.env.E2E_ADMIN_EMAILS?.trim() || "admin-e2e@example.com";
}

export default defineConfig({
  testDir: "./e2e/specs",
  fullyParallel: false,
  workers: 1,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  // 本地 dev 模式下首次访问会触发 Turbopack 编译，单条 spec 多次导航容易触顶 30s 默认超时；
  // CI 用预编译的 production build 模式不受影响，但保留更宽裕的超时也不会变慢通过路径。
  timeout: process.env.CI ? 60_000 : 120_000,
  expect: { timeout: 10_000 },
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
          env: webServerEnv,
        },
      }
    : {}),
});
