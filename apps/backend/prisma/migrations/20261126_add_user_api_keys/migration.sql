-- Personal Employee/User API Keys (mxp_usr_*)
-- Inherits all live RBAC permissions of the bound user within the bound company.
CREATE TABLE IF NOT EXISTS "user_api_keys" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "companyId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "keyPrefix" TEXT NOT NULL,
  "keyHash" TEXT NOT NULL,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "expiresAt" TIMESTAMP(3),
  "revokedAt" TIMESTAMP(3),
  "revokedByUserId" TEXT,
  "revokedReason" TEXT,
  "lastUsedAt" TIMESTAMP(3),
  "lastUsedIp" TEXT,
  "requestCount" INTEGER NOT NULL DEFAULT 0,
  "createdByUserId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "user_api_keys_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "user_api_keys_keyPrefix_key" ON "user_api_keys"("keyPrefix");
CREATE UNIQUE INDEX IF NOT EXISTS "user_api_keys_keyHash_key" ON "user_api_keys"("keyHash");
CREATE INDEX IF NOT EXISTS "user_api_keys_userId_companyId_idx" ON "user_api_keys"("userId", "companyId");
CREATE INDEX IF NOT EXISTS "user_api_keys_companyId_isActive_idx" ON "user_api_keys"("companyId", "isActive");
CREATE INDEX IF NOT EXISTS "user_api_keys_expiresAt_idx" ON "user_api_keys"("expiresAt");
