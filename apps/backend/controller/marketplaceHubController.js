const marketplaceHubService = require('../services/marketplaceHubCalculatorService');
const marketplaceHubAiService = require('../services/marketplaceHubAiService');
const marketplaceHubOpsService = require('../services/marketplaceHubOpsService');

function getCompanyId(req) {
  return req.user?.companyId || req.user?.company?.id || 'default';
}

function handleError(res, error, fallbackMessage) {
  const status = error.statusCode || 500;
  if (status >= 500) console.error('[MarketplaceHub]', error);
  return res.status(status).json({
    success: false,
    message: error.message || fallbackMessage,
  });
}

exports.getMetadata = async (req, res) => {
  try {
    return res.json({ success: true, data: marketplaceHubService.getMetadata() });
  } catch (error) {
    return handleError(res, error, 'Failed to load marketplace metadata');
  }
};

exports.calculateProfit = async (req, res) => {
  try {
    const { productCost } = req.body || {};
    if (productCost === undefined || productCost === null || Number(productCost) < 0) {
      return res.status(400).json({ success: false, message: 'Valid productCost is required' });
    }
    return res.json({ success: true, data: marketplaceHubService.calculateMarketplaceProfit(req.body) });
  } catch (error) {
    return handleError(res, error, 'Failed to calculate marketplace fees');
  }
};

exports.getOpportunities = async (req, res) => {
  try {
    const { country = 'EGY', search = '' } = req.query || {};
    return res.json({ success: true, data: marketplaceHubService.getOpportunitiesCatalog(country, search) });
  } catch (error) {
    return handleError(res, error, 'Failed to fetch opportunities');
  }
};

exports.generateQr = async (req, res) => {
  try {
    const result = await marketplaceHubService.generateQrCode(req.body || {});
    return res.json({ success: true, data: result });
  } catch (error) {
    const status = error.message === 'QR content is required' ? 400 : 500;
    return res.status(status).json({ success: false, message: error.message || 'Failed to generate QR code' });
  }
};

exports.getWallet = async (req, res) => {
  try {
    const data = await marketplaceHubAiService.getWalletSummary(getCompanyId(req));
    return res.json({ success: true, data });
  } catch (error) {
    return handleError(res, error, 'Failed to load credit wallet');
  }
};

exports.calculateCustomPlan = async (req, res) => {
  try {
    return res.json({ success: true, data: marketplaceHubAiService.calculateCustomPlan(req.body || {}) });
  } catch (error) {
    return handleError(res, error, 'Failed to calculate custom plan');
  }
};

exports.generateCopy = async (req, res) => {
  try {
    const data = await marketplaceHubAiService.generateProductCopy({
      companyId: getCompanyId(req),
      ...(req.body || {}),
    });
    return res.json({ success: true, data });
  } catch (error) {
    return handleError(res, error, 'Failed to generate product copy');
  }
};

exports.generateImageBrief = async (req, res) => {
  try {
    const data = await marketplaceHubAiService.generateImageBriefAndAsset({
      companyId: getCompanyId(req),
      ...(req.body || {}),
    });
    return res.json({ success: true, data });
  } catch (error) {
    return handleError(res, error, 'Failed to process image brief');
  }
};

exports.generatePrefill = async (req, res) => {
  try {
    const data = await marketplaceHubAiService.generateMarketplacePrefill({
      companyId: getCompanyId(req),
      ...(req.body || {}),
    });
    return res.json({ success: true, data });
  } catch (error) {
    return handleError(res, error, 'Failed to generate marketplace prefill');
  }
};

exports.sellerCopilot = async (req, res) => {
  try {
    const data = await marketplaceHubAiService.sellerCopilotChat({
      companyId: getCompanyId(req),
      ...(req.body || {}),
    });
    return res.json({ success: true, data });
  } catch (error) {
    return handleError(res, error, 'Failed to contact seller copilot');
  }
};

exports.listDrafts = async (req, res) => {
  try {
    const data = await marketplaceHubAiService.listStudioDrafts(getCompanyId(req));
    return res.json({ success: true, data });
  } catch (error) {
    return handleError(res, error, 'Failed to fetch studio drafts');
  }
};

exports.saveDraft = async (req, res) => {
  try {
    const data = await marketplaceHubAiService.saveStudioDraft({
      companyId: getCompanyId(req),
      ...(req.body || {}),
    });
    return res.json({ success: true, data });
  } catch (error) {
    return handleError(res, error, 'Failed to save studio draft');
  }
};

exports.getVendors = async (req, res) => {
  try {
    const data = marketplaceHubOpsService.getVendors(req.query || {});
    return res.json({ success: true, data });
  } catch (error) {
    return handleError(res, error, 'Failed to load vendors');
  }
};

exports.importCsv = async (req, res) => {
  try {
    const data = marketplaceHubOpsService.parseMarketplaceCsv(req.body || {});
    return res.json({ success: true, data });
  } catch (error) {
    return handleError(res, error, 'Failed to parse CSV');
  }
};

exports.listConnections = async (req, res) => {
  try {
    const connections = await marketplaceHubOpsService.listConnections(getCompanyId(req));
    const amazonOAuth = marketplaceHubOpsService.buildAmazonOAuthConsentUrl(req.query?.country || 'EGY');
    return res.json({ success: true, data: { connections, amazonOAuth } });
  } catch (error) {
    return handleError(res, error, 'Failed to load channel connections');
  }
};

exports.saveConnection = async (req, res) => {
  try {
    const data = await marketplaceHubOpsService.saveConnection({
      companyId: getCompanyId(req),
      ...(req.body || {}),
    });
    return res.json({ success: true, data });
  } catch (error) {
    return handleError(res, error, 'Failed to save channel connection');
  }
};

exports.deleteConnection = async (req, res) => {
  try {
    const { platform, country } = req.params;
    const data = await marketplaceHubOpsService.removeConnection(getCompanyId(req), platform, country);
    return res.json({ success: true, data });
  } catch (error) {
    return handleError(res, error, 'Failed to remove channel connection');
  }
};

exports.testAmazonSandbox = async (req, res) => {
  try {
    const data = await marketplaceHubOpsService.testAmazonSandbox(req.body || {});
    return res.json({ success: true, data });
  } catch (error) {
    return handleError(res, error, 'Failed to test Amazon SP-API Sandbox');
  }
};

exports.getDashboardAnalytics = async (req, res) => {
  try {
    const source = req.method === 'GET' ? req.query || {} : req.body || {};
    const data = await marketplaceHubOpsService.getChannelAnalytics({
      companyId: getCompanyId(req),
      country: source.country || 'EGY',
      dateRange: source.dateRange || '30d',
      region: source.region || 'na',
      mode: source.mode || 'sandbox',
      credentials: source.credentials,
    });
    return res.json({ success: true, data });
  } catch (error) {
    return handleError(res, error, 'Failed to load channel analytics');
  }
};

exports.comparePrices = async (req, res) => {
  try {
    const data = await marketplaceHubAiService.compareMarketplacePrices({
      companyId: getCompanyId(req),
      ...(req.body || {}),
    });
    return res.json({ success: true, data });
  } catch (error) {
    return handleError(res, error, 'Failed to compare marketplace prices');
  }
};

exports.getPriceHistory = async (req, res) => {
  try {
    const data = marketplaceHubAiService.getPriceCompareHistory(getCompanyId(req));
    return res.json({ success: true, data });
  } catch (error) {
    return handleError(res, error, 'Failed to load price history');
  }
};

exports.exchangeAmazonOAuth = async (req, res) => {
  try {
    const data = await marketplaceHubOpsService.exchangeAmazonOAuthCode({
      companyId: getCompanyId(req),
      ...(req.body || {}),
    });
    return res.json({ success: true, data });
  } catch (error) {
    return handleError(res, error, 'Failed to complete Amazon OAuth');
  }
};
