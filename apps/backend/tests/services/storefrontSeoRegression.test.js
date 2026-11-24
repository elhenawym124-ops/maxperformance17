const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const {
  buildStorefrontSeoMetadata,
} = require('../../services/storefrontSeoService');
const {
  buildProductSearchFilter,
  buildNormalizedProductSearchText,
  matchesNormalizedProduct,
} = require('../../utils/arabicSearchUtils');

describe('Storefront SEO & OG Image Resolution (Task: Real store image / product fallback)', () => {
  it('uses store logo when configured in company.logo', () => {
    const meta = buildStorefrontSeoMetadata({
      pathname: '/',
      currentUrl: 'https://swan.maxp.online/',
      company: {
        name: 'Swan',
        logo: '/uploads/products/product-13003cf0-3d80-41a5-9679-ad00595d5a38.png',
      },
      storefrontSettings: {},
    });

    assert.equal(
      meta.image,
      'https://swan.maxp.online/uploads/products/product-13003cf0-3d80-41a5-9679-ad00595d5a38.png',
    );
    assert.notEqual(meta.image, 'https://maxp.online/og-cover.png');
  });

  it('uses designTokens.seo.ogImage when company.logo is null', () => {
    const meta = buildStorefrontSeoMetadata({
      pathname: '/',
      currentUrl: 'https://swan.maxp.online/',
      company: {
        name: 'Swan',
        logo: null,
      },
      storefrontSettings: {
        designTokens: {
          seo: {
            ogImage: '/uploads/custom-share-cover.jpg',
          },
        },
      },
    });

    assert.equal(
      meta.image,
      'https://swan.maxp.online/uploads/custom-share-cover.jpg',
    );
  });

  it('falls back to store product image when neither logo nor custom ogImage are set', () => {
    const meta = buildStorefrontSeoMetadata({
      pathname: '/',
      currentUrl: 'https://swan.maxp.online/',
      company: {
        name: 'Swan',
        logo: null,
      },
      storefrontSettings: {
        designTokens: {},
      },
      products: [
        {
          id: 'prod-1',
          name: 'سنيكرز سوان ميموري فوم 2026',
          mainImage: '/uploads/products/product-13003cf0-3d80-41a5-9679-ad00595d5a38.png',
        },
      ],
    });

    // Must NOT fall back to maxp.online/og-cover.png when store products exist!
    assert.equal(
      meta.image,
      'https://swan.maxp.online/uploads/products/product-13003cf0-3d80-41a5-9679-ad00595d5a38.png',
    );
    assert.notEqual(meta.image, 'https://maxp.online/og-cover.png');
  });

  it('uses product image on product pages with fallback to store assets', () => {
    const meta = buildStorefrontSeoMetadata({
      pathname: '/product/kotchii-lamsa-10',
      currentUrl: 'https://swan.maxp.online/product/kotchii-lamsa-10',
      company: {
        name: 'Swan',
        logo: '/uploads/brands/swan-logo.png',
      },
      product: {
        id: 'prod-113',
        name: 'كوتشي لمسه',
        slug: 'kotchii-lamsa-10',
        mainImage: '/uploads/products/product-b0b1c16e-395a-40d4-8424-c40f871f9baf.jpeg',
      },
    });

    assert.equal(
      meta.image,
      'https://swan.maxp.online/uploads/products/product-b0b1c16e-395a-40d4-8424-c40f871f9baf.jpeg',
    );
  });
});

describe('Search utils: Arabic, SKU, Barcode, English & Edge Cases', () => {
  it('builds search filter with barcode condition for products and variants sku', () => {
    const filter = buildProductSearchFilter('6221234567890');
    assert.ok(filter?.OR, 'filter should have OR conditions');
    const conditions = filter.OR;

    const hasProductBarcode = conditions.some((c) => c.barcode?.contains === '6221234567890');
    const hasVariantSku = conditions.some((c) =>
      c.productVariants?.some?.OR?.some((vc) => vc.sku?.contains === '6221234567890'),
    );

    assert.ok(hasProductBarcode, 'should query product barcode');
    assert.ok(hasVariantSku, 'should query variant sku for barcode matching');
  });

  it('matches barcode in normalized product search text', () => {
    const product = {
      id: 'p-1',
      name: 'كوتشي لمسه',
      sku: 'sw-113',
      barcode: '6221234567890',
    };

    const searchText = buildNormalizedProductSearchText(product);
    assert.ok(searchText.includes('6221234567890'));
    assert.ok(searchText.includes('sw-113'));
    assert.ok(searchText.includes('كوتشي'));
  });

  it('matches SKU search 113 for product with SKU sw-113', () => {
    const filter = buildProductSearchFilter('113');
    assert.ok(filter?.OR, 'filter should have OR conditions');
    const conditions = filter.OR;
    const hasSkuCondition = conditions.some((c) => c.sku?.contains === '113');
    assert.ok(hasSkuCondition, 'should query sku contains 113');

    const candidateProduct = {
      id: 'p-113',
      name: 'كوتشي لمسه',
      sku: 'sw-113',
      slug: 'kotchii-lamsa-10',
    };
    assert.ok(matchesNormalizedProduct(candidateProduct, '113'), 'matches 113');
  });

  it('matches Arabic footwear queries (حذاء) for product named كوتشي', () => {
    const candidateProduct = {
      id: 'p-1',
      name: 'كوتشي لمسه رائع',
      sku: 'sw-100',
    };
    assert.ok(
      matchesNormalizedProduct(candidateProduct, 'حذاء'),
      'حذاء should match كوتشي via footwear synonym expansion',
    );
  });

  it('matches Arabic color queries (ابيض / أبيض) for product named أبيض', () => {
    const candidateProduct = {
      id: 'p-2',
      name: 'سنيكرز رياضي أبيض كلاسيك',
      sku: 'sw-101',
    };
    assert.ok(
      matchesNormalizedProduct(candidateProduct, 'ابيض'),
      'ابيض without hamza should match أبيض',
    );
    assert.ok(
      matchesNormalizedProduct(candidateProduct, 'أبيض'),
      'أبيض with hamza should match',
    );
  });

  it('returns null filter for empty search', () => {
    assert.equal(buildProductSearchFilter(''), null);
    assert.equal(buildProductSearchFilter('   '), null);
    assert.equal(buildProductSearchFilter(null), null);
    assert.equal(buildProductSearchFilter(undefined), null);
  });
});
