import { describe, expect, it } from "vitest";
import { canDeleteEvent, getEventDeletionBlockReason } from "@/lib/events/delete-policy";

describe("event delete policy", () => {
  it("allows deleting unpublished events without related records", () => {
    expect(
      canDeleteEvent({
        published: false,
        registrationsCount: 0,
        projectsCount: 0,
        projectScoresCount: 0,
        judgesCount: 0,
      })
    ).toBe(true);
  });

  it("blocks deleting published events", () => {
    expect(
      getEventDeletionBlockReason({
        published: true,
        registrationsCount: 0,
        projectsCount: 0,
        projectScoresCount: 0,
        judgesCount: 0,
      })
    ).toBe("已发布赛事请先取消发布，再执行删除。");
  });

  it("blocks deleting events with related business data", () => {
    expect(
      getEventDeletionBlockReason({
        published: false,
        registrationsCount: 1,
        projectsCount: 0,
        projectScoresCount: 0,
        judgesCount: 0,
      })
    ).toBe("已有报名、作品、评分或评委分配数据的赛事不可删除。");
  });
});
