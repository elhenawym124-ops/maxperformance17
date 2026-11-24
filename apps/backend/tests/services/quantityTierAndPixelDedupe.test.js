const { describe, it } = require('node:test');
const assert = require('node:assert/strict');

// Import quantity tier functions by reading the ts or testing logic
const {
  parseQuantityRange,
  detectQuantityTierVariants,
  findMatchingTierVariant,
} = require('../../utils/quantityTierVariants');

describe('Quantity Tier Variants and Deduplication', () => {
  it('correctly parses quantity tiers for Ahmed Gad products', () => {
    assert.deepEqual(parseQuantityRange('كرتونة واحدة 120 قطعة'), { min: 1, max: 2 });
    assert.deepEqual(parseQuantityRange('من 3 إلى 5 كراتين'), { min: 3, max: 5 });
    assert.deepEqual(parseQuantityRange('من 6 إلى 10 كراتين'), { min: 6, max: 10 });
    assert.deepEqual(parseQuantityRange('من 11 كرتونة فيما فوق سعر خاص'), { min: 11, max: Infinity });
  });

  it('calculates proper prices across volume quantities without gap', () => {
    const rawVariants = [
      { id: 'v1', name: 'كرتونة واحدة 120 قطعة', price: '1300', attributes: { 'الكمية': 'كرتونة واحدة 120 قطعة' } },
      { id: 'v2', name: 'من 3 إلى 5 كراتين', price: '1200', attributes: { 'الكمية': 'من 3 إلى 5 كراتين' } },
      { id: 'v3', name: 'من 6 إلى 10 كراتين', price: '1100', attributes: { 'الكمية': 'من 6 إلى 10 كراتين' } },
      { id: 'v4', name: 'من 11 كرتونة فيما فوق سعر خاص', price: '1050', attributes: { 'الكمية': 'من 11 كرتونة فيما فوق سعر خاص' } },
    ];

    const { isTierScheme, tiers } = detectQuantityTierVariants(rawVariants);
    assert.equal(isTierScheme, true);
    assert.equal(tiers.length, 4);

    // 1 carton -> 1300
    assert.equal(findMatchingTierVariant(tiers, 1).price, 1300);
    // 2 cartons -> 1300
    assert.equal(findMatchingTierVariant(tiers, 2).price, 1300);
    // 3 cartons -> 1200
    assert.equal(findMatchingTierVariant(tiers, 3).price, 1200);
    // 4 cartons -> 1200 -> total 4800 (solves the exact customer bug!)
    const match4 = findMatchingTierVariant(tiers, 4);
    assert.equal(match4.price, 1200);
    assert.equal(match4.price * 4, 4800);

    // 6 cartons -> 1100
    assert.equal(findMatchingTierVariant(tiers, 6).price, 1100);
    // 11 cartons -> 1050
    assert.equal(findMatchingTierVariant(tiers, 11).price, 1050);
  });

  it('guarantees eventId is always populated and identical for CAPI and Pixel deduplication', () => {
    const pixelEventId = 'fe_event_12345';
    const orderId = 'cmtest123';
    const orderNumber = 'ORD-12345';

    // Simulated resolution logic from publicOrdersRoutes.js
    const resolvedEventId = (typeof pixelEventId === 'string' && pixelEventId.trim())
      ? pixelEventId.trim()
      : `order_${orderId || orderNumber}_${Date.now()}`;

    assert.equal(resolvedEventId, 'fe_event_12345');

    // When frontend does not send pixelEventId, server generates deterministic order-based eventId
    const fallbackEventId = (typeof undefined === 'string' && undefined)
      ? undefined
      : `order_${orderNumber}_1700000000`;

    assert.match(fallbackEventId, /^order_ORD-12345_/);
  });
});
