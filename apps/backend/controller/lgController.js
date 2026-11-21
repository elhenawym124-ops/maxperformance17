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

// ---------------------------------------------------------------------------
// POST /lg/webhook
// استقبال إشعارات تحديث الحالة اللحظية من Accurate Logistics / LG Express
// ---------------------------------------------------------------------------
exports.handleWebhook = async (req, res) => {
  try {
    const prisma = getSharedPrismaClient();
    const payload = req.body || {};
    const code = payload.shipmentCode || payload.code || payload.trackingNumber;
    const externalId = payload.shipmentId ? String(payload.shipmentId) : null;
    const statusCode = payload.shipmentStatusCode || payload.statusCode || '';
    const statusName = payload.statusName || payload.status?.name || statusCode;

    if (!code && !externalId) {
      return res.status(400).json({ success: false, error: 'shipmentCode or shipmentId required' });
    }

    const shipment = await safeQuery(() =>
      prisma.shipment.findFirst({
        where: {
          OR: [
            ...(code ? [{ trackingNumber: String(code) }] : []),
            ...(externalId ? [{ externalShipmentId: externalId }] : []),
          ],
        },
        include: { order: true },
      }),
      2
    );

    if (!shipment) {
      return res.status(200).json({ success: true, message: 'Shipment not found locally, ignored' });
    }

    // Map LG status codes to MaxP statuses
    let mappedStatus = 'SHIPPED';
    let mappedOrderStatus = null;

    const normCode = String(statusCode).toUpperCase();
    if (normCode === 'DTR' || normCode.includes('DELIVER') || statusName.includes('تسليم')) {
      mappedStatus = 'DELIVERED';
      mappedOrderStatus = 'DELIVERED';
    } else if (normCode === 'RTS' || normCode.includes('RETURN') || statusName.includes('مرتجع')) {
      mappedStatus = 'RETURNED';
      mappedOrderStatus = 'RETURNED';
    } else if (normCode === 'CAN' || normCode.includes('CANCEL') || statusName.includes('إلغاء') || statusName.includes('الغاء')) {
      mappedStatus = 'CANCELLED';
      mappedOrderStatus = 'CANCELLED';
    } else if (normCode === 'O4D' || normCode.includes('OUT') || statusName.includes('توزيع') || statusName.includes('مندوب')) {
      mappedStatus = 'OUT_FOR_DELIVERY';
    } else {
      mappedStatus = statusName || normCode || 'SHIPPED';
    }

    await prisma.shipment.update({
      where: { id: shipment.id },
      data: {
        status: mappedStatus,
        metadata: JSON.stringify({
          ...(typeof shipment.metadata === 'string' ? JSON.parse(shipment.metadata || '{}') : (shipment.metadata || {})),
          lastWebhook: new Date().toISOString(),
          webhookPayload: payload,
        }),
      },
    });

    if (mappedOrderStatus && shipment.orderId) {
      await prisma.order.update({
        where: { id: shipment.orderId },
        data: {
          status: mappedOrderStatus,
          statusHistory: {
            create: {
              status: mappedOrderStatus,
              oldStatus: shipment.order?.status || 'SHIPPED',
              reason: `تحديث آلي من LG Express عبر Webhook (${statusName})`,
              changedBy: 'SYSTEM',
            },
          },
        },
      }).catch(() => null);
    }

    return res.status(200).json({ success: true, message: 'Webhook processed successfully' });
  } catch (error) {
    console.error('⚠️ [LG_EXPRESS] Webhook processing error:', error.message);
    return res.status(200).json({ success: false, error: error.message });
  }
};
