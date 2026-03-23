import { z } from "zod";

const customFieldTypes = ["text", "textarea", "url", "select"] as const;

const requiredText = (label: string) => z.string().trim().min(1, `请输入${label}。`);
const optionalText = z.string().trim().default("");
const dateTimeField = z
  .string()
  .trim()
  .min(1, "请选择时间。")
  .refine((value) => !Number.isNaN(new Date(value).getTime()), "请输入有效时间。");

export const eventTrackSchema = z
  .object({
    name: requiredText("赛道名称"),
    description: optionalText,
  })
  .transform(({ name, description }) => ({
    name: name.trim(),
    description: description.trim(),
  }));

export const eventChallengeSchema = z
  .object({
    title: requiredText("赛题标题"),
    description: optionalText,
  })
  .transform(({ title, description }) => ({
    title: title.trim(),
    description: description.trim(),
  }));

export const eventPrizeSchema = z
  .object({
    title: requiredText("奖项名称"),
    description: optionalText,
    amount: optionalText,
  })
  .transform(({ title, description, amount }) => ({
    title: title.trim(),
    description: description.trim(),
    amount: amount.trim(),
  }));

export const eventScoringCriterionSchema = z
  .object({
    name: requiredText("评分维度名称"),
    maxScore: z.coerce.number().gt(0, "最高分必须大于 0。"),
    weight: z.coerce.number().gt(0, "权重必须大于 0。"),
  })
  .transform(({ name, maxScore, weight }) => ({
    name: name.trim(),
    maxScore,
    weight,
  }));

export const eventCustomFieldSchema = z
  .object({
    id: z.string().trim().min(1).optional(),
    label: requiredText("字段名称"),
    type: z.enum(customFieldTypes),
    required: z.boolean().default(false),
    options: z.array(z.string().trim().min(1, "选项不能为空。")).default([]),
  })
  .superRefine((value, ctx) => {
    if (value.type === "select" && value.options.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["options"],
        message: "下拉字段至少需要一个选项。",
      });
    }
  })
  .transform(({ id, label, type, required, options }) => ({
    id: id?.trim() || createEventCustomFieldId({ label, type, required, options }),
    label: label.trim(),
    type,
    required,
    options,
  }));

export const eventTrackListSchema = z.array(eventTrackSchema).default([]);
export const eventChallengeListSchema = z.array(eventChallengeSchema).default([]);
export const eventPrizeListSchema = z.array(eventPrizeSchema).default([]);
export const eventScoringCriteriaSchema = z
  .array(eventScoringCriterionSchema)
  .min(1, "至少添加一个评分维度。")
  .superRefine((criteria, ctx) => {
    const names = new Set<string>();

    criteria.forEach((item, index) => {
      if (names.has(item.name)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: [index, "name"],
          message: "评分维度名称不能重复。",
        });
        return;
      }

      names.add(item.name);
    });
  });
export const eventCustomFieldListSchema = z
  .array(eventCustomFieldSchema)
  .default([])
  .transform((fields) => ensureUniqueCustomFieldIds(fields));

export const eventFormSchema = z
  .object({
    name: z.string().trim().min(2, "赛事名称至少 2 个字符。"),
    description: z.string().trim().min(10, "赛事描述至少 10 个字符。"),
    startDate: dateTimeField,
    endDate: dateTimeField,
    registrationStart: dateTimeField,
    registrationEnd: dateTimeField,
    submissionStart: dateTimeField,
    submissionEnd: dateTimeField,
    reviewStart: dateTimeField,
    reviewEnd: dateTimeField,
    tracks: eventTrackListSchema,
    challenges: eventChallengeListSchema,
    prizes: eventPrizeListSchema,
    scoringCriteria: eventScoringCriteriaSchema,
    customFields: eventCustomFieldListSchema,
  })
  .superRefine((value, ctx) => {
    const startDate = new Date(value.startDate);
    const endDate = new Date(value.endDate);
    const registrationStart = new Date(value.registrationStart);
    const registrationEnd = new Date(value.registrationEnd);
    const submissionStart = new Date(value.submissionStart);
    const submissionEnd = new Date(value.submissionEnd);
    const reviewStart = new Date(value.reviewStart);
    const reviewEnd = new Date(value.reviewEnd);

    if (!(startDate < endDate)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["endDate"],
        message: "赛事结束时间必须晚于开始时间。",
      });
    }

    if (startDate > registrationStart) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["registrationStart"],
        message: "报名开始时间不能早于赛事开始时间。",
      });
    }

    if (!(registrationStart < registrationEnd)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["registrationEnd"],
        message: "报名截止时间必须晚于报名开始时间。",
      });
    }

    if (registrationEnd > submissionStart) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["submissionStart"],
        message: "作品提交开始时间不能早于报名截止时间。",
      });
    }

    if (!(submissionStart < submissionEnd)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["submissionEnd"],
        message: "作品提交截止时间必须晚于提交开始时间。",
      });
    }

    if (submissionEnd > reviewStart) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["reviewStart"],
        message: "评审开始时间不能早于作品提交截止时间。",
      });
    }

    if (!(reviewStart < reviewEnd)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["reviewEnd"],
        message: "评审截止时间必须晚于评审开始时间。",
      });
    }

    if (reviewEnd > endDate) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["endDate"],
        message: "赛事结束时间不能早于评审截止时间。",
      });
    }
  });

export type EventTrackInput = z.output<typeof eventTrackSchema>;
export type EventChallengeInput = z.output<typeof eventChallengeSchema>;
export type EventPrizeInput = z.output<typeof eventPrizeSchema>;
export type EventScoringCriterionInput = z.output<typeof eventScoringCriterionSchema>;
export type EventCustomFieldInput = z.output<typeof eventCustomFieldSchema>;
export type EventCustomFieldType = (typeof customFieldTypes)[number];
export type EventFormInput = z.output<typeof eventFormSchema>;
export type EventFormInitialValues = Omit<
  EventFormInput,
  | "startDate"
  | "endDate"
  | "registrationStart"
  | "registrationEnd"
  | "submissionStart"
  | "submissionEnd"
  | "reviewStart"
  | "reviewEnd"
> & {
  startDate: string | Date;
  endDate: string | Date;
  registrationStart: string | Date;
  registrationEnd: string | Date;
  submissionStart: string | Date;
  submissionEnd: string | Date;
  reviewStart: string | Date;
  reviewEnd: string | Date;
};

export function getDefaultEventFormValues(now = new Date()): EventFormInput {
  const registrationStart = addDays(now, 1);
  const registrationEnd = addDays(registrationStart, 7);
  const submissionStart = registrationEnd;
  const submissionEnd = addDays(submissionStart, 7);
  const reviewStart = submissionEnd;
  const reviewEnd = addDays(reviewStart, 3);

  return {
    name: "",
    description: "",
    startDate: toDateTimeLocalValue(registrationStart),
    endDate: toDateTimeLocalValue(reviewEnd),
    registrationStart: toDateTimeLocalValue(registrationStart),
    registrationEnd: toDateTimeLocalValue(registrationEnd),
    submissionStart: toDateTimeLocalValue(submissionStart),
    submissionEnd: toDateTimeLocalValue(submissionEnd),
    reviewStart: toDateTimeLocalValue(reviewStart),
    reviewEnd: toDateTimeLocalValue(reviewEnd),
    tracks: [],
    challenges: [],
    prizes: [],
    scoringCriteria: [
      { name: "创新性", maxScore: 10, weight: 40 },
      { name: "完成度", maxScore: 10, weight: 35 },
      { name: "落地价值", maxScore: 10, weight: 25 },
    ],
    customFields: [],
  };
}

export function normalizeEventFormValues(input: EventFormInitialValues): EventFormInput {
  return {
    name: input.name,
    description: input.description,
    startDate: toDateTimeLocalValue(toDate(input.startDate)),
    endDate: toDateTimeLocalValue(toDate(input.endDate)),
    registrationStart: toDateTimeLocalValue(toDate(input.registrationStart)),
    registrationEnd: toDateTimeLocalValue(toDate(input.registrationEnd)),
    submissionStart: toDateTimeLocalValue(toDate(input.submissionStart)),
    submissionEnd: toDateTimeLocalValue(toDate(input.submissionEnd)),
    reviewStart: toDateTimeLocalValue(toDate(input.reviewStart)),
    reviewEnd: toDateTimeLocalValue(toDate(input.reviewEnd)),
    tracks: input.tracks,
    challenges: input.challenges,
    prizes: input.prizes,
    scoringCriteria: input.scoringCriteria,
    customFields: input.customFields,
  };
}

export function toEventMutationData(input: EventFormInput) {
  return {
    name: input.name.trim(),
    description: input.description.trim(),
    startDate: new Date(input.startDate),
    endDate: new Date(input.endDate),
    registrationStart: new Date(input.registrationStart),
    registrationEnd: new Date(input.registrationEnd),
    submissionStart: new Date(input.submissionStart),
    submissionEnd: new Date(input.submissionEnd),
    reviewStart: new Date(input.reviewStart),
    reviewEnd: new Date(input.reviewEnd),
    tracks: input.tracks,
    challenges: input.challenges,
    prizes: input.prizes,
    scoringCriteria: input.scoringCriteria,
    customFields: input.customFields,
  };
}

export function areScoringCriteriaEqual(
  left: EventScoringCriterionInput[],
  right: EventScoringCriterionInput[]
) {
  if (left.length !== right.length) {
    return false;
  }

  return left.every((criterion, index) => {
    const other = right[index];

    if (!other) {
      return false;
    }

    return (
      criterion.name === other.name &&
      criterion.maxScore === other.maxScore &&
      criterion.weight === other.weight
    );
  });
}

export function parseEventJsonFields(input: {
  tracks: unknown;
  challenges: unknown;
  prizes: unknown;
  scoringCriteria: unknown;
  customFields: unknown;
}) {
  return {
    tracks: parseJsonField(eventTrackListSchema, input.tracks, []),
    challenges: parseJsonField(eventChallengeListSchema, input.challenges, []),
    prizes: parseJsonField(eventPrizeListSchema, input.prizes, []),
    scoringCriteria: parseJsonField(eventScoringCriteriaSchema, input.scoringCriteria, []),
    customFields: parseJsonField(eventCustomFieldListSchema, input.customFields, []),
  };
}

export function toDateTimeLocalValue(date: Date) {
  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return localDate.toISOString().slice(0, 16);
}

export function createEmptyEventCustomField(): EventCustomFieldInput {
  return {
    id: createRuntimeEventCustomFieldId(),
    label: "",
    type: "text",
    required: false,
    options: [],
  };
}

function parseJsonField<T>(schema: z.ZodType<T>, value: unknown, fallback: T) {
  const result = schema.safeParse(value);
  return result.success ? result.data : fallback;
}

function toDate(value: string | Date) {
  return value instanceof Date ? value : new Date(value);
}

function addDays(date: Date, days: number) {
  return new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
}

function ensureUniqueCustomFieldIds(fields: EventCustomFieldInput[]) {
  const counts = new Map<string, number>();

  return fields.map((field) => {
    const currentCount = (counts.get(field.id) ?? 0) + 1;
    counts.set(field.id, currentCount);

    if (currentCount === 1) {
      return field;
    }

    return {
      ...field,
      id: `${field.id}-${currentCount}`,
    };
  });
}

function createEventCustomFieldId(input: {
  label: string;
  type: EventCustomFieldType;
  required: boolean;
  options: string[];
}) {
  const seed = [
    input.label.trim().toLowerCase(),
    input.type,
    input.required ? "required" : "optional",
    input.options.map((option) => option.trim().toLowerCase()).join("|"),
  ].join("::");

  const normalizedLabel =
    input.label
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, "-")
      .replace(/^-+|-+$/g, "") || "custom-field";

  return `${normalizedLabel}-${hashString(seed)}`;
}

function createRuntimeEventCustomFieldId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `custom-field-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function hashString(value: string) {
  let hash = 0x811c9dc5;

  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }

  return (hash >>> 0).toString(36);
}
