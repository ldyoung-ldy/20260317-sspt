const DEFAULT_BASE_URL = "http://127.0.0.1:3000";

export function getE2EBaseUrl() {
  return process.env.PLAYWRIGHT_BASE_URL ?? DEFAULT_BASE_URL;
}

export function getRequiredEnv(name: "AUTH_SECRET" | "DATABASE_URL") {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`${name} 未配置，无法运行 E2E 测试。`);
  }

  return value;
}

/**
 * 解析 E2E 测试库连接串。
 *
 * 优先使用 `E2E_DATABASE_URL`（允许开发者把开发库 `DATABASE_URL` 与 E2E 测试库分开），
 * 不存在时回退到 `DATABASE_URL`（兼容 CI 既有配置）。
 */
export function getE2EDatabaseUrl() {
  const explicit = process.env.E2E_DATABASE_URL?.trim();
  if (explicit) {
    return explicit;
  }
  return getRequiredEnv("DATABASE_URL");
}

export function assertSafeE2EDatabaseUrl(databaseUrl: string) {
  if (process.env.CI === "true") {
    return databaseUrl;
  }

  const lowerCaseUrl = databaseUrl.toLowerCase();

  if (!lowerCaseUrl.includes("test") && !lowerCaseUrl.includes("e2e")) {
    throw new Error(
      `当前 E2E 数据库连接看起来不是测试库（${databaseUrl}）。为避免误删开发数据，E2E reset/seed 只允许连接名称包含 test 或 e2e 的数据库。请通过 E2E_DATABASE_URL 指向独立测试库（例如 Neon 测试 branch 或本地 PostgreSQL），或在 .env.local 中配置专用 DATABASE_URL。`
    );
  }

  return databaseUrl;
}
