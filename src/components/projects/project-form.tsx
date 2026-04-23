"use client";

import { LoaderCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { type ReactNode, useMemo, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { ActionResult } from "@/lib/action-result";
import type { ProjectFormInput } from "@/lib/projects/schema";
import type { ProjectStatusValue } from "@/lib/projects/status";

type ProjectMutationResult = {
  id: string;
  status: ProjectStatusValue;
};

type ProjectFormProps = {
  event: {
    id: string;
    name: string;
    tracks: { name: string; description: string }[];
    challenges: { title: string; description: string }[];
  };
  initialValues: ProjectFormInput;
  currentStatus?: ProjectStatusValue;
  createAction: (input: ProjectFormInput) => Promise<ActionResult<ProjectMutationResult>>;
  updateAction: (input: ProjectFormInput) => Promise<ActionResult<ProjectMutationResult>>;
  submitAction: (input: ProjectFormInput) => Promise<ActionResult<ProjectMutationResult>>;
};

export function ProjectForm({
  event,
  initialValues,
  currentStatus,
  createAction,
  updateAction,
  submitAction,
}: ProjectFormProps) {
  const router = useRouter();
  const [values, setValues] = useState<ProjectFormInput>(initialValues);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[] | undefined>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [pendingMode, setPendingMode] = useState<"draft" | "final" | null>(null);
  const [isPending, startTransition] = useTransition();
  const challengeSet = useMemo(() => new Set(values.challenges), [values.challenges]);

  function updateValue<Key extends keyof ProjectFormInput>(key: Key, value: ProjectFormInput[Key]) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  function toggleChallenge(title: string) {
    setValues((current) => ({
      ...current,
      challenges: current.challenges.includes(title)
        ? current.challenges.filter((item) => item !== title)
        : [...current.challenges, title],
    }));
  }

  function runAction(mode: "draft" | "final") {
    setFormError(null);
    setFieldErrors({});
    setPendingMode(mode);

    startTransition(async () => {
      const action =
        mode === "final"
          ? submitAction
          : currentStatus
            ? updateAction
            : createAction;
      const result = await action(values);

      if (!result.success) {
        setFormError(result.error.message);
        setFieldErrors(result.error.fieldErrors ?? {});
        setPendingMode(null);
        return;
      }

      router.refresh();
      setPendingMode(null);
    });
  }

  return (
    <div className="space-y-6">
      <Card className="border border-border">
        <CardHeader>
          <CardTitle>作品基础信息</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="border border-border bg-background px-4 py-4 text-sm text-muted-foreground">
            你正在为「{event.name}」提交作品。保存草稿后可继续完善，点击“提交终稿”后仍可在截止前继续修改并再次提交。
          </div>

          <Field label="作品名称" error={fieldErrors.name?.[0]}>
            <Input
              value={values.name}
              onChange={(event_) => updateValue("name", event_.target.value)}
              placeholder="例如：Factory Copilot"
            />
          </Field>

          <Field label="作品描述" error={fieldErrors.description?.[0]}>
            <Textarea
              value={values.description}
              onChange={(event_) => updateValue("description", event_.target.value)}
              rows={6}
              placeholder="说明作品解决的问题、核心功能与亮点。"
            />
          </Field>
        </CardContent>
      </Card>

      <Card className="border border-border">
        <CardHeader>
          <CardTitle>赛道与赛题</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          {event.tracks.length > 0 ? (
            <Field label="参赛赛道" error={fieldErrors.track?.[0]} htmlFor="project-track">
              <select
                id="project-track"
                className="flex h-8 w-full rounded-md border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                value={values.track}
                onChange={(event_) => updateValue("track", event_.target.value)}
              >
                <option value="">请选择赛道</option>
                {event.tracks.map((track) => (
                  <option key={track.name} value={track.name}>
                    {track.name}
                  </option>
                ))}
              </select>
            </Field>
          ) : (
            <div className="border border-dashed border-border px-4 py-5 text-sm text-muted-foreground">
              当前赛事未配置赛道，作品将按默认分组提交。
            </div>
          )}

          {event.challenges.length > 0 ? (
            <Field label="可关联赛题（可多选）" error={fieldErrors.challenges?.[0]}>
              <div className="grid gap-3 md:grid-cols-2">
                {event.challenges.map((challenge) => (
                  <label
                    key={challenge.title}
                    className="flex cursor-pointer items-start gap-3 border border-border bg-background px-4 py-3 text-sm"
                  >
                    <input
                      type="checkbox"
                      checked={challengeSet.has(challenge.title)}
                      onChange={() => toggleChallenge(challenge.title)}
                      className="mt-0.5 size-4 rounded border-border"
                    />
                    <span className="space-y-1">
                      <span className="block font-medium text-foreground">{challenge.title}</span>
                      <span className="block text-muted-foreground">
                        {challenge.description || "暂无赛题补充说明。"}
                      </span>
                    </span>
                  </label>
                ))}
              </div>
            </Field>
          ) : null}
        </CardContent>
      </Card>

      <Card className="border border-border">
        <CardHeader>
          <CardTitle>相关链接</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <Field label="源码链接" error={fieldErrors.sourceUrl?.[0]}>
            <Input
              type="url"
              value={values.sourceUrl}
              onChange={(event_) => updateValue("sourceUrl", event_.target.value)}
              placeholder="https://github.com/..."
            />
          </Field>
          <Field label="演示链接" error={fieldErrors.demoUrl?.[0]}>
            <Input
              type="url"
              value={values.demoUrl}
              onChange={(event_) => updateValue("demoUrl", event_.target.value)}
              placeholder="https://demo.example.com"
            />
          </Field>
          <Field label="视频链接" error={fieldErrors.videoUrl?.[0]}>
            <Input
              type="url"
              value={values.videoUrl}
              onChange={(event_) => updateValue("videoUrl", event_.target.value)}
              placeholder="https://youtube.com/..."
            />
          </Field>
        </CardContent>
      </Card>

      <div className="border border-border bg-card p-6">
        {formError ? (
          <div className="mb-4 border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {formError}
          </div>
        ) : null}

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">
            终稿提交后仍可在截止前继续修改。后台会始终看到你最近一次保存的内容。
          </p>
          <div className="flex flex-wrap gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => runAction("draft")}
              disabled={isPending}
            >
              {isPending && pendingMode === "draft" ? <LoaderCircle className="animate-spin" /> : null}
              {isPending && pendingMode === "draft" ? "保存中..." : "保存草稿"}
            </Button>
            <Button type="button" onClick={() => runAction("final")} disabled={isPending}>
              {isPending && pendingMode === "final" ? <LoaderCircle className="animate-spin" /> : null}
              {isPending && pendingMode === "final"
                ? "提交中..."
                : currentStatus === "FINAL"
                  ? "更新终稿"
                  : "提交终稿"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  error,
  children,
  htmlFor,
}: {
  label: string;
  error?: string;
  children: ReactNode;
  htmlFor?: string;
}) {
  return (
    <div>
      <Label htmlFor={htmlFor}>{label}</Label>
      <div className="mt-2">{children}</div>
      {error ? <p className="mt-2 text-xs text-destructive">{error}</p> : null}
    </div>
  );
}
