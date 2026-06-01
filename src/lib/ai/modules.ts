export interface LandingModule {
  id: string;
  name: string;
  description: string;
  defaultEnabled: boolean;
  locked: boolean;
  requiredDataKeys: string[];
}

export const LANDING_MODULES: LandingModule[] = [
  {
    id: "intro",
    name: "赛事介绍",
    description: "赛事名称和详细描述",
    defaultEnabled: true,
    locked: true,
    requiredDataKeys: ["name", "description"],
  },
  {
    id: "eligibility",
    name: "参赛对象",
    description: "参赛资格和面向人群",
    defaultEnabled: true,
    locked: false,
    requiredDataKeys: ["eligibility"],
  },
  {
    id: "requirements",
    name: "参赛要求",
    description: "组队规则、提交要求等",
    defaultEnabled: true,
    locked: false,
    requiredDataKeys: ["requirements"],
  },
  {
    id: "tracks",
    name: "赛道介绍",
    description: "赛事赛道或方向",
    defaultEnabled: true,
    locked: false,
    requiredDataKeys: ["tracks"],
  },
  {
    id: "challenges",
    name: "赛题",
    description: "具体赛题或挑战",
    defaultEnabled: true,
    locked: false,
    requiredDataKeys: ["challenges"],
  },
  {
    id: "timeline",
    name: "赛程时间线",
    description: "报名、提交、评审等各阶段时间",
    defaultEnabled: true,
    locked: false,
    requiredDataKeys: [
      "registrationStart",
      "registrationEnd",
      "submissionStart",
      "submissionEnd",
      "reviewStart",
      "reviewEnd",
    ],
  },
  {
    id: "prizes",
    name: "赛事奖励",
    description: "奖金、奖品和荣誉",
    defaultEnabled: true,
    locked: false,
    requiredDataKeys: ["prizes"],
  },
  {
    id: "scoring",
    name: "评分标准",
    description: "评审维度和权重",
    defaultEnabled: false,
    locked: false,
    requiredDataKeys: ["scoringCriteria"],
  },
  {
    id: "organizers",
    name: "组织单位",
    description: "主办方、承办方等信息",
    defaultEnabled: false,
    locked: false,
    requiredDataKeys: ["organizers"],
  },
  {
    id: "cta",
    name: "报名入口",
    description: "立即报名按钮和链接",
    defaultEnabled: true,
    locked: true,
    requiredDataKeys: [],
  },
];

export interface EventDataForModules {
  name?: string;
  description?: string;
  eligibility?: string | null;
  requirements?: string | null;
  tracks?: unknown[];
  challenges?: unknown[];
  prizes?: unknown[];
  scoringCriteria?: unknown[];
  organizers?: unknown[];
  registrationStart?: Date | string;
  registrationEnd?: Date | string;
  submissionStart?: Date | string;
  submissionEnd?: Date | string;
  reviewStart?: Date | string;
  reviewEnd?: Date | string;
}

export function getModuleAvailability(
  eventData: EventDataForModules
): Map<string, boolean> {
  const availability = new Map<string, boolean>();

  for (const mod of LANDING_MODULES) {
    const hasData = mod.requiredDataKeys.every((key) => {
      const value = eventData[key as keyof EventDataForModules];
      if (value == null) return false;
      if (Array.isArray(value)) return value.length > 0;
      if (typeof value === "string") return value.trim().length > 0;
      return true;
    });
    availability.set(mod.id, hasData);
  }

  return availability;
}

export function getDefaultEnabledModules(
  eventData: EventDataForModules
): string[] {
  const availability = getModuleAvailability(eventData);

  return LANDING_MODULES.filter(
    (mod) => mod.defaultEnabled && availability.get(mod.id)
  ).map((mod) => mod.id);
}
