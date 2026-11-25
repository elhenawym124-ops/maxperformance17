const assert = require('assert');
const {
  getMetadata,
  calculateMarketplaceProfit,
  getOpportunitiesCatalog,
  generateQrCode,
} = require('../services/marketplaceHubCalculatorService');
const aiService = require('../services/marketplaceHubAiService');
const opsService = require('../services/marketplaceHubOpsService');

async function runTests() {
  const meta = getMetadata();
  assert.strictEqual(meta.countries.length, 3, 'Should expose 3 regional countries');
  assert.ok(meta.amazonCategories.length >= 30, 'Should include Amazon categories');

  const amazonRes = calculateMarketplaceProfit({
    platform: 'amazon',
    country: 'EGY',
    shipmentType: 'EASY_SHIP',
    category: 'home',
    productCost: 100,
    profitMarginPct: 30,
    weightGrams: 500,
    lengthCm: 20,
    widthCm: 15,
    heightCm: 10,
  });
  assert.strictEqual(amazonRes.currency, 'EGP');
  assert.strictEqual(amazonRes.netProfit, 30);
  assert.strictEqual(amazonRes.basePrice, 130);
  assert.ok(amazonRes.finalSellingPrice > amazonRes.basePrice);

  const noonRes = calculateMarketplaceProfit({
    platform: 'noon',
    country: 'KSA',
    fulfillmentType: 'FBN',
    packageType: 'STANDARD',
    productFamily: 'electronics',
    productCost: 200,
    profitMarginPct: 25,
    weightKg: 1.5,
  });
  assert.strictEqual(noonRes.currency, 'SAR');
  assert.strictEqual(noonRes.netProfit, 50);

  const jumiaRes = calculateMarketplaceProfit({
    platform: 'jumia',
    country: 'EGY',
    productFamily: 'fashion',
    productSize: 'MEDIUM',
    warehouseType: 'JUMIA_EXPRESS',
    productCost: 150,
    profitMarginPct: 20,
  });
  assert.strictEqual(jumiaRes.currency, 'EGP');
  assert.strictEqual(jumiaRes.netProfit, 30);

  const trendyolRes = calculateMarketplaceProfit({
    platform: 'trendyol',
    country: 'UAE',
    mainCategory: 'clothing',
    isNewSeller: true,
    productCost: 80,
    profitMarginPct: 35,
    weightKg: 0.8,
  });
  assert.strictEqual(trendyolRes.currency, 'AED');
  assert.strictEqual(trendyolRes.netProfit, 28);

  const opps = getOpportunitiesCatalog('EGY', 'home');
  assert.ok(opps.length >= 1 && opps[0].amazonUrl.includes('amazon.eg'));

  // Phase 2 Wallet & Plan Math Tests
  const walletInit = await aiService.getWalletSummary('test-co-1', null);
  assert.strictEqual(walletInit.wallet.balance, 30);
  const deducted = await aiService.deductCredits('test-co-1', 'leo', 2, 'Unit test', null);
  assert.strictEqual(deducted.wallet.balance, 28);
  const planMath = aiService.calculateCustomPlan({ studio: 10, alpha: 30, leo: 50, emma: 100, bekam: 20 });
  assert.strictEqual(planMath.totalCredits, 550);
  assert.strictEqual(planMath.discountPct, 20);
  assert.ok(planMath.discountedPriceUsd < planMath.listPriceUsd);

  const draft = await aiService.saveStudioDraft({ companyId: 'test-co-1', title: 'Test Lamp' }, null);
  const drafts = await aiService.listStudioDrafts('test-co-1', null);
  assert.strictEqual(drafts.length, 1);
  assert.strictEqual(drafts[0].id, draft.id);

  // Phase 3 & 4 Ops Tests
  const vendors = opsService.getVendors({ country: 'EGY', category: 'Wholesalers' });
  assert.ok(vendors.vendors.length >= 1);

  const csv = opsService.parseMarketplaceCsv({
    platform: 'amazon',
    csvText: 'sku,title,price,quantity\nSKU-1,Coffee Maker,499,12',
  });
  assert.strictEqual(csv.totalRowsParsed, 1);
  assert.strictEqual(csv.previewRows[0].sku, 'SKU-1');

  const conn = await opsService.saveConnection({
    companyId: 'test-co-1',
    platform: 'jumia',
    country: 'EGY',
    storeName: 'MaxP Egypt',
    credentials: { clientId: 'demo' },
  }, null);
  assert.strictEqual(conn.status, 'CONFIGURED');

  const oauthUnconfigured = opsService.buildAmazonOAuthConsentUrl('EGY', '');
  assert.strictEqual(oauthUnconfigured.ready, false);
  const oauthConfigured = opsService.buildAmazonOAuthConsentUrl('EGY', 'amzn1.sp.solution.demo');
  assert.strictEqual(oauthConfigured.ready, true);
  assert.ok(oauthConfigured.oauthUrl.includes('sellercentral.amazon.eg'));

  const agg = opsService.aggregateOrdersToAnalytics([
    { AmazonOrderId: '902-1', OrderStatus: 'Unshipped', FulfillmentChannel: 'MFN', SalesChannel: 'Amazon.com', OrderTotal: { CurrencyCode: 'USD', Amount: '11.01' }, NumberOfItemsShipped: 0, NumberOfItemsUnshipped: 1, PurchaseDate: '2026-11-25T10:00:00Z' },
  ], { region: 'na', marketplaceId: 'ATVPDKIKX0DER', mode: 'sandbox', country: 'EGY', dateRange: '30d' });
  assert.strictEqual(agg.overview.totalOrders, 1);
  assert.strictEqual(agg.overview.totalRevenue, 11.01);
  assert.strictEqual(agg.payments.grossSales, 11.01);
  assert.ok(agg.payments.netPayout > 0);

  const searchUrls = aiService.buildMarketplaceSearchUrls('EGY', 'coffee maker');
  assert.ok(searchUrls.amazon.includes('amazon.eg/s?k=coffee%20maker'));
  assert.ok(searchUrls.noon.includes('noon.com/egypt-en'));
  assert.ok(searchUrls.jumia.includes('jumia.com.eg'));

  try {
    const qrPng = await generateQrCode({ content: 'https://maxp.online', size: 240, format: 'png' });
    assert.strictEqual(qrPng.mimeType, 'image/png');
  } catch (err) {
    if (!String(err.message).includes('not installed')) throw err;
    console.log('SKIPPED server-side qrcode render test (qrcode package not installed in local node_modules)');
  }

  console.log('ALL MARKETPLACE HUB SERVICE TESTS PASSED');
}

runTests().catch((err) => {
  console.error(err);
  process.exit(1);
});
