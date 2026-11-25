const crypto = require('crypto');

let sharedDbModule = null;
function safeGetPrisma() {
  if (!sharedDbModule) {
    try {
      sharedDbModule = require('./sharedDatabase');
    } catch {
      return null;
    }
  }
  try {
    return sharedDbModule.getSharedPrismaClient ? sharedDbModule.getSharedPrismaClient() : null;
  } catch {
    return null;
  }
}

const VENDORS_DIRECTORY = [
  { id: 'v-eg-1', country: 'EGY', category: 'Wholesalers', name: 'مجمع العتبة والموسكي للأدوات المنزلية', city: 'القاهرة', notes: 'جملة مستلزمات المطبخ والمنزل', verified: true },
  { id: 'v-eg-2', country: 'EGY', category: 'Mobile Accessories', name: 'مركز عبدالعزيز لإكسسوارات الموبايل', city: 'القاهرة', notes: 'جرابات، شواحن، وسماعات جملة', verified: true },
  { id: 'v-eg-3', country: 'EGY', category: 'Special Products', name: 'منطقة العاشر من رمضان الصناعية', city: 'الشرقية', notes: 'توريد مصانع مباشرة ومستلزمات تغليف', verified: true },
  { id: 'v-sa-1', country: 'KSA', category: 'Wholesalers', name: 'أسواق الجملة بالبطحاء', city: 'الرياض', notes: 'إلكترونيات ومنتجات منزلية بالجملة', verified: true },
  { id: 'v-sa-2', country: 'KSA', category: 'Retailers', name: 'موزعو الإلكترونيات — جدة', city: 'جدة', notes: 'تجهيز شحنات FBA و FBN', verified: true },
  { id: 'v-ae-1', country: 'UAE', category: 'Wholesalers', name: 'سوق التنين (Dragon Mart Wholesale)', city: 'دبي', notes: 'استيراد مباشر وتجارة جملة', verified: true },
];

const VENDOR_CATEGORIES = [
  'Mobile Accessories',
  'Retailers',
  'Special Products',
  'Telegram Suppliers',
  'Wholesalers',
];

const memoryConnections = new Map();

function deriveAesKey() {
  const secretSeed = process.env.JWT_SECRET || process.env.ENCRYPTION_KEY || 'maxp-marketplace-hub-local-key';
  return crypto.createHash('sha256').update(secretSeed).digest();
}

function encryptConfig(obj) {
  const key = deriveAesKey();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const plaintext = JSON.stringify(obj || {});
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString('hex')}:${tag.toString('hex')}:${encrypted.toString('hex')}`;
}

function decryptConfig(payload) {
  if (!payload || typeof payload !== 'string') return {};
  const parts = payload.split(':');
  if (parts.length !== 3) return {};
  const [ivHex, tagHex, encHex] = parts;
  const decipher = crypto.createDecipheriv('aes-256-gcm', deriveAesKey(), Buffer.from(ivHex, 'hex'));
  decipher.setAuthTag(Buffer.from(tagHex, 'hex'));
  const plain = Buffer.concat([decipher.update(Buffer.from(encHex, 'hex')), decipher.final()]).toString('utf8');
  return JSON.parse(plain);
}

function getVendors({ country = 'EGY', category = '', search = '' }) {
  const c = String(country || 'EGY').toUpperCase();
  const cat = String(category || '').trim();
  const q = String(search || '').trim().toLowerCase();

  return {
    categories: VENDOR_CATEGORIES,
    vendors: VENDORS_DIRECTORY.filter((v) => {
      if (v.country !== c) return false;
      if (cat && v.category !== cat) return false;
      if (q && !v.name.toLowerCase().includes(q) && !v.notes.toLowerCase().includes(q)) return false;
      return true;
    }),
  };
}

function parseMarketplaceCsv({ platform = 'amazon', csvText = '' }) {
  const raw = String(csvText || '').trim();
  if (!raw) {
    const err = new Error('محتوى الملف فارغ');
    err.statusCode = 400;
    throw err;
  }

  const lines = raw.split(/\r?\n/).filter((line) => line.trim().length > 0);
  if (lines.length < 2) {
    const err = new Error('الملف يجب أن يحتوي على صف العناوين وصف بيانات واحد على الأقل');
    err.statusCode = 400;
    throw err;
  }

  const splitCsvLine = (line) => line.split(',').map((cell) => cell.trim().replace(/^"|"$/g, ''));
  const headers = splitCsvLine(lines[0]);
  const rows = lines.slice(1, 101).map((line, idx) => {
    const cols = splitCsvLine(line);
    const record = {};
    headers.forEach((h, i) => {
      record[h] = cols[i] ?? '';
    });
    return {
      rowNumber: idx + 1,
      sku: record.sku || record.SKU || record['seller-sku'] || record.PartnerSKU || `ROW-${idx + 1}`,
      title: record.title || record.Title || record['product-name'] || record.Name || 'منتج مستورد',
      price: Number(record.price || record.Price || record['item-price'] || 0) || 0,
      stock: Number(record.quantity || record.Quantity || record.stock || record.Stock || 0) || 0,
      raw: record,
    };
  });

  return {
    platform,
    totalRowsParsed: rows.length,
    headers,
    previewRows: rows,
  };
}

async function listConnections(companyId, prisma = safeGetPrisma()) {
  const key = String(companyId || 'default');
  if (prisma?.marketplaceChannelConnection?.findMany) {
    const rows = await prisma.marketplaceChannelConnection.findMany({
      where: { companyId: key },
      select: {
        id: true,
        platform: true,
        country: true,
        storeName: true,
        status: true,
        authMode: true,
        lastSyncAt: true,
        updatedAt: true,
      },
    });
    return rows;
  }
  return (memoryConnections.get(key) || []).map(({ encryptedConfig: _omit, ...safe }) => safe);
}

async function getSavedConnectionCredentials(companyId, platform, country, prisma = safeGetPrisma()) {
  const key = String(companyId || 'default');
  const plat = String(platform || 'amazon').toLowerCase();
  const ctry = String(country || 'EGY').toUpperCase();
  if (prisma?.marketplaceChannelConnection?.findFirst) {
    const row = await prisma.marketplaceChannelConnection.findFirst({
      where: { companyId: key, platform: plat, country: ctry },
    });
    return row?.encryptedConfig ? decryptConfig(row.encryptedConfig) : null;
  }
  const found = (memoryConnections.get(key) || []).find(
    (item) => item.platform === plat && (item.country === ctry || !country)
  );
  return found?.encryptedConfig ? decryptConfig(found.encryptedConfig) : null;
}

async function saveConnection({ companyId, platform, country = 'EGY', storeName, authMode = 'API_KEY', credentials }, prisma = safeGetPrisma()) {
  const key = String(companyId || 'default');
  const plat = String(platform || '').toLowerCase();
  const ctry = String(country || 'EGY').toUpperCase();
  if (!['amazon', 'noon', 'jumia', 'trendyol'].includes(plat)) {
    const err = new Error('منصة غير مدعومة');
    err.statusCode = 400;
    throw err;
  }

  const encryptedConfig = encryptConfig(credentials || {});
  const status = credentials && Object.keys(credentials).length > 0 ? 'CONFIGURED' : 'PENDING_OAUTH';

  if (prisma?.marketplaceChannelConnection?.upsert) {
    return prisma.marketplaceChannelConnection.upsert({
      where: { companyId_platform_country: { companyId: key, platform: plat, country: ctry } },
      update: { storeName: storeName || null, authMode, encryptedConfig, status },
      create: { companyId: key, platform: plat, country: ctry, storeName: storeName || null, authMode, encryptedConfig, status },
      select: { id: true, platform: true, country: true, storeName: true, status: true, authMode: true, updatedAt: true },
    });
  }

  const list = memoryConnections.get(key) || [];
  const next = {
    id: `conn-${plat}-${ctry}`,
    platform: plat,
    country: ctry,
    storeName: storeName || `${plat.toUpperCase()} (${ctry})`,
    status,
    authMode,
    encryptedConfig,
    updatedAt: new Date().toISOString(),
  };
  const idx = list.findIndex((item) => item.platform === plat && item.country === ctry);
  if (idx >= 0) list[idx] = next;
  else list.push(next);
  memoryConnections.set(key, list);
  const { encryptedConfig: _omit, ...safeNext } = next;
  return safeNext;
}

async function removeConnection(companyId, platform, country = 'EGY', prisma = safeGetPrisma()) {
  const key = String(companyId || 'default');
  const plat = String(platform || '').toLowerCase();
  const ctry = String(country || 'EGY').toUpperCase();

  if (prisma?.marketplaceChannelConnection?.deleteMany) {
    await prisma.marketplaceChannelConnection.deleteMany({
      where: { companyId: key, platform: plat, country: ctry },
    });
    return { removed: true };
  }

  const list = (memoryConnections.get(key) || []).filter((item) => !(item.platform === plat && item.country === ctry));
  memoryConnections.set(key, list);
  return { removed: true };
}

function buildAmazonOAuthConsentUrl(country = 'EGY', appId = process.env.AMAZON_SP_API_APP_ID) {
  const domains = { EGY: 'sellercentral.amazon.eg', KSA: 'sellercentral.amazon.sa', UAE: 'sellercentral.amazon.ae' };
  const host = domains[String(country).toUpperCase()] || domains.EGY;
  if (!appId) {
    return {
      ready: false,
      reason: 'يتطلب وجود حساب Amazon Seller Central + تسجيل تطبيق SP-API App ID أولاً',
      sellerSignupUrl: `https://${host.replace('sellercentral.', 'sell.')}`,
      developerRegisterUrl: `https://${host}/developer/register`,
    };
  }
  const state = crypto.randomBytes(16).toString('hex');
  return {
    ready: true,
    oauthUrl: `https://${host}/apps/authorize/consent?application_id=${encodeURIComponent(appId)}&state=${state}&version=beta`,
  };
}

async function fetchAmazonOrders({ clientId, clientSecret, refreshToken, region = 'na', mode = 'sandbox', dateRangeDays = 30 }) {
  const cleanId = String(clientId || '').trim();
  const cleanSecret = String(clientSecret || '').trim();
  const cleanToken = String(refreshToken || '').trim();
  if (!cleanId || !cleanSecret || !cleanToken) {
    const err = new Error('Client ID و Client Secret و Refresh Token مطلوبة');
    err.statusCode = 400;
    throw err;
  }

  const normalizedRegion = ['na', 'eu', 'fe'].includes(String(region).toLowerCase())
    ? String(region).toLowerCase()
    : 'na';
  const marketplaceByRegion = { na: 'ATVPDKIKX0DER', eu: 'ARBP9OOSHTCHU', fe: 'A1VC38T7YXB528' };
  const marketplaceId = marketplaceByRegion[normalizedRegion];

  const tokenParams = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: cleanToken,
    client_id: cleanId,
    client_secret: cleanSecret,
  });

  const lwaRes = await fetch('https://api.amazon.com/auth/o2/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' },
    body: tokenParams.toString(),
  });
  const lwaJson = await lwaRes.json();
  if (!lwaRes.ok || !lwaJson.access_token) {
    const err = new Error(`فشل مصادقة Amazon LWA: ${lwaJson.error_description || lwaJson.error || lwaRes.status}`);
    err.statusCode = 400;
    throw err;
  }

  const hostPrefix = mode === 'production' ? 'sellingpartnerapi' : 'sandbox.sellingpartnerapi';
  const createdAfter = mode === 'production'
    ? new Date(Date.now() - Math.max(1, Number(dateRangeDays || 30)) * 86400000).toISOString()
    : 'TEST_CASE_200';
  const spUrl = `https://${hostPrefix}-${normalizedRegion}.amazon.com/orders/v0/orders?MarketplaceIds=${marketplaceId}&CreatedAfter=${encodeURIComponent(createdAfter)}`;

  const spRes = await fetch(spUrl, {
    method: 'GET',
    headers: {
      'x-amz-access-token': lwaJson.access_token,
      Accept: 'application/json',
    },
  });
  const spJson = await spRes.json();
  if (!spRes.ok) {
    const errMsg = spJson?.errors?.[0]?.message || `SP-API HTTP ${spRes.status}`;
    const err = new Error(`فشل استدعاء SP-API: ${errMsg}`);
    err.statusCode = 400;
    throw err;
  }

  return {
    region: normalizedRegion,
    marketplaceId,
    mode,
    tokenExpiresIn: lwaJson.expires_in,
    orders: spJson?.payload?.Orders || [],
  };
}

async function testAmazonSandbox({ clientId, clientSecret, refreshToken, region = 'na' }) {
  const res = await fetchAmazonOrders({ clientId, clientSecret, refreshToken, region, mode: 'sandbox' });
  return {
    connected: true,
    region: res.region,
    marketplaceId: res.marketplaceId,
    tokenExpiresIn: res.tokenExpiresIn,
    ordersCount: res.orders.length,
    sampleOrders: res.orders.slice(0, 5),
  };
}

function aggregateOrdersToAnalytics(orders, { region, marketplaceId, mode, country, dateRange }) {
  const list = Array.isArray(orders) ? orders : [];
  const round2 = (n) => Math.round((Number(n) + Number.EPSILON) * 100) / 100;

  let totalRevenue = 0;
  let unshippedCount = 0;
  let shippedCount = 0;
  let itemsOrdered = 0;
  const currency = list[0]?.OrderTotal?.CurrencyCode || (country === 'KSA' ? 'SAR' : country === 'UAE' ? 'AED' : 'EGP');
  const channelMap = new Map();

  const sales = list.map((o) => {
    const amount = Number(o?.OrderTotal?.Amount || 0);
    const items = Number(o?.NumberOfItemsShipped || 0) + Number(o?.NumberOfItemsUnshipped || 0);
    totalRevenue += amount;
    itemsOrdered += items;
    if (String(o?.OrderStatus || '').toLowerCase() === 'shipped') shippedCount += 1;
    else unshippedCount += 1;

    const ch = `${o?.SalesChannel || 'Amazon'} · ${o?.FulfillmentChannel || 'MFN'}`;
    const prev = channelMap.get(ch) || { channel: ch, ordersCount: 0, units: 0, revenue: 0 };
    prev.ordersCount += 1;
    prev.units += items;
    prev.revenue = round2(prev.revenue + amount);
    channelMap.set(ch, prev);

    return {
      orderId: o.AmazonOrderId,
      purchaseDate: o.PurchaseDate,
      status: o.OrderStatus,
      fulfillmentChannel: o.FulfillmentChannel,
      salesChannel: o.SalesChannel,
      amount: round2(amount),
      currency: o?.OrderTotal?.CurrencyCode || currency,
      itemsCount: items,
    };
  });

  const gross = round2(totalRevenue);
  const estimatedCommission = round2(gross * 0.13);
  const estimatedShipping = round2(list.length * (currency === 'USD' ? 3.5 : 45));
  const netPayout = round2(Math.max(0, gross - estimatedCommission - estimatedShipping));

  return {
    connected: true,
    mode,
    region,
    marketplaceId,
    country,
    dateRange,
    currency,
    overview: {
      totalOrders: list.length,
      totalRevenue: gross,
      itemsOrdered,
      unshippedCount,
      shippedCount,
      averageOrderValue: list.length > 0 ? round2(gross / list.length) : 0,
    },
    sales,
    productsPerformance: Array.from(channelMap.values()),
    payments: {
      grossSales: gross,
      estimatedCommission,
      estimatedShipping,
      netPayout,
    },
  };
}

async function getChannelAnalytics({ companyId, country = 'EGY', dateRange = '30d', credentials, region = 'na', mode = 'sandbox' }, prisma = safeGetPrisma()) {
  let activeCreds = credentials;
  if (!activeCreds || !activeCreds.apiKey || !activeCreds.apiSecret || !activeCreds.refreshToken) {
    const saved = await getSavedConnectionCredentials(companyId, 'amazon', country, prisma);
    if (saved?.apiKey && saved?.apiSecret && saved?.refreshToken) {
      activeCreds = saved;
    }
  }

  if (!activeCreds || !activeCreds.apiKey || !activeCreds.apiSecret || !activeCreds.refreshToken) {
    return {
      connected: false,
      country,
      dateRange,
      overview: null,
      sales: [],
      productsPerformance: [],
      payments: null,
    };
  }

  const daysMap = { '1d': 1, '7d': 7, '15d': 15, '30d': 30, '60d': 60 };
  const fetched = await fetchAmazonOrders({
    clientId: activeCreds.apiKey,
    clientSecret: activeCreds.apiSecret,
    refreshToken: activeCreds.refreshToken,
    region,
    mode,
    dateRangeDays: daysMap[dateRange] || 30,
  });

  return aggregateOrdersToAnalytics(fetched.orders, {
    region: fetched.region,
    marketplaceId: fetched.marketplaceId,
    mode: fetched.mode,
    country,
    dateRange,
  });
}

module.exports = {
  getVendors,
  parseMarketplaceCsv,
  listConnections,
  saveConnection,
  removeConnection,
  buildAmazonOAuthConsentUrl,
  testAmazonSandbox,
  getChannelAnalytics,
  aggregateOrdersToAnalytics,
};
