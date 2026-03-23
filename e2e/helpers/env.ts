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

export function assertSafeE2EDatabaseUrl(databaseUrl: string) {
  if (process.env.CI === "true") {
    return databaseUrl;
  }

  const lowerCaseUrl = databaseUrl.toLowerCase();

  if (!lowerCaseUrl.includes("test") && !lowerCaseUrl.includes("e2e")) {
    throw new Error(
      `当前 DATABASE_URL 看起来不是测试库（${databaseUrl}）。为避免误删开发数据，E2E reset/seed 只允许连接名称包含 test 或 e2e 的数据库。`
    );
  }

  return databaseUrl;
}
