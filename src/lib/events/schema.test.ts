import { describe, expect, it } from "vitest";
import {
  createEmptyEventCustomField,
  eventFormSchema,
  normalizeEventFormValues,
  parseEventJsonFields,
  toDateTimeLocalValue,
  type EventFormInitialValues,
  type EventFormInput,
} from "@/lib/events/schema";

function createValidInput(): EventFormInput {
  return {
    name: "AI Hackathon 2026",
    description: "面向企业创新团队的 AI 赛事，覆盖报名、提交与评审全流程。",
    startDate: "2026-04-01T09:00",
    endDate: "2026-04-20T18:00",
    registrationStart: "2026-04-01T09:00",
    registrationEnd: "2026-04-05T18:00",
    submissionStart: "2026-04-05T18:00",
    submissionEnd: "2026-04-12T18:00",
    reviewStart: "2026-04-12T18:00",
    reviewEnd: "2026-04-18T18:00",
    tracks: [{ name: "企业智能体", description: "面向内部协作场景" }],
    challenges: [{ title: "流程自动化", description: "优化审批与运营流程" }],
    prizes: [{ title: "一等奖", description: "现金奖励", amount: "¥20,000" }],
    scoringCriteria: [{ name: "创新性", maxScore: 10, weight: 40 }],
    customFields: [
      { id: "team-site", label: "团队官网", type: "url", required: false, options: [] },
    ],
  };
}

describe("event schema", () => {
  it("accepts a valid event payload", () => {
    expect(eventFormSchema.safeParse(createValidInput()).success).toBe(true);
  });

  it("rejects invalid timeline ordering", () => {
    const result = eventFormSchema.safeParse({
      ...createValidInput(),
      submissionStart: "2026-04-04T18:00",
    });

    expect(result.success).toBe(false);

    if (!result.success) {
      expect(result.error.flatten().fieldErrors.submissionStart).toContain(
        "作品提交开始时间不能早于报名截止时间。"
      );
    }
  });

  it("requires options for select custom fields", () => {
    const result = eventFormSchema.safeParse({
      ...createValidInput(),
      customFields: [
        { id: "track", label: "参赛赛道", type: "select", required: true, options: [] },
      ],
    });

    expect(result.success).toBe(false);
  });

  it("falls back to empty arrays when json shape is invalid", () => {
    expect(
      parseEventJsonFields({
        tracks: { bad: true },
        challenges: null,
        prizes: "x",
        scoringCriteria: 1,
        customFields: undefined,
      })
    ).toEqual({
      tracks: [],
      challenges: [],
      prizes: [],
      scoringCriteria: [],
      customFields: [],
    });
  });

  it("adds deterministic ids to persisted custom fields without ids", () => {
    const parsed = parseEventJsonFields({
      tracks: [],
      challenges: [],
      prizes: [],
      scoringCriteria: [{ name: "创新性", maxScore: 10, weight: 40 }],
      customFields: [{ label: "团队官网", type: "url", required: false, options: [] }],
    });

    expect(parsed.customFields[0]?.id).toBeTruthy();
    expect(parsed.customFields[0]).toMatchObject({
      label: "团队官网",
      type: "url",
      required: false,
      options: [],
    });
  });

  it("creates runtime ids for new custom fields", () => {
    expect(createEmptyEventCustomField()).toMatchObject({
      label: "",
      type: "text",
      required: false,
      options: [],
    });
  });

  it("normalizes persisted dates using the runtime timezone", () => {
    const input: EventFormInitialValues = {
      ...createValidInput(),
      startDate: "2026-04-01T01:00:00.000Z",
      endDate: "2026-04-20T10:00:00.000Z",
      registrationStart: "2026-04-01T01:00:00.000Z",
      registrationEnd: "2026-04-05T10:00:00.000Z",
      submissionStart: "2026-04-05T10:00:00.000Z",
      submissionEnd: "2026-04-12T10:00:00.000Z",
      reviewStart: "2026-04-12T10:00:00.000Z",
      reviewEnd: "2026-04-18T10:00:00.000Z",
    };

    expect(normalizeEventFormValues(input)).toEqual({
      ...input,
      startDate: toDateTimeLocalValue(new Date(input.startDate)),
      endDate: toDateTimeLocalValue(new Date(input.endDate)),
      registrationStart: toDateTimeLocalValue(new Date(input.registrationStart)),
      registrationEnd: toDateTimeLocalValue(new Date(input.registrationEnd)),
      submissionStart: toDateTimeLocalValue(new Date(input.submissionStart)),
      submissionEnd: toDateTimeLocalValue(new Date(input.submissionEnd)),
      reviewStart: toDateTimeLocalValue(new Date(input.reviewStart)),
      reviewEnd: toDateTimeLocalValue(new Date(input.reviewEnd)),
    });
  });
});
