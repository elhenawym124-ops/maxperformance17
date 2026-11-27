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

const SUPPORTED_PLATFORMS = ['amazon', 'noon', 'jumia', 'trendyol', 'shopify', 'zid', 'woocommerce', 'shein'];

async function saveConnection({ companyId, platform, country = 'EGY', storeName, authMode = 'API_KEY', credentials }, prisma = safeGetPrisma()) {
  const key = String(companyId || 'default');
  const plat = String(platform || '').toLowerCase();
  const ctry = String(country || 'EGY').toUpperCase();
  if (!SUPPORTED_PLATFORMS.includes(plat)) {
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

async function exchangeAmazonOAuthCode({ companyId, code, sellingPartnerId, country = 'EGY', clientId, clientSecret }, prisma = safeGetPrisma()) {
  const authCode = String(code || '').trim();
  const activeClientId = String(clientId || process.env.AMAZON_SP_API_CLIENT_ID || '').trim();
  const activeClientSecret = String(clientSecret || process.env.AMAZON_SP_API_CLIENT_SECRET || '').trim();
  if (!authCode || !activeClientId || !activeClientSecret) {
    const err = new Error('كود التوثيق و Client ID و Client Secret مطلوبة لإتمام ربط أمازون');
    err.statusCode = 400;
    throw err;
  }

  const params = new URLSearchParams({
    grant_type: 'authorization_code',
    code: authCode,
    client_id: activeClientId,
    client_secret: activeClientSecret,
  });

  const tokenRes = await fetch('https://api.amazon.com/auth/o2/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' },
    body: params.toString(),
  });
  const tokenJson = await tokenRes.json();
  if (!tokenRes.ok || !tokenJson.refresh_token) {
    const err = new Error(`فشل تبديل كود OAuth: ${tokenJson.error_description || tokenJson.error || tokenRes.status}`);
    err.statusCode = 400;
    throw err;
  }

  return saveConnection({
    companyId,
    platform: 'amazon',
    country,
    storeName: sellingPartnerId ? `Amazon (${sellingPartnerId})` : `Amazon (${country})`,
    authMode: 'SP_API_OAUTH',
    credentials: {
      apiKey: activeClientId,
      apiSecret: activeClientSecret,
      refreshToken: tokenJson.refresh_token,
      sellingPartnerId: sellingPartnerId || '',
    },
  }, prisma);
}

async function listCompanyCatalogProducts(companyId, search = '', prisma = safeGetPrisma()) {
  const key = String(companyId || '');
  if (!key || !prisma?.product?.findMany) {
    return [];
  }
  const q = String(search || '').trim();
  const rows = await prisma.product.findMany({
    where: {
      companyId: key,
      deletedAt: null,
      ...(q
        ? {
            OR: [
              { name: { contains: q, mode: 'insensitive' } },
              { sku: { contains: q, mode: 'insensitive' } },
              { barcode: { contains: q, mode: 'insensitive' } },
            ],
          }
        : {}),
    },
    select: {
      id: true,
      name: true,
      sku: true,
      barcode: true,
      price: true,
      cost: true,
      stock: true,
      weight: true,
    },
    orderBy: { updatedAt: 'desc' },
    take: 50,
  });
  return rows.map((p) => ({
    ...p,
    price: Number(p.price || 0),
    cost: p.cost !== null && p.cost !== undefined ? Number(p.cost) : null,
    weight: p.weight !== null && p.weight !== undefined ? Number(p.weight) : null,
  }));
}

async function pushCsvRowsToMaxpCatalog(companyId, rows = [], prisma = safeGetPrisma()) {
  const key = String(companyId || '');
  const list = Array.isArray(rows) ? rows : [];
  if (list.length === 0) {
    const err = new Error('لا توجد صفوف صالحة لإضافتها للكتالوج');
    err.statusCode = 400;
    throw err;
  }

  if (!key || !prisma?.product?.findFirst || !prisma?.product?.create) {
    return { created: 0, updated: 0, skipped: list.length, mode: 'preview_only' };
  }

  let created = 0;
  let updated = 0;
  for (const item of list.slice(0, 100)) {
    const sku = String(item.sku || '').trim();
    const title = String(item.title || '').trim();
    if (!title) continue;

    const price = Math.max(0, Number(item.price || 0));
    const stock = Math.max(0, Math.floor(Number(item.stock || 0)));

    const existing = sku
      ? await prisma.product.findFirst({ where: { companyId: key, sku, deletedAt: null }, select: { id: true } })
      : null;

    if (existing) {
      await prisma.product.update({
        where: { id: existing.id },
        data: { name: title, price, stock },
      });
      updated += 1;
    } else {
      await prisma.product.create({
        data: {
          companyId: key,
          name: title,
          sku: sku || null,
          barcode: sku || null,
          price,
          stock,
          source: 'marketplace-hub-csv',
          isActive: true,
        },
      });
      created += 1;
    }
  }
  return { created, updated, skipped: 0, mode: 'database' };
}

async function lookupAmazonCatalog({ clientId, clientSecret, refreshToken, region = 'na', mode = 'sandbox', keywords = '', asin = '' }) {
  const cleanId = String(clientId || '').trim();
  const cleanSecret = String(clientSecret || '').trim();
  const cleanToken = String(refreshToken || '').trim();
  if (!cleanId || !cleanSecret || !cleanToken) {
    const err = new Error('بيانات SP-API مطلوبة للبحث في كتالوج أمازون');
    err.statusCode = 400;
    throw err;
  }
  const normalizedRegion = ['na', 'eu', 'fe'].includes(String(region).toLowerCase()) ? String(region).toLowerCase() : 'na';
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
  const query = new URLSearchParams({ marketplaceIds: marketplaceId });
  if (asin) query.set('identifiers', String(asin).trim()), query.set('identifiersType', 'ASIN');
  else query.set('keywords', String(keywords || 'headphones').trim());

  const spRes = await fetch(`https://${hostPrefix}-${normalizedRegion}.amazon.com/catalog/2022-04-01/items?${query.toString()}`, {
    method: 'GET',
    headers: { 'x-amz-access-token': lwaJson.access_token, Accept: 'application/json' },
  });
  const spJson = await spRes.json();
  if (!spRes.ok) {
    const err = new Error(spJson?.errors?.[0]?.message || `SP-API Catalog HTTP ${spRes.status}`);
    err.statusCode = 400;
    throw err;
  }
  return {
    marketplaceId,
    items: spJson?.items || [],
  };
}

async function testStoreConnection({ platform, storeUrl, apiKey, apiSecret }) {
  const plat = String(platform || '').toLowerCase();
  if (!SUPPORTED_PLATFORMS.includes(plat)) {
    const err = new Error('منصة غير مدعومة');
    err.statusCode = 400;
    throw err;
  }

  if (plat === 'shopify') {
    const host = String(storeUrl || '').trim().replace(/^https?:\/\//i, '').replace(/\/+$/, '');
    const token = String(apiSecret || apiKey || '').trim();
    if (!host || !token) {
      const err = new Error('نطاق متجر Shopify و Access Token مطلوبان');
      err.statusCode = 400;
      throw err;
    }
    const res = await fetch(`https://${host}/admin/api/2024-10/shop.json`, {
      method: 'GET',
      headers: { 'X-Shopify-Access-Token': token, Accept: 'application/json' },
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      const err = new Error(json?.errors || `Shopify HTTP ${res.status}`);
      err.statusCode = 400;
      throw err;
    }
    return {
      connected: true,
      platform: 'shopify',
      storeTitle: json?.shop?.name || host,
      currency: json?.shop?.currency || 'USD',
    };
  }

  if (plat === 'woocommerce') {
    const cleanUrl = String(storeUrl || '').trim().replace(/\/+$/, '');
    const ck = String(apiKey || '').trim();
    const cs = String(apiSecret || '').trim();
    if (!cleanUrl || !ck || !cs) {
      const err = new Error('رابط متجر WooCommerce و Consumer Key و Secret مطلوبان');
      err.statusCode = 400;
      throw err;
    }
    const basicAuth = Buffer.from(`${ck}:${cs}`).toString('base64');
    const res = await fetch(`${cleanUrl}/wp-json/wc/v3/system_status`, {
      method: 'GET',
      headers: { Authorization: `Basic ${basicAuth}`, Accept: 'application/json' },
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      const err = new Error(json?.message || `WooCommerce HTTP ${res.status}`);
      err.statusCode = 400;
      throw err;
    }
    return {
      connected: true,
      platform: 'woocommerce',
      storeTitle: json?.environment?.site_url || cleanUrl,
      currency: json?.settings?.currency || 'USD',
    };
  }

  const hasCreds = Boolean(String(apiKey || '').trim() || String(apiSecret || '').trim());
  if (!hasCreds) {
    const err = new Error('بيانات الربط مطلوبة للتحقق');
    err.statusCode = 400;
    throw err;
  }
  return {
    connected: true,
    platform: plat,
    storeTitle: `${plat.toUpperCase()} Credentials Ready`,
    currency: null,
  };
}

const memoryDistributionRules = new Map();

function computeAllocationMatrix(products, channels, ruleConfig = {}) {
  const safetyBuffer = Math.max(0, Math.floor(Number(ruleConfig.safetyBuffer ?? 2)));
  const rawShares = ruleConfig.channelShares || {};
  const activeChannels = channels.length > 0 ? channels : ['amazon', 'noon'];
  const evenShare = Math.floor(100 / activeChannels.length);
  const shares = {};
  activeChannels.forEach((ch, idx) => {
    const custom = Number(rawShares[ch]);
    shares[ch] = Number.isFinite(custom) && custom >= 0
      ? custom
      : (idx === activeChannels.length - 1 ? 100 - evenShare * (activeChannels.length - 1) : evenShare);
  });

  const shareSum = Object.values(shares).reduce((acc, v) => acc + v, 0);
  const items = products.map((p) => {
    const totalAvailable = Math.max(0, Number(p.availableStock ?? p.stock ?? 0));
    const distributable = Math.max(0, totalAvailable - safetyBuffer);
    const channelAllocations = {};
    activeChannels.forEach((ch) => {
      channelAllocations[ch] = Math.floor((distributable * (shares[ch] || 0)) / 100);
    });
    const allocatedSum = Object.values(channelAllocations).reduce((acc, v) => acc + v, 0);
    const conflicts = [];
    if (shareSum > 100) conflicts.push('مجموع نسب التوزيع يتجاوز 100% — خطر بيع زائد (Oversell)');
    if (totalAvailable > 0 && totalAvailable <= safetyBuffer) conflicts.push('الكمية ضمن هامش الأمان ولن تُعرض على القنوات');
    if (Number(p.reserved || 0) > totalAvailable) conflicts.push('المخزون المحجوز يتجاوز المتاح');

    return {
      productId: p.id,
      sku: p.sku,
      name: p.name,
      warehouseName: p.warehouseName || 'المستودع الرئيسي',
      totalQuantity: Number(p.quantity ?? p.stock ?? 0),
      reserved: Number(p.reserved || 0),
      available: totalAvailable,
      distributable,
      channelAllocations,
      allocatedSum,
      conflicts,
    };
  });

  return {
    safetyBuffer,
    shareSum,
    shares,
    activeChannels,
    conflictCount: items.filter((i) => i.conflicts.length > 0).length,
    items,
  };
}

async function getStockDistributionPlan(companyId, prisma = safeGetPrisma()) {
  const key = String(companyId || 'default');
  const connections = await listConnections(key, prisma);
  const connectedPlatforms = Array.from(new Set(connections.map((c) => c.platform)));
  const ruleConfig = memoryDistributionRules.get(key) || { safetyBuffer: 2, channelShares: {} };

  let warehouses = [];
  let products = [];

  if (prisma?.warehouse?.findMany) {
    warehouses = await prisma.warehouse.findMany({
      where: { companyId: key, isActive: true },
      select: { id: true, name: true, location: true, type: true },
      take: 20,
    }).catch(() => []);
  }

  if (prisma?.inventory?.findMany) {
    const invRows = await prisma.inventory.findMany({
      where: { warehouse: { companyId: key } },
      include: {
        warehouse: { select: { name: true } },
        product: { select: { id: true, name: true, sku: true, stock: true } },
      },
      take: 50,
    }).catch(() => []);

    products = invRows
      .filter((r) => r.product)
      .map((r) => ({
        id: r.product.id,
        name: r.product.name,
        sku: r.product.sku,
        warehouseName: r.warehouse?.name || 'المستودع الرئيسي',
        quantity: Number(r.quantity || 0),
        reserved: Number(r.reserved || 0),
        availableStock: Math.max(0, Number(r.available || r.quantity || 0)),
      }));
  }

  if (products.length === 0 && prisma?.product?.findMany) {
    const prodRows = await prisma.product.findMany({
      where: { companyId: key, deletedAt: null },
      select: { id: true, name: true, sku: true, stock: true },
      orderBy: { updatedAt: 'desc' },
      take: 30,
    }).catch(() => []);
    products = prodRows.map((p) => ({
      id: p.id,
      name: p.name,
      sku: p.sku,
      warehouseName: warehouses[0]?.name || 'المستودع الافتراضي',
      quantity: Number(p.stock || 0),
      reserved: 0,
      availableStock: Math.max(0, Number(p.stock || 0)),
    }));
  }

  return {
    warehouses,
    ...computeAllocationMatrix(products, connectedPlatforms, ruleConfig),
  };
}

async function saveStockDistributionRules(companyId, payload = {}, prisma = safeGetPrisma()) {
  const key = String(companyId || 'default');
  const ruleConfig = {
    safetyBuffer: Math.max(0, Math.floor(Number(payload.safetyBuffer ?? 2))),
    channelShares: payload.channelShares && typeof payload.channelShares === 'object' ? payload.channelShares : {},
  };
  memoryDistributionRules.set(key, ruleConfig);
  return getStockDistributionPlan(key, prisma);
}

module.exports = {
  SUPPORTED_PLATFORMS,
  getVendors,
  parseMarketplaceCsv,
  listConnections,
  saveConnection,
  removeConnection,
  buildAmazonOAuthConsentUrl,
  exchangeAmazonOAuthCode,
  testAmazonSandbox,
  testStoreConnection,
  getChannelAnalytics,
  aggregateOrdersToAnalytics,
  listCompanyCatalogProducts,
  pushCsvRowsToMaxpCatalog,
  lookupAmazonCatalog,
  computeAllocationMatrix,
  getStockDistributionPlan,
  saveStockDistributionRules,
};
