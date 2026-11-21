/**
 * LG Express Controller
 * معالجة طلبات الربط مع شركة LG Express (Accurate Logistics)
 */

const LgService = require('../services/lgService');
const { getSharedPrismaClient, safeQuery } = require('../services/sharedDatabase');
const { calculateCollectableCodAmount } = require('../utils/shippingFinancialUtils');

const getService = (req) => {
  const companyId = req.user?.companyId || null;
  return new LgService({}, companyId);
};

const findOrder = async (prisma, orderId, companyId) => {
  const where = {
    OR: [{ id: orderId }, { orderNumber: orderId }],
    ...(companyId ? { companyId } : {}),
  };
  let order = await safeQuery(() =>
    prisma.order.findFirst({
      where,
      include: { customer: true, orderItems: { include: { product: true } } },
    }), 2);

  let isGuest = false;
  if (!order) {
    order = await safeQuery(() =>
      prisma.guestOrder.findFirst({ where: { OR: [{ id: orderId }, { orderNumber: orderId }], ...(companyId ? { companyId } : {}) } }), 2);
    isGuest = true;
  }
  return { order, isGuest };
};

const INVALID_STATUSES = ['DUPLICATE_ORDER', 'CANCELLED', 'RETURNED', 'REFUNDED', 'TRASH', 'LOST'];

// ---------------------------------------------------------------------------
// POST /lg/orders/:orderId/shipment
// ---------------------------------------------------------------------------
exports.createShipment = async (req, res) => {
  try {
    const service = getService(req);
    const prisma = getSharedPrismaClient();
    const { orderId } = req.params;
    const companyId = req.user?.companyId || null;

    const { order, isGuest } = await findOrder(prisma, orderId, companyId);
    if (!order) return res.status(404).json({ success: false, error: 'Order not found' });

    if (INVALID_STATUSES.includes(String(order.status || '').toUpperCase())) {
      return res.status(400).json({
        success: false,
        code: 'INVALID_ORDER_STATUS_FOR_SHIPPING',
        error: `لا يمكن شحن هذا الطلب — الحالة: ${order.status}`,
      });
    }

    const orderData = service.formatOrderForLG(
      order,
      order.customer || {},
      order.orderItems || [],
    );

    const result = await service.createShipment(orderData);

    // Persist to DB
    if (!isGuest && result.success && result.trackingNumber) {
      try {
        const lgCompany = await safeQuery(() =>
          prisma.shippingCompany.findFirst({
            where: {
              companyId,
              OR: [{ providerKey: 'LG_EXPRESS' }, { slug: 'lg-express' }],
            },
          }), 1);

        const shipmentRecord = await prisma.shipment.upsert({
          where: {
            orderId_shippingCompanyId: {
              orderId: order.id,
              shippingCompanyId: lgCompany?.id || '',
            },
          },
          update: {
            trackingNumber: result.trackingNumber,
            externalShipmentId: result.externalShipmentId,
            labelUrl: result.labelUrl,
            status: 'CREATED',
            carrierType: 'LG_EXPRESS',
          },
          create: {
            orderId: order.id,
            companyId,
            shippingCompanyId: lgCompany?.id || null,
            trackingNumber: result.trackingNumber,
            externalShipmentId: result.externalShipmentId,
            labelUrl: result.labelUrl,
            status: 'CREATED',
            carrierType: 'LG_EXPRESS',
            codAmount: orderData.codAmount,
            destinationCity: orderData.governorate,
          },
        }).catch(() => null);

        // Update order status
        await prisma.order.update({
          where: { id: order.id },
          data: {
            status: 'SHIPPED',
            statusHistory: {
              create: {
                status: 'SHIPPED',
                oldStatus: order.status || 'PENDING',
                reason: `تم إنشاء البوليصة لدى LG Express (رقم التتبع: ${result.trackingNumber})`,
                changedBy: 'SYSTEM',
              },
            },
          },
        }).catch(() => null);
      } catch (dbErr) {
        console.warn('⚠️ [LG_EXPRESS] DB persist warning:', dbErr.message);
      }
    }

    return res.json({ success: true, data: result });
  } catch (error) {
    console.error('❌ [LG_EXPRESS] createShipment error:', error.message);
    return res.status(500).json({ success: false, error: error.message });
  }
};

// ---------------------------------------------------------------------------
// POST /lg/bulk/create-shipments
// ---------------------------------------------------------------------------
exports.bulkCreateShipments = async (req, res) => {
  try {
    const { orderIds = [] } = req.body;
    if (!Array.isArray(orderIds) || orderIds.length === 0) {
      return res.status(400).json({ success: false, error: 'orderIds مطلوب' });
    }

    const service = getService(req);
    const prisma = getSharedPrismaClient();
    const companyId = req.user?.companyId || null;

    let successCount = 0;
    const failed = [];
    const skipped = [];

    for (const orderId of orderIds) {
      try {
        const { order } = await findOrder(prisma, orderId, companyId);
        if (!order) {
          failed.push({ orderNumber: orderId, error: 'Order not found' });
          continue;
        }
        if (INVALID_STATUSES.includes(String(order.status || '').toUpperCase())) {
          skipped.push({ orderNumber: order.orderNumber || orderId, reason: `حالة غير صالحة: ${order.status}` });
          continue;
        }

        const orderData = service.formatOrderForLG(order, order.customer || {}, order.orderItems || []);
        const result = await service.createShipment(orderData);

        if (result.success) {
          successCount++;
          // Async DB persist (non-blocking)
          if (order.id) {
            const lgCompany = await safeQuery(() =>
              prisma.shippingCompany.findFirst({
                where: { companyId, OR: [{ providerKey: 'LG_EXPRESS' }, { slug: 'lg-express' }] },
              }), 1).catch(() => null);

            prisma.shipment.upsert({
              where: { orderId_shippingCompanyId: { orderId: order.id, shippingCompanyId: lgCompany?.id || '' } },
              update: { trackingNumber: result.trackingNumber, externalShipmentId: result.externalShipmentId, status: 'CREATED', carrierType: 'LG_EXPRESS' },
              create: {
                orderId: order.id, companyId, shippingCompanyId: lgCompany?.id || null,
                trackingNumber: result.trackingNumber, externalShipmentId: result.externalShipmentId,
                labelUrl: result.labelUrl, status: 'CREATED', carrierType: 'LG_EXPRESS',
                codAmount: orderData.codAmount, destinationCity: orderData.governorate,
              },
            }).catch(() => null);

            prisma.order.update({
              where: { id: order.id },
              data: { status: 'SHIPPED' },
            }).catch(() => null);
          }
        } else {
          failed.push({ orderNumber: order.orderNumber || orderId, error: result.reason || 'فشل الإنشاء' });
        }
      } catch (err) {
        failed.push({ orderNumber: orderId, error: err.message });
      }
    }

    return res.json({
      success: true,
      data: {
        success: successCount,
        failed: failed.length,
        results: { failed, skipped },
      },
    });
  } catch (error) {
    console.error('❌ [LG_EXPRESS] bulkCreateShipments error:', error.message);
    return res.status(500).json({ success: false, error: error.message });
  }
};

// ---------------------------------------------------------------------------
// GET /lg/track/:trackingNumber
// ---------------------------------------------------------------------------
exports.trackShipment = async (req, res) => {
  try {
    const service = getService(req);
    const { trackingNumber } = req.params;
    const result = await service.trackShipment(trackingNumber);
    return res.json({ success: true, data: result });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

// ---------------------------------------------------------------------------
// POST /lg/test-connection
// ---------------------------------------------------------------------------
exports.testConnection = async (req, res) => {
  try {
    const service = getService(req);
    const result = await service.testConnection(req.body || {});
    return res.json(result);
  } catch (error) {
    return res.status(400).json({ success: false, error: error.message });
  }
};
