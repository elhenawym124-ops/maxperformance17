-- Hashtag Express delivery proof on orders + provider on status history.
-- Additive only: nullable columns, no status/enum/data changes.

ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "shippingCompanyId" TEXT;
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "courierId" TEXT;
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "providerKey" TEXT;
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "trackingNumber" TEXT;
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "deliveredAt" TIMESTAMP(3);

ALTER TABLE "OrderStatusHistory" ADD COLUMN IF NOT EXISTS "providerKey" TEXT;

CREATE INDEX IF NOT EXISTS "orders_shippingCompanyId_idx" ON "orders"("shippingCompanyId");
CREATE INDEX IF NOT EXISTS "orders_courierId_idx" ON "orders"("courierId");
CREATE INDEX IF NOT EXISTS "orders_providerKey_idx" ON "orders"("providerKey");
CREATE INDEX IF NOT EXISTS "orders_trackingNumber_idx" ON "orders"("trackingNumber");
