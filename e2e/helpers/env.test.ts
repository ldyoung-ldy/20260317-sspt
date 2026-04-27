import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { assertSafeE2EDatabaseUrl, getE2EDatabaseUrl } from "./env";

describe("E2E env 解析与安全断言", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    delete process.env.CI;
    delete process.env.DATABASE_URL;
    delete process.env.E2E_DATABASE_URL;
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it("getE2EDatabaseUrl 优先返回 E2E_DATABASE_URL", () => {
    process.env.DATABASE_URL = "postgresql://dev/neondb";
    process.env.E2E_DATABASE_URL = "postgresql://dev/neondb_e2e";
    expect(getE2EDatabaseUrl()).toBe("postgresql://dev/neondb_e2e");
  });

  it("getE2EDatabaseUrl 在未设置 E2E_DATABASE_URL 时回退 DATABASE_URL", () => {
    process.env.DATABASE_URL = "postgresql://dev/sspt_e2e";
    expect(getE2EDatabaseUrl()).toBe("postgresql://dev/sspt_e2e");
  });

  it("getE2EDatabaseUrl 在两者都缺失时抛出", () => {
    expect(() => getE2EDatabaseUrl()).toThrow(/DATABASE_URL/);
  });

  it("assertSafeE2EDatabaseUrl 拒绝非 test/e2e 名称的库（非 CI）", () => {
    expect(() =>
      assertSafeE2EDatabaseUrl("postgresql://x:y@host/neondb"),
    ).toThrow(/不是测试库/);
  });

  it("assertSafeE2EDatabaseUrl 放行名称含 test 或 e2e 的库", () => {
    expect(
      assertSafeE2EDatabaseUrl("postgresql://x:y@host/sspt_e2e"),
    ).toMatch(/sspt_e2e/);
    expect(
      assertSafeE2EDatabaseUrl("postgresql://x:y@host/sspt_test"),
    ).toMatch(/sspt_test/);
  });

  it("assertSafeE2EDatabaseUrl 在 CI 下短路放行任意名称", () => {
    process.env.CI = "true";
    expect(
      assertSafeE2EDatabaseUrl("postgresql://x:y@host/whatever"),
    ).toMatch(/whatever/);
  });
});
