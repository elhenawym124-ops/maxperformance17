/**
 * LG Express (Accurate Logistics) Shipping Service
 * GraphQL API — https://a2x.lg.accuratess.com:8443/graphql
 */

const axios = require('axios');
const { getSharedPrismaClient, safeQuery } = require('./sharedDatabase');
const { calculateCollectableCodAmount } = require('../utils/shippingFinancialUtils');
const {
  cleanPhoneNumber,
  cleanCustomerName,
  cleanShippingAddress,
  cleanShippingNotes,
  detectGovernorateFromText,
} = require('../utils/shippingSanitizer');

const LG_API_URL = 'https://a2x.lg.accuratess.com:8443/graphql';
const TOKEN_TTL_MS = 23 * 60 * 60 * 1000; // 23h conservative

// ---------------------------------------------------------------------------
// GraphQL helpers
// ---------------------------------------------------------------------------
const GQL_LOGIN = `
  mutation login($input: LoginInput!) {
    login(input: $input) {
      token
      tokenType
    }
  }
`;

const GQL_SAVE_SHIPMENT = `
  mutation saveShipment($input: ShipmentInput!) {
    saveShipment(input: $input) {
      id
      code
      trackingUrl
      notes
    }
  }
`;

const GQL_LIST_SERVICES = `
  query listShippingServicesDropdown {
    listShippingServicesDropdown {
      id
      name
    }
  }
`;

const GQL_LIST_ZONES = `
  query listZonesDropdown($parentId: Int) {
    listZonesDropdown(parentId: $parentId) {
      id
      name
    }
  }
`;

const GQL_TRACK = `
  query shipment($code: String!) {
    shipment(code: $code) {
      id
      code
      status { name }
      trackingUrl
      recipientName
      recipientMobile
      recipientAddress
    }
  }
`;

// ---------------------------------------------------------------------------
// Zone name → LG zone mapping (Egyptian governorates in Arabic & English)
// ---------------------------------------------------------------------------
const GOVERNORATE_ALIASES = {
  'القاهرة': ['cairo', 'القاهره', 'قاهره', 'قاهرة'],
  'الجيزة': ['giza', 'الجيزه', 'جيزه', 'جيزة'],
  'الإسكندرية': ['alex', 'alexandria', 'الاسكندريه', 'الإسكندريه', 'اسكندريه', 'اسكندرية', 'إسكندريه'],
  'الشرقية': ['sharqia', 'sharkeya', 'الشرقيه', 'شرقية', 'شرقيه'],
  'الغربية': ['gharbia', 'gharbiea', 'الغربيه', 'غربية', 'غربيه'],
  'المنوفية': ['menofia', 'menoufia', 'المنوفيه', 'منوفيه', 'منوفية'],
  'القليوبية': ['qalyubia', 'قليوبية', 'القليوبيه'],
  'البحيرة': ['beheira', 'البحيره', 'بحيره', 'بحيرة'],
  'كفر الشيخ': ['kafr el sheikh', 'كفر الشيخ', 'كفر الشيخه'],
  'الدقهلية': ['dakahlia', 'الدقهليه', 'دقهليه', 'دقهلية'],
  'دمياط': ['damietta', 'دمياط', 'دمياطه'],
  'بورسعيد': ['port said', 'بورسعيد', 'بور سعيد'],
  'الإسماعيلية': ['ismailia', 'الاسماعيليه', 'اسماعيليه', 'اسماعيلية'],
  'السويس': ['suez', 'السويس'],
  'شمال سيناء': ['north sinai', 'شمال سيناء', 'شمال سينا'],
  'جنوب سيناء': ['south sinai', 'جنوب سيناء', 'جنوب سينا'],
  'المنيا': ['minya', 'menia', 'المنيا', 'منيا'],
  'أسيوط': ['assiut', 'asyut', 'اسيوط', 'أسيوط'],
  'سوهاج': ['sohag', 'سوهاج'],
  'قنا': ['qena', 'قنا'],
  'الأقصر': ['luxor', 'الأقصر', 'الاقصر', 'اقصر'],
  'أسوان': ['aswan', 'اسوان', 'أسوان'],
  'الوادي الجديد': ['new valley', 'الوادي الجديد', 'وادي جديد'],
  'مطروح': ['marsa matrouh', 'matrouh', 'مطروح', 'مرسى مطروح'],
  'البحر الأحمر': ['red sea', 'البحر الاحمر', 'البحر الأحمر'],
  'الفيوم': ['fayoum', 'fayum', 'الفيوم', 'فيوم'],
  'بني سويف': ['beni suef', 'بني سويف', 'بني سويفه'],
};

function normalizeArabic(str = '') {
  return str
    .trim()
    .toLowerCase()
    .replace(/[أإآ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .replace(/\s+/g, ' ');
}

function findBestZoneMatch(zones, searchText) {
  if (!searchText || !Array.isArray(zones)) return null;
  const norm = normalizeArabic(searchText);
  const normLower = norm.toLowerCase();

  // Exact match first
  let match = zones.find((z) => normalizeArabic(z.name) === norm);
  if (match) return match;

  // Alias match
  for (const [canonical, aliases] of Object.entries(GOVERNORATE_ALIASES)) {
    const normCanonical = normalizeArabic(canonical);
    if (normCanonical === norm || aliases.some((a) => normalizeArabic(a) === norm)) {
      const found = zones.find((z) => normalizeArabic(z.name) === normCanonical);
      if (found) return found;
    }
  }

  // Partial contains
  match = zones.find((z) => normalizeArabic(z.name).includes(norm) || norm.includes(normalizeArabic(z.name)));
  if (match) return match;

  // English partial
  match = zones.find((z) => z.name.toLowerCase().includes(normLower) || normLower.includes(z.name.toLowerCase()));
  return match || null;
}

// ---------------------------------------------------------------------------
class LgService {
  constructor(options = {}, companyId = null) {
    this.username = options.username || options.apiName || '';
    this.password = options.password || options.apiPassword || '';
    this.apiUrl = (options.apiUrl || LG_API_URL).replace(/\/+$/, '');
    this.serviceId = options.serviceId ? Number(options.serviceId) : null;
    this.cachedToken = options.cachedToken || options.token || null;
    this.tokenCachedAt = options.tokenCachedAt ? Number(options.tokenCachedAt) : null;
    this.companyId = companyId;
    this.timeout = 30000;
    // zone cache (in-process only; re-fetched per process restart)
    this._zonesCache = null;
  }

  // -------------------------------------------------------------------------
  // DB credentials loader
  // -------------------------------------------------------------------------
  async ensureCredentials() {
    if (this.username && this.password) return;
    if (!this.companyId) throw new Error('لم يتم تحديد معرّف الشركة لاسترجاع بيانات LG Express.');

    const prisma = getSharedPrismaClient();
    const carrier = await safeQuery(
      () =>
        prisma.shippingCompany.findFirst({
          where: {
            companyId: this.companyId,
            OR: [
              { providerKey: 'LG_EXPRESS' },
              { slug: 'lg-express' },
              { slug: 'lg_express' },
              { name: { contains: 'lg', mode: 'insensitive' } },
              { name: { contains: 'accurate', mode: 'insensitive' } },
            ],
            isActive: true,
          },
        }),
      2,
    );

    if (!carrier) throw new Error('لم يتم العثور على شركة LG Express مفعلة في إعدادات المتجر.');

    let settings = {};
    try {
      settings = carrier.settings
        ? typeof carrier.settings === 'string'
          ? JSON.parse(carrier.settings)
          : carrier.settings
        : {};
    } catch {
      settings = {};
    }

    this.username = this.username || settings.username || settings.apiName || carrier.apiKey || '';
    this.password = this.password || settings.password || settings.apiPassword || '';
    this.serviceId = this.serviceId || (settings.serviceId ? Number(settings.serviceId) : null);
    this.cachedToken = this.cachedToken || settings.cachedToken || null;
    this.tokenCachedAt = this.tokenCachedAt || (settings.tokenCachedAt ? Number(settings.tokenCachedAt) : null);
    this._carrierId = carrier.id;

    if (carrier.apiUrl) this.apiUrl = carrier.apiUrl.replace(/\/+$/, '');
    if (!this.username || !this.password)
      throw new Error('بيانات الربط (username / password) الخاصة بـ LG Express غير مكتملة.');
  }

  // -------------------------------------------------------------------------
  // GraphQL POST
  // -------------------------------------------------------------------------
  async _gql(query, variables = {}, token = null) {
    const headers = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      'User-Agent': 'MaxP-ShippingPlatform/2.0',
    };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const response = await axios.post(
      this.apiUrl,
      { query, variables },
      { headers, timeout: this.timeout },
    );

    const { data, errors } = response.data || {};
    if (errors && errors.length > 0) {
      const msg = errors[0]?.message || 'GraphQL error';
      throw new Error(msg);
    }
    return data;
  }

  // -------------------------------------------------------------------------
  // Auth: login + token cache
  // -------------------------------------------------------------------------
  async login() {
    await this.ensureCredentials();
    const data = await this._gql(GQL_LOGIN, {
      input: { username: this.username, password: this.password, rememberMe: true },
    });
    const token = data?.login?.token;
    if (!token) throw new Error('LG Express: لم يتم استلام رمز المصادقة (token).');
    this.cachedToken = token;
    this.tokenCachedAt = Date.now();
    await this._persistToken(token);
    return token;
  }

  async _persistToken(token) {
    if (!this._carrierId && !this.companyId) return;
    try {
      const prisma = getSharedPrismaClient();
      const where = this._carrierId
        ? { id: this._carrierId }
        : { companyId_slug: { companyId: this.companyId, slug: 'lg-express' } };

      const existing = await safeQuery(() => prisma.shippingCompany.findFirst({ where }), 1);
      if (!existing) return;

      let settings = {};
      try {
        settings = existing.settings
          ? typeof existing.settings === 'string'
            ? JSON.parse(existing.settings)
            : existing.settings
          : {};
      } catch { settings = {}; }

      settings.cachedToken = token;
      settings.tokenCachedAt = Date.now();
      await prisma.shippingCompany.update({
        where: { id: existing.id },
        data: { settings: JSON.stringify(settings) },
      });
    } catch (e) {
      console.warn('⚠️ [LG_EXPRESS] Could not persist token:', e.message);
    }
  }

  async ensureToken() {
    await this.ensureCredentials();
    const expired = !this.tokenCachedAt || Date.now() - this.tokenCachedAt > TOKEN_TTL_MS;
    if (this.cachedToken && !expired) return this.cachedToken;
    return this.login();
  }

  // -------------------------------------------------------------------------
  // Service ID
  // -------------------------------------------------------------------------
  async resolveServiceId() {
    if (this.serviceId) return this.serviceId;
    const token = await this.ensureToken();
    try {
      const data = await this._gql(GQL_LIST_SERVICES, {}, token);
      const services = data?.listShippingServicesDropdown || [];
      if (services.length > 0) {
        this.serviceId = Number(services[0].id);
        return this.serviceId;
      }
    } catch (e) {
      console.warn('⚠️ [LG_EXPRESS] Could not list services:', e.message);
    }
    throw new Error('LG Express: لا توجد خدمات شحن متاحة.');
  }

  // -------------------------------------------------------------------------
  // Zones
  // -------------------------------------------------------------------------
  async getZones(parentId = null) {
    const token = await this.ensureToken();
    const vars = parentId ? { parentId } : {};
    const data = await this._gql(GQL_LIST_ZONES, vars, token);
    return data?.listZonesDropdown || [];
  }

  async resolveZoneIds(governorate, city) {
    // Fetch top-level zones once per service instance
    if (!this._zonesCache) {
      this._zonesCache = await this.getZones();
    }
    const zones = this._zonesCache;

    const govText = governorate || city || '';
    const zoneMatch = findBestZoneMatch(zones, govText);
    if (!zoneMatch) {
      throw new Error(`LG Express: لم يتم التعرف على المحافظة: ${govText}`);
    }

    // Fetch subzones for this zone
    let subzones = [];
    try {
      subzones = await this.getZones(Number(zoneMatch.id));
    } catch { subzones = []; }

    const cityText = city && city !== governorate ? city : '';
    let subzoneMatch = cityText ? findBestZoneMatch(subzones, cityText) : null;
    if (!subzoneMatch && subzones.length > 0) subzoneMatch = subzones[0]; // fallback first subzone
    if (!subzoneMatch) subzoneMatch = zoneMatch; // last resort: use zone itself

    return { zoneId: Number(zoneMatch.id), subzoneId: Number(subzoneMatch.id) };
  }

  // -------------------------------------------------------------------------
  // Format order
  // -------------------------------------------------------------------------
  formatOrderForLG(order = {}, customer = {}, items = []) {
    const rawName =
      order.customerName ||
      customer.name ||
      (customer.firstName ? `${customer.firstName} ${customer.lastName || ''}`.trim() : null) ||
      'عميل متجر';

    const recipientName = cleanCustomerName(rawName);
    const rawPhone = order.customerPhone || customer.phone || '';
    const recipientMobile = cleanPhoneNumber(rawPhone);
    const rawAddress = order.shippingAddress || customer.address || '';
    const recipientAddress = cleanShippingAddress(rawAddress) || rawAddress;
    const detectedGov = detectGovernorateFromText(order.governorate || order.city || recipientAddress);
    const governorate = detectedGov || order.governorate || order.city || 'القاهرة';
    const city = order.city || order.shippingCity || governorate;
    const codAmount = calculateCollectableCodAmount(order);
    const orderNumber = String(order.orderNumber || order.id || Date.now());
    const notes = cleanShippingNotes(order.notes || order.customerNotes || '');
    const itemCount = Array.isArray(items)
      ? items.reduce((s, i) => s + (Number(i.quantity) || 1), 0)
      : Number(order.itemsCount) || 1;

    return {
      orderId: order.id,
      orderNumber,
      recipientName,
      recipientMobile,
      recipientAddress,
      governorate,
      city,
      codAmount,
      notes,
      pieces: itemCount,
      weight: Number(order.weight) || 1,
    };
  }

  // -------------------------------------------------------------------------
  // Create shipment
  // -------------------------------------------------------------------------
  async createShipment(orderData) {
    let token = await this.ensureToken();
    const serviceId = await this.resolveServiceId();
    const { zoneId, subzoneId } = await this.resolveZoneIds(orderData.governorate, orderData.city);

    const isCOD = orderData.codAmount > 0;

    const input = {
      serviceId,
      recipientName: orderData.recipientName,
      recipientMobile: orderData.recipientMobile,
      recipientAddress: orderData.recipientAddress,
      recipientZoneId: zoneId,
      recipientSubzoneId: subzoneId,
      description: orderData.orderNumber,
      notes: orderData.notes || '',
      price: isCOD ? Number(orderData.codAmount) : 0,
      paymentTypeCode: isCOD ? 'COLC' : 'PAID',
      priceTypeCode: 'INCLD',
      openableCode: 'N',
      pieces: orderData.pieces || 1,
      weight: orderData.weight || 1,
    };

    const tryCreate = async (tok) => {
      const data = await this._gql(GQL_SAVE_SHIPMENT, { input }, tok);
      return data?.saveShipment;
    };

    let shipment;
    try {
      shipment = await tryCreate(token);
    } catch (err) {
      if (err.message && err.message.includes('Unauthenticated')) {
        token = await this.login();
        shipment = await tryCreate(token);
      } else {
        throw err;
      }
    }

    if (!shipment) throw new Error('LG Express: لم يتم استلام بيانات البوليصة من الخادم.');

    const trackingNumber = String(shipment.code || shipment.id);
    return {
      success: true,
      status: 'CREATED',
      externalShipmentId: String(shipment.id || trackingNumber),
      trackingNumber,
      labelUrl: shipment.trackingUrl || `https://lg.accuratess.com/tracking?code=${trackingNumber}`,
      serviceLevel: 'LG Express Standard',
      cost: null,
      data: shipment,
    };
  }

  // -------------------------------------------------------------------------
  // Track
  // -------------------------------------------------------------------------
  async trackShipment(code) {
    if (!code) throw new Error('رقم التتبع مطلوب');
    const token = await this.ensureToken();
    const data = await this._gql(GQL_TRACK, { code }, token);
    const s = data?.shipment;
    return {
      success: Boolean(s),
      trackingNumber: code,
      status: s?.status?.name || null,
      trackingUrl: s?.trackingUrl || `https://lg.accuratess.com/tracking?code=${code}`,
      carrier: 'LG_EXPRESS',
      raw: s || null,
    };
  }

  // -------------------------------------------------------------------------
  // Test connection
  // -------------------------------------------------------------------------
  async testConnection(customCredentials = {}) {
    const username = customCredentials.username || customCredentials.apiName || this.username;
    const password = customCredentials.password || customCredentials.apiPassword || this.password;
    const apiUrl = (customCredentials.apiUrl || this.apiUrl).replace(/\/+$/, '');

    if (!username || !password) throw new Error('يرجى إدخال اسم المستخدم وكلمة المرور لـ LG Express');

    const tmpService = new LgService({ username, password, apiUrl }, this.companyId);
    const token = await tmpService.login();
    return {
      success: Boolean(token),
      message: 'تم التحقق من بيانات الاتصال بـ LG Express بنجاح ✓',
    };
  }
}

module.exports = LgService;
