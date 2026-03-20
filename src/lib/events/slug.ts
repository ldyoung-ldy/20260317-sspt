import type { PrismaClient } from "@prisma/client";
import { ActionResultError } from "@/lib/action-result";

const MAX_SLUG_ATTEMPTS = 50;

export function slugifyEventName(name: string) {
  const slug = name
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");

  return slug || "event";
}

export async function ensureUniqueEventSlug(
  prisma: PrismaClient,
  name: string,
  excludeEventId?: string
) {
  const baseSlug = slugifyEventName(name);

  for (let attempt = 0; attempt < MAX_SLUG_ATTEMPTS; attempt += 1) {
    const candidate = attempt === 0 ? baseSlug : `${baseSlug}-${attempt + 1}`;
    const existing = await prisma.event.findUnique({
      where: { slug: candidate },
      select: { id: true },
    });

    if (!existing || existing.id === excludeEventId) {
      return candidate;
    }
  }

  throw new ActionResultError("CONFLICT", "赛事 slug 生成失败，请稍后重试。");
}
