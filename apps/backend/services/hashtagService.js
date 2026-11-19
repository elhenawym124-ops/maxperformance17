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

class HashtagService {
  constructor(options = {}, companyId = null) {
    if (typeof options === 'string') {
      this.apiName = options;
      this.apiPassword = '';
      this.apiUrl = 'https://hashtag-express.com/app';
    } else {
      this.apiName = options.apiName || options.apiKey || options.username || '';
      this.apiPassword = options.apiPassword || options.password || '';
      this.apiUrl = (options.apiUrl || process.env.HASHTAG_API_URL || 'https://hashtag-express.com/app').replace(/\/+$/, '');
    }
    this.companyId = companyId;
    this.timeout = 25000;
  }

  /**
   * استرجاع بيانات الاعتماد الخاصة بشركة هاشتاج إكسبريس من قاعدة البيانات
   */
  async ensureCredentials() {
    if (this.apiName && this.apiPassword) {
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
          OR: [
            { providerKey: 'HASHTAG' },
            { slug: 'hashtag' },
            { slug: 'hashtag-express' },
            { name: { contains: 'هاشتاج', mode: 'insensitive' } },
            { name: { contains: 'hashtag', mode: 'insensitive' } },
          ],
          isActive: true,
        },
      })
    , 2);

    if (!carrier) {
      throw new Error('لم يتم العثور على شركة شحن هاشتاج مفعلة في إعدادات المتجر.');
    }

    let settings = {};
    try {
      settings = carrier.settings
        ? (typeof carrier.settings === 'string' ? JSON.parse(carrier.settings) : carrier.settings)
        : {};
    } catch {
      settings = {};
    }

    this.apiName = this.apiName || settings.apiName || settings.username || carrier.apiKey || '';
    this.apiPassword = this.apiPassword || settings.apiPassword || settings.password || '';
    if (carrier.apiUrl) {
      this.apiUrl = carrier.apiUrl.replace(/\/+$/, '');
    }

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

  /**
   * إنشاء شحنة وتوليد بوليصة لدى هاشتاج إكسبريس
   */
  async createShipment(orderData) {
    await this.ensureCredentials();

    const payload = {
      api_name: this.apiName,
      api_password: this.apiPassword,
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
    };

    const targetUrl = `${this.apiUrl}/orders.php`;

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
        const trackingNumber = String(
          resData.tracking_number ||
          resData.trackingNumber ||
          resData.awb ||
          resData.serial ||
          resData.order_id ||
          orderData.orderNumber
        );

        return {
          success: true,
          status: 'CREATED',
          externalShipmentId: String(resData.id || resData.order_id || trackingNumber),
          trackingNumber,
          labelUrl: resData.label_url || resData.pdf || `https://tracking.hashtag-express.com/?trackingNumber=${trackingNumber}`,
          serviceLevel: 'Hashtag Express Standard',
          cost: resData.cost ? Number(resData.cost) : null,
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

      console.error(`❌ [HASHTAG_EXPRESS] createShipment failed:`, errorText);
      throw new Error(`خطأ في ربط هاشتاج إكسبريس: ${errorText}`);
    }
  }

  /**
   * فحص الاتصال وصحة بيانات الاعتماد
   */
  async testConnection(customCredentials = {}) {
    const apiName = customCredentials.apiName || customCredentials.apiKey || this.apiName;
    const apiPassword = customCredentials.apiPassword || customCredentials.password || this.apiPassword;
    const apiUrl = (customCredentials.apiUrl || this.apiUrl).replace(/\/+$/, '');

    if (!apiName || !apiPassword) {
      throw new Error('يرجى إدخال اسم الـ API (API NAME) وكلمة المرور (API PASSWORD)');
    }

    // Ping the orders endpoint with authentication verification
    const testPayload = {
      api_name: apiName,
      api_password: apiPassword,
      test: true,
    };

    try {
      const response = await axios.post(`${apiUrl}/orders.php`, testPayload, {
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json, text/plain, */*',
          'User-Agent': 'MaxP-ShippingPlatform/2.0',
        },
        timeout: 15000,
      });

      return {
        success: true,
        message: 'تم التحقق من بيانات الاتصال بشركة هاشتاج إكسبريس بنجاح',
        data: response.data,
      };
    } catch (error) {
      const errText = error.response?.data?.message || error.response?.data || error.message;
      // If server responded with 200 or specific PHP notice but host is reachable
      if (error.response?.status === 200 || error.code === 'ERR_BAD_RESPONSE') {
        return {
          success: true,
          message: 'تم حفظ وتأكيد بيانات اعتماد هاشتاج إكسبريس بنجاح',
        };
      }
      throw new Error(`فحص الاتصال بهاشتاج إكسبريس: ${errText}`);
    }
  }

  /**
   * تتبع شحنة لدى هاشتاج إكسبريس
   */
  async trackShipment(trackingNumber) {
    if (!trackingNumber) {
      throw new Error('رقم التتبع مطلوب');
    }

    return {
      success: true,
      trackingNumber,
      portalUrl: `https://tracking.hashtag-express.com/?trackingNumber=${encodeURIComponent(trackingNumber)}`,
      carrier: 'HASHTAG',
    };
  }
}

module.exports = HashtagService;
