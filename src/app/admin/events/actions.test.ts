import { afterEach, describe, expect, it, vi } from "vitest";
import { removeJudgeFromEvent, updateEvent } from "@/app/admin/events/actions";
import type { EventFormInput } from "@/lib/events/schema";

const {
  authMock,
  ensureUniqueEventSlugMock,
  getPrismaClientMock,
  revalidatePathMock,
} = vi.hoisted(() => ({
  authMock: vi.fn(),
  ensureUniqueEventSlugMock: vi.fn(),
  getPrismaClientMock: vi.fn(),
  revalidatePathMock: vi.fn(),
}));

vi.mock("@/auth", () => ({
  auth: authMock,
}));

vi.mock("@/lib/events/slug", () => ({
  ensureUniqueEventSlug: ensureUniqueEventSlugMock,
}));

vi.mock("@/lib/prisma", () => ({
  getPrismaClient: getPrismaClientMock,
}));

vi.mock("next/cache", () => ({
  revalidatePath: revalidatePathMock,
}));

const validInput: EventFormInput & { eventId: string } = {
  eventId: "11111111-1111-4111-8111-111111111111",
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
  scoringCriteria: [
    { name: "创新性", maxScore: 10, weight: 40 },
    { name: "完成度", maxScore: 10, weight: 35 },
  ],
  customFields: [],
};

function createPrismaMock(options?: {
  existingEvent?: {
    id: string;
    slug: string;
    scoringCriteria: EventFormInput["scoringCriteria"];
    _count: { projectScores: number };
  } | null;
}) {
  const eventUpdate = vi.fn().mockResolvedValue({
    id: validInput.eventId,
    slug: "ai-hackathon-2026",
    published: true,
  });

  return {
    prisma: {
      event: {
        findUnique:
          vi.fn().mockResolvedValue(
            options?.existingEvent ?? {
              id: validInput.eventId,
              slug: "ai-hackathon-2026",
              scoringCriteria: validInput.scoringCriteria,
              _count: { projectScores: 0 },
            }
          ),
        update: eventUpdate,
      },
    },
    eventUpdate,
  };
}

function createJudgeRemovalPrismaMock(options?: {
  event?: { id: string; slug: string } | null;
  assignment?: { userId: string } | null;
}) {
  const projectScoreDeleteMany = vi.fn().mockResolvedValue({ count: 2 });
  const eventJudgeDelete = vi.fn().mockResolvedValue({ id: "assignment-1" });
  const transaction = vi.fn(async (operations: Promise<unknown>[]) => Promise.all(operations));

  return {
    prisma: {
      event: {
        findUnique: vi.fn().mockResolvedValue(
          options?.event ?? {
            id: validInput.eventId,
            slug: "ai-hackathon-2026",
          }
        ),
      },
      eventJudge: {
        findUnique: vi.fn().mockResolvedValue(options?.assignment ?? { userId: "judge-1" }),
        delete: eventJudgeDelete,
      },
      projectScore: {
        deleteMany: projectScoreDeleteMany,
      },
      $transaction: transaction,
    },
    projectScoreDeleteMany,
    eventJudgeDelete,
    transaction,
  };
}

afterEach(() => {
  vi.clearAllMocks();
});

describe("admin event actions", () => {
  it("returns conflict when scored events try to change scoring criteria", async () => {
    authMock.mockResolvedValue({ user: { id: "admin-1", role: "ADMIN" } });
    ensureUniqueEventSlugMock.mockResolvedValue("ai-hackathon-2026");
    const { prisma, eventUpdate } = createPrismaMock({
      existingEvent: {
        id: validInput.eventId,
        slug: "ai-hackathon-2026",
        scoringCriteria: validInput.scoringCriteria,
        _count: { projectScores: 1 },
      },
    });
    getPrismaClientMock.mockReturnValue(prisma);

    await expect(
      updateEvent({
        ...validInput,
        scoringCriteria: [{ name: "产品价值", maxScore: 10, weight: 40 }],
      })
    ).resolves.toEqual({
      success: false,
      error: {
        code: "CONFLICT",
        message:
          "赛事已有评分记录，已有评分后不可修改评分维度。为避免影响已提交评分和榜单汇总，请先处理已有评分后再调整。",
        fieldErrors: undefined,
      },
    });

    expect(eventUpdate).not.toHaveBeenCalled();
  });

  it("allows updates when scored events keep the same scoring criteria", async () => {
    authMock.mockResolvedValue({ user: { id: "admin-1", role: "ADMIN" } });
    ensureUniqueEventSlugMock.mockResolvedValue("ai-hackathon-2026");
    const { prisma, eventUpdate } = createPrismaMock({
      existingEvent: {
        id: validInput.eventId,
        slug: "ai-hackathon-2026",
        scoringCriteria: validInput.scoringCriteria,
        _count: { projectScores: 2 },
      },
    });
    getPrismaClientMock.mockReturnValue(prisma);

    await expect(
      updateEvent({
        ...validInput,
        description: "更新后的赛事描述，继续保留原评分维度不变。",
      })
    ).resolves.toEqual({
      success: true,
      data: {
        id: validInput.eventId,
        slug: "ai-hackathon-2026",
        published: true,
      },
    });

    expect(eventUpdate).toHaveBeenCalledOnce();
  });

  it("allows scoring criteria changes before any score exists", async () => {
    authMock.mockResolvedValue({ user: { id: "admin-1", role: "ADMIN" } });
    ensureUniqueEventSlugMock.mockResolvedValue("ai-hackathon-2026");
    const { prisma, eventUpdate } = createPrismaMock();
    getPrismaClientMock.mockReturnValue(prisma);

    await expect(
      updateEvent({
        ...validInput,
        scoringCriteria: [{ name: "产品价值", maxScore: 12, weight: 100 }],
      })
    ).resolves.toEqual({
      success: true,
      data: {
        id: validInput.eventId,
        slug: "ai-hackathon-2026",
        published: true,
      },
    });

    expect(eventUpdate).toHaveBeenCalledOnce();
  });

  it("removes a judge and revokes their historical scores for the event", async () => {
    authMock.mockResolvedValue({ user: { id: "admin-1", role: "ADMIN" } });
    const { prisma, projectScoreDeleteMany, eventJudgeDelete, transaction } =
      createJudgeRemovalPrismaMock();
    getPrismaClientMock.mockReturnValue(prisma);

    await expect(
      removeJudgeFromEvent({
        eventId: validInput.eventId,
        judgeUserId: "judge-1",
      })
    ).resolves.toEqual({
      success: true,
      data: {
        userId: "judge-1",
      },
    });

    expect(projectScoreDeleteMany).toHaveBeenCalledWith({
      where: {
        eventId: validInput.eventId,
        judgeId: "judge-1",
      },
    });
    expect(eventJudgeDelete).toHaveBeenCalledWith({
      where: {
        eventId_userId: {
          eventId: validInput.eventId,
          userId: "judge-1",
        },
      },
    });
    expect(transaction).toHaveBeenCalledOnce();
  });
});
