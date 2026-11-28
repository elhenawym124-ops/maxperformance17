/**
 * Hashtag Express Webhook
 *
 * Every delivery event must carry the carrier that delivered. On a delivered
 * status this handler writes, on the order itself:
 *   shippingCompanyId / courierId / providerKey / trackingNumber / deliveredAt
 * plus an OrderStatusHistory row tagged with providerKey = HASHTAG.
 */

const express = require('express');
const router = express.Router();
const { getSharedPrismaClient, safeQuery } = require('../services/sharedDatabase');
const { mapHashtagStatus } = require('../services/hashtag/hashtagStatusMap');
const { parseSettings } = require('../services/hashtag/hashtagCredentials');

const DELIVERED_STATUSES = new Set(['DELIVERED', 'PARTIALLY_DELIVERED']);

const firstValue = (payload, keys) => {
  for (const key of keys) {
    const value = payload?.[key];
    if (value !== undefined && value !== null && String(value).trim() !== '') return value;
  }
  return null;
};

const parseMetadata = (raw) => {
  if (!raw) return {};
  if (typeof raw === 'object') return { ...raw };
  try {
    return JSON.parse(raw) || {};
  } catch {
    return {};
  }
};

const parseWebhookPayload = (payload = {}) => {
  const trackingNumber = firstValue(payload, [
    'tracking_number', 'trackingNumber', 'awb', 'barcode', 'waybill', 'serial',
  ]);
  const orderCandidates = [
    firstValue(payload, ['order_id', 'orderId', 'order_number', 'orderNumber', 'customer_serial', 'reference']),
    trackingNumber,
  ].filter((value) => value !== null && value !== undefined && String(value).trim() !== '');

  const rawStatus = firstValue(payload, [
    'status', 'shipment_status', 'shipmentStatus', 'order_status', 'orderStatus', 'state', 'status_name', 'status_text',
  ]);

  const courierName = firstValue(payload, [
    'courier_name', 'courierName', 'delegate_name', 'delegateName', 'driver_name', 'driverName', 'captain_name', 'captainName',
  ]);
  const courierPhone = firstValue(payload, [
    'courier_phone', 'courierPhone', 'delegate_phone', 'delegatePhone', 'driver_phone', 'driverPhone', 'captain_phone', 'captainPhone',
  ]);
  const rawDeliveredAt = firstValue(payload, [
    'delivered_at', 'deliveredAt', 'delivery_date', 'deliveryDate', 'delivered_time', 'timestamp', 'updated_at',
  ]);

  return {
    trackingNumber: trackingNumber ? String(trackingNumber) : null,
    orderCandidates: [...new Set(orderCandidates.map((value) => String(value)))],
    rawStatus,
    courierName: courierName ? String(courierName).trim() : null,
    courierPhone: courierPhone ? String(courierPhone).trim() : null,
    rawDeliveredAt,
  };
};

const getWebhookToken = (req) => {
  const header = req.headers['x-webhook-token'] || req.headers.authorization || req.headers.Authorization;
  if (header) return String(header).replace(/^Bearer\s+/i, '').trim();
  return req.query?.token || req.query?.secret || null;
};

const findHashtagCarrier = async (prisma, companyId) =>
  safeQuery(() =>
    prisma.shippingCompany.findFirst({
      where: { companyId, providerKey: 'HASHTAG' },
      select: { id: true, name: true, settings: true, isActive: true },
    })
  , 2);

const findOrder = async (prisma, parsed) => {
  const or = [];
  for (const candidate of parsed.orderCandidates) {
    or.push({ id: candidate }, { orderNumber: candidate }, { trackingNumber: candidate });
  }
  if (parsed.trackingNumber) {
    or.push({ shipments: { some: { trackingNumber: parsed.trackingNumber } } });
    or.push({ shipments: { some: { externalShipmentId: parsed.trackingNumber } } });
  }
  if (or.length === 0) return null;

  return safeQuery(() =>
    prisma.order.findFirst({
      where: { OR: or },
      include: {
        shipments: { orderBy: { createdAt: 'desc' }, take: 5 },
      },
    })
  , 3);
};

const resolveCourier = async (prisma, companyId, parsed) => {
  if (!parsed.courierName && !parsed.courierPhone) return null;
  const or = [];
  if (parsed.courierPhone) or.push({ phone: parsed.courierPhone });
  if (parsed.courierName) or.push({ name: parsed.courierName });
  if (or.length === 0) return null;

  const existing = await safeQuery(() =>
    prisma.courier.findFirst({ where: { companyId, OR: or } })
  , 2);
  if (existing) return existing;

  return safeQuery(() =>
    prisma.courier.create({
      data: {
        companyId,
        name: parsed.courierName || 'مندوب هاشتاج إكسبريس',
        phone: parsed.courierPhone || '',
        status: 'ON_DUTY',
        notes: 'أُنشئ تلقائياً من webhook هاشتاج إكسبريس',
      },
    })
  , 2);
};

const hasHashtagDeliveryHistory = async (prisma, orderId) =>
  Boolean(
    await safeQuery(() =>
      prisma.orderStatusHistory.findFirst({
        where: { orderId, status: 'DELIVERED', providerKey: 'HASHTAG' },
        select: { id: true },
      })
    , 2),
  );

const processHashtagWebhook = async (payload = {}, options = {}) => {
  const parsed = parseWebhookPayload(payload);
  const mapping = mapHashtagStatus(parsed.rawStatus);
  const prisma = options.prisma || getSharedPrismaClient();

  const order = await findOrder(prisma, parsed);
  if (!order) {
    console.warn(`[HASHTAG-WEBHOOK] No order matched for ${JSON.stringify(parsed.orderCandidates)}`);
    return { success: false, skipped: 'ORDER_NOT_FOUND' };
  }

  const carrier = await findHashtagCarrier(prisma, order.companyId);
  if (!carrier) {
    console.warn(`[HASHTAG-WEBHOOK] HASHTAG carrier is not configured for company ${order.companyId}`);
    return { success: false, skipped: 'CARRIER_NOT_CONFIGURED' };
  }

  if (options.webhookToken) {
    const expected = parseSettings(carrier.settings).webhookToken;
    if (expected && expected !== options.webhookToken) {
      console.warn(`[HASHTAG-WEBHOOK] Invalid webhook token for company ${order.companyId}`);
      return { success: false, skipped: 'INVALID_TOKEN' };
    }
  }

  if (!mapping.isKnown) {
    console.warn(`[HASHTAG-WEBHOOK] Unknown provider status "${parsed.rawStatus}" for order ${order.orderNumber} — ignored (no status added).`);
    return {
      success: false,
      skipped: 'UNKNOWN_PROVIDER_STATUS',
      orderId: order.id,
      providerStatus: parsed.rawStatus,
    };
  }

  const targetStatus = mapping.mapsToSystem;
  const isDelivery = DELIVERED_STATUSES.has(targetStatus);
  const courier = await resolveCourier(prisma, order.companyId, parsed);
  const deliveredAt = isDelivery
    ? (parsed.rawDeliveredAt ? new Date(parsed.rawDeliveredAt) : new Date())
    : null;
  const trackingNumber = parsed.trackingNumber || order.trackingNumber || null;

  const deliveryProof = {
    shippingCompanyId: carrier.id,
    courierId: courier?.id || order.courierId || null,
    trackingNumber,
    deliveredAt,
  };

  // 1) Shipment mirror (the provider-facing record).
  const shipment = order.shipments?.[0] || null;
  const shipmentMeta = {
    ...parseMetadata(shipment?.metadata),
    hashtagProviderStatus: parsed.rawStatus ? String(parsed.rawStatus) : null,
    hashtagMapsToSystem: targetStatus,
    hashtagSyncedAt: new Date().toISOString(),
    hashtagCourierName: parsed.courierName || null,
    hashtagCourierPhone: parsed.courierPhone || null,
  };
  if (shipment) {
    await safeQuery(() =>
      prisma.shipment.update({
        where: { id: shipment.id },
        data: {
          shippingCompanyId: carrier.id,
          courierId: courier?.id || shipment.courierId || null,
          carrierType: 'HASHTAG',
          status: targetStatus,
          trackingNumber: trackingNumber || shipment.trackingNumber,
          externalShipmentId: parsed.trackingNumber || shipment.externalShipmentId,
          metadata: JSON.stringify(shipmentMeta),
          ...(isDelivery ? { collectedAt: deliveredAt } : {}),
        },
      })
    , 2);
  } else {
    await safeQuery(() =>
      prisma.shipment.create({
        data: {
          companyId: order.companyId,
          orderId: order.id,
          shippingCompanyId: carrier.id,
          courierId: courier?.id || null,
          carrierType: 'HASHTAG',
          status: targetStatus,
          trackingNumber: trackingNumber || null,
          externalShipmentId: parsed.trackingNumber || null,
          destinationGovernorate: order.governorate || null,
          destinationCity: order.city || null,
          destinationAddress: order.customerAddress || order.shippingAddress || null,
          currency: order.currency || 'EGP',
          metadata: JSON.stringify(shipmentMeta),
          ...(isDelivery ? { collectedAt: deliveredAt } : {}),
        },
      })
    , 2);
  }

  // 2) Order status via the canonical path (history + notifications + side effects).
  const currentStatus = String(order.status || '').toUpperCase();
  const alreadyDeliveredByHashtag =
    isDelivery && currentStatus === 'DELIVERED' && order.providerKey === 'HASHTAG' && order.deliveredAt;
  const statusChanged = currentStatus !== targetStatus && !alreadyDeliveredByHashtag;

  if (statusChanged) {
    const orderService = require('../services/orderService');
    const providerLabel = carrier.name || 'هاشتاج إكسبريس';
    const reason = isDelivery
      ? `تم التسليم بواسطة: ${providerLabel} — بوليصة ${trackingNumber || 'غير متوفرة'}`
      : `تحديث حالة شحنة هاشتاج إكسبريس إلى ${targetStatus} (${parsed.rawStatus})`;

    try {
      await orderService.updateOrderStatus(
        order.orderNumber,
        order.companyId,
        targetStatus,
        reason,
        'SYSTEM',
        'Hashtag Express',
        null,
        true,
        {
          skipCallAttemptGuard: true,
          skipTransitionValidation: true,
          providerKey: 'HASHTAG',
          deliveryProof,
        },
      );
    } catch (error) {
      console.warn(`[HASHTAG-WEBHOOK] orderService status update failed, applying direct update: ${error.message}`);
      await safeQuery(() =>
        prisma.order.update({
          where: { id: order.id },
          data: {
            status: targetStatus,
            customStatusCode: null,
            ...deliveryProof,
            statusHistory: {
              create: {
                status: targetStatus,
                oldStatus: order.status,
                providerKey: 'HASHTAG',
                reason,
                changedBy: 'SYSTEM',
                userName: 'Hashtag Express',
              },
            },
          },
        })
      , 2);
    }
  } else if (isDelivery && !(await hasHashtagDeliveryHistory(prisma, order.id))) {
    // Order was already DELIVERED for another reason: never add a second delivery
    // status row, but the provider proof must still be traceable.
    await safeQuery(() =>
      prisma.orderStatusHistory.create({
        data: {
          orderId: order.id,
          status: 'DELIVERED',
          oldStatus: order.status,
          providerKey: 'HASHTAG',
          reason: `تم التسليم بواسطة: ${carrier.name || 'هاشتاج إكسبريس'} — بوليصة ${trackingNumber || 'غير متوفرة'}`,
          changedBy: 'SYSTEM',
          userName: 'Hashtag Express',
        },
      })
    , 2);
  }

  // 3) Guarantee the proof columns are filled even when the status was a no-op.
  const orderMetadata = {
    ...parseMetadata(order.metadata),
    shippingCarrier: 'HASHTAG',
    providerKey: 'HASHTAG',
    ...(trackingNumber ? { trackingNumber: String(trackingNumber) } : {}),
    hashtagProviderStatus: parsed.rawStatus ? String(parsed.rawStatus) : null,
    hashtagMapsToSystem: targetStatus,
    ...(parsed.courierName ? { hashtagCourierName: parsed.courierName } : {}),
    ...(parsed.courierPhone ? { hashtagCourierPhone: parsed.courierPhone } : {}),
    hashtagSyncedAt: new Date().toISOString(),
  };

  await safeQuery(() =>
    prisma.order.update({
      where: { id: order.id },
      data: {
        shippingCompanyId: carrier.id,
        providerKey: 'HASHTAG',
        ...(courier?.id ? { courierId: courier.id } : {}),
        ...(trackingNumber ? { trackingNumber: String(trackingNumber) } : {}),
        ...(deliveredAt ? { deliveredAt } : {}),
        metadata: JSON.stringify(orderMetadata),
      },
    })
  , 2);

  console.log(
    `[HASHTAG-WEBHOOK] order=${order.orderNumber} providerStatus=${parsed.rawStatus} -> ${targetStatus} tracking=${trackingNumber || '-'} courier=${courier?.id || '-'} deliveredAt=${deliveredAt ? deliveredAt.toISOString() : '-'}`,
  );

  return {
    success: true,
    orderId: order.id,
    orderNumber: order.orderNumber,
    providerStatus: parsed.rawStatus,
    mapsToSystem: targetStatus,
    trackingNumber,
    courierId: courier?.id || null,
    deliveredAt: deliveredAt ? deliveredAt.toISOString() : null,
  };
};

router.post(['/webhook', '/'], async (req, res) => {
  const token = getWebhookToken(req);
  try {
    const result = await processHashtagWebhook(req.body || {}, { webhookToken: token });
    if (result.skipped === 'INVALID_TOKEN') {
      return res.status(401).json({ success: false, error: 'Invalid token', code: 'INVALID_TOKEN' });
    }
    return res.status(200).json({ success: true, received: true, result });
  } catch (error) {
    console.error('[HASHTAG-WEBHOOK] Error:', error);
    // Acknowledge to avoid provider retry storms; details stay in the log.
    return res.status(200).json({ success: true, received: true, processed: false });
  }
});

module.exports = router;
module.exports.processHashtagWebhook = processHashtagWebhook;
module.exports.parseWebhookPayload = parseWebhookPayload;
