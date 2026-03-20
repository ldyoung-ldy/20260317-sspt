import { PrismaClient } from "@prisma/client";

declare global {
  var __prisma__: PrismaClient | undefined;
}

export function getPrismaClient() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL 未配置，无法初始化 Prisma Client。");
  }

  if (!globalThis.__prisma__) {
    globalThis.__prisma__ = new PrismaClient();
  }

  return globalThis.__prisma__;
}

export function getOptionalPrismaClient() {
  if (!process.env.DATABASE_URL?.trim()) {
    return null;
  }

  return getPrismaClient();
}
