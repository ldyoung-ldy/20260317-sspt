"use client";

import { LoaderCircle, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { ActionResult } from "@/lib/action-result";

type JudgeSummary = {
  userId: string;
  name: string | null;
  email: string | null;
  assignedAt: Date;
  scoredProjectCount: number;
};

type AssignmentResult = {
  id: string;
  name: string | null;
  email: string | null;
} | {
  userId: string;
};

export function JudgeAssignmentPanel({
  eventId,
  rankingsPublished,
  canPublishRankings,
  judges,
  assignAction,
  removeAction,
  toggleRankingsAction,
}: {
  eventId: string;
  rankingsPublished: boolean;
  canPublishRankings: boolean;
  judges: JudgeSummary[];
  assignAction: (input: { eventId: string; email: string }) => Promise<ActionResult<AssignmentResult>>;
  removeAction: (input: { eventId: string; judgeUserId: string }) => Promise<ActionResult<AssignmentResult>>;
  toggleRankingsAction: (input: {
    eventId: string;
    rankingsPublished: boolean;
  }) => Promise<ActionResult<{ id: string; slug: string; rankingsPublished: boolean }>>;
}) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pendingKey, setPendingKey] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function runAssign() {
    setMessage(null);
    setError(null);
    setPendingKey("assign");

    startTransition(async () => {
      const result = await assignAction({
        eventId,
        email,
      });

      if (!result.success) {
        setError(result.error.message);
        setPendingKey(null);
        return;
      }

      setEmail("");
      setMessage("评委分配成功。");
      setPendingKey(null);
      router.refresh();
    });
  }

  function runRemove(judgeUserId: string) {
    setMessage(null);
    setError(null);
    setPendingKey(`remove:${judgeUserId}`);

    startTransition(async () => {
      const result = await removeAction({
        eventId,
        judgeUserId,
      });

      if (!result.success) {
        setError(result.error.message);
        setPendingKey(null);
        return;
      }

      setMessage("评委已移除。");
      setPendingKey(null);
      router.refresh();
    });
  }

  function runToggle() {
    setMessage(null);
    setError(null);
    setPendingKey("toggle");

    startTransition(async () => {
      const result = await toggleRankingsAction({
        eventId,
        rankingsPublished: !rankingsPublished,
      });

      if (!result.success) {
        setError(result.error.message);
        setPendingKey(null);
        return;
      }

      setMessage(result.data.rankingsPublished ? "排名已公开。" : "排名公示已关闭。");
      setPendingKey(null);
      router.refresh();
    });
  }

  return (
    <section className="border border-border bg-card p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <h2 className="text-xl font-semibold">评委与公示</h2>
          <p className="text-sm leading-7 text-muted-foreground">
            输入已登录用户的邮箱即可分配评委。移除评委时，会同步撤销该评委在本赛事下的历史评分影响。榜单默认仅后台可见，确认分数稳定后再公开到前台。
          </p>
        </div>
        <Button
          type="button"
          variant={rankingsPublished ? "outline" : "default"}
          onClick={runToggle}
          disabled={isPending || (!rankingsPublished && !canPublishRankings)}
        >
          {isPending && pendingKey === "toggle" ? <LoaderCircle className="animate-spin" /> : null}
          {rankingsPublished ? "关闭排名公示" : "公开排名"}
        </Button>
      </div>

      <div className="mt-6 grid gap-3 md:grid-cols-[1fr_auto]">
        <Input
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="输入评委邮箱，例如 judge@example.com"
        />
        <Button type="button" onClick={runAssign} disabled={isPending}>
          {isPending && pendingKey === "assign" ? <LoaderCircle className="animate-spin" /> : null}
          分配评委
        </Button>
      </div>

      {error ? (
        <div className="mt-4 border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      {message ? (
        <div className="mt-4 border border-primary/30 bg-primary/10 px-4 py-3 text-sm text-primary">
          {message}
        </div>
      ) : null}

      <div className="mt-6 space-y-3">
        {judges.length === 0 ? (
          <div className="border border-dashed border-border px-4 py-6 text-sm text-muted-foreground">
            当前还没有分配评委。评委登录后会在“评审中心”看到被分配的赛事。
          </div>
        ) : (
          judges.map((judge) => (
            <div
              key={judge.userId}
              className="flex flex-wrap items-center justify-between gap-4 border border-border bg-background/70 px-4 py-4"
            >
              <div className="space-y-1">
                <p className="font-medium text-foreground">
                  {judge.name || judge.email || "未命名用户"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {judge.email || "未绑定邮箱"} · 已评 {judge.scoredProjectCount} 份作品
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => runRemove(judge.userId)}
                disabled={isPending}
              >
                {isPending && pendingKey === `remove:${judge.userId}` ? (
                  <LoaderCircle className="animate-spin" />
                ) : (
                  <Trash2 />
                )}
                移除
              </Button>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
