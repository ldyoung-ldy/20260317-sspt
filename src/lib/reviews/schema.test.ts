import { describe, expect, it } from "vitest";
import { judgeScoreInputSchema, validateJudgeScoreEntries } from "@/lib/reviews/schema";

const criteria = [
  { name: "创新性", maxScore: 10, weight: 40 },
  { name: "完成度", maxScore: 10, weight: 35 },
  { name: "落地价值", maxScore: 10, weight: 25 },
];

describe("judge score schema", () => {
  it("parses a valid judge score payload", () => {
    const result = judgeScoreInputSchema.safeParse({
      eventId: "fce8af7a-ef7a-4d7f-a7c2-4c9351ed1829",
      projectId: "fce8af7a-ef7a-4d7f-a7c2-4c9351ed1830",
      comment: "整体完成度高。",
      scores: [
        { criterionName: "创新性", score: "9.5" },
        { criterionName: "完成度", score: 8 },
        { criterionName: "落地价值", score: "8.5" },
      ],
    });

    expect(result.success).toBe(true);
  });

  it("rejects duplicate criterion names at schema level", () => {
    const result = judgeScoreInputSchema.safeParse({
      eventId: "fce8af7a-ef7a-4d7f-a7c2-4c9351ed1829",
      projectId: "fce8af7a-ef7a-4d7f-a7c2-4c9351ed1830",
      comment: "",
      scores: [
        { criterionName: "创新性", score: "9" },
        { criterionName: "创新性", score: "8" },
      ],
    });

    expect(result.success).toBe(false);
  });

  it("rejects stale or missing criterion collections", () => {
    const result = validateJudgeScoreEntries(criteria, [
      { criterionName: "创新性", score: 9 },
      { criterionName: "完成度", score: 8 },
    ]);

    expect(result.success).toBe(false);

    if (!result.success) {
      expect(result.fieldErrors.scores).toContain("评分维度已更新，请刷新页面后重新打分。");
    }
  });

  it("rejects out-of-range scores", () => {
    const result = validateJudgeScoreEntries(criteria, [
      { criterionName: "创新性", score: 11 },
      { criterionName: "完成度", score: 8 },
      { criterionName: "落地价值", score: 7 },
    ]);

    expect(result.success).toBe(false);

    if (!result.success) {
      expect(result.fieldErrors["score:创新性"]).toContain("分数需在 0 到 10 之间。");
    }
  });
});
