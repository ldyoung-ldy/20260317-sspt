"use client";

import { LoaderCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import type { FormEvent, ReactNode } from "react";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { ActionResult } from "@/lib/action-result";
import type { EventCustomFieldInput } from "@/lib/events/schema";
import type { RegistrationStatusValue } from "@/lib/registration-status";
import type {
  RegistrationFieldAnswerInput,
  RegistrationFormInput,
} from "@/lib/registrations/schema";

type RegistrationMutationResult = {
  id: string;
  status: RegistrationStatusValue;
};

type RegistrationFormProps = {
  event: {
    id: string;
    name: string;
    customFields: EventCustomFieldInput[];
  };
  action: (
    input: RegistrationFormInput
  ) => Promise<ActionResult<RegistrationMutationResult>>;
};

export function RegistrationForm({ event, action }: RegistrationFormProps) {
  const router = useRouter();
  const [values, setValues] = useState<RegistrationFormInput>(() => ({
    eventId: event.id,
    teamName: "",
    answers: event.customFields.map((field) => ({
      fieldId: field.id,
      value: "",
    })),
  }));
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[] | undefined>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function updateAnswer(fieldId: string, value: string) {
    setValues((current) => ({
      ...current,
      answers: current.answers.map((item) =>
        item.fieldId === fieldId ? { ...item, value } : item
      ),
    }));
  }

  function handleSubmit(event_: FormEvent<HTMLFormElement>) {
    event_.preventDefault();
    setFormError(null);
    setFieldErrors({});

    startTransition(async () => {
      const result = await action(values);

      if (!result.success) {
        setFormError(result.error.message);
        setFieldErrors(result.error.fieldErrors ?? {});
        return;
      }

      router.push("/my/registrations");
      router.refresh();
    });
  }

  return (
    <form className="space-y-6" onSubmit={handleSubmit}>
      <Card className="border border-border">
        <CardHeader>
          <CardTitle>报名信息</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="border border-border bg-background px-4 py-4 text-sm text-muted-foreground">
            你正在报名「{event.name}」。提交后状态默认为待审核，管理员审核通过后可在“我的报名”里确认参赛。
          </div>

          <Field label="队伍名称（可选）" error={fieldErrors.teamName?.[0]}>
            <Input
              value={values.teamName}
              onChange={(inputEvent) =>
                setValues((current) => ({
                  ...current,
                  teamName: inputEvent.target.value,
                }))
              }
              placeholder="例如：AI 冲刺队"
            />
          </Field>
        </CardContent>
      </Card>

      <Card className="border border-border">
        <CardHeader>
          <CardTitle>补充信息</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {fieldErrors.answers?.[0] ? (
            <div className="border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {fieldErrors.answers[0]}
            </div>
          ) : null}

          {event.customFields.length === 0 ? (
            <div className="border border-dashed border-border px-4 py-6 text-sm text-muted-foreground">
              当前赛事没有额外报名字段，直接提交即可进入审核。
            </div>
          ) : (
            <div className="grid gap-4">
              {event.customFields.map((field, index) => (
                <Field
                  key={field.id}
                  label={field.required ? `${field.label} *` : field.label}
                  error={fieldErrors[`answer-${index}`]?.[0]}
                >
                  {renderField(
                    field,
                    getAnswerValue(values.answers, field.id),
                    (value) => updateAnswer(field.id, value)
                  )}
                </Field>
              ))}
            </div>
          )}
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
            报名提交后管理员可进行接受或拒绝，接受后你还需要手动确认参赛。
          </p>
          <div className="flex gap-3">
            <Button type="button" variant="outline" onClick={() => router.back()}>
              返回
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? <LoaderCircle className="animate-spin" /> : null}
              {isPending ? "提交中..." : "提交报名"}
            </Button>
          </div>
        </div>
      </div>
    </form>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div>
      <Label>{label}</Label>
      <div className="mt-2">{children}</div>
      {error ? <p className="mt-2 text-xs text-destructive">{error}</p> : null}
    </div>
  );
}

function renderField(
  field: EventCustomFieldInput,
  value: string,
  onChange: (value: string) => void
) {
  if (field.type === "textarea") {
    return <Textarea value={value} onChange={(event) => onChange(event.target.value)} />;
  }

  if (field.type === "select") {
    return (
      <select
        className="flex h-8 w-full border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        <option value="">请选择</option>
        {field.options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    );
  }

  return (
    <Input
      type={field.type === "url" ? "url" : "text"}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder={field.type === "url" ? "https://example.com" : undefined}
    />
  );
}

function getAnswerValue(answers: RegistrationFieldAnswerInput[], fieldId: string) {
  return answers.find((answer) => answer.fieldId === fieldId)?.value ?? "";
}
