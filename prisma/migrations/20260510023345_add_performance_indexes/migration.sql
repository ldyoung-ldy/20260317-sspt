-- CreateIndex
CREATE INDEX IF NOT EXISTS "Event_published_startDate_createdAt_idx" ON "Event"("published", "startDate", "createdAt");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "EventJudge_userId_idx" ON "EventJudge"("userId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Project_submittedBy_updatedAt_createdAt_idx" ON "Project"("submittedBy", "updatedAt", "createdAt");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Project_eventId_status_updatedAt_createdAt_idx" ON "Project"("eventId", "status", "updatedAt", "createdAt");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "ProjectScore_eventId_judgeId_idx" ON "ProjectScore"("eventId", "judgeId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Registration_userId_createdAt_idx" ON "Registration"("userId", "createdAt");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Registration_eventId_status_createdAt_idx" ON "Registration"("eventId", "status", "createdAt");

