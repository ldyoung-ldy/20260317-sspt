import { describe, expect, it } from "vitest";
import {
  parseRegistrationAnswers,
  parseRegistrationCustomFields,
  registrationFormSchema,
  validateRegistrationAnswers,
} from "@/lib/registrations/schema";

describe("registration schema", () => {
  it("accepts a valid registration payload", () => {
    expect(
      registrationFormSchema.safeParse({
        eventId: "2d44d6fb-6d3d-4c7e-b61a-9e0f5111d215",
        teamName: "AI Squad",
        answers: [{ fieldId: "team-site", value: "https://example.com" }],
      }).success
    ).toBe(true);
  });

  it("validates required/url/select custom fields", () => {
    const result = validateRegistrationAnswers(
      [
        { id: "team-site", label: "团队官网", type: "url", required: true, options: [] },
        {
          id: "track",
          label: "报名赛道",
          type: "select",
          required: true,
          options: ["企业服务", "内容生成"],
        },
      ],
      [
        { fieldId: "team-site", value: "bad-url" },
        { fieldId: "track", value: "其他" },
      ]
    );

    expect(result.success).toBe(false);
    expect(result.fieldErrors["answer-0"]).toContain("团队官网 请输入有效链接。");
    expect(result.fieldErrors["answer-1"]).toContain("报名赛道 请选择有效选项。");
  });

  it("detects stale field definitions", () => {
    const result = validateRegistrationAnswers(
      [{ id: "company", label: "公司", type: "text", required: false, options: [] }],
      []
    );

    expect(result.success).toBe(false);
    expect(result.fieldErrors.answers).toContain("报名字段已更新，请刷新页面后重新填写。");
  });

  it("rejects answers when field ids no longer match", () => {
    const result = validateRegistrationAnswers(
      [{ id: "company", label: "公司", type: "text", required: false, options: [] }],
      [{ fieldId: "old-company", value: "Factory" }]
    );

    expect(result.success).toBe(false);
    expect(result.fieldErrors.answers).toContain("报名字段已更新，请刷新页面后重新填写。");
  });

  it("falls back to empty arrays when persisted data is invalid", () => {
    expect(parseRegistrationAnswers({ bad: true })).toEqual([]);
    expect(parseRegistrationCustomFields({ bad: true })).toEqual([]);
  });
});
