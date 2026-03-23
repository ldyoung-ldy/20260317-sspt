"use client";

import { LoaderCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { ActionResult } from "@/lib/action-result";
import type { EventScoringCriterionInput } from "@/lib/events/schema";
import type {
  JudgeScoreActionInput,
  StoredJudgeScoreEntry,
} from "@/lib/reviews/schema";

export function JudgeScoreForm({
  eventId,
  projectId,
  criteria,
  reviewOpen,
  initialComment,
  initialEntries,
  action,
}: {
  eventId: string;
  projectId: string;
  criteria: EventScoringCriterionInput[];
  reviewOpen: boolean;
  initialComment?: string | null;
  initialEntries?: StoredJudgeScoreEntry[];
  action: (input: JudgeScoreActionInput) => Promise<ActionResult<{ id: string }>>;
}) {
  const router = useRouter();
  const [scores, setScores] = useState<Record<string, string>>(() =>
    toScoreState(criteria, initialEntries)
  );
  const [comment, setComment] = useState(initialComment ?? "");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[] | undefined>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function updateScore(criterionName: string, value: string) {
    setScores((current) => ({
      ...current,
      [criterionName]: value,
    }));
  }

  function handleSubmit() {
    setFormError(null);
    setFormSuccess(null);
    setFieldErrors({});

    startTransition(async () => {
      const result = await action({
        eventId,
        projectId,
        comment,
        scores: criteria.map((criterion) => ({
          criterionName: criterion.name,
          score: scores[criterion.name] ?? "",
        })),
      });

      if (!result.success) {
        setFormError(result.error.message);
        setFieldErrors(result.error.fieldErrors ?? {});
        return;
      }

      setFormSuccess("评分已保存。");
      router.refresh();
    });
  }

  return (
    <div className="border border-border bg-card p-6">
      <div className="space-y-2">
        <h2 className="text-xl font-semibold">评分表</h2>
        <p className="text-sm leading-7 text-muted-foreground">
          请按各评分维度填写分数。系统会按赛事权重自动汇总总分。
        </p>
      </div>

      {!reviewOpen ? (
        <div className="mt-4 border border-dashed border-border px-4 py-4 text-sm text-muted-foreground">
          当前不在评审时间窗口内，你仍可查看已保存评分，但暂不可继续提交修改。
        </div>
      ) : null}

      <div className="mt-6 grid gap-4">
        {criteria.map((criterion) => (
          <div key={criterion.name}>
            <Label>{criterion.name}</Label>
            <div className="mt-2 flex items-center gap-3">
              <Input
                type="number"
                inputMode="decimal"
                min={0}
                max={criterion.maxScore}
                step="0.1"
                value={scores[criterion.name] ?? ""}
                onChange={(event) => updateScore(criterion.name, event.target.value)}
                disabled={!reviewOpen || isPending}
              />
              <span className="shrink-0 text-xs text-muted-foreground">
                / {criterion.maxScore}，权重 {criterion.weight}%
              </span>
            </div>
            {fieldErrors[`score:${criterion.name}`]?.[0] ? (
              <p className="mt-2 text-xs text-destructive">
                {fieldErrors[`score:${criterion.name}`]?.[0]}
              </p>
            ) : null}
          </div>
        ))}
      </div>

      <div className="mt-6">
        <Label>评语（可选）</Label>
        <div className="mt-2">
          <Textarea
            value={comment}
            onChange={(event) => setComment(event.target.value)}
            rows={5}
            placeholder="记录亮点、风险和建议，便于后台复核。"
            disabled={!reviewOpen || isPending}
          />
        </div>
      </div>

      {formError ? (
        <div className="mt-4 border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {formError}
        </div>
      ) : null}

      {formSuccess ? (
        <div className="mt-4 border border-primary/30 bg-primary/10 px-4 py-3 text-sm text-primary">
          {formSuccess}
        </div>
      ) : null}

      <div className="mt-6 flex justify-end">
        <Button type="button" onClick={handleSubmit} disabled={!reviewOpen || isPending}>
          {isPending ? <LoaderCircle className="animate-spin" /> : null}
          {isPending ? "保存中..." : "保存评分"}
        </Button>
      </div>
    </div>
  );
}

function toScoreState(
  criteria: EventScoringCriterionInput[],
  initialEntries?: StoredJudgeScoreEntry[]
) {
  return Object.fromEntries(
    criteria.map((criterion) => {
      const entry = initialEntries?.find((item) => item.criterionName === criterion.name);
      return [criterion.name, entry ? String(entry.score) : ""];
    })
  );
}
