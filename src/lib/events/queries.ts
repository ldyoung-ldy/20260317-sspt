import { Prisma } from "@prisma/client";
import { getOptionalPrismaClient } from "@/lib/prisma";
import { getEventPhase, type EventPhase } from "@/lib/events/phase";
import { parseEventJsonFields } from "@/lib/events/schema";

const eventDetailsSelect = {
  id: true,
  name: true,
  slug: true,
  description: true,
  published: true,
  rankingsPublished: true,
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
  prizes: true,
  scoringCriteria: true,
  customFields: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.EventSelect;

type EventDetailsRecord = Prisma.EventGetPayload<{ select: typeof eventDetailsSelect }>;

export type EventDetails = Omit<
  EventDetailsRecord,
  "tracks" | "challenges" | "prizes" | "scoringCriteria" | "customFields"
> &
  ReturnType<typeof parseEventJsonFields> & {
    phase: EventPhase;
  };

export async function listAdminEvents() {
  const prisma = getOptionalPrismaClient();

  if (!prisma) {
    return [] as EventDetails[];
  }

  try {
    const events = await prisma.event.findMany({
      select: eventDetailsSelect,
      orderBy: [{ startDate: "asc" }, { createdAt: "desc" }],
    });

    return events.map(mapEventDetails);
  } catch {
    return [] as EventDetails[];
  }
}

export async function listPublishedEvents() {
  const prisma = getOptionalPrismaClient();

  if (!prisma) {
    return [] as EventDetails[];
  }

  try {
    const events = await prisma.event.findMany({
      where: { published: true },
      select: eventDetailsSelect,
      orderBy: [{ startDate: "asc" }, { createdAt: "desc" }],
    });

    return events.map(mapEventDetails);
  } catch {
    return [] as EventDetails[];
  }
}

export async function getPublishedEventBySlug(slug: string) {
  const prisma = getOptionalPrismaClient();

  if (!prisma) {
    return null;
  }

  try {
    const event = await prisma.event.findUnique({
      where: { slug },
      select: eventDetailsSelect,
    });

    if (!event || !event.published) {
      return null;
    }

    return mapEventDetails(event);
  } catch {
    return null;
  }
}

function mapEventDetails(event: EventDetailsRecord): EventDetails {
  return {
    ...event,
    ...parseEventJsonFields(event),
    phase: getEventPhase(event),
  };
}
