-- Migration: Add App Contract, Manifest, and KillSwitch fields to MarketplaceApp
-- Safe for PostgreSQL (production & staging)

ALTER TABLE "marketplace_apps" ADD COLUMN IF NOT EXISTS "version" TEXT DEFAULT '1.0.0';
ALTER TABLE "marketplace_apps" ADD COLUMN IF NOT EXISTS "permissions" JSONB DEFAULT '[]'::jsonb;
ALTER TABLE "marketplace_apps" ADD COLUMN IF NOT EXISTS "settingsSchema" JSONB;
ALTER TABLE "marketplace_apps" ADD COLUMN IF NOT EXISTS "killSwitch" BOOLEAN DEFAULT false;
ALTER TABLE "marketplace_apps" ADD COLUMN IF NOT EXISTS "manifest" JSONB;
