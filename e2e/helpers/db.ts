import { PrismaClient, type Prisma } from "@prisma/client";
import { assertSafeE2EDatabaseUrl, getRequiredEnv } from "./env";
import { E2E_USERS } from "./users";

let prisma: PrismaClient | null = null;

function getE2EPrismaClient() {
  if (!prisma) {
    assertSafeE2EDatabaseUrl(getRequiredEnv("DATABASE_URL"));
    prisma = new PrismaClient();
  }

  return prisma;
}

export async function resetE2EDatabase() {
  const client = getE2EPrismaClient();

  await client.$transaction([
    client.projectScore.deleteMany(),
    client.eventJudge.deleteMany(),
    client.project.deleteMany(),
    client.registration.deleteMany(),
    client.session.deleteMany(),
    client.account.deleteMany(),
    client.verificationToken.deleteMany(),
    client.event.deleteMany(),
    client.user.deleteMany(),
  ]);
}

export async function seedCoreUsers() {
  const client = getE2EPrismaClient();
  const now = new Date();
  const records = Object.values(E2E_USERS).map((user) => ({
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    emailVerified: now,
  })) satisfies Prisma.UserCreateManyInput[];

  await client.user.createMany({
    data: records,
  });
}

export async function resetAndSeedCoreUsers() {
  await resetE2EDatabase();
  await seedCoreUsers();
}

export async function closeE2EPrisma() {
  if (!prisma) {
    return;
  }

  await prisma.$disconnect();
  prisma = null;
}

export function getPrismaForE2E() {
  return getE2EPrismaClient();
}
