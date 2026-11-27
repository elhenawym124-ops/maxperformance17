const express = require('express');
const router = express.Router();
const verifyToken = require('../utils/verifyToken');
const { checkAppAccess } = require('../middleware/checkAppAccess');
const controller = require('../controller/marketplaceHubController');

// Isolated Marketplace Hub routes — authenticated, company-scoped & app-gated
router.use(verifyToken.authenticateToken);
router.use(verifyToken.requireCompanyAccess);
router.use(checkAppAccess('marketplace-hub'));

// Phase 1: Core Utilities
router.get('/metadata', controller.getMetadata);
router.post('/calculate', controller.calculateProfit);
router.post('/calculate/compare', controller.compareMarketplaces);
router.get('/opportunities', controller.getOpportunities);
router.post('/qr', controller.generateQr);

// Phase 2: Credit Wallet & AI Studio (keys resolved strictly from public.ai_keys)
router.get('/wallet', controller.getWallet);
router.post('/wallet/calculate-plan', controller.calculateCustomPlan);
router.post('/ai/copy', controller.generateCopy);
router.post('/ai/image', controller.generateImageBrief);
router.post('/ai/prefill', controller.generatePrefill);
router.post('/ai/health-assess', controller.assessListingHealth);
router.post('/ai/copilot', controller.sellerCopilot);
router.get('/studio/drafts', controller.listDrafts);
router.post('/studio/drafts', controller.saveDraft);

// Phase 3 & 4: Vendors, CSV Import, Stock Distribution & Channel Connections
router.get('/vendors', controller.getVendors);
router.post('/import-csv', controller.importCsv);
router.post('/price-compare', controller.comparePrices);
router.get('/price-compare/history', controller.getPriceHistory);
router.get('/connections', controller.listConnections);
router.post('/connections', controller.saveConnection);
router.post('/connections/amazon-oauth-exchange', controller.exchangeAmazonOAuth);
router.post('/connections/test-amazon-sandbox', controller.testAmazonSandbox);
router.post('/connections/test-store', controller.testStoreConnection);
router.delete('/connections/:platform/:country', controller.deleteConnection);
router.get('/dashboard/analytics', controller.getDashboardAnalytics);
router.post('/dashboard/analytics', controller.getDashboardAnalytics);
router.get('/catalog/products', controller.getCompanyCatalog);
router.post('/catalog/push-products', controller.pushToCompanyCatalog);
router.post('/catalog/amazon-lookup', controller.lookupAmazonCatalog);
router.get('/inventory/distribution', controller.getStockDistribution);
router.post('/inventory/distribute', controller.saveStockDistribution);

// Stage 3: Cost Groups, Currency Policy, Bulk SKU ZIP Images, Custom Fields & Sync Tickets
router.get('/cost-groups', controller.listCostGroups);
router.post('/cost-groups', controller.saveCostGroup);
router.delete('/cost-groups/:id', controller.deleteCostGroup);
router.get('/currency-policy', controller.getCurrencyPolicy);
router.post('/currency-policy', controller.saveCurrencyPolicy);
router.post('/import-sku-zip', controller.importSkuZip);
router.get('/custom-fields', controller.listCustomFields);
router.post('/custom-fields', controller.saveCustomField);
router.delete('/custom-fields/:id', controller.deleteCustomField);
router.get('/inventory/sync-policy', controller.getInventorySyncPolicy);
router.post('/inventory/sync-policy', controller.saveInventorySyncPolicy);
router.get('/inventory/tickets', controller.listStockTickets);
router.post('/inventory/tickets/scan', controller.scanStockDiscrepancies);
router.post('/inventory/tickets/:id/resolve', controller.resolveStockTicket);
router.post('/inventory/tickets/resolve-all', controller.resolveAllStockTickets);

module.exports = router;
