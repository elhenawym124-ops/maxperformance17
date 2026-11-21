-- Migration: Add daily at HH:MM scheduling, timezone, and telemetry fields to ai_agent_schedules
ALTER TABLE ai_agent_schedules ADD COLUMN IF NOT EXISTS "scheduleType" VARCHAR(32) NOT NULL DEFAULT 'INTERVAL';
ALTER TABLE ai_agent_schedules ADD COLUMN IF NOT EXISTS "targetTime" VARCHAR(16);
ALTER TABLE ai_agent_schedules ADD COLUMN IF NOT EXISTS "cronExpr" VARCHAR(64);
ALTER TABLE ai_agent_schedules ADD COLUMN IF NOT EXISTS "lastError" TEXT;
ALTER TABLE ai_agent_schedules ADD COLUMN IF NOT EXISTS "failureCount" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE ai_agent_schedules ADD COLUMN IF NOT EXISTS "successCount" INTEGER NOT NULL DEFAULT 0;

-- Index for daily schedules
CREATE INDEX IF NOT EXISTS "idx_ai_agent_schedules_daily" 
ON ai_agent_schedules ("enabled", "scheduleType", "nextRunAt");
