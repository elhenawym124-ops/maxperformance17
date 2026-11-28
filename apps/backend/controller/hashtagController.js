const HashtagService = require('../services/hashtagService');
const { getSharedPrismaClient, safeQuery } = require('../services/sharedDatabase');
const { HASHTAG_STATUS_MAP } = require('../services/hashtag/hashtagStatusMap');

const INVALID_SHIPPING_STATUSES = [
  'DUPLICATE_ORDER',
  'CANCELLED',
  'RETURNED',
  'PARTIALLY_RETURNED',
  'REFUNDED',
  'TRASH',
  'LOST',
  'DELIVERED',
];

const getRequestCompanyId = (req) =>
  req.user?.effectiveCompanyId || req.user?.companyId;

const parseMetadata = (raw) => {
  if (!raw) return {};
  if (typeof raw === 'object') return { ...raw };
  try {
    return JSON.parse(raw) || {};
  } catch {
    return {};
  }
};

const getHashtagCarrier = (prisma, companyId) =>
  safeQuery(() =>
    prisma.shippingCompany.findFirst({
      where: { companyId, providerKey: 'HASHTAG', isActive: true },
      select: { id: true, name: true, apiKey: true, apiUrl: true, settings: true },
    })
  , 2);

const createShipmentForOrder = async ({ prisma, companyId, userId, orderId }) => {
  const order = await safeQuery(() =>
    prisma.order.findFirst({
      where: {
        companyId,
        OR: [{ id: String(orderId) }, { orderNumber: String(orderId) }],
      },
      include: {
        customer: true,
        orderItems: { include: { product: true } },
        shipments: {
          where: { carrierType: 'HASHTAG' },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    })
  , 2);

  if (!order) {
    const error = new Error('الطلب غير موجود');
    error.statusCode = 404;
    throw error;
  }

  if (INVALID_SHIPPING_STATUSES.includes(String(order.status || '').toUpperCase())) {
    const error = new Error(`لا يمكن شحن هذا الطلب لهاشتاج لأن حالته هي: ${order.status}`);
    error.statusCode = 400;
    error.code = 'INVALID_ORDER_STATUS_FOR_SHIPPING';
    throw error;
  }

  if (parseMetadata(order.metadata).discountApprovalStatus === 'PENDING_APPROVAL') {
    const error = new Error('لا يمكن شحن هذا الطلب لهاشتاج قبل اعتماد الخصم من قِبل الإدارة أو إلغائه');
    error.statusCode = 400;
    error.code = 'DISCOUNT_APPROVAL_PENDING';
    throw error;
  }

  const carrier = await getHashtagCarrier(prisma, companyId);
  if (!carrier) {
    const error = new Error('لم يتم تفعيل شركة شحن هاشتاج إكسبريس لهذا المتجر. فعّلها وأدخل بيانات الاعتماد أولاً.');
    error.statusCode = 400;
    error.code = 'HASHTAG_NOT_CONFIGURED';
    throw error;
  }

  const service = new HashtagService(null, companyId);
  const payload = service.formatOrderForHashtag(order, order.customer || {}, order.orderItems || []);
  const result = await service.createShipment(payload);

  if (!result.success || !result.trackingNumber) {
    const error = new Error('لم يُرجع خادم هاشتاج رقم بوليصة صالح');
    error.statusCode = 502;
    throw error;
  }

  const hashtagMeta = {
    hashtagTrackingNumber: result.trackingNumber,
    hashtagExternalShipmentId: result.externalShipmentId,
    hashtagProviderStatus: result.providerStatus || null,
    hashtagSyncedAt: new Date().toISOString(),
  };

  const existingShipment = order.shipments?.[0] || null;
  const shipment = existingShipment
    ? await safeQuery(() =>
        prisma.shipment.update({
          where: { id: existingShipment.id },
          data: {
            shippingCompanyId: carrier.id,
            carrierType: 'HASHTAG',
            status: 'CREATED',
            trackingNumber: result.trackingNumber,
            externalShipmentId: result.externalShipmentId,
            labelUrl: result.labelUrl || existingShipment.labelUrl,
            cost: result.cost ?? existingShipment.cost,
            metadata: JSON.stringify({ ...parseMetadata(existingShipment.metadata), ...hashtagMeta }),
          },
        })
      , 2)
    : await safeQuery(() =>
        prisma.shipment.create({
          data: {
            companyId,
            orderId: order.id,
            shippingCompanyId: carrier.id,
            carrierType: 'HASHTAG',
            status: 'CREATED',
            trackingNumber: result.trackingNumber,
            externalShipmentId: result.externalShipmentId,
            labelUrl: result.labelUrl || null,
            cost: result.cost ?? null,
            destinationGovernorate: order.governorate || null,
            destinationCity: order.city || null,
            destinationAddress: order.customerAddress || order.shippingAddress || null,
            currency: order.currency || 'EGP',
            metadata: JSON.stringify(hashtagMeta),
          },
        })
      , 2);

  const orderMetadata = {
    ...parseMetadata(order.metadata),
    trackingNumber: String(result.trackingNumber),
    shippingCarrier: 'HASHTAG',
    providerKey: 'HASHTAG',
    hashtagTrackingNumber: String(result.trackingNumber),
    hashtagExternalShipmentId: result.externalShipmentId,
  };

  const nextOrderStatus = String(order.status || '').toUpperCase() === 'DELIVERED' ? 'DELIVERED' : 'SHIPPED';
  await safeQuery(() =>
    prisma.order.update({
      where: { id: order.id },
      data: {
        status: nextOrderStatus,
        customStatusCode: null,
        shippingCompanyId: carrier.id,
        providerKey: 'HASHTAG',
        trackingNumber: String(result.trackingNumber),
        metadata: JSON.stringify(orderMetadata),
        statusHistory: {
          create: {
            status: nextOrderStatus,
            oldStatus: order.status,
            providerKey: 'HASHTAG',
            reason: `تم إنشاء بوليصة هاشتاج برقم ${result.trackingNumber}`,
            changedBy: userId || 'SYSTEM',
            userName: 'Hashtag Express',
          },
        },
      },
    })
  , 2);

  return {
    orderId: order.id,
    orderNumber: order.orderNumber,
    shipmentId: shipment?.id || null,
    trackingNumber: result.trackingNumber,
    labelUrl: result.labelUrl || null,
    providerKey: 'HASHTAG',
    shippingCompanyId: carrier.id,
    data: result.data,
  };
};

exports.createShipment = async (req, res) => {
  try {
    const companyId = getRequestCompanyId(req);
    const prisma = getSharedPrismaClient();
    const data = await createShipmentForOrder({
      prisma,
      companyId,
      userId: req.user?.id,
      orderId: req.params.orderId,
    });
    res.json({
      success: true,
      data,
      message: `تم إنشاء بوليصة هاشتاج بنجاح برقم ${data.trackingNumber}`,
    });
  } catch (error) {
    console.error('[HASHTAG] createShipment error:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      code: error.code,
      error: error.message,
    });
  }
};

exports.bulkCreateShipments = async (req, res) => {
  try {
    const companyId = getRequestCompanyId(req);
    const prisma = getSharedPrismaClient();
    const orderIds = Array.isArray(req.body?.orderIds) ? req.body.orderIds : [];

    if (orderIds.length === 0) {
      return res.status(400).json({ success: false, error: 'يرجى تحديد الطلبات المراد شحنها' });
    }

    const results = [];
    for (const orderId of orderIds) {
      try {
        const data = await createShipmentForOrder({
          prisma,
          companyId,
          userId: req.user?.id,
          orderId,
        });
        results.push({ orderId, success: true, ...data });
      } catch (error) {
        results.push({ orderId, success: false, error: error.message, code: error.code });
      }
    }

    const successfulCount = results.filter((item) => item.success).length;
    res.json({
      success: true,
      data: {
        total: orderIds.length,
        successfulCount,
        failedCount: orderIds.length - successfulCount,
        results,
      },
      message: `تم إنشاء ${successfulCount} بوليصة هاشتاج من أصل ${orderIds.length}`,
    });
  } catch (error) {
    console.error('[HASHTAG] bulkCreateShipments error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getOrderShipment = async (req, res) => {
  try {
    const companyId = getRequestCompanyId(req);
    const prisma = getSharedPrismaClient();
    const orderId = String(req.params.orderId);

    const order = await safeQuery(() =>
      prisma.order.findFirst({
        where: { companyId, OR: [{ id: orderId }, { orderNumber: orderId }] },
        select: { id: true },
      })
    , 2);

    if (!order) return res.status(404).json({ success: false, error: 'الطلب غير موجود' });

    const shipment = await safeQuery(() =>
      prisma.shipment.findFirst({
        where: { orderId: order.id, companyId, carrierType: 'HASHTAG' },
        orderBy: { createdAt: 'desc' },
      })
    , 2);

    res.json({ success: true, data: shipment });
  } catch (error) {
    console.error('[HASHTAG] getOrderShipment error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.trackShipment = async (req, res) => {
  try {
    const companyId = getRequestCompanyId(req);
    const prisma = getSharedPrismaClient();
    const trackingNumber = String(req.params.trackingNumber || '').trim();

    if (!trackingNumber) {
      return res.status(400).json({ success: false, error: 'رقم التتبع مطلوب' });
    }

    const service = new HashtagService(null, companyId);
    const result = await service.trackShipment(trackingNumber);

    const shipment = await safeQuery(() =>
      prisma.shipment.findFirst({
        where: { companyId, trackingNumber, carrierType: 'HASHTAG' },
        orderBy: { createdAt: 'desc' },
      })
    , 2);

    if (shipment && result.mapsToSystem) {
      await safeQuery(() =>
        prisma.shipment.update({
          where: { id: shipment.id },
          data: {
            status: result.mapsToSystem,
            metadata: JSON.stringify({
              ...parseMetadata(shipment.metadata),
              hashtagProviderStatus: result.providerStatus || null,
              hashtagSyncedAt: result.requestedAt,
            }),
          },
        })
      , 2);
    }

    res.json({ success: true, data: result });
  } catch (error) {
    console.error('[HASHTAG] trackShipment error:', error);
    res.status(502).json({ success: false, error: error.message });
  }
};

/** Exposes the provider→legal status map for UI/reporting without adding statuses. */
exports.getStatusMap = async (_req, res) => {
  res.json({ success: true, data: HASHTAG_STATUS_MAP, providerKey: 'HASHTAG' });
};

exports._internal = { createShipmentForOrder, parseMetadata, INVALID_SHIPPING_STATUSES };
