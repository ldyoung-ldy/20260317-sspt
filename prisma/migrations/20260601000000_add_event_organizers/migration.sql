-- AlterTable
ALTER TABLE "Event" ADD COLUMN "organizers" TEXT[] NOT NULL DEFAULT '{}';
