import { describe, expect, it } from "vitest";
import { isAdminNavItemActive } from "./admin-sidebar";

describe("isAdminNavItemActive", () => {
  it("仅在 pathname 严格等于 /admin 时让概览高亮", () => {
    expect(isAdminNavItemActive("/admin", "/admin")).toBe(true);
    expect(isAdminNavItemActive("/admin/", "/admin")).toBe(false);
    expect(isAdminNavItemActive("/admin/events", "/admin")).toBe(false);
    expect(isAdminNavItemActive("/admin/events/abc/edit", "/admin")).toBe(false);
  });

  it("赛事管理在 /admin/events 及其子路径下高亮", () => {
    expect(isAdminNavItemActive("/admin/events", "/admin/events")).toBe(true);
    expect(isAdminNavItemActive("/admin/events/new", "/admin/events")).toBe(true);
    expect(
      isAdminNavItemActive("/admin/events/abc-123/edit", "/admin/events")
    ).toBe(true);
  });

  it("不会因为前缀部分匹配而误判（防御 startsWith 陷阱）", () => {
    expect(isAdminNavItemActive("/admin/eventsx", "/admin/events")).toBe(false);
  });

  it("非 admin 路径下两个 tab 都不应高亮", () => {
    expect(isAdminNavItemActive("/", "/admin")).toBe(false);
    expect(isAdminNavItemActive("/", "/admin/events")).toBe(false);
    expect(isAdminNavItemActive("/events/foo", "/admin/events")).toBe(false);
  });
});
