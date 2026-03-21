import { describe, expect, it } from "vitest";
import { projectFormSchema, validateProjectFormInput } from "@/lib/projects/schema";

function createValidInput() {
  return {
    eventId: "11111111-1111-4111-8111-111111111111",
    name: "Factory Copilot",
    description: "面向制造企业的多角色智能体协作平台。",
    sourceUrl: "https://github.com/example/factory-copilot",
    demoUrl: "https://demo.example.com/factory-copilot",
    videoUrl: "https://video.example.com/factory-copilot",
    track: "企业智能体",
    challenges: ["流程自动化"],
  };
}

const config = {
  tracks: [{ name: "企业智能体", description: "面向内部运营场景" }],
  challenges: [{ title: "流程自动化", description: "减少重复人工操作" }],
};

describe("project schema", () => {
  it("accepts a valid payload", () => {
    expect(projectFormSchema.safeParse(createValidInput()).success).toBe(true);
  });

  it("requires name and description", () => {
    const result = projectFormSchema.safeParse({
      ...createValidInput(),
      name: " ",
      description: " ",
    });

    expect(result.success).toBe(false);
  });

  it("rejects invalid urls", () => {
    const result = projectFormSchema.safeParse({
      ...createValidInput(),
      demoUrl: "ftp://example.com/demo",
    });

    expect(result.success).toBe(false);
  });

  it("rejects invalid tracks from event config", () => {
    const validation = validateProjectFormInput(config, {
      ...createValidInput(),
      track: "未知赛道",
    });

    expect(validation.success).toBe(false);
    expect(validation.fieldErrors.track).toContain("请选择有效赛道。");
  });

  it("rejects invalid challenges from event config", () => {
    const validation = validateProjectFormInput(config, {
      ...createValidInput(),
      challenges: ["流程自动化", "未知赛题"],
    });

    expect(validation.success).toBe(false);
    expect(validation.fieldErrors.challenges).toContain("请选择有效赛题。");
  });

  it("deduplicates repeated challenges", () => {
    const validation = validateProjectFormInput(config, {
      ...createValidInput(),
      challenges: ["流程自动化", "流程自动化"],
    });

    expect(validation.success).toBe(true);

    if (validation.success) {
      expect(validation.data.challenges).toEqual(["流程自动化"]);
    }
  });
});
