-- Extend UserApiKey with permissionMode (INHERIT_ALL | SCOPED), scopes, rateLimitPerMin, and allowedIps
ALTER TABLE "user_api_keys" ADD COLUMN IF NOT EXISTS "permissionMode" TEXT NOT NULL DEFAULT 'INHERIT_ALL';
ALTER TABLE "user_api_keys" ADD COLUMN IF NOT EXISTS "scopes" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "user_api_keys" ADD COLUMN IF NOT EXISTS "rateLimitPerMin" INTEGER NOT NULL DEFAULT 60;
ALTER TABLE "user_api_keys" ADD COLUMN IF NOT EXISTS "allowedIps" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
