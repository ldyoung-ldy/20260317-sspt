import { z } from "zod";
import {
  type EventScoringCriterionInput,
  eventScoringCriteriaSchema,
} from "@/lib/events/schema";

const scoreValueSchema = z.preprocess((value) => {
  if (typeof value === "number") {
    return value;
  }

  if (typeof value === "string") {
    const normalized = value.trim();

    if (!normalized) {
      return Number.NaN;
    }

    return Number(normalized);
  }

  return value;
}, z.number().finite("请输入有效分数。"));

const judgeCriterionScoreInputSchema = z.object({
  criterionName: z.string().trim().min(1, "评分维度名称不能为空。"),
  score: scoreValueSchema,
});

export const storedJudgeScoreEntrySchema = z.object({
  criterionName: z.string().trim().min(1),
  score: z.number().finite(),
  maxScore: z.number().gt(0),
  weight: z.number().gt(0),
});

export const judgeScoreInputSchema = z
  .object({
    eventId: z.string().uuid("赛事 ID 无效。"),
    projectId: z.string().uuid("作品 ID 无效。"),
    scores: z.array(judgeCriterionScoreInputSchema).min(1, "至少填写一个评分维度。"),
    comment: z.string().trim().max(2_000, "评语最多 2000 个字符。").default(""),
  })
  .superRefine((value, ctx) => {
    const names = new Set<string>();

    value.scores.forEach((item, index) => {
      if (names.has(item.criterionName)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["scores", index, "criterionName"],
          message: "评分维度不能重复。",
        });
        return;
      }

      names.add(item.criterionName);
    });
  });

export type JudgeCriterionScoreInput = z.output<typeof judgeCriterionScoreInputSchema>;
export type StoredJudgeScoreEntry = z.output<typeof storedJudgeScoreEntrySchema>;
export type JudgeScoreInput = z.output<typeof judgeScoreInputSchema>;
export type JudgeScoreActionInput = z.input<typeof judgeScoreInputSchema>;

export function parseStoredJudgeScoreEntries(value: unknown) {
  const result = z.array(storedJudgeScoreEntrySchema).safeParse(value);
  return result.success ? result.data : [];
}

export function validateJudgeScoreEntries(
  criteria: EventScoringCriterionInput[],
  scores: JudgeCriterionScoreInput[]
) {
  const currentCriteria = eventScoringCriteriaSchema.safeParse(criteria);

  if (!currentCriteria.success) {
    return {
      success: false as const,
      fieldErrors: {
        scores: ["当前赛事评分维度配置无效，请联系管理员检查赛事设置。"],
      },
    };
  }

  const fieldErrors: Record<string, string[]> = {};
  const scoreMap = new Map(scores.map((item) => [item.criterionName, item]));
  const unknownCriterion = scores.find(
    (item) => !currentCriteria.data.some((criterion) => criterion.name === item.criterionName)
  );

  if (scores.length !== currentCriteria.data.length || unknownCriterion) {
    fieldErrors.scores = ["评分维度已更新，请刷新页面后重新打分。"];
  }

  const normalizedEntries = currentCriteria.data.map((criterion) => {
    const entry = scoreMap.get(criterion.name);

    if (!entry) {
      fieldErrors.scores = ["评分维度已更新，请刷新页面后重新打分。"];
      return {
        criterionName: criterion.name,
        score: Number.NaN,
        maxScore: criterion.maxScore,
        weight: criterion.weight,
      };
    }

    if (entry.score < 0 || entry.score > criterion.maxScore) {
      fieldErrors[`score:${criterion.name}`] = [
        `分数需在 0 到 ${criterion.maxScore} 之间。`,
      ];
    }

    return {
      criterionName: criterion.name,
      score: entry.score,
      maxScore: criterion.maxScore,
      weight: criterion.weight,
    };
  });

  if (Object.keys(fieldErrors).length > 0) {
    return {
      success: false as const,
      fieldErrors,
    };
  }

  return {
    success: true as const,
    data: normalizedEntries,
  };
}

export function calculateJudgeTotalScore(entries: StoredJudgeScoreEntry[]) {
  return roundScore(
    entries.reduce((sum, entry) => sum + (entry.score / entry.maxScore) * entry.weight, 0)
  );
}

function roundScore(value: number) {
  return Math.round(value * 100) / 100;
}
