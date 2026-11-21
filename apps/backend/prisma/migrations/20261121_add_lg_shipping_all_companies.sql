-- Migration: Add LG Express (Accurate Logistics) shipping company for all companies
INSERT INTO "shipping_companies" (
  "id",
  "name",
  "slug",
  "providerKey",
  "integrationMode",
  "website",
  "apiUrl",
  "phone",
  "isActive",
  "companyId",
  "createdAt",
  "updatedAt"
)
SELECT
  'ship_lg_' || substr(md5(c.id || '_lg_express'), 1, 20),
  'LG Express (Accurate Logistics)',
  'lg-express',
  'LG_EXPRESS',
  'LIVE',
  'https://accuratess.com',
  'https://a2x.lg.accuratess.com:8443/graphql',
  '',
  false,
  c.id,
  NOW(),
  NOW()
FROM "companies" c
WHERE NOT EXISTS (
  SELECT 1 FROM "shipping_companies" sc
  WHERE sc."companyId" = c.id
    AND (
      sc."providerKey" = 'LG_EXPRESS'
      OR sc."slug" = 'lg-express'
      OR sc."slug" = 'lg_express'
    )
)
ON CONFLICT ("companyId", "slug") DO NOTHING;
