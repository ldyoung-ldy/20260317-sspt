import { describe, expect, it } from "vitest";
import { parseAdminProjectFilters } from "@/lib/projects/queries";

describe("parseAdminProjectFilters", () => {
  it("parses valid status, track and query", () => {
    expect(
      parseAdminProjectFilters({
        status: "FINAL",
        track: "企业智能体",
        query: "factory",
      })
    ).toEqual({
      status: "FINAL",
      track: "企业智能体",
      query: "factory",
    });
  });

  it("drops invalid status and trims empty track", () => {
    expect(
      parseAdminProjectFilters({
        status: "PENDING",
        track: "   ",
        query: "  demo  ",
      })
    ).toEqual({
      status: undefined,
      track: undefined,
      query: "demo",
    });
  });
});
