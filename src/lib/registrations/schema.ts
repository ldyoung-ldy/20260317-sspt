import { z } from "zod";
import {
  eventCustomFieldListSchema,
  type EventCustomFieldInput,
  type EventCustomFieldType,
} from "@/lib/events/schema";

const maxAnswerLength = 2_000;

export const registrationAnswerInputSchema = z.string().max(maxAnswerLength, "填写内容过长。");

export const registrationFormSchema = z.object({
  eventId: z.string().uuid("赛事 ID 无效。"),
  teamName: z.string().trim().max(120, "队伍名称最多 120 个字符。"),
  answers: z.array(registrationAnswerInputSchema).default([]),
});

export const registrationStatusUpdateSchema = z.object({
  eventId: z.string().uuid("赛事 ID 无效。"),
  registrationIds: z.array(z.string().uuid("报名 ID 无效。")).min(1, "请至少选择一条报名。"),
  nextStatus: z.enum(["ACCEPTED", "REJECTED"]),
});

export const registrationActionSchema = z.object({
  registrationId: z.string().uuid("报名 ID 无效。"),
});

export const registrationAnswerSchema = z.object({
  label: z.string().trim().min(1),
  type: z.enum(["text", "textarea", "url", "select"] satisfies readonly EventCustomFieldType[]),
  value: z.string().trim(),
});

export const registrationAnswerListSchema = z.array(registrationAnswerSchema).default([]);

export type RegistrationFormInput = z.output<typeof registrationFormSchema>;
export type RegistrationActionInput = z.output<typeof registrationActionSchema>;
export type RegistrationStatusUpdateInput = z.output<typeof registrationStatusUpdateSchema>;
export type RegistrationAnswer = z.output<typeof registrationAnswerSchema>;

export function parseRegistrationAnswers(value: unknown) {
  const result = registrationAnswerListSchema.safeParse(value);
  return result.success ? result.data : [];
}

export function parseRegistrationCustomFields(value: unknown) {
  const result = eventCustomFieldListSchema.safeParse(value);
  return result.success ? result.data : [];
}

export function validateRegistrationAnswers(
  customFields: EventCustomFieldInput[],
  rawAnswers: string[]
) {
  const fieldErrors: Record<string, string[]> = {};

  if (rawAnswers.length !== customFields.length) {
    fieldErrors.answers = ["报名字段已更新，请刷新页面后重新填写。"];
  }

  const answers = customFields.map((field, index) => {
    const value = (rawAnswers[index] ?? "").trim();

    if (field.required && value.length === 0) {
      fieldErrors[`answer-${index}`] = [`请填写${field.label}。`];
    }

    if (field.type === "url" && value.length > 0) {
      if (!isValidHttpUrl(value)) {
        fieldErrors[`answer-${index}`] = [`${field.label} 请输入有效链接。`];
      }
    }

    if (field.type === "select" && value.length > 0 && !field.options.includes(value)) {
      fieldErrors[`answer-${index}`] = [`${field.label} 请选择有效选项。`];
    }

    return {
      label: field.label,
      type: field.type,
      value,
    } satisfies RegistrationAnswer;
  });

  return {
    success: Object.keys(fieldErrors).length === 0,
    fieldErrors,
    answers,
  };
}

function isValidHttpUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}
