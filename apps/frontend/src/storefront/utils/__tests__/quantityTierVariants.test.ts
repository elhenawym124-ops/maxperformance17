import { describe, it, expect } from 'vitest';
import {
  parseQuantityRange,
  detectQuantityTierVariants,
  findMatchingTierVariant,
  isAhmedGadStore,
  getVariantQuantityRange,
  getCartItemQuantityRange,
  AHMED_GAD_COMPANY_ID,
  AHMED_GAD_SLUG,
} from '../quantityTierVariants';

describe('quantityTierVariants', () => {
  it('correctly parses individual tier labels', () => {
    expect(parseQuantityRange('كرتونة واحدة 120 قطعة')).toEqual({ min: 1, max: 2 });
    expect(parseQuantityRange('من 3 إلى 5 كراتين')).toEqual({ min: 3, max: 5 });
    expect(parseQuantityRange('من 6 إلى 10 كراتين')).toEqual({ min: 6, max: 10 });
    expect(parseQuantityRange('من 11 كرتونة فيما فوق سعر خاص')).toEqual({ min: 11, max: Infinity });
  });

  it('guarantees tenant isolation for Ahmed Gad store', () => {
    // Ahmed Gad company ID
    expect(isAhmedGadStore(AHMED_GAD_COMPANY_ID)).toBe(true);
    // Ahmed Gad slug
    expect(isAhmedGadStore(null, AHMED_GAD_SLUG)).toBe(true);

    // Other companies must return false
    expect(isAhmedGadStore('some-other-company-id')).toBe(false);
    expect(isAhmedGadStore('company123', 'other-store')).toBe(false);
    expect(isAhmedGadStore(null, null)).toBe(false);
  });

  it('confines variant quantity range strictly for Ahmed Gad company only', () => {
    const tierVariant = {
      attributes: { 'الكمية': 'من 6 إلى 10 كراتين' },
    };

    // For Ahmed Gad: extracts range [6, 10]
    const ahmedRange = getVariantQuantityRange(tierVariant, AHMED_GAD_COMPANY_ID);
    expect(ahmedRange).toEqual({ min: 6, max: 10 });

    // For another merchant: returns null (completely unconstrained)
    const otherRange = getVariantQuantityRange(tierVariant, 'other-company-id');
    expect(otherRange).toBeNull();
  });

  it('confines cart item quantity range for Ahmed Gad', () => {
    const cartItem = {
      id: 'cart-1',
      name: 'كرتونة حجر خفاف اسود – 120 قطعة',
      attributes: { 'الكمية': 'من 6 إلى 10 كراتين' },
      quantity: 1,
    };

    // For Ahmed Gad: extracts [6, 10]
    const range = getCartItemQuantityRange(cartItem, AHMED_GAD_COMPANY_ID);
    expect(range).toEqual({ min: 6, max: 10 });

    // For other store: null
    expect(getCartItemQuantityRange(cartItem, 'other-store')).toBeNull();
  });

  it('detects tier scheme from Ahmed Gad variants and resolves tiers correctly', () => {
    const rawVariants = [
      {
        id: 'var1',
        name: 'كرتونة واحدة 120 قطعة',
        price: '1300',
        metadata: JSON.stringify({ attributeValues: { 'الكمية': 'كرتونة واحدة 120 قطعة' } }),
      },
      {
        id: 'var2',
        name: 'من 3 إلى 5 كراتين',
        price: '1200',
        metadata: JSON.stringify({ attributeValues: { 'الكمية': 'من 3 إلى 5 كراتين' } }),
      },
      {
        id: 'var3',
        name: 'من 6 إلى 10 كراتين',
        price: '1100',
        metadata: JSON.stringify({ attributeValues: { 'الكمية': 'من 6 إلى 10 كراتين' } }),
      },
      {
        id: 'var4',
        name: 'من 11 كرتونة فيما فوق سعر خاص',
        price: '1050',
        metadata: JSON.stringify({ attributeValues: { 'الكمية': 'من 11 كرتونة فيما فوق سعر خاص' } }),
      },
    ];

    const result = detectQuantityTierVariants(rawVariants);
    expect(result.isTierScheme).toBe(true);
    expect(result.attributeKey).toBe('الكمية');
    expect(result.tiers.length).toBe(4);

    expect(result.tiers[0].range).toEqual({ min: 1, max: 2 });
    expect(result.tiers[1].range).toEqual({ min: 3, max: 5 });
    expect(result.tiers[2].range).toEqual({ min: 6, max: 10 });
    expect(result.tiers[3].range).toEqual({ min: 11, max: Infinity });

    // Test matching quantities:
    expect(findMatchingTierVariant(result.tiers, 1)?.price).toBe(1300);
    expect(findMatchingTierVariant(result.tiers, 2)?.price).toBe(1300);
    expect(findMatchingTierVariant(result.tiers, 3)?.price).toBe(1200);
    expect(findMatchingTierVariant(result.tiers, 5)?.price).toBe(1200);
    expect(findMatchingTierVariant(result.tiers, 6)?.price).toBe(1100);
    expect(findMatchingTierVariant(result.tiers, 10)?.price).toBe(1100);
    expect(findMatchingTierVariant(result.tiers, 11)?.price).toBe(1050);
    expect(findMatchingTierVariant(result.tiers, 20)?.price).toBe(1050);
  });
});
