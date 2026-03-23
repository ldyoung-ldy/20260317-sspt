import { describe, expect, it } from "vitest";
import {
  canReviewEvent,
  canRegisterForEvent,
  canSubmitProjectForEvent,
  getEventPhase,
  getEventPhaseLabel,
} from "@/lib/events/phase";

const event = {
  published: true,
  registrationStart: new Date("2026-04-01T09:00:00.000Z"),
  registrationEnd: new Date("2026-04-05T09:00:00.000Z"),
  submissionStart: new Date("2026-04-05T09:00:00.000Z"),
  submissionEnd: new Date("2026-04-10T09:00:00.000Z"),
  reviewStart: new Date("2026-04-10T09:00:00.000Z"),
  reviewEnd: new Date("2026-04-15T09:00:00.000Z"),
};

describe("event phase", () => {
  it("returns draft for unpublished events", () => {
    expect(
      getEventPhase({ ...event, published: false }, new Date("2026-04-02T00:00:00.000Z"))
    ).toBe("DRAFT");
  });

  it("walks through the configured timeline", () => {
    expect(getEventPhase(event, new Date("2026-03-31T23:00:00.000Z"))).toBe("UPCOMING");
    expect(getEventPhase(event, new Date("2026-04-03T00:00:00.000Z"))).toBe("REGISTRATION");
    expect(getEventPhase(event, new Date("2026-04-07T00:00:00.000Z"))).toBe("SUBMISSION");
    expect(getEventPhase(event, new Date("2026-04-12T00:00:00.000Z"))).toBe("REVIEW");
    expect(getEventPhase(event, new Date("2026-04-16T00:00:00.000Z"))).toBe("COMPLETED");
  });

  it("exposes registration window and labels", () => {
    expect(canRegisterForEvent(event, new Date("2026-04-02T00:00:00.000Z"))).toBe(true);
    expect(canRegisterForEvent(event, new Date("2026-04-06T00:00:00.000Z"))).toBe(false);
    expect(canSubmitProjectForEvent(event, new Date("2026-04-07T00:00:00.000Z"))).toBe(true);
    expect(canSubmitProjectForEvent(event, new Date("2026-04-12T00:00:00.000Z"))).toBe(false);
    expect(canReviewEvent(event, new Date("2026-04-12T00:00:00.000Z"))).toBe(true);
    expect(canReviewEvent(event, new Date("2026-04-16T00:00:00.000Z"))).toBe(false);
    expect(getEventPhaseLabel("SUBMISSION_PENDING")).toBe("待提交");
  });
});
