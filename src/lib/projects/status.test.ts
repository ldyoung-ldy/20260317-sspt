import { describe, expect, it } from "vitest";
import {
  getProjectStatusLabel,
  isProjectStatus,
  projectStatuses,
} from "@/lib/projects/status";

describe("project status helpers", () => {
  it("exposes stable statuses", () => {
    expect(projectStatuses).toEqual(["DRAFT", "FINAL"]);
  });

  it("validates project status strings", () => {
    expect(isProjectStatus("DRAFT")).toBe(true);
    expect(isProjectStatus("FINAL")).toBe(true);
    expect(isProjectStatus("PENDING")).toBe(false);
  });

  it("returns labels", () => {
    expect(getProjectStatusLabel("DRAFT")).toBe("草稿");
    expect(getProjectStatusLabel("FINAL")).toBe("终稿");
  });
});
