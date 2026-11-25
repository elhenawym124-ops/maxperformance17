const express = require('express');
const router = express.Router();
const verifyToken = require('../utils/verifyToken');
const controller = require('../controller/marketplaceHubController');

// Isolated Marketplace Hub routes — authenticated & company-scoped
router.use(verifyToken.authenticateToken);
router.use(verifyToken.requireCompanyAccess);

// Phase 1: Core Utilities
router.get('/metadata', controller.getMetadata);
router.post('/calculate', controller.calculateProfit);
router.get('/opportunities', controller.getOpportunities);
router.post('/qr', controller.generateQr);

// Phase 2: Credit Wallet & AI Studio (keys resolved strictly from public.ai_keys)
router.get('/wallet', controller.getWallet);
router.post('/wallet/calculate-plan', controller.calculateCustomPlan);
router.post('/ai/copy', controller.generateCopy);
router.post('/ai/image', controller.generateImageBrief);
router.post('/ai/prefill', controller.generatePrefill);
router.post('/ai/copilot', controller.sellerCopilot);
router.get('/studio/drafts', controller.listDrafts);
router.post('/studio/drafts', controller.saveDraft);

// Phase 3 & 4: Vendors, CSV Import & Channel Connections
router.get('/vendors', controller.getVendors);
router.post('/import-csv', controller.importCsv);
router.post('/price-compare', controller.comparePrices);
router.get('/price-compare/history', controller.getPriceHistory);
router.get('/connections', controller.listConnections);
router.post('/connections', controller.saveConnection);
router.post('/connections/amazon-oauth-exchange', controller.exchangeAmazonOAuth);
router.post('/connections/test-amazon-sandbox', controller.testAmazonSandbox);
router.delete('/connections/:platform/:country', controller.deleteConnection);
router.get('/dashboard/analytics', controller.getDashboardAnalytics);
router.post('/dashboard/analytics', controller.getDashboardAnalytics);
router.get('/catalog/products', controller.getCompanyCatalog);
router.post('/catalog/push-products', controller.pushToCompanyCatalog);
router.post('/catalog/amazon-lookup', controller.lookupAmazonCatalog);

module.exports = router;
