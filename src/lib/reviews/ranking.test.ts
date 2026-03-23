import { describe, expect, it } from "vitest";
import { buildProjectRankings } from "@/lib/reviews/ranking";

const criteria = [
  { name: "创新性", maxScore: 10, weight: 40 },
  { name: "完成度", maxScore: 10, weight: 35 },
  { name: "落地价值", maxScore: 10, weight: 25 },
];

describe("buildProjectRankings", () => {
  it("aggregates multiple judge scores into an average weighted total", () => {
    const rankings = buildProjectRankings(criteria, [
      {
        id: "project-a",
        name: "Factory Copilot",
        teamName: "AI 冲刺队",
        track: "企业智能体",
        scoreRecords: [
          {
            judgeId: "judge-1",
            scores: [
              { criterionName: "创新性", score: 9, maxScore: 10, weight: 40 },
              { criterionName: "完成度", score: 8, maxScore: 10, weight: 35 },
              { criterionName: "落地价值", score: 8, maxScore: 10, weight: 25 },
            ],
          },
          {
            judgeId: "judge-2",
            scores: [
              { criterionName: "创新性", score: 8, maxScore: 10, weight: 40 },
              { criterionName: "完成度", score: 9, maxScore: 10, weight: 35 },
              { criterionName: "落地价值", score: 8, maxScore: 10, weight: 25 },
            ],
          },
        ],
      },
      {
        id: "project-b",
        name: "Workflow Pilot",
        teamName: "流程队",
        track: "智能工作流",
        scoreRecords: [
          {
            judgeId: "judge-1",
            scores: [
              { criterionName: "创新性", score: 7, maxScore: 10, weight: 40 },
              { criterionName: "完成度", score: 7, maxScore: 10, weight: 35 },
              { criterionName: "落地价值", score: 8, maxScore: 10, weight: 25 },
            ],
          },
        ],
      },
    ]);

    expect(rankings).toHaveLength(2);
    expect(rankings[0]).toMatchObject({
      projectId: "project-a",
      rank: 1,
      judgeCount: 2,
      totalScore: 83.75,
    });
    expect(rankings[1]).toMatchObject({
      projectId: "project-b",
      rank: 2,
      judgeCount: 1,
      totalScore: 72.5,
    });
  });

  it("ignores incompatible score records and keeps dense ranking stable", () => {
    const rankings = buildProjectRankings(criteria, [
      {
        id: "project-a",
        name: "Alpha",
        teamName: null,
        track: null,
        scoreRecords: [
          {
            judgeId: "judge-1",
            scores: [
              { criterionName: "创新性", score: 8, maxScore: 10, weight: 40 },
              { criterionName: "完成度", score: 8, maxScore: 10, weight: 35 },
              { criterionName: "落地价值", score: 8, maxScore: 10, weight: 25 },
            ],
          },
          {
            judgeId: "judge-2",
            scores: [
              { criterionName: "旧维度", score: 10, maxScore: 10, weight: 100 },
            ],
          },
        ],
      },
      {
        id: "project-b",
        name: "Beta",
        teamName: null,
        track: null,
        scoreRecords: [
          {
            judgeId: "judge-1",
            scores: [
              { criterionName: "创新性", score: 8, maxScore: 10, weight: 40 },
              { criterionName: "完成度", score: 8, maxScore: 10, weight: 35 },
              { criterionName: "落地价值", score: 8, maxScore: 10, weight: 25 },
            ],
          },
        ],
      },
    ]);

    expect(rankings).toHaveLength(2);
    expect(rankings[0]?.rank).toBe(1);
    expect(rankings[1]?.rank).toBe(1);
  });
});
