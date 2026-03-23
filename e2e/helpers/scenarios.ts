import { randomUUID } from "node:crypto";
import { getPrismaForE2E } from "./db";
import { E2E_USERS } from "./users";

export type E2EEventPhase = "registration" | "submission" | "review" | "post-review";

type EventWindowInput = {
  phase: E2EEventPhase;
};

export async function createDraftEventScenario() {
  const prisma = getPrismaForE2E();
  const { startDate, endDate, registrationStart, registrationEnd, submissionStart, submissionEnd, reviewStart, reviewEnd } =
    buildEventWindowInput({ phase: "registration" });

  const slug = `e2e-admin-publish-${randomUUID().slice(0, 8)}`;

  const event = await prisma.event.create({
    data: {
      name: `E2E 管理员发布赛事 ${slug}`,
      slug,
      description: "用于验证管理员创建、发布与前台可见链路的 E2E 测试赛事。",
      startDate,
      endDate,
      registrationStart,
      registrationEnd,
      submissionStart,
      submissionEnd,
      reviewStart,
      reviewEnd,
      published: false,
      rankingsPublished: false,
      tracks: [{ name: "企业智能体", description: "聚焦实际业务协作场景" }],
      challenges: [{ title: "流程自动化", description: "提升效率与稳定性" }],
      prizes: [{ title: "优胜奖", description: "展示与奖金支持", amount: "¥5,000" }],
      scoringCriteria: [
        { name: "创新性", maxScore: 10, weight: 40 },
        { name: "完成度", maxScore: 10, weight: 35 },
        { name: "落地价值", maxScore: 10, weight: 25 },
      ],
      customFields: [
        {
          id: "team-background",
          label: "团队背景",
          type: "textarea",
          required: true,
          options: [],
        },
      ],
    },
    select: {
      id: true,
      slug: true,
      name: true,
    },
  });

  return event;
}

export async function seedRegistrationSubmissionScenario() {
  const prisma = getPrismaForE2E();
  const slug = `e2e-registration-submission-${randomUUID().slice(0, 8)}`;
  const windows = buildEventWindowInput({ phase: "registration" });

  return prisma.event.create({
    data: {
      name: `E2E 报名提交赛事 ${slug}`,
      slug,
      description: "用于验证报名、管理员审核、用户确认和作品提交的 E2E 赛事。",
      ...windows,
      published: true,
      rankingsPublished: false,
      tracks: [{ name: "效率工具", description: "面向组织协作与交付效率" }],
      challenges: [{ title: "知识沉淀", description: "优化内部知识库和工作流" }],
      prizes: [{ title: "最佳作品", description: "最佳落地方案", amount: "¥8,000" }],
      scoringCriteria: [
        { name: "创新性", maxScore: 10, weight: 40 },
        { name: "完成度", maxScore: 10, weight: 35 },
        { name: "落地价值", maxScore: 10, weight: 25 },
      ],
      customFields: [
        {
          id: "team-background",
          label: "团队背景",
          type: "textarea",
          required: true,
          options: [],
        },
      ],
    },
    select: {
      id: true,
      slug: true,
      name: true,
    },
  });
}

export async function seedReviewRankingScenario() {
  const prisma = getPrismaForE2E();
  const slug = `e2e-review-ranking-${randomUUID().slice(0, 8)}`;
  const windows = buildEventWindowInput({ phase: "review" });
  const event = await prisma.event.create({
    data: {
      name: `E2E 评审排名赛事 ${slug}`,
      slug,
      description: "用于验证评委评分、后台榜单汇总与前台公示的 E2E 赛事。",
      ...windows,
      published: true,
      rankingsPublished: false,
      tracks: [{ name: "企业智能体", description: "帮助企业团队提效" }],
      challenges: [{ title: "流程自动化", description: "减少重复劳动" }],
      prizes: [{ title: "冠军", description: "综合评分最高", amount: "¥10,000" }],
      scoringCriteria: [
        { name: "创新性", maxScore: 10, weight: 40 },
        { name: "完成度", maxScore: 10, weight: 35 },
        { name: "落地价值", maxScore: 10, weight: 25 },
      ],
      customFields: [],
      registrations: {
        create: [
          {
            userId: E2E_USERS.participant.id,
            status: "CONFIRMED",
            teamName: "E2E Team Alpha",
            answers: [],
          },
          {
            userId: E2E_USERS.participantTwo.id,
            status: "CONFIRMED",
            teamName: "E2E Team Beta",
            answers: [],
          },
        ],
      },
      projects: {
        create: [
          {
            submittedBy: E2E_USERS.participant.id,
            name: "Alpha Copilot",
            description: "帮助团队自动整理 SOP 与任务流转。",
            teamName: "E2E Team Alpha",
            sourceUrl: "https://github.com/example/alpha-copilot",
            demoUrl: "https://demo.example.com/alpha-copilot",
            videoUrl: "https://video.example.com/alpha-copilot",
            track: "企业智能体",
            challenges: ["流程自动化"],
            status: "FINAL",
          },
          {
            submittedBy: E2E_USERS.participantTwo.id,
            name: "Beta Workspace",
            description: "围绕知识协同和文档洞察的企业应用。",
            teamName: "E2E Team Beta",
            sourceUrl: "https://github.com/example/beta-workspace",
            demoUrl: "https://demo.example.com/beta-workspace",
            videoUrl: "https://video.example.com/beta-workspace",
            track: "企业智能体",
            challenges: ["流程自动化"],
            status: "FINAL",
          },
        ],
      },
    },
    select: {
      id: true,
      slug: true,
      name: true,
      projects: {
        select: {
          id: true,
          name: true,
          submittedBy: true,
        },
        orderBy: [{ name: "asc" }],
      },
    },
  });

  return event;
}

export async function shiftEventPhase(eventId: string, phase: E2EEventPhase) {
  const prisma = getPrismaForE2E();
  const windows = buildEventWindowInput({ phase });

  return prisma.event.update({
    where: { id: eventId },
    data: windows,
    select: {
      id: true,
      slug: true,
      reviewStart: true,
      reviewEnd: true,
      submissionStart: true,
      submissionEnd: true,
      registrationStart: true,
      registrationEnd: true,
    },
  });
}

function buildEventWindowInput({ phase }: EventWindowInput) {
  const hour = 60 * 60 * 1000;
  const day = 24 * hour;
  const now = Date.now();

  switch (phase) {
    case "registration":
      return {
        startDate: new Date(now - day),
        endDate: new Date(now + 14 * day),
        registrationStart: new Date(now - hour),
        registrationEnd: new Date(now + hour),
        submissionStart: new Date(now + 2 * hour),
        submissionEnd: new Date(now + 2 * day),
        reviewStart: new Date(now + 3 * day),
        reviewEnd: new Date(now + 5 * day),
      };
    case "submission":
      return {
        startDate: new Date(now - 2 * day),
        endDate: new Date(now + 12 * day),
        registrationStart: new Date(now - 5 * day),
        registrationEnd: new Date(now - 2 * hour),
        submissionStart: new Date(now - hour),
        submissionEnd: new Date(now + hour),
        reviewStart: new Date(now + 3 * hour),
        reviewEnd: new Date(now + 3 * day),
      };
    case "review":
      return {
        startDate: new Date(now - 5 * day),
        endDate: new Date(now + 10 * day),
        registrationStart: new Date(now - 8 * day),
        registrationEnd: new Date(now - 5 * day),
        submissionStart: new Date(now - 4 * day),
        submissionEnd: new Date(now - 2 * hour),
        reviewStart: new Date(now - hour),
        reviewEnd: new Date(now + day),
      };
    case "post-review":
      return {
        startDate: new Date(now - 8 * day),
        endDate: new Date(now + day),
        registrationStart: new Date(now - 12 * day),
        registrationEnd: new Date(now - 9 * day),
        submissionStart: new Date(now - 8 * day),
        submissionEnd: new Date(now - 5 * day),
        reviewStart: new Date(now - 4 * day),
        reviewEnd: new Date(now - hour),
      };
  }
}
