-- Add requestType column to orders table if not exists
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "requestType" text DEFAULT 'delivery';

-- Create index on requestType for query performance
CREATE INDEX IF NOT EXISTS "orders_requestType_idx" ON "orders"("requestType");

-- Backfill existing exchange orders from metadata or original order links
UPDATE "orders"
SET "requestType" = 'exchange'
WHERE ("requestType" IS NULL OR "requestType" = 'delivery')
  AND (
    "metadata"::jsonb->>'requestType' = 'exchange'
    OR "metadata"::jsonb->>'originalOrderId' IS NOT NULL
    OR "metadata"::jsonb->>'originalOrderNumber' IS NOT NULL
  );

-- Backfill existing return orders from metadata or status
UPDATE "orders"
SET "requestType" = 'return'
WHERE ("requestType" IS NULL OR "requestType" = 'delivery')
  AND (
    "metadata"::jsonb->>'requestType' = 'return'
    OR "status"::text = 'RETURNED'
  );
