-- Migration: Add attribution and registrar tracking columns to education_demo_attendees
-- Created: 2026-11-21

ALTER TABLE "education_demo_attendees" ADD COLUMN IF NOT EXISTS "registeredByType" TEXT;
ALTER TABLE "education_demo_attendees" ADD COLUMN IF NOT EXISTS "registeredByUserId" TEXT;
ALTER TABLE "education_demo_attendees" ADD COLUMN IF NOT EXISTS "registeredByName" TEXT;
ALTER TABLE "education_demo_attendees" ADD COLUMN IF NOT EXISTS "sourceChannel" TEXT;
ALTER TABLE "education_demo_attendees" ADD COLUMN IF NOT EXISTS "sourceRaw" TEXT;
ALTER TABLE "education_demo_attendees" ADD COLUMN IF NOT EXISTS "campaignName" TEXT;
ALTER TABLE "education_demo_attendees" ADD COLUMN IF NOT EXISTS "adRef" TEXT;
ALTER TABLE "education_demo_attendees" ADD COLUMN IF NOT EXISTS "postRef" TEXT;
ALTER TABLE "education_demo_attendees" ADD COLUMN IF NOT EXISTS "landingUrl" TEXT;

CREATE INDEX IF NOT EXISTS "idx_edu_demo_att_company_channel" ON "education_demo_attendees"("companyId", "sourceChannel");
CREATE INDEX IF NOT EXISTS "idx_edu_demo_att_demoday_regtype" ON "education_demo_attendees"("demoDayId", "registeredByType");
