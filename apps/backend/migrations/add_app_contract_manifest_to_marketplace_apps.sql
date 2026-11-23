-- Migration: Add App Contract, Manifest, and KillSwitch fields to MarketplaceApp
-- Safe, additive, and idempotent for PostgreSQL (production & staging)

-- ==============================================================================
-- UP MIGRATION
-- ==============================================================================

-- Contract specification fields
ALTER TABLE "marketplace_apps" ADD COLUMN IF NOT EXISTS "manifest_version" TEXT;
ALTER TABLE "marketplace_apps" ADD COLUMN IF NOT EXISTS "app_version" TEXT;
ALTER TABLE "marketplace_apps" ADD COLUMN IF NOT EXISTS "permissions" JSONB DEFAULT '[]'::jsonb;
ALTER TABLE "marketplace_apps" ADD COLUMN IF NOT EXISTS "settingsSchema" JSONB;
ALTER TABLE "marketplace_apps" ADD COLUMN IF NOT EXISTS "entry_route" TEXT;
ALTER TABLE "marketplace_apps" ADD COLUMN IF NOT EXISTS "kill_switch" BOOLEAN DEFAULT false;
ALTER TABLE "marketplace_apps" ADD COLUMN IF NOT EXISTS "kill_switch_reason" TEXT;
ALTER TABLE "marketplace_apps" ADD COLUMN IF NOT EXISTS "kill_switch_at" TIMESTAMP WITH TIME ZONE;

-- Compatibility aliases
ALTER TABLE "marketplace_apps" ADD COLUMN IF NOT EXISTS "version" TEXT DEFAULT '1.0.0';
ALTER TABLE "marketplace_apps" ADD COLUMN IF NOT EXISTS "killSwitch" BOOLEAN DEFAULT false;
ALTER TABLE "marketplace_apps" ADD COLUMN IF NOT EXISTS "manifest" JSONB;

-- ==============================================================================
-- DOWN MIGRATION (Documented for Rollback)
-- ==============================================================================
-- ALTER TABLE "marketplace_apps" DROP COLUMN IF EXISTS "manifest_version";
-- ALTER TABLE "marketplace_apps" DROP COLUMN IF EXISTS "app_version";
-- ALTER TABLE "marketplace_apps" DROP COLUMN IF EXISTS "entry_route";
-- ALTER TABLE "marketplace_apps" DROP COLUMN IF EXISTS "kill_switch_reason";
-- ALTER TABLE "marketplace_apps" DROP COLUMN IF EXISTS "kill_switch_at";
