import { afterEach, describe, expect, it } from "vitest";
import {
  getAdminEmails,
  getRoleForEmail,
  isAdminEmail,
} from "@/lib/access-control";

const originalAdminEmails = process.env.ADMIN_EMAILS;

afterEach(() => {
  if (originalAdminEmails === undefined) {
    delete process.env.ADMIN_EMAILS;
    return;
  }

  process.env.ADMIN_EMAILS = originalAdminEmails;
});

describe("access-control", () => {
  it("parses admin emails from multiple separators", () => {
    process.env.ADMIN_EMAILS = "admin@example.com, ops@example.com;owner@example.com";

    expect(Array.from(getAdminEmails())).toEqual([
      "admin@example.com",
      "ops@example.com",
      "owner@example.com",
    ]);
  });

  it("matches admin email case-insensitively", () => {
    process.env.ADMIN_EMAILS = "admin@example.com";

    expect(isAdminEmail("Admin@Example.com")).toBe(true);
    expect(getRoleForEmail("Admin@Example.com")).toBe("ADMIN");
  });

  it("falls back to USER when no admin match exists", () => {
    process.env.ADMIN_EMAILS = "admin@example.com";

    expect(isAdminEmail("user@example.com")).toBe(false);
    expect(getRoleForEmail("user@example.com")).toBe("USER");
  });
});
