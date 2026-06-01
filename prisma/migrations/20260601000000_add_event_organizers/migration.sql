-- AlterTable
ALTER TABLE "Event" ADD COLUMN "organizers" JSONB NOT NULL DEFAULT '[]';
