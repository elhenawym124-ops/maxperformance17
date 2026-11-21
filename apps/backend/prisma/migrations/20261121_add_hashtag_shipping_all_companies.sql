-- Migration: Add Hashtag shipping company for all companies
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
  'ship_ht_' || substr(md5(c.id || '_hashtag'), 1, 20),
  'هاشتاج إكسبريس (Hashtag Express)',
  'hashtag',
  'HASHTAG',
  'LIVE',
  'https://hashtag-express.com',
  'https://hashtag-express.com/app',
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
      sc."providerKey" = 'HASHTAG'
      OR sc."slug" = 'hashtag'
      OR sc."slug" = 'hashtag-express'
    )
)
ON CONFLICT ("companyId", "slug") DO NOTHING;
