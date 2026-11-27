const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const CORRUPTED_QUESTION_MARKS_RE = /\?{3,}/;
const CATALOG_PATH = path.resolve(__dirname, '../catalog/marketplace/apps.json');

function findCorruptedCatalogEntries(rawJson) {
  const apps = JSON.parse(rawJson);
  assert.ok(Array.isArray(apps) && apps.length > 0, 'Catalog must be a non-empty array');

  const violations = [];
  for (const app of apps) {
    for (const field of ['name', 'description']) {
      const value = app?.[field];
      if (typeof value === 'string' && CORRUPTED_QUESTION_MARKS_RE.test(value)) {
        violations.push({ slug: app?.slug || '<unknown>', field, value });
      }
    }
  }
  return violations;
}

function assertCatalogHasNoCorruptedText(rawJson) {
  const violations = findCorruptedCatalogEntries(rawJson);
  assert.equal(
    violations.length,
    0,
    `Found corrupted encoding (3+ consecutive '?') in marketplace catalog: ${JSON.stringify(violations)}`
  );
}

test('marketplace apps.json has no 3+ consecutive question marks in name or description', () => {
  const rawJson = fs.readFileSync(CATALOG_PATH, 'utf8');
  assertCatalogHasNoCorruptedText(rawJson);

  const apps = JSON.parse(rawJson);
  const woo = apps.find((app) => app.slug === 'woocommerce-pro');
  assert.ok(woo, 'woocommerce-pro must exist in catalog');
  assert.equal(woo.name, 'تكامل WooCommerce');
  assert.equal(
    woo.description,
    'مزامنة المنتجات والطلبات والمخزون بين منصة MaxP ومتجر WooCommerce — استيراد وتصدير تلقائي.'
  );
});

test('guard fails on internal fixture with corrupted name or description', () => {
  const corruptedFixture = JSON.stringify([
    {
      slug: 'woocommerce-pro',
      name: '?????????? WooCommerce',
      description: '?????? ?????????? ????????????????????'
    }
  ]);

  assert.throws(
    () => assertCatalogHasNoCorruptedText(corruptedFixture),
    /Found corrupted encoding \(3\+ consecutive '\?'\) in marketplace catalog: .*woocommerce-pro/
  );
});

test('guard detects 3+ consecutive question marks in description alone while allowing normal punctuation', () => {
  const cleanFixture = JSON.stringify([
    {
      slug: 'valid-app',
      name: 'تطبيق صالح؟',
      description: 'هل هذا متاح؟؟ نعم متاح.'
    }
  ]);
  assert.doesNotThrow(() => assertCatalogHasNoCorruptedText(cleanFixture));

  const corruptedDescOnlyFixture = JSON.stringify([
    {
      slug: 'broken-desc-app',
      name: 'تطبيق سليم',
      description: 'وصف مشوه ??? داخل النص'
    }
  ]);
  assert.throws(
    () => assertCatalogHasNoCorruptedText(corruptedDescOnlyFixture),
    /broken-desc-app.*"field":"description"/
  );
});
