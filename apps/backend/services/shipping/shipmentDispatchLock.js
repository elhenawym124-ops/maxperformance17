const crypto = require('crypto');
const redisCacheService = require('../redisCacheService');

const _localInFlightLocks = new Map();

/**
 * Acquire distributed (Redis) or local in-memory locks for a set of canonical order keys.
 * Ensures duplicate concurrent dispatches across PM2 workers or order/guestOrder twins are blocked.
 */
async function acquireDispatchLock(rawKeys = [], ttlMs = 60000) {
  const keys = Array.from(new Set((rawKeys || []).filter(Boolean).map((k) => `ship_dispatch_lock:${k}`)));
  if (keys.length === 0) {
    return { acquired: true, token: null, keys: [] };
  }

  const token = `${process.pid}:${Date.now()}:${crypto.randomBytes(4).toString('hex')}`;
  const useRedis =
    process.env.NODE_ENV !== 'test' &&
    Boolean(redisCacheService?.isConnected && redisCacheService?.client);

  const acquiredKeys = [];

  try {
    if (useRedis) {
      for (const key of keys) {
        const res = await redisCacheService.client.set(key, token, 'PX', ttlMs, 'NX');
        if (res !== 'OK') {
          await releaseDispatchLock({ token, keys: acquiredKeys, useRedis: true });
          return { acquired: false, blockedKey: key };
        }
        acquiredKeys.push(key);
      }
      return { acquired: true, token, keys: acquiredKeys, useRedis: true };
    }

    const now = Date.now();
    for (const key of keys) {
      const existing = _localInFlightLocks.get(key);
      if (existing && existing.expiresAt > now) {
        await releaseDispatchLock({ token, keys: acquiredKeys, useRedis: false });
        return { acquired: false, blockedKey: key };
      }
    }

    for (const key of keys) {
      _localInFlightLocks.set(key, { token, expiresAt: now + ttlMs });
      acquiredKeys.push(key);
    }
    return { acquired: true, token, keys: acquiredKeys, useRedis: false };
  } catch (err) {
    await releaseDispatchLock({ token, keys: acquiredKeys, useRedis });
    // Fail-open to local map if Redis throws transiently
    const now = Date.now();
    for (const key of keys) {
      const existing = _localInFlightLocks.get(key);
      if (existing && existing.expiresAt > now) {
        return { acquired: false, blockedKey: key };
      }
    }
    for (const key of keys) {
      _localInFlightLocks.set(key, { token, expiresAt: now + ttlMs });
      acquiredKeys.push(key);
    }
    return { acquired: true, token, keys: acquiredKeys, useRedis: false };
  }
}

async function releaseDispatchLock(lockHandle) {
  if (!lockHandle || !Array.isArray(lockHandle.keys) || lockHandle.keys.length === 0) return;
  const { token, keys, useRedis } = lockHandle;

  for (const key of keys) {
    const local = _localInFlightLocks.get(key);
    if (local && (!token || local.token === token)) {
      _localInFlightLocks.delete(key);
    }
  }

  if (useRedis && redisCacheService?.isConnected && redisCacheService?.client) {
    const luaRelease =
      'if redis.call("get", KEYS[1]) == ARGV[1] then return redis.call("del", KEYS[1]) else return 0 end';
    for (const key of keys) {
      await redisCacheService.client.eval(luaRelease, 1, key, token).catch(() => {});
    }
  }
}

/**
 * Synchronize a Turbo shipment onto prisma.shipment so unified shipping logs,
 * courier settlement reports, and carrier dashboards stay consistent across manual & auto-create.
 */
async function syncTurboShipmentRecord(prisma, {
  companyId,
  order,
  shipmentId,
  trackingNumber,
  status,
  labelUrl,
  metadata,
} = {}) {
  try {
    if (!prisma?.shipment || !companyId || !order?.id) return null;
    const turboCarrier = prisma.shippingCompany?.findFirst
      ? await prisma.shippingCompany.findFirst({
          where: { companyId, providerKey: 'TURBO' },
          select: { id: true },
        }).catch(() => null)
      : null;

    const existingShipment = await prisma.shipment.findFirst({
      where: { orderId: order.id, companyId },
    });

    const resolvedTracking = String(trackingNumber || shipmentId || '');
    const resolvedExternalId = String(shipmentId || trackingNumber || '');
    const resolvedStatus = status || 'turbo_sent';

    if (existingShipment) {
      return await prisma.shipment.update({
        where: { id: existingShipment.id },
        data: {
          shippingCompanyId: turboCarrier?.id || existingShipment.shippingCompanyId,
          carrierType: 'TURBO',
          trackingNumber: resolvedTracking || existingShipment.trackingNumber,
          externalShipmentId: resolvedExternalId || existingShipment.externalShipmentId,
          status: resolvedStatus,
          labelUrl: labelUrl || existingShipment.labelUrl || null,
        },
      });
    }

    const serializedMeta =
      typeof metadata === 'string' ? metadata : JSON.stringify(metadata || {});

    return await prisma.shipment.create({
      data: {
        companyId,
        orderId: order.id,
        shippingCompanyId: turboCarrier?.id || null,
        carrierType: 'TURBO',
        trackingNumber: resolvedTracking,
        externalShipmentId: resolvedExternalId,
        status: resolvedStatus,
        labelUrl: labelUrl || null,
        destinationGovernorate: order.governorate || null,
        destinationCity: order.city || null,
        destinationAddress: order.customerAddress || order.shippingAddress || null,
        cost: order.shipping !== null && order.shipping !== undefined ? Number(order.shipping) : null,
        currency: order.currency || 'EGP',
        metadata: serializedMeta,
      },
    });
  } catch (err) {
    console.warn('⚠️ [SHIPMENT-SYNC] Error syncing Turbo shipment to prisma.shipment:', err?.message);
    return null;
  }
}

module.exports = {
  acquireDispatchLock,
  releaseDispatchLock,
  syncTurboShipmentRecord,
};
