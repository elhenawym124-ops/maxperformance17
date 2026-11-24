const { describe, it } = require('node:test');
const assert = require('node:assert/strict');

const {
  isAhmedGadStore,
  AHMED_GAD_COMPANY_ID,
  AHMED_GAD_SLUG,
} = require('../../utils/quantityTierVariants');

describe('Ahmed Gad Store Navigation Isolation', () => {
  it('correctly isolates Ahmed Gad store from other stores', () => {
    assert.equal(isAhmedGadStore(AHMED_GAD_COMPANY_ID), true);
    assert.equal(isAhmedGadStore(null, AHMED_GAD_SLUG), true);
    assert.equal(isAhmedGadStore('random_company_id'), false);
    assert.equal(isAhmedGadStore(null, 'other_store'), false);
    assert.equal(isAhmedGadStore(null, null), false);
  });

  it('filters shoes navigation links strictly for Ahmed Gad only', () => {
    const isShoesLink = (label) => {
      if (!label) return false;
      const l = label.trim().toLowerCase();
      return (
        l.includes('أحذية') ||
        l.includes('احذية') ||
        l.includes('shoes') ||
        l.includes('footwear')
      );
    };

    const navItems = [
      { label: 'الرئيسية', to: '/' },
      { label: 'الأحذية', to: '/shop' },
      { label: 'التشكيلات', to: '/collections' },
      { label: 'العروض', to: '/sale' },
      { label: 'تواصل معنا', to: '/contact' },
    ];

    // For Ahmed Gad:
    const filteredForAhmedGad = navItems.filter((item) => !isShoesLink(item.label));
    assert.deepEqual(filteredForAhmedGad.map(i => i.label), [
      'الرئيسية',
      'التشكيلات',
      'العروض',
      'تواصل معنا',
    ]);
    assert.equal(filteredForAhmedGad.some(i => i.label === 'الأحذية'), false);

    // For Other stores:
    const otherStoreId = 'other_store_123';
    const isOtherAhmed = isAhmedGadStore(otherStoreId);
    assert.equal(isOtherAhmed, false);
    const navForOther = isOtherAhmed ? navItems.filter((item) => !isShoesLink(item.label)) : navItems;
    assert.deepEqual(navForOther.map(i => i.label), [
      'الرئيسية',
      'الأحذية',
      'التشكيلات',
      'العروض',
      'تواصل معنا',
    ]);
  });
});
