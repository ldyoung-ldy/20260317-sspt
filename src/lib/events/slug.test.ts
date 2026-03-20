import type { PrismaClient } from "@prisma/client";
import { describe, expect, it, vi } from "vitest";
import { ensureUniqueEventSlug, slugifyEventName } from "@/lib/events/slug";

describe("event slug", () => {
  it("normalizes names into url-safe slugs", () => {
    expect(slugifyEventName("AI 创新挑战赛 2026!")).toBe("ai-2026");
    expect(slugifyEventName("  ")).toBe("event");
  });

  it("retries until a free slug is found", async () => {
    const findUnique = vi
      .fn()
      .mockResolvedValueOnce({ id: "event-1" })
      .mockResolvedValueOnce(null);
    const prisma = {
      event: { findUnique },
    } as unknown as PrismaClient;

    await expect(ensureUniqueEventSlug(prisma, "AI Demo Day")).resolves.toBe(
      "ai-demo-day-2"
    );
    expect(findUnique).toHaveBeenCalledTimes(2);
  });
});
