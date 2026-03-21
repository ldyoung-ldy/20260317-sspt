import { Prisma } from "@prisma/client";
import { getEventPhase, type EventPhase } from "@/lib/events/phase";
import { getOptionalPrismaClient } from "@/lib/prisma";
import { parseProjectConfig, parseProjectChallenges } from "@/lib/projects/schema";
import { isProjectStatus, type ProjectStatusValue } from "@/lib/projects/status";

const submissionEventSelect = {
  id: true,
  name: true,
  slug: true,
  description: true,
  published: true,
  startDate: true,
  endDate: true,
  registrationStart: true,
  registrationEnd: true,
  submissionStart: true,
  submissionEnd: true,
  reviewStart: true,
  reviewEnd: true,
  tracks: true,
  challenges: true,
} satisfies Prisma.EventSelect;

const projectSelect = {
  id: true,
  eventId: true,
  submittedBy: true,
  name: true,
  description: true,
  teamName: true,
  sourceUrl: true,
  demoUrl: true,
  videoUrl: true,
  track: true,
  challenges: true,
  status: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.ProjectSelect;

const userProjectSelect = {
  ...projectSelect,
  event: {
    select: {
      id: true,
      name: true,
      slug: true,
      published: true,
      startDate: true,
      endDate: true,
      registrationStart: true,
      registrationEnd: true,
      submissionStart: true,
      submissionEnd: true,
      reviewStart: true,
      reviewEnd: true,
    },
  },
} satisfies Prisma.ProjectSelect;

const adminProjectSelect = {
  ...projectSelect,
  user: {
    select: {
      id: true,
      name: true,
      email: true,
    },
  },
} satisfies Prisma.ProjectSelect;

type SubmissionEventRecord = Prisma.EventGetPayload<{ select: typeof submissionEventSelect }>;
type ProjectRecord = Prisma.ProjectGetPayload<{ select: typeof projectSelect }>;
type UserProjectRecord = Prisma.ProjectGetPayload<{ select: typeof userProjectSelect }>;
type AdminProjectRecord = Prisma.ProjectGetPayload<{ select: typeof adminProjectSelect }>;

export type SubmissionEvent = Omit<SubmissionEventRecord, "tracks" | "challenges"> & {
  tracks: ReturnType<typeof parseProjectConfig>["tracks"];
  challenges: ReturnType<typeof parseProjectConfig>["challenges"];
  phase: EventPhase;
};

export type ProjectRecordView = Omit<ProjectRecord, "challenges"> & {
  challenges: string[];
};

export type UserProject = Omit<UserProjectRecord, "challenges"> & {
  challenges: string[];
  event: UserProjectRecord["event"] & { phase: EventPhase };
};

export type AdminProject = Omit<AdminProjectRecord, "challenges"> & {
  challenges: string[];
};

export type SubmissionPageData = {
  event: SubmissionEvent;
  registration: {
    id: string;
    status: "PENDING" | "ACCEPTED" | "CONFIRMED" | "REJECTED" | "CANCELLED";
    teamName: string | null;
  } | null;
  project: ProjectRecordView | null;
};

export type AdminProjectFilters = {
  status?: ProjectStatusValue;
  track?: string;
  query: string;
};

export async function getProjectSubmissionPageData(slug: string, userId: string) {
  const prisma = getOptionalPrismaClient();

  if (!prisma) {
    return null;
  }

  try {
    const event = await prisma.event.findUnique({
      where: { slug },
      select: submissionEventSelect,
    });

    if (!event || !event.published) {
      return null;
    }

    const [registration, project] = await Promise.all([
      prisma.registration.findUnique({
        where: {
          eventId_userId: {
            eventId: event.id,
            userId,
          },
        },
        select: {
          id: true,
          status: true,
          teamName: true,
        },
      }),
      prisma.project.findUnique({
        where: {
          eventId_submittedBy: {
            eventId: event.id,
            submittedBy: userId,
          },
        },
        select: projectSelect,
      }),
    ]);

    return {
      event: mapSubmissionEvent(event),
      registration,
      project: project ? mapProjectRecord(project) : null,
    } satisfies SubmissionPageData;
  } catch {
    return null;
  }
}

export async function getUserEventProject(eventId: string, userId: string) {
  const prisma = getOptionalPrismaClient();

  if (!prisma) {
    return null;
  }

  try {
    const project = await prisma.project.findUnique({
      where: {
        eventId_submittedBy: {
          eventId,
          submittedBy: userId,
        },
      },
      select: projectSelect,
    });

    return project ? mapProjectRecord(project) : null;
  } catch {
    return null;
  }
}

export async function listUserProjects(userId: string) {
  const prisma = getOptionalPrismaClient();

  if (!prisma) {
    return [] as UserProject[];
  }

  try {
    const projects = await prisma.project.findMany({
      where: { submittedBy: userId },
      select: userProjectSelect,
      orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
    });

    return projects.map((project) => ({
      ...mapProjectRecord(project),
      event: {
        ...project.event,
        phase: getEventPhase(project.event),
      },
    }));
  } catch {
    return [] as UserProject[];
  }
}

export async function getAdminEventProjects(eventId: string, filters: AdminProjectFilters) {
  const prisma = getOptionalPrismaClient();

  if (!prisma) {
    return null;
  }

  try {
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: submissionEventSelect,
    });

    if (!event) {
      return null;
    }

    const where = buildAdminProjectWhere(eventId, filters);
    const [projects, groupedCounts] = await Promise.all([
      prisma.project.findMany({
        where,
        select: adminProjectSelect,
        orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
      }),
      prisma.project.groupBy({
        by: ["status"],
        where: { eventId },
        _count: { _all: true },
      }),
    ]);

    return {
      event: mapSubmissionEvent(event),
      filters,
      statusCounts: {
        DRAFT: groupedCounts.find((item) => item.status === "DRAFT")?._count._all ?? 0,
        FINAL: groupedCounts.find((item) => item.status === "FINAL")?._count._all ?? 0,
      },
      projects: projects.map(mapAdminProject),
    };
  } catch {
    return null;
  }
}

export async function listAdminProjectsForExport(eventId: string, filters: AdminProjectFilters) {
  return getAdminEventProjects(eventId, filters);
}

export function parseAdminProjectFilters(input: {
  status?: string | string[];
  track?: string | string[];
  query?: string | string[];
}) {
  const statusInput = Array.isArray(input.status) ? input.status[0] : input.status;
  const trackInput = Array.isArray(input.track) ? input.track[0] : input.track;
  const queryInput = Array.isArray(input.query) ? input.query[0] : input.query;

  return {
    status: statusInput && isProjectStatus(statusInput) ? statusInput : undefined,
    track: trackInput?.trim() || undefined,
    query: queryInput?.trim() ?? "",
  } satisfies AdminProjectFilters;
}

function mapSubmissionEvent(event: SubmissionEventRecord): SubmissionEvent {
  const config = parseProjectConfig({
    tracks: event.tracks,
    challenges: event.challenges,
  });

  return {
    ...event,
    ...config,
    phase: getEventPhase(event),
  };
}

function mapProjectRecord<T extends ProjectRecord>(project: T): Omit<T, "challenges"> & { challenges: string[] } {
  return {
    ...project,
    challenges: parseProjectChallenges(project.challenges),
  };
}

function mapAdminProject(project: AdminProjectRecord): AdminProject {
  return {
    ...project,
    challenges: parseProjectChallenges(project.challenges),
  };
}

function buildAdminProjectWhere(eventId: string, filters: AdminProjectFilters): Prisma.ProjectWhereInput {
  const orFilters: Prisma.ProjectWhereInput[] = [];

  if (filters.query) {
    orFilters.push(
      { name: { contains: filters.query, mode: "insensitive" } },
      { teamName: { contains: filters.query, mode: "insensitive" } },
      { user: { is: { name: { contains: filters.query, mode: "insensitive" } } } },
      { user: { is: { email: { contains: filters.query, mode: "insensitive" } } } }
    );
  }

  return {
    eventId,
    ...(filters.status ? { status: filters.status } : {}),
    ...(filters.track ? { track: filters.track } : {}),
    ...(orFilters.length > 0 ? { OR: orFilters } : {}),
  };
}
