/**
 * Hashtag Express Shipping Service — Facade
 * إدارة عمليات الربط والشحن والتتبع والتوليد الآلي لبوالص شركة هاشتاج إكسبريس (Hashtag Express)
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
const {
  decryptHashtagSettings,
} = require('./hashtag/hashtagCredentials');
const { mapHashtagStatus } = require('./hashtag/hashtagStatusMap');

const DEFAULT_API_URL = 'https://hashtag-express.com/app';
const DEFAULT_CREATE_PATH = '/orders.php';
const DEFAULT_TRACK_PATH = '/track.php';
const DEFAULT_TEST_PATH = '/orders.php';

const trimSlash = (value) => String(value || '').replace(/\/+$/, '');

const buildLogSuffix = (settings) =>
  String(settings?.apiName || settings?.username || settings?.apiKey || '').trim().slice(0, 6) || 'unknown';

class HashtagService {
  constructor(options = {}, companyId = null) {
    if (typeof options === 'string') {
      this.apiName = options;
      this.apiPassword = '';
      this.apiUrl = trimSlash(process.env.HASHTAG_API_URL || DEFAULT_API_URL);
      this.createPath = DEFAULT_CREATE_PATH;
      this.trackPath = DEFAULT_TRACK_PATH;
      this.testPath = DEFAULT_TEST_PATH;
    } else {
      const opts = options || {};
      this.apiName = opts.apiName || opts.apiKey || opts.username || '';
      this.apiPassword = opts.apiPassword || opts.password || '';
      this.apiUrl = trimSlash(opts.apiUrl || process.env.HASHTAG_API_URL || DEFAULT_API_URL);
      this.createPath = opts.createPath || DEFAULT_CREATE_PATH;
      this.trackPath = opts.trackPath || DEFAULT_TRACK_PATH;
      this.testPath = opts.testPath || DEFAULT_TEST_PATH;
    }
    this.companyId = companyId;
    this.timeout = 25000;
    this.logPrefix = 'unknown';
  }

  /**
   * استرجاع بيانات الاعتماد المشفّرة الخاصة بشركة هاشتاج إكسبريس من قاعدة البيانات
   * وفك تشفيرها في الذاكرة فقط قبل الاستخدام.
   */
  async ensureCredentials() {
    if (this.apiName && this.apiPassword) {
      this.logPrefix = buildLogSuffix(this);
      return;
    }

    if (!this.companyId) {
      throw new Error('لم يتم تحديد معرّف الشركة (Company ID) لاسترجاع بيانات اعتماد هاشتاج إكسبريس.');
    }

    const prisma = getSharedPrismaClient();
    const carrier = await safeQuery(() =>
      prisma.shippingCompany.findFirst({
        where: {
          companyId: this.companyId,
          providerKey: 'HASHTAG',
          isActive: true,
        },
      })
    , 2);

    if (!carrier) {
      throw new Error('لم يتم العثور على شركة شحن هاشتاج مفعلة في إعدادات المتجر.');
    }

    const settings = decryptHashtagSettings(carrier.settings);

    this.apiName = this.apiName || settings.apiName || settings.username || carrier.apiKey || '';
    this.apiPassword = this.apiPassword || settings.apiPassword || settings.password || '';
    if (carrier.apiUrl) {
      this.apiUrl = trimSlash(carrier.apiUrl);
    }
    this.createPath = settings.createPath || this.createPath;
    this.trackPath = settings.trackPath || this.trackPath;
    this.testPath = settings.testPath || this.testPath;
    this.logPrefix = buildLogSuffix(settings);

    if (!this.apiName || !this.apiPassword) {
      throw new Error('بيانات الربط (API NAME أو API PASSWORD) الخاصة بهاشتاج إكسبريس غير مكتملة.');
    }
  }

  /**
   * صياغة بيانات الطلب المتوافقة مع نظام هاشتاج إكسبريس
   */
  formatOrderForHashtag(order = {}, customer = {}, items = []) {
    const rawCustomerName =
      order.customerName ||
      customer.name ||
      (customer.firstName ? `${customer.firstName} ${customer.lastName || ''}`.trim() : null) ||
      'عميل متجر';
    const recipientName = cleanCustomerName(rawCustomerName);

    const rawPhone = order.customerPhone || customer.phone || '';
    const recipientPhone = cleanPhoneNumber(rawPhone);
    const altPhone = cleanPhoneNumber(order.altPhone || customer.altPhone || '');

    const rawAddress = order.shippingAddress || customer.address || '';
    const address = cleanShippingAddress(rawAddress);

    const detectedGov = detectGovernorateFromText(order.governorate || order.city || address);
    const governorate = detectedGov || order.governorate || order.city || 'القاهرة';

    const codAmount = calculateCollectableCodAmount(order);
    const orderNumber = String(order.orderNumber || order.id || Date.now());

    const itemCount = Array.isArray(items)
      ? items.reduce((sum, item) => sum + (Number(item.quantity) || 1), 0)
      : (Number(order.itemsCount) || 1);

    const notes = cleanShippingNotes(order.notes || order.customerNotes || '');

    return {
      orderId: order.id,
      orderNumber,
      recipientName,
      recipientPhone,
      recipientPhone2: altPhone,
      address,
      governorate,
      city: order.city || governorate,
      codAmount,
      pieces: itemCount,
      weight: Number(order.weight) || 1,
      notes,
    };
  }

  buildAuthPayload(extra = {}) {
    return {
      api_name: this.apiName,
      api_password: this.apiPassword,
      ...extra,
    };
  }

  extractTrackingNumber(resData, fallback) {
    if (!resData) return fallback;
    return String(
      resData.tracking_number ||
      resData.trackingNumber ||
      resData.awb ||
      resData.barcode ||
      resData.serial ||
      resData.order_id ||
      fallback,
    );
  }

  extractProviderStatus(resData) {
    if (!resData) return null;
    return (
      resData.status ||
      resData.shipment_status ||
      resData.order_status ||
      resData.status_name ||
      resData.state ||
      null
    );
  }

  /**
   * إنشاء شحنة وتوليد بوليصة لدى هاشتاج إكسبريس
   */
  async createShipment(orderData) {
    await this.ensureCredentials();

    const payload = this.buildAuthPayload({
      order_id: orderData.orderNumber || String(orderData.orderId),
      customer_name: orderData.recipientName,
      customer_phone: orderData.recipientPhone,
      customer_phone2: orderData.recipientPhone2 || '',
      customer_address: orderData.address,
      governorate: orderData.governorate,
      city: orderData.city || orderData.governorate,
      cod_amount: orderData.codAmount,
      pieces: orderData.pieces || 1,
      weight: orderData.weight || 1,
      notes: orderData.notes || '',
    });

    const targetUrl = `${this.apiUrl}${this.createPath}`;
    const startedAt = new Date().toISOString();

    try {
      const response = await axios.post(targetUrl, payload, {
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json, text/plain, */*',
          'User-Agent': 'MaxP-ShippingPlatform/2.0',
        },
        timeout: this.timeout,
      });

      const resData = response.data;
      if (resData && (resData.success || resData.status === 'success' || resData.tracking_number || resData.order_id)) {
        const trackingNumber = this.extractTrackingNumber(resData, orderData.orderNumber);
        const providerStatus = this.extractProviderStatus(resData);
        const mapped = mapHashtagStatus(providerStatus);

        return {
          success: true,
          providerKey: 'HASHTAG',
          status: 'CREATED',
          providerStatus,
          mapToSystem: mapped.mapsToSystem,
          externalShipmentId: String(resData.id || resData.order_id || trackingNumber),
          trackingNumber,
          labelUrl: resData.label_url || resData.pdf || `https://tracking.hashtag-express.com/?trackingNumber=${trackingNumber}`,
          serviceLevel: 'Hashtag Express Standard',
          cost: resData.cost ? Number(resData.cost) : null,
          deliveredAt: resData.delivered_at || resData.delivery_date || null,
          courierName: resData.courier_name || resData.delegate_name || resData.driver_name || null,
          courierPhone: resData.courier_phone || resData.delegate_phone || resData.driver_phone || null,
          requestedAt: startedAt,
          data: resData,
        };
      }

      // Check if server returned explicit error message
      const errorMsg = resData?.message || resData?.error || (typeof resData === 'string' ? resData : 'استجابة غير متوقعة من خادم هاشتاج');
      throw new Error(errorMsg);
    } catch (error) {
      const respBody = error.response?.data;
      const errorText = typeof respBody === 'string'
        ? respBody
        : (respBody?.message || respBody?.error || error.message);

      console.error(`❌ [HASHTAG_EXPRESS] createShipment failed at ${startedAt}:`, errorText);
      throw new Error(`خطأ في ربط هاشتاج إكسبريس: ${errorText}`);
    }
  }

  /**
   * فحص الاتصال وصحة بيانات الاعتماد — طلب قراءة فقط (لا ينشئ بوليصة).
   * كل محاولة تُسجّل بالوقت ورمز الاستجابة في لوج السيرفر.
   */
  async testConnection(customCredentials = {}) {
    const apiName = customCredentials.apiName || customCredentials.apiKey || customCredentials.username || this.apiName;
    const apiPassword = customCredentials.apiPassword || customCredentials.password || this.apiPassword;
    const apiUrl = trimSlash(customCredentials.apiUrl || this.apiUrl);
    const testPath = customCredentials.testPath || this.testPath || DEFAULT_TEST_PATH;

    if (!apiName || !apiPassword) {
      throw new Error('يرجى إدخال اسم الـ API (API NAME) وكلمة المرور (API PASSWORD)');
    }

    const testedAt = new Date().toISOString();
    const targetUrl = `${apiUrl}${testPath}`;

    try {
      const response = await axios.get(targetUrl, {
        params: { api_name: apiName, api_password: apiPassword, test: 1 },
        headers: {
          Accept: 'application/json, text/plain, */*',
          'User-Agent': 'MaxP-ShippingPlatform/2.0',
        },
        timeout: 15000,
        validateStatus: (status) => status >= 200 && status < 500,
      });

      const raw = response.data;
      const text = typeof raw === 'string' ? raw : JSON.stringify(raw);
      const authFailure =
        response.status >= 400 ||
        /invalid|unauthorized|wrong password|خطأ|غير صحيح/i.test(text || '');

      console.log(
        `[HASHTAG] test-connection at ${testedAt} | url=${targetUrl} | account=${String(apiName).slice(0, 6)}… | http=${response.status} | ${authFailure ? 'AUTH_REJECTED' : 'AUTH_ACCEPTED'} | response=${String(text).slice(0, 300)}`,
      );

      if (authFailure) {
        throw new Error(`رفض خادم هاشتاج بيانات الاعتماد (HTTP ${response.status}): ${String(text).slice(0, 200)}`);
      }

      return {
        success: true,
        status: 'CONNECTED',
        httpStatus: response.status,
        testedAt,
        message: 'تم التحقق من بيانات الاتصال بشركة هاشتاج إكسبريس بنجاح',
        data: raw,
      };
    } catch (error) {
      const errText = error.response?.data?.message || error.response?.data || error.message;
      console.error(`[HASHTAG] test-connection FAILED at ${testedAt} | url=${targetUrl} | ${String(errText).slice(0, 300)}`);
      if (error.response?.status === 200) {
        return {
          success: true,
          status: 'CONNECTED',
          httpStatus: 200,
          testedAt,
          message: 'تم حفظ وتأكيد بيانات اعتماد هاشتاج إكسبريس بنجاح',
        };
      }
      throw new Error(`فحص الاتصال بهاشتاج إكسبريس: ${errText}`);
    }
  }

  /**
   * استعلام حالة بوليصة من هاشتاج إكسبريس (قراءة فقط).
   */
  async trackShipment(trackingNumber) {
    if (!trackingNumber) {
      throw new Error('رقم التتبع مطلوب');
    }
    await this.ensureCredentials();

    const requestedAt = new Date().toISOString();
    const targetUrl = `${this.apiUrl}${this.trackPath}`;

    try {
      const response = await axios.get(targetUrl, {
        params: this.buildAuthPayload({ tracking_number: trackingNumber, awb: trackingNumber }),
        headers: {
          Accept: 'application/json, text/plain, */*',
          'User-Agent': 'MaxP-ShippingPlatform/2.0',
        },
        timeout: this.timeout,
      });

      const resData = response.data || {};
      const providerStatus = this.extractProviderStatus(resData);
      const mapped = mapHashtagStatus(providerStatus);

      console.log(
        `[HASHTAG] track at ${requestedAt} | tracking=${trackingNumber} | providerStatus=${providerStatus || 'unknown'} | mapsToSystem=${mapped.mapsToSystem || 'unknown'}`,
      );

      return {
        success: true,
        providerKey: 'HASHTAG',
        trackingNumber,
        providerStatus,
        mapsToSystem: mapped.mapsToSystem,
        deliveredAt: resData.delivered_at || resData.delivery_date || null,
        courierName: resData.courier_name || resData.delegate_name || resData.driver_name || null,
        courierPhone: resData.courier_phone || resData.delegate_phone || resData.driver_phone || null,
        portalUrl: `https://tracking.hashtag-express.com/?trackingNumber=${encodeURIComponent(trackingNumber)}`,
        carrier: 'HASHTAG',
        requestedAt,
        data: resData,
      };
    } catch (error) {
      const errText = error.response?.data?.message || error.response?.data || error.message;
      console.error(`[HASHTAG] track FAILED at ${requestedAt} | tracking=${trackingNumber} | ${String(errText).slice(0, 300)}`);
      throw new Error(`تعذر استعلام حالة الشحنة من هاشتاج إكسبريس: ${errText}`);
    }
  }

  /** Read the saved (non-secret) settings for this tenant, decrypted in memory. */
  async getSavedSettings() {
    if (!this.companyId) return {};
    const prisma = getSharedPrismaClient();
    const carrier = await safeQuery(() =>
      prisma.shippingCompany.findFirst({
        where: { companyId: this.companyId, providerKey: 'HASHTAG', isActive: true },
        select: { settings: true },
      })
    , 2);
    return carrier ? decryptHashtagSettings(carrier.settings) : {};
  }
}

module.exports = HashtagService;
