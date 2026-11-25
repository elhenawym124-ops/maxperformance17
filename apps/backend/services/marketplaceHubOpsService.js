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

function encryptConfig(obj) {
  const secretSeed = process.env.JWT_SECRET || process.env.ENCRYPTION_KEY || 'maxp-marketplace-hub-local-key';
  const key = crypto.createHash('sha256').update(secretSeed).digest();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const plaintext = JSON.stringify(obj || {});
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString('hex')}:${tag.toString('hex')}:${encrypted.toString('hex')}`;
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
  return memoryConnections.get(key) || [];
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
    updatedAt: new Date().toISOString(),
  };
  const idx = list.findIndex((item) => item.platform === plat && item.country === ctry);
  if (idx >= 0) list[idx] = next;
  else list.push(next);
  memoryConnections.set(key, list);
  return next;
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

async function testAmazonSandbox({ clientId, clientSecret, refreshToken, region = 'na' }) {
  const cleanId = String(clientId || '').trim();
  const cleanSecret = String(clientSecret || '').trim();
  const cleanToken = String(refreshToken || '').trim();
  if (!cleanId || !cleanSecret || !cleanToken) {
    const err = new Error('Client ID و Client Secret و Refresh Token مطلوبة لاختبار SP-API Sandbox');
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

  const spUrl = `https://sandbox.sellingpartnerapi-${normalizedRegion}.amazon.com/orders/v0/orders?MarketplaceIds=${marketplaceId}&CreatedAfter=TEST_CASE_200`;
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
    const err = new Error(`فشل استدعاء SP-API Sandbox: ${errMsg}`);
    err.statusCode = 400;
    throw err;
  }

  const orders = spJson?.payload?.Orders || [];
  return {
    connected: true,
    region: normalizedRegion,
    marketplaceId,
    tokenExpiresIn: lwaJson.expires_in,
    ordersCount: orders.length,
    sampleOrders: orders.slice(0, 5),
  };
}

module.exports = {
  getVendors,
  parseMarketplaceCsv,
  listConnections,
  saveConnection,
  removeConnection,
  buildAmazonOAuthConsentUrl,
  testAmazonSandbox,
};
