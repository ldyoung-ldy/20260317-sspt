"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/auth";
import { ActionResultError, safeActionWithSchema } from "@/lib/action-result";
import { getEventDeletionBlockReason } from "@/lib/events/delete-policy";
import { ensureUniqueEventSlug } from "@/lib/events/slug";
import { eventFormSchema, toEventMutationData, type EventFormInput } from "@/lib/events/schema";
import { getPrismaClient } from "@/lib/prisma";

const updateEventSchema = eventFormSchema.extend({
  eventId: z.string().uuid("赛事 ID 无效。"),
});

const togglePublishSchema = z.object({
  eventId: z.string().uuid("赛事 ID 无效。"),
  published: z.boolean(),
});

const deleteEventSchema = z.object({
  eventId: z.string().uuid("赛事 ID 无效。"),
});

export async function createEvent(input: EventFormInput) {
  return safeActionWithSchema(eventFormSchema, input, async (payload) => {
    await requireAdminAction();

    const prisma = getPrismaClient();
    const slug = await ensureUniqueEventSlug(prisma, payload.name);
    const event = await prisma.event.create({
      data: {
        ...toEventMutationData(payload),
        slug,
      },
      select: {
        id: true,
        slug: true,
        published: true,
      },
    });

    revalidatePath("/admin/events");
    revalidatePath("/");

    return event;
  });
}

export async function updateEvent(input: EventFormInput & { eventId: string }) {
  return safeActionWithSchema(updateEventSchema, input, async ({ eventId, ...payload }) => {
    await requireAdminAction();

    const prisma = getPrismaClient();
    const existingEvent = await prisma.event.findUnique({
      where: { id: eventId },
      select: { id: true, slug: true },
    });

    if (!existingEvent) {
      throw new ActionResultError("NOT_FOUND", "赛事不存在或已被删除。");
    }

    const nextSlug = await ensureUniqueEventSlug(prisma, payload.name, existingEvent.id);
    const event = await prisma.event.update({
      where: { id: eventId },
      data: {
        ...toEventMutationData(payload),
        slug: nextSlug,
      },
      select: {
        id: true,
        slug: true,
        published: true,
      },
    });

    revalidatePath("/admin/events");
    revalidatePath("/");
    revalidatePath(`/events/${existingEvent.slug}`);
    revalidatePath(`/events/${event.slug}`);

    return event;
  });
}

export async function togglePublish(input: { eventId: string; published: boolean }) {
  return safeActionWithSchema(togglePublishSchema, input, async ({ eventId, published }) => {
    await requireAdminAction();

    const prisma = getPrismaClient();
    const event = await prisma.event.update({
      where: { id: eventId },
      data: { published },
      select: {
        id: true,
        slug: true,
        published: true,
      },
    });

    revalidatePath("/admin/events");
    revalidatePath("/");
    revalidatePath(`/events/${event.slug}`);

    return event;
  });
}

export async function deleteEvent(input: { eventId: string }) {
  return safeActionWithSchema(deleteEventSchema, input, async ({ eventId }) => {
    await requireAdminAction();

    const prisma = getPrismaClient();
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: {
        id: true,
        slug: true,
        published: true,
        _count: {
          select: {
            registrations: true,
            projects: true,
            projectScores: true,
            judges: true,
          },
        },
      },
    });

    if (!event) {
      throw new ActionResultError("NOT_FOUND", "赛事不存在或已被删除。");
    }

    const blockReason = getEventDeletionBlockReason({
      published: event.published,
      registrationsCount: event._count.registrations,
      projectsCount: event._count.projects,
      projectScoresCount: event._count.projectScores,
      judgesCount: event._count.judges,
    });

    if (blockReason) {
      throw new ActionResultError("CONFLICT", blockReason);
    }

    await prisma.event.delete({
      where: { id: eventId },
      select: { id: true },
    });

    revalidatePath("/admin/events");
    revalidatePath("/");
    revalidatePath(`/admin/events/${eventId}/edit`);
    revalidatePath(`/events/${event.slug}`);

    return {
      id: eventId,
    };
  });
}

async function requireAdminAction() {
  const session = await auth();

  if (!session?.user) {
    throw new ActionResultError("UNAUTHORIZED", "请先登录管理员账号。");
  }

  if (session.user.role !== "ADMIN") {
    throw new ActionResultError("FORBIDDEN", "仅管理员可执行此操作。");
  }

  return session;
}
