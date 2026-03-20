import { Prisma } from "@prisma/client";
import { getEventPhase, type EventPhase } from "@/lib/events/phase";
import { getOptionalPrismaClient } from "@/lib/prisma";
import {
  isRegistrationStatus,
  registrationStatuses,
  type RegistrationStatusValue,
} from "@/lib/registration-status";
import {
  parseRegistrationAnswers,
  parseRegistrationCustomFields,
} from "@/lib/registrations/schema";

const registrationEventSelect = {
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
  customFields: true,
} satisfies Prisma.EventSelect;

const myRegistrationSelect = {
  id: true,
  status: true,
  teamName: true,
  answers: true,
  createdAt: true,
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
} satisfies Prisma.RegistrationSelect;

const adminRegistrationSelect = {
  id: true,
  status: true,
  teamName: true,
  answers: true,
  createdAt: true,
  user: {
    select: {
      id: true,
      name: true,
      email: true,
    },
  },
} satisfies Prisma.RegistrationSelect;

type RegistrationEventRecord = Prisma.EventGetPayload<{ select: typeof registrationEventSelect }>;
type MyRegistrationRecord = Prisma.RegistrationGetPayload<{ select: typeof myRegistrationSelect }>;
type AdminRegistrationRecord = Prisma.RegistrationGetPayload<{ select: typeof adminRegistrationSelect }>;

export type RegistrationEvent = Omit<RegistrationEventRecord, "customFields"> & {
  customFields: ReturnType<typeof parseRegistrationCustomFields>;
  phase: EventPhase;
};

export type MyRegistration = Omit<MyRegistrationRecord, "answers"> & {
  answers: ReturnType<typeof parseRegistrationAnswers>;
  event: MyRegistrationRecord["event"] & { phase: EventPhase };
};

export type AdminRegistration = Omit<AdminRegistrationRecord, "answers"> & {
  answers: ReturnType<typeof parseRegistrationAnswers>;
};

export type AdminRegistrationFilters = {
  status?: RegistrationStatusValue;
  query: string;
};

export type RegistrationStatusCounts = Record<RegistrationStatusValue, number>;

export async function getRegistrationEventBySlug(slug: string) {
  const prisma = getOptionalPrismaClient();

  if (!prisma) {
    return null;
  }

  try {
    const event = await prisma.event.findUnique({
      where: { slug },
      select: registrationEventSelect,
    });

    if (!event || !event.published) {
      return null;
    }

    return mapRegistrationEvent(event);
  } catch {
    return null;
  }
}

export async function getUserEventRegistration(eventId: string, userId: string) {
  const prisma = getOptionalPrismaClient();

  if (!prisma) {
    return null;
  }

  try {
    const registration = await prisma.registration.findUnique({
      where: {
        eventId_userId: {
          eventId,
          userId,
        },
      },
      select: myRegistrationSelect,
    });

    if (!registration) {
      return null;
    }

    return mapMyRegistration(registration);
  } catch {
    return null;
  }
}

export async function listUserRegistrations(userId: string) {
  const prisma = getOptionalPrismaClient();

  if (!prisma) {
    return [] as MyRegistration[];
  }

  try {
    const registrations = await prisma.registration.findMany({
      where: { userId },
      select: myRegistrationSelect,
      orderBy: [{ createdAt: "desc" }],
    });

    return registrations.map(mapMyRegistration);
  } catch {
    return [] as MyRegistration[];
  }
}

export async function getAdminEventRegistrations(
  eventId: string,
  filters: AdminRegistrationFilters
) {
  const prisma = getOptionalPrismaClient();

  if (!prisma) {
    return null;
  }

  try {
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: registrationEventSelect,
    });

    if (!event) {
      return null;
    }

    const where = buildAdminRegistrationWhere(eventId, filters);
    const [registrations, groupedCounts] = await Promise.all([
      prisma.registration.findMany({
        where,
        select: adminRegistrationSelect,
        orderBy: [{ createdAt: "desc" }],
      }),
      prisma.registration.groupBy({
        by: ["status"],
        where: { eventId },
        _count: { _all: true },
      }),
    ]);

    return {
      event: mapRegistrationEvent(event),
      filters,
      statusCounts: toStatusCounts(groupedCounts),
      registrations: registrations.map(mapAdminRegistration),
    };
  } catch {
    return null;
  }
}

export async function listAdminRegistrationsForExport(
  eventId: string,
  filters: AdminRegistrationFilters
) {
  const data = await getAdminEventRegistrations(eventId, filters);

  if (!data) {
    return null;
  }

  return data;
}

export function parseAdminRegistrationFilters(input: {
  status?: string | string[];
  query?: string | string[];
}): AdminRegistrationFilters {
  const statusInput = Array.isArray(input.status) ? input.status[0] : input.status;
  const queryInput = Array.isArray(input.query) ? input.query[0] : input.query;

  return {
    status: statusInput && isRegistrationStatus(statusInput) ? statusInput : undefined,
    query: queryInput?.trim() ?? "",
  };
}

function mapRegistrationEvent(event: RegistrationEventRecord): RegistrationEvent {
  return {
    ...event,
    customFields: parseRegistrationCustomFields(event.customFields),
    phase: getEventPhase(event),
  };
}

function mapMyRegistration(registration: MyRegistrationRecord): MyRegistration {
  return {
    ...registration,
    answers: parseRegistrationAnswers(registration.answers),
    event: {
      ...registration.event,
      phase: getEventPhase(registration.event),
    },
  };
}

function mapAdminRegistration(registration: AdminRegistrationRecord): AdminRegistration {
  return {
    ...registration,
    answers: parseRegistrationAnswers(registration.answers),
  };
}

function buildAdminRegistrationWhere(eventId: string, filters: AdminRegistrationFilters) {
  const where: Prisma.RegistrationWhereInput = {
    eventId,
  };

  if (filters.status) {
    where.status = filters.status;
  }

  if (filters.query) {
    where.OR = [
      {
        teamName: {
          contains: filters.query,
          mode: "insensitive",
        },
      },
      {
        user: {
          name: {
            contains: filters.query,
            mode: "insensitive",
          },
        },
      },
      {
        user: {
          email: {
            contains: filters.query,
            mode: "insensitive",
          },
        },
      },
    ];
  }

  return where;
}

function toStatusCounts(
  groupedCounts: Array<{
    status: RegistrationStatusValue;
    _count: { _all: number };
  }>
): RegistrationStatusCounts {
  const counts = Object.fromEntries(
    registrationStatuses.map((status) => [status, 0])
  ) as RegistrationStatusCounts;

  groupedCounts.forEach((item) => {
    counts[item.status] = item._count._all;
  });

  return counts;
}
